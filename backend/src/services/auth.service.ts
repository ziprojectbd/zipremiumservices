import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import User from '@models/User';
import type { IUser } from '@models/User';
import Session from '@models/Session';
import { signTokenPair, verifyRefreshToken, signAccessToken } from '@utils/jwt';
import { hashSessionToken, encryptSessionToken, decryptSessionToken, newFamilyId } from '@utils/sessionToken';
import { refreshExpiryToMs } from '@utils/cookies';
import env from '@config/env';
import logger, { logAuthEvent } from '@config/logger';
import { AppError } from '@utils/AppError';

export interface AuthResult {
  user: IUser;
  accessToken: string;
  refreshToken: string;
}

export interface SessionContext {
  ip: string;
  userAgent?: string;
}

// ---------------------------------------------------------------------------
// Session helpers
// ---------------------------------------------------------------------------

function deviceFromUserAgent(userAgent?: string): string {
  const ua = userAgent || '';
  if (/android/i.test(ua)) return 'Android';
  if (/iphone|ipad|ipod/i.test(ua)) return 'iOS';
  if (/windows/i.test(ua)) return 'Windows';
  if (/macintosh|mac os x/i.test(ua)) return 'macOS';
  if (/linux/i.test(ua)) return 'Linux';
  return ua ? 'Unknown device' : '';
}

async function createSession(
  user: Pick<IUser, '_id'>,
  refreshToken: string,
  familyId: string,
  ctx: SessionContext,
): Promise<mongoose.Types.ObjectId> {
  const now = new Date();
  const doc = await Session.create({
    user: user._id,
    tokenHash: hashSessionToken(refreshToken),
    // Kept only to replay the same token during the rotation grace window;
    // the serializer clears it once the window closes.
    tokenEnc: encryptSessionToken(refreshToken),
    familyId,
    lastUsedAt: now,
    expiresAt: new Date(now.getTime() + refreshExpiryToMs()),
    ip: ctx.ip,
    userAgent: (ctx.userAgent || '').substring(0, 500),
    device: deviceFromUserAgent(ctx.userAgent),
  });
  return doc._id;
}

/** Revoke every token produced by one login chain (theft response / logout-all). */
async function revokeFamily(familyId: string, reason: string): Promise<void> {
  await Session.updateMany(
    { familyId, revokedAt: null },
    { $set: { revokedAt: new Date(), revokedReason: reason, tokenEnc: null } },
  );
}

/** Revoke all of a user's active sessions. */
export async function revokeAllUserSessions(userId: string, reason = 'logout_all'): Promise<void> {
  await Session.updateMany(
    { user: userId, revokedAt: null },
    { $set: { revokedAt: new Date(), revokedReason: reason, tokenEnc: null } },
  );
  // Legacy tokens live on the user document until they are rotated into
  // sessions; clearing them keeps "log out everywhere" absolute.
  await User.updateOne({ _id: userId }, { $set: { refreshTokens: [] } });
}

/**
 * Look up a presented refresh token among the sessions, falling back to the
 * legacy plaintext array on the user document. A legacy hit is adopted into a
 * session so already-signed-in users are never logged out by this change.
 */
async function findSessionForToken(refreshToken: string) {
  const tokenHash = hashSessionToken(refreshToken);
  const existing = await Session.findOne({ tokenHash });
  if (existing) return existing;

  // Legacy adoption path.
  const legacyOwner = await User.findOne({ 'refreshTokens.token': refreshToken }).select('_id');
  if (!legacyOwner) return null;

  const familyId = newFamilyId();
  const sessionId = await createSession(legacyOwner, refreshToken, familyId, {
    ip: '',
    userAgent: '',
  });
  await User.updateOne(
    { _id: legacyOwner._id },
    { $pull: { refreshTokens: { token: refreshToken } as never } },
  );

  logger.info('Adopted legacy refresh token into a session', { userId: legacyOwner._id.toString() });
  return Session.findById(sessionId);
}

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------

export async function authenticateUser(
  email: string,
  password: string,
  ip: string,
  userAgent?: string,
): Promise<AuthResult> {
  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

  if (!user) {
    logAuthEvent('LOGIN_FAILED', { email, reason: 'User not found', ip });
    throw new AppError(401, 'Invalid email or password');
  }

  if (user.lockUntil && user.lockUntil > new Date()) {
    const remainingMs = user.lockUntil.getTime() - Date.now();
    const remainingMin = Math.ceil(remainingMs / 60000);
    logAuthEvent('LOGIN_BLOCKED', { email, reason: 'Account locked', ip });
    throw new AppError(423, `Account locked. Try again in ${remainingMin} minutes.`);
  }

  const isMatch = await bcrypt.compare(password, user.password || '');
  if (!isMatch) {
    const attempts = (user.loginAttempts || 0) + 1;
    const maxAttempts = env.MAX_LOGIN_ATTEMPTS;

    const update: Record<string, unknown> = { loginAttempts: attempts };
    if (attempts >= maxAttempts) {
      update.lockUntil = new Date(Date.now() + env.LOCK_DURATION_MINUTES * 60 * 1000);
      logger.warn(`Account locked for ${email} after ${attempts} failed attempts`);
    }

    await User.updateOne({ _id: user._id }, { $set: update });

    logAuthEvent('LOGIN_FAILED', { email, reason: 'Invalid password', ip, attempts, maxAttempts });

    const remaining = maxAttempts - attempts;
    const msg = remaining > 0
      ? `Invalid email or password. ${remaining} attempt(s) remaining.`
      : 'Account locked due to too many failed attempts.';

    throw new AppError(401, msg);
  }

  // Success — create a session, then sign the pair bound to it.
  const familyId = newFamilyId();
  // The refresh token carries the session id, so signing needs the id first.
  // Create the session with a placeholder then bind the real token by rotating
  // in place is wasteful; instead sign first with a temporary family marker and
  // update the session document with the final hash.
  const sessionId = new mongoose.Types.ObjectId();
  const tokens = signTokenPair(user, sessionId.toString());

  const now = new Date();
  await Session.create({
    _id: sessionId,
    user: user._id,
    tokenHash: hashSessionToken(tokens.refreshToken),
    tokenEnc: encryptSessionToken(tokens.refreshToken),
    familyId,
    lastUsedAt: now,
    expiresAt: new Date(now.getTime() + refreshExpiryToMs()),
    ip,
    userAgent: (userAgent || '').substring(0, 500),
    device: deviceFromUserAgent(userAgent),
  });

  await User.updateOne(
    { _id: user._id },
    {
      $set: { loginAttempts: 0, lockUntil: null, lastLogin: now, lastLoginIp: ip },
      $push: {
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

  logAuthEvent('LOGIN_SUCCESS', { email, ip });

  const userObj = await User.findById(user._id).select('-password');
  if (!userObj) throw new AppError(500, 'User not found after login');

  return {
    user: userObj,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  };
}

// ---------------------------------------------------------------------------
// Refresh (rotation + reuse detection + grace replay)
// ---------------------------------------------------------------------------

export async function refreshUserToken(
  refreshTokenStr: string,
  ip: string,
  userAgent?: string,
): Promise<AuthResult> {
  if (!refreshTokenStr) {
    throw new AppError(401, 'Refresh token is required');
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(refreshTokenStr);
  } catch {
    throw new AppError(401, 'Invalid or expired refresh token');
  }

  const session = await findSessionForToken(refreshTokenStr);

  if (!session) {
    logAuthEvent('TOKEN_REUSE_DETECTED', { email: decoded.email, ip, reason: 'Unknown token' });
    // A refresh token we never issued (or already fully revoked): kill the whole
    // user chain — a stolen token must not outlive the theft.
    await revokeAllUserSessions(decoded.id, 'reuse');
    throw new AppError(401, 'Session expired. Please sign in again.');
  }

  const now = new Date();

  // ---- Revoked after (or during) rotation ----------------------------------
  if (session.revokedAt) {
    const graceMs = Math.max(0, env.SESSION_GRACE_SECONDS) * 1000;
    const withinGrace =
      session.revokedReason === 'rotation' &&
      session.replacedBy &&
      now.getTime() - session.revokedAt.getTime() <= graceMs;

    if (withinGrace) {
      // Multi-tab / retry race: hand back the SAME successor token rather than
      // rotating again, so parallel refreshes all succeed.
      const successor = await Session.findById(session.replacedBy);
      if (successor && !successor.revokedAt && successor.expiresAt > now) {
        const replayToken = decryptSessionToken(successor.tokenEnc);
        if (replayToken) {
          const user = await User.findById(successor.user).select('-password');
          if (user) {
            return {
              user,
              accessToken: signAccessToken(user, successor._id.toString()),
              refreshToken: replayToken,
            };
          }
        }
      }
    }

    logAuthEvent('TOKEN_REUSE_DETECTED', {
      email: decoded.email,
      ip,
      reason: session.revokedReason || 'revoked',
    });
    await revokeFamily(session.familyId, 'reuse');
    throw new AppError(401, 'Session expired. Please sign in again.');
  }

  if (session.expiresAt <= now) {
    await Session.updateOne(
      { _id: session._id },
      { $set: { revokedAt: now, revokedReason: 'expired', tokenEnc: null } },
    );
    throw new AppError(401, 'Session expired. Please sign in again.');
  }

  const user = await User.findById(session.user).select('-password');
  if (!user) {
    await revokeFamily(session.familyId, 'reuse');
    throw new AppError(401, 'User not found');
  }

  // ---- Rotate ---------------------------------------------------------------
  const successorId = new mongoose.Types.ObjectId();
  const tokens = signTokenPair(user, successorId.toString());

  await Session.create({
    _id: successorId,
    user: user._id,
    tokenHash: hashSessionToken(tokens.refreshToken),
    tokenEnc: encryptSessionToken(tokens.refreshToken),
    familyId: session.familyId,
    lastUsedAt: now,
    expiresAt: new Date(now.getTime() + refreshExpiryToMs()),
    ip,
    userAgent: (userAgent || '').substring(0, 500),
    device: deviceFromUserAgent(userAgent),
  });

  await Session.updateOne(
    { _id: session._id },
    {
      $set: {
        revokedAt: now,
        revokedReason: 'rotation',
        rotatedAt: now,
        replacedBy: successorId,
        // The successor is persisted now, so the old ciphertext is no longer
        // needed for replay and is dropped immediately.
        tokenEnc: null,
      },
    },
  );

  await User.updateOne({ _id: user._id }, { $set: { lastLogin: now, lastLoginIp: ip } });

  // Housekeeping: retire this user's expired sessions.
  await Session.deleteMany({ user: user._id, expiresAt: { $lte: now } });

  logAuthEvent('TOKEN_REFRESHED', { email: user.email, ip });

  return {
    user,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  };
}

// ---------------------------------------------------------------------------
// Logout / revocation
// ---------------------------------------------------------------------------

/**
 * Revoke the session behind a refresh token.
 * Does not need an access token, so signing out works even after it expired.
 */
export async function revokeSessionByToken(refreshTokenStr: string, userId?: string): Promise<boolean> {
  if (!refreshTokenStr) return false;

  const tokenHash = hashSessionToken(refreshTokenStr);
  const session = await Session.findOne({ tokenHash });

  if (session) {
    await Session.updateOne(
      { _id: session._id },
      { $set: { revokedAt: new Date(), revokedReason: 'logout', tokenEnc: null } },
    );
    logAuthEvent('LOGOUT', { userId: session.user.toString() });
    return true;
  }

  // Legacy token still sitting on the user document.
  const scope = userId ? { _id: userId, 'refreshTokens.token': refreshTokenStr } : { 'refreshTokens.token': refreshTokenStr };
  const result = await User.updateOne(scope, { $pull: { refreshTokens: { token: refreshTokenStr } as never } });
  if (result.modifiedCount > 0) {
    logAuthEvent('LOGOUT', { userId: userId || 'legacy' });
    return true;
  }

  return false;
}

export async function logoutUser(userId: string, refreshTokenStr: string): Promise<void> {
  await revokeSessionByToken(refreshTokenStr, userId);
}

export async function logoutAllSessions(userId: string): Promise<void> {
  await revokeAllUserSessions(userId, 'logout_all');
  logAuthEvent('LOGOUT_ALL', { userId });
}

// ---------------------------------------------------------------------------
// Session introspection
// ---------------------------------------------------------------------------

/** Is this session still usable? Used by the auth middleware for prompt revocation. */
export async function isSessionActive(sessionId: string): Promise<boolean> {
  if (!sessionId) return false;
  const session = await Session.findOne({ _id: sessionId }).select('revokedAt expiresAt');
  if (!session) return false;
  if (session.revokedAt) return false;
  return session.expiresAt > new Date();
}

/** Active devices for the account (for a "sessions" UI). */
export async function listUserSessions(userId: string) {
  return Session.find({ user: userId, revokedAt: null, expiresAt: { $gt: new Date() } })
    .sort({ lastUsedAt: -1 })
    .select('device userAgent ip lastUsedAt createdAt expiresAt')
    .lean();
}

export async function checkAccountLocked(email: string): Promise<boolean> {
  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('lockUntil');
  if (!user) return false;
  return !!(user.lockUntil && user.lockUntil > new Date());
}
