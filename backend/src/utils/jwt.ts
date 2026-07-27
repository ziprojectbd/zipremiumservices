import jwt, { type SignOptions } from 'jsonwebtoken';
import env from '@config/env';
import type { IUser } from '@models/User';

export interface JwtPayload {
  id: string;
  email: string;
  role: string;
  type: 'access' | 'refresh';
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export function signAccessToken(user: Pick<IUser, '_id' | 'email' | 'role'>): string {
  return jwt.sign(
    { id: user._id.toString(), email: user.email, role: user.role, type: 'access' },
    env.JWT_SECRET,
    { expiresIn: env.JWT_ACCESS_EXPIRY } as SignOptions,
  );
}

export function signRefreshToken(user: Pick<IUser, '_id' | 'email' | 'role'>): string {
  return jwt.sign(
    { id: user._id.toString(), email: user.email, role: user.role, type: 'refresh' },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRY } as SignOptions,
  );
}

export function signTokenPair(user: Pick<IUser, '_id' | 'email' | 'role'>): TokenPair {
  return {
    accessToken: signAccessToken(user),
    refreshToken: signRefreshToken(user),
  };
}

export function verifyAccessToken(token: string): JwtPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
  if (decoded.type !== 'access') {
    throw new jwt.JsonWebTokenError('Invalid token type');
  }
  return decoded;
}

export function verifyRefreshToken(token: string): JwtPayload {
  const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtPayload;
  if (decoded.type !== 'refresh') {
    throw new jwt.JsonWebTokenError('Invalid token type');
  }
  return decoded;
}
