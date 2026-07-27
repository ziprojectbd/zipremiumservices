import mongoose from 'mongoose';
import User, { type IUser } from '@models/User';
import { BaseRepository } from './BaseRepository.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FilterQuery<T> = Record<string, any>;
type UserDocument = IUser & mongoose.Document;

export class UserRepository extends BaseRepository<UserDocument> {
  constructor() {
    super(User);
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.findOne({ email: email.toLowerCase().trim() } as FilterQuery<IUser>);
  }

  async findByEmailWithPassword(email: string): Promise<UserDocument | null> {
    return User.findOne({ email: email.toLowerCase().trim() } as FilterQuery<IUser>)
      .select('+password')
      .lean();
  }

  async updateLoginAttempts(userId: string, attempts: number): Promise<void> {
    await User.updateOne(
      { _id: userId } as FilterQuery<IUser>,
      { $set: { loginAttempts: attempts } },
    );
  }

  async lockAccount(userId: string, lockDurationMinutes: number): Promise<void> {
    const lockUntil = new Date(Date.now() + lockDurationMinutes * 60 * 1000);
    await User.updateOne(
      { _id: userId } as FilterQuery<IUser>,
      { $set: { lockUntil } },
    );
  }

  async unlockAccount(userId: string): Promise<void> {
    await User.updateOne(
      { _id: userId } as FilterQuery<IUser>,
      { $set: { loginAttempts: 0, lockUntil: null } },
    );
  }

  async resetLoginAttempts(userId: string): Promise<void> {
    await User.updateOne(
      { _id: userId } as FilterQuery<IUser>,
      { $set: { loginAttempts: 0, lockUntil: null } },
    );
  }
}

export const userRepository = new UserRepository();
