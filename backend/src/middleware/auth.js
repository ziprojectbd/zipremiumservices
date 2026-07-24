import { verifyToken } from '../utils/jwt.js';
import User from '../models/User.js';
import { error } from '../utils/apiResponse.js';

export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json(error('Authentication required'));
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json(error('User not found'));
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json(error('Invalid or expired token'));
  }
}
