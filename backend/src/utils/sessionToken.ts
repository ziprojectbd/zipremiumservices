import crypto from 'crypto';
import env from '@config/env';

/**
 * Helpers for handling refresh-token material at rest.
 *
 * The refresh token is a JWT, so it is already opaque and signed. We still never
 * persist it verbatim:
 *  - hashing gives us a constant-time lookup key that survives a database leak
 *  - authenticated encryption lets us replay the exact same token during the
 *    short rotation grace window without storing it in the clear
 *
 * The AES key is derived from JWT_REFRESH_SECRET via HKDF, so an existing
 * deployment needs to set no additional secret.
 */

const ENC_ALGO = 'aes-256-gcm';
const IV_BYTES = 12;
const HKDF_SALT = 'zi-refresh-token-v1';

function getEncryptionKey(): Buffer {
  return Buffer.from(
    crypto.hkdfSync(
      'sha256',
      Buffer.from(env.JWT_REFRESH_SECRET || env.JWT_SECRET, 'utf8'),
      Buffer.from(HKDF_SALT, 'utf8'),
      Buffer.from('refresh-token-encryption', 'utf8'),
      32,
    ),
  );
}

/** Stable lookup digest for a raw refresh token. */
export function hashSessionToken(token: string): string {
  return crypto.createHash('sha256').update(token, 'utf8').digest('hex');
}

/** Encrypt a refresh token for storage. Format: v1.<iv>.<tag>.<ciphertext> (base64url). */
export function encryptSessionToken(token: string): string {
  const iv = crypto.randomBytes(IV_BYTES);
  const cipher = crypto.createCipheriv(ENC_ALGO, getEncryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return ['v1', iv.toString('base64url'), tag.toString('base64url'), ciphertext.toString('base64url')].join('.');
}

/** Decrypt a stored token. Returns null when the payload is missing or tampered with. */
export function decryptSessionToken(payload: string | null | undefined): string | null {
  if (!payload) return null;
  try {
    const [version, ivPart, tagPart, dataPart] = payload.split('.');
    if (version !== 'v1' || !ivPart || !tagPart || !dataPart) return null;
    const decipher = crypto.createDecipheriv(ENC_ALGO, getEncryptionKey(), Buffer.from(ivPart, 'base64url'));
    decipher.setAuthTag(Buffer.from(tagPart, 'base64url'));
    const plain = Buffer.concat([decipher.update(Buffer.from(dataPart, 'base64url')), decipher.final()]);
    return plain.toString('utf8');
  } catch {
    return null;
  }
}

/** Opaque identifier used to group all tokens produced by one login chain. */
export function newFamilyId(): string {
  return crypto.randomUUID();
}
