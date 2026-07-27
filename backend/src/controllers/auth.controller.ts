import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import User from '@models/User';
import { success, error } from '@utils/apiResponse';
import env from '@config/env';
import { getClientIP, getGeoFromIP } from '@utils/geo';
import { authenticateUser, refreshUserToken, logoutUser, logoutAllSessions } from '@services/auth.service';
import { getRedis } from '@config/redis';
import logger from '@config/logger';

const GOOGLE_REDIRECT_URI = `${(env.CLIENT_URL as string).replace(/\/$/, '')}/api/auth/google/callback`;

const googleClient = env.GOOGLE_CLIENT_ID
  ? new OAuth2Client(env.GOOGLE_CLIENT_ID, env.GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI)
  : null;

// POST /api/auth/login
export async function login(req: import('express').Request, res: import('express').Response) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json(error('Email and password are required'));
  }

  const ip = getClientIP(req);
  const userAgent = req.headers['user-agent'] || '';

  // 1. Check ENV admin credentials first
  if (email === env.ADMIN_EMAIL && password === env.ADMIN_PASSWORD) {
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        name: 'Admin',
        email: env.ADMIN_EMAIL,
        password: await bcrypt.hash(env.ADMIN_PASSWORD, 12),
        role: 'admin',
      });
    } else if (user.role !== 'admin') {
      user.role = 'admin';
      await user.save();
    }

    const result = await authenticateUser(email, password, ip, userAgent);
    return res.json(success({
      ...result,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        image: user.image,
        isTrader: user.isTrader,
        kycStatus: user.kycStatus,
      },
    }));
  }

  // 2. Check DB user login
  try {
    const result = await authenticateUser(email, password, ip, userAgent);
    return res.json(success({
      ...result,
      user: {
        id: result.user._id,
        name: result.user.name,
        email: result.user.email,
        role: result.user.role,
        image: result.user.image,
        isTrader: result.user.isTrader,
        kycStatus: result.user.kycStatus,
      },
    }));
  } catch (err: unknown) {
    const appErr = err as { statusCode?: number; message?: string };
    return res.status(appErr.statusCode || 401).json(error(appErr.message || 'Authentication failed'));
  }
}

// POST /api/auth/refresh
export async function refresh(req: import('express').Request, res: import('express').Response) {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json(error('Refresh token is required'));
  }

  try {
    const ip = getClientIP(req);
    const userAgent = req.headers['user-agent'] || '';
    const result = await refreshUserToken(refreshToken, ip, userAgent);

    return res.json(success({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: {
        id: result.user._id,
        name: result.user.name,
        email: result.user.email,
        role: result.user.role,
        image: result.user.image,
        isTrader: result.user.isTrader,
        kycStatus: result.user.kycStatus,
      },
    }));
  } catch (err: unknown) {
    const appErr = err as { statusCode?: number; message?: string };
    return res.status(appErr.statusCode || 401).json(error(appErr.message || 'Token refresh failed'));
  }
}

// POST /api/auth/logout
export async function logout(req: import('express').Request, res: import('express').Response) {
  const { refreshToken } = req.body;

  try {
    if (req.user?._id && refreshToken) {
      await logoutUser(req.user._id.toString(), refreshToken);
    }
    return res.json(success({ message: 'Logged out successfully' }));
  } catch {
    return res.json(success({ message: 'Logged out successfully' }));
  }
}

// POST /api/auth/logout-all
export async function logoutAll(req: import('express').Request, res: import('express').Response) {
  try {
    if (req.user?._id) {
      await logoutAllSessions(req.user._id.toString());
    }
    return res.json(success({ message: 'All sessions logged out' }));
  } catch {
    return res.json(success({ message: 'All sessions logged out' }));
  }
}

// POST /api/auth/check-lock
export async function checkLock(req: import('express').Request, res: import('express').Response) {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json(error('Email is required'));
  }
  try {
    const { checkAccountLocked } = await import('@services/auth.service');
    const locked = await checkAccountLocked(email);
    return res.json(success({ locked }));
  } catch {
    return res.json(success({ locked: false }));
  }
}

// POST /api/signup
export async function signup(req: import('express').Request, res: import('express').Response) {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json(error('Name, email, and password are required'));
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json(error('A user with this email already exists'));
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  // Capture IP and geolocation
  const ipAddress = getClientIP(req);
  let geo = { country: '', countryCode: '', countryFlag: '' };
  try {
    const result = await getGeoFromIP(ipAddress);
    geo = { ...geo, ...result };
  } catch {
    // Geolocation is optional
  }

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    role: 'user',
    kycStatus: 'none',
    ipAddress,
    ...geo,
  });

  return res.status(201).json(success({
    message: 'User created successfully',
    userId: user._id,
  }));
}

// GET /api/auth/user
export async function getUser(req: import('express').Request, res: import('express').Response) {
  const email = (req.query.email as string) || req.user?.email;

  if (!email) {
    return res.status(400).json(error('Email is required'));
  }

  const user = await User.findOne({ email }).select('-password');
  if (!user) {
    return res.status(404).json(error('User not found'));
  }

  return res.json(success({
    id: user._id,
    name: user.name,
    email: user.email,
    image: user.image,
    role: user.role,
    isTrader: user.isTrader,
    kycStatus: user.kycStatus,
  }));
}

// POST /api/auth/google
export async function googleAuthWithCredential(req: import('express').Request, res: import('express').Response) {
  if (!googleClient) {
    return res.status(500).json(error('Google OAuth is not configured'));
  }

  const { credential } = req.body;
  if (!credential) {
    return res.status(400).json(error('Google credential is required'));
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload()!;
    const { email, name, picture } = payload;

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        name: name || email!.split('@')[0],
        email,
        password: await bcrypt.hash(email! + env.JWT_SECRET, 12),
        image: picture,
        role: email === env.ADMIN_EMAIL ? 'admin' : 'user',
        kycStatus: 'none',
      });
    } else if (email === env.ADMIN_EMAIL && user.role !== 'admin') {
      user.role = 'admin';
      user.image = picture || user.image;
      await user.save();
    }

    const { signTokenPair } = await import('@utils/jwt');
    const tokens = signTokenPair(user);
    return res.json(success({
      ...tokens,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        image: user.image,
        isTrader: user.isTrader,
        kycStatus: user.kycStatus,
      },
    }));
  } catch (err) {
    logger.error('Google auth failed', { error: err instanceof Error ? err.message : String(err) });
    return res.status(401).json(error('Google authentication failed'));
  }
}

// GET /api/auth/google
export async function googleAuth(req: import('express').Request, res: import('express').Response) {
  if (!googleClient) {
    return res.status(500).json(error('Google OAuth is not configured'));
  }

  const authUrl = googleClient.generateAuthUrl({
    access_type: 'offline',
    scope: ['openid', 'email', 'profile'],
  });

  return res.redirect(authUrl);
}

// GET /api/auth/google/callback
export async function googleCallback(req: import('express').Request, res: import('express').Response) {
  if (!googleClient) {
    return res.status(500).json(error('Google OAuth is not configured'));
  }

  const { code } = req.query;
  if (!code) {
    return res.status(400).json(error('Authorization code is required'));
  }

  try {
    const { tokens } = await googleClient.getToken(code as string);
    const ticket = await googleClient.verifyIdToken({
      idToken: tokens.id_token!,
      audience: env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload()!;
    const { email, name, picture } = payload;

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        name: name || email!.split('@')[0],
        email,
        password: await bcrypt.hash(email! + env.JWT_SECRET, 12),
        image: picture,
        role: email === env.ADMIN_EMAIL ? 'admin' : 'user',
        kycStatus: 'none',
      });
    } else if (email === env.ADMIN_EMAIL && user.role !== 'admin') {
      user.role = 'admin';
      user.image = picture || user.image;
      await user.save();
    }

    const { signTokenPair } = await import('@utils/jwt');
    const tokens2 = signTokenPair(user);
    return res.redirect(`${env.CLIENT_URL}/?token=${tokens2.accessToken}&refreshToken=${tokens2.refreshToken}`);
  } catch (err) {
    logger.error('Google callback failed', { error: err instanceof Error ? err.message : String(err) });
    return res.status(401).json(error('Google authentication failed'));
  }
}

// POST /api/auth/update-admin-role
export async function updateAdminRole(req: import('express').Request, res: import('express').Response) {
  const { email } = req.body;

  if (!email || email !== env.ADMIN_EMAIL) {
    return res.status(403).json(error('Not authorized to update admin role'));
  }

  const user = await User.findOneAndUpdate(
    { email },
    { role: 'admin' },
    { new: true }
  );

  if (!user) {
    return res.status(404).json(error('User not found'));
  }

  return res.json(success({ role: user.role }));
}
