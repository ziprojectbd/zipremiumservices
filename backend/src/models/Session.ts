import mongoose from 'mongoose';

/**
 * A single refresh-token session.
 *
 * One document is created per login (per device). Refreshing rotates the token:
 * the old document is marked `rotatedAt`/`replacedBy` and a new one is written,
 * so the whole chain shares a `familyId` and can be revoked together when token
 * reuse is detected.
 *
 * The raw token is never stored:
 *  - `tokenHash` is a SHA-256 digest used for lookups, so a database leak does
 *    not hand out usable sessions.
 *  - `tokenEnc` is an AES-256-GCM ciphertext of the token, only needed to replay
 *    the same token during the short rotation grace window. It is cleared as soon
 *    as the grace window closes.
 */
export interface ISession {
  _id: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  /** SHA-256 of the raw refresh token — indexed lookup key. */
  tokenHash: string;
  /** AES-256-GCM ciphertext of the raw token (grace-window replay only). */
  tokenEnc?: string | null;
  /** Groups every token produced by one login chain. */
  familyId: string;
  /** Set on the token that replaced this one during rotation. */
  replacedBy?: mongoose.Types.ObjectId | null;
  /** Non-null once this token is no longer usable. */
  revokedAt?: Date | null;
  /** 'rotation' | 'reuse' | 'logout' | 'logout_all' */
  revokedReason?: string;
  rotatedAt?: Date | null;
  lastUsedAt: Date;
  expiresAt: Date;
  ip?: string;
  userAgent?: string;
  device?: string;
  createdAt: Date;
  updatedAt: Date;
}

const sessionSchema = new mongoose.Schema<ISession>(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
    },
    tokenEnc: {
      type: String,
      default: null,
    },
    familyId: {
      type: String,
      required: true,
      index: true,
    },
    replacedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Session',
      default: null,
    },
    revokedAt: {
      type: Date,
      default: null,
    },
    revokedReason: {
      type: String,
      default: '',
    },
    rotatedAt: {
      type: Date,
      default: null,
    },
    lastUsedAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    ip: {
      type: String,
      default: '',
    },
    userAgent: {
      type: String,
      default: '',
    },
    device: {
      type: String,
      default: '',
    },
  },
  { timestamps: true },
);

// Expired sessions are removed automatically (MongoDB TTL monitor).
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
// Fast "list my active sessions" lookups.
sessionSchema.index({ user: 1, revokedAt: 1, expiresAt: 1 });

sessionSchema.set('toJSON', {
  virtuals: true,
  transform(_doc, ret) {
    // Never expose token material, even to a server-side JSON.stringify.
    const obj = ret as unknown as Record<string, unknown>;
    delete obj.tokenHash;
    delete obj.tokenEnc;
    return ret;
  },
});

const Session = mongoose.models.Session || mongoose.model<ISession>('Session', sessionSchema);

export default Session;
