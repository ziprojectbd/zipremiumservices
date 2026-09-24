import jwt, { type SignOptions } from 'jsonwebtoken';
import env from '@config/env';
import type { IUser } from '@models/User';

export interface JwtPayload {
  id: string;
  email: string;
  role: string;
  type: 'access' | 'refresh';
  /** Session (refresh-token) id. Older tokens issued before sessions existed omit it. */
  sid?: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/**
 * `sid` ties both tokens to a Session document. Revoking the session therefore
 * invalidates the access token as well, without a database hit on every request
 * (the middleware only checks liveness when the claim is present).
 */
function baseClaims(user: Pick<IUser, '_id' | 'email' | 'role'>, sid?: string) {
  const claims: Record<string, unknown> = {
    id: user._id.toString(),
    email: user.email,
    role: user.role,
  };
  if (sid) claims.sid = sid;
  return claims;
}

export function signAccessToken(user: Pick<IUser, '_id' | 'email' | 'role'>, sid?: string): string {
  return jwt.sign(
    { ...baseClaims(user, sid), type: 'access' },
    env.JWT_SECRET,
    { expiresIn: env.JWT_ACCESS_EXPIRY } as SignOptions,
  );
}

export function signRefreshToken(user: Pick<IUser, '_id' | 'email' | 'role'>, sid?: string): string {
  return jwt.sign(
    { ...baseClaims(user, sid), type: 'refresh' },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRY } as SignOptions,
  );
}

export function signTokenPair(user: Pick<IUser, '_id' | 'email' | 'role'>, sid?: string): TokenPair {
  return {
    accessToken: signAccessToken(user, sid),
    refreshToken: signRefreshToken(user, sid),
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
