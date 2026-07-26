import jwt from 'jsonwebtoken';
import env from '@config/env';
import type { IUser } from '@models/User';

export interface JwtPayload {
  id: string;
  email: string;
  role: string;
}

export function signToken(user: IUser): string {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    env.JWT_SECRET,
    { expiresIn: '30d' },
  );
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
}
