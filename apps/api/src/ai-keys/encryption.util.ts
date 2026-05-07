import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

function getKey(rawKey: string): Buffer {
  if (!/^[0-9a-fA-F]{64}$/.test(rawKey)) {
    throw new Error(
      'ENCRYPTION_KEY must be a 64-character hex string (32 bytes). Generate one with: openssl rand -hex 32',
    );
  }
  return Buffer.from(rawKey, 'hex');
}

export function encrypt(plaintext: string, rawKey: string): string {
  const key = getKey(rawKey);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, ciphertext]).toString('base64');
}

export function decrypt(encoded: string, rawKey: string): string {
  const key = getKey(rawKey);
  const buf = Buffer.from(encoded, 'base64');
  if (buf.length < IV_LENGTH + AUTH_TAG_LENGTH + 1) {
    throw new Error('Encrypted payload is too short to be valid.');
  }
  const iv = buf.subarray(0, IV_LENGTH);
  const authTag = buf.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const ciphertext = buf.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
}

export function previewKey(plaintext: string): string {
  const cleaned = plaintext.trim();
  if (cleaned.length <= 8) return '****';
  return `${cleaned.slice(0, 4)}…${cleaned.slice(-4)}`;
}
