import bcrypt from 'bcryptjs';
import User from '@models/User';
import type { IUser } from '@models/User';
import { signTokenPair, verifyRefreshToken, signAccessToken } from '@utils/jwt';
import env from '@config/env';
import logger, { logAuthEvent } from '@config/logger';
import { AppError } from '@utils/AppError';

export interface AuthResult {
  user: IUser;
  accessToken: string;
  refreshToken: string;
}

export async function authenticateUser(
  email: string,
  password: string,
  ip: string,
  userAgent?: string,
): Promise<AuthResult> {
  // Find user with password
  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

  if (!user) {
    logAuthEvent('LOGIN_FAILED', { email, reason: 'User not found', ip });
    throw new AppError(401, 'Invalid email or password');
  }

  // Check if account is locked
  if (user.lockUntil && user.lockUntil > new Date()) {
    const remainingMs = user.lockUntil.getTime() - Date.now();
    const remainingMin = Math.ceil(remainingMs / 60000);
    logAuthEvent('LOGIN_BLOCKED', { email, reason: 'Account locked', ip });
    throw new AppError(423, `Account locked. Try again in ${remainingMin} minutes.`);
  }

  // Verify password
  const isMatch = await bcrypt.compare(password, user.password || '');
  if (!isMatch) {
    // Increment login attempts
    const attempts = (user.loginAttempts || 0) + 1;
    const maxAttempts = env.MAX_LOGIN_ATTEMPTS;

    const update: Record<string, unknown> = { loginAttempts: attempts };
    if (attempts >= maxAttempts) {
      update.lockUntil = new Date(Date.now() + env.LOCK_DURATION_MINUTES * 60 * 1000);
      logger.warn(`Account locked for ${email} after ${attempts} failed attempts`);
    }

    await User.updateOne({ _id: user._id }, { $set: update });

    logAuthEvent('LOGIN_FAILED', {
      email,
      reason: 'Invalid password',
      ip,
      attempts,
      maxAttempts,
    });

    const remaining = maxAttempts - attempts;
    const msg = remaining > 0
      ? `Invalid email or password. ${remaining} attempt(s) remaining.`
      : 'Account locked due to too many failed attempts.';

    throw new AppError(401, msg);
  }

  // Success — generate tokens, reset attempts, record login
  const tokens = signTokenPair(user);
  const now = new Date();
  const refreshExpiry = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  // Add refresh token to user's token list
  await User.updateOne(
    { _id: user._id },
    {
      $set: {
        loginAttempts: 0,
        lockUntil: null,
        lastLogin: now,
        lastLoginIp: ip,
      },
      $push: {
        refreshTokens: {
          $each: [{
            token: tokens.refreshToken,
            device: userAgent ? userAgent.substring(0, 200) : '',
            userAgent: userAgent ? userAgent.substring(0, 500) : '',
            createdAt: now,
            expiresAt: refreshExpiry,
          }],
          $position: 0,
        },
        loginHistory: {
          $each: [{
            ip,
            device: userAgent ? userAgent.substring(0, 200) : '',
            userAgent: userAgent ? userAgent.substring(0, 500) : '',
            timestamp: now,
            success: true,
          }],
          $position: 0,
        },
      },
    },
  );

  // Keep only last 10 refresh tokens per user
  await User.updateOne(
    { _id: user._id },
    { $pop: { refreshTokens: 5 } },
  );

  logAuthEvent('LOGIN_SUCCESS', { email, ip });

  const userObj = await User.findById(user._id).select('-password');
  if (!userObj) throw new AppError(500, 'User not found after login');

  return {
    user: userObj,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  };
}

export async function refreshUserToken(
  refreshTokenStr: string,
  ip: string,
  userAgent?: string,
): Promise<AuthResult> {
  let decoded;
  try {
    decoded = verifyRefreshToken(refreshTokenStr);
  } catch {
    throw new AppError(401, 'Invalid or expired refresh token');
  }

  const user = await User.findOne({
    _id: decoded.id,
    'refreshTokens.token': refreshTokenStr,
  });

  if (!user) {
    logAuthEvent('TOKEN_REUSE_DETECTED', { email: decoded.email, ip });
    // Token reuse — could be a stolen token. Clear all tokens for this user.
    await User.updateOne({ _id: decoded.id }, { $set: { refreshTokens: [] } });
    throw new AppError(401, 'Refresh token already used. Please login again.');
  }

  // Remove old refresh token (token rotation)
  await User.updateOne(
    { _id: user._id },
    { $pull: { refreshTokens: { token: refreshTokenStr } as any } },
  );

  // Issue new token pair
  const tokens = signTokenPair(user);
  const now = new Date();
  const refreshExpiry = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  await User.updateOne(
    { _id: user._id },
    {
      $push: {
        refreshTokens: {
          $each: [{
            token: tokens.refreshToken,
            device: userAgent ? userAgent.substring(0, 200) : '',
            userAgent: userAgent ? userAgent.substring(0, 500) : '',
            createdAt: now,
            expiresAt: refreshExpiry,
          }],
          $position: 0,
        },
      },
      $set: { lastLogin: now, lastLoginIp: ip },
    },
  );

  logAuthEvent('TOKEN_REFRESHED', { email: user.email, ip });

  return {
    user,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  };
}

export async function logoutUser(
  userId: string,
  refreshTokenStr: string,
): Promise<void> {
  await User.updateOne(
    { _id: userId },
    { $pull: { refreshTokens: { token: refreshTokenStr } as any } },
  );
  logAuthEvent('LOGOUT', { userId });
}

export async function logoutAllSessions(userId: string): Promise<void> {
  await User.updateOne(
    { _id: userId },
    { $set: { refreshTokens: [] } },
  );
  logAuthEvent('LOGOUT_ALL', { userId });
}

export async function checkAccountLocked(email: string): Promise<boolean> {
  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('lockUntil');
  if (!user) return false;
  return !!(user.lockUntil && user.lockUntil > new Date());
}
