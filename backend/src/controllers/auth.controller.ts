import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import User from '@models/User';
import { signToken } from '@utils/jwt';
import { success, error } from '@utils/apiResponse';
import env from '@config/env';
import { getClientIP, getGeoFromIP } from '@utils/geo';

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

  // 1. Check ENV admin credentials first (same priority as auth.config.ts)
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

    const token = signToken(user);
    return res.json(success({
      token,
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
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    return res.status(401).json(error('Invalid email or password'));
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).json(error('Invalid email or password'));
  }

  const token = signToken(user);
  return res.json(success({
    token,
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

  // Capture IP and geolocation (same as original signup route)
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

    const token = signToken(user);
    return res.json(success({
      token,
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

    const token = signToken(user);
    return res.redirect(`${env.CLIENT_URL}/?token=${token}`);
  } catch (err) {
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
