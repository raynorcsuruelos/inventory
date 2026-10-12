import { SecurityCredential } from '../types';

export const PASS_CRED_KEY = 'wllab_security_cred';
export const LEGACY_PASS_KEY = 'wllab_adminpass';
export const DEFAULT_INITIAL_PASS = 'WLAdmin2025';
export const DEFAULT_ITERATIONS = 100000;

// Convert Uint8Array to Hex String
export function bufferToHex(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Convert Hex String to Uint8Array
export function hexToBuffer(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

// Generate cryptographically secure random salt (32 bytes = 256 bits)
export function generateRandomSalt(byteLength = 32): Uint8Array {
  const salt = new Uint8Array(byteLength);
  window.crypto.getRandomValues(salt);
  return salt;
}

/**
 * Robust PBKDF2-SHA256 password hashing with cryptographic salt
 */
export async function deriveKeyHash(
  password: string,
  saltBytes: Uint8Array,
  iterations = DEFAULT_ITERATIONS
): Promise<string> {
  const enc = new TextEncoder();
  const passwordKey = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  const derivedBits = await window.crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBytes as unknown as BufferSource,
      iterations: iterations,
      hash: 'SHA-256',
    },
    passwordKey,
    256 // 256 bits = 32 bytes
  );

  return bufferToHex(derivedBits);
}

/**
 * Constant-time comparison to protect against timing attacks
 */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Hash a new password and return security credential record
 */
export async function hashNewPassword(
  password: string,
  iterations = DEFAULT_ITERATIONS
): Promise<SecurityCredential> {
  const saltBytes = generateRandomSalt(32);
  const saltHex = bufferToHex(saltBytes);
  const hashHex = await deriveKeyHash(password, saltBytes, iterations);

  return {
    saltHex,
    hashHex,
    iterations,
    algorithm: 'PBKDF2-HMAC-SHA256',
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Verify input password against stored security credential
 */
export async function verifyPassword(
  attempt: string,
  credential: SecurityCredential
): Promise<boolean> {
  try {
    const saltBytes = hexToBuffer(credential.saltHex);
    const computedHash = await deriveKeyHash(attempt, saltBytes, credential.iterations);
    return timingSafeEqual(computedHash, credential.hashHex);
  } catch (err) {
    console.error('Password verification error:', err);
    return false;
  }
}

/**
 * Load or initialize security credential.
 * Automatically migrates plain-text legacy passwords if found.
 */
export async function getOrInitSecurityCredential(): Promise<SecurityCredential> {
  try {
    const raw = localStorage.getItem(PASS_CRED_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.saltHex && parsed.hashHex) {
        return parsed as SecurityCredential;
      }
    }
  } catch (e) {
    console.warn('Could not parse stored security credential, re-initializing.');
  }

  // Check for legacy plaintext password
  const legacyPass = localStorage.getItem(LEGACY_PASS_KEY) || DEFAULT_INITIAL_PASS;
  const newCredential = await hashNewPassword(legacyPass, DEFAULT_ITERATIONS);
  localStorage.setItem(PASS_CRED_KEY, JSON.stringify(newCredential));
  // Clean up plaintext password
  localStorage.removeItem(LEGACY_PASS_KEY);
  return newCredential;
}

/**
 * Save new credential
 */
export function saveSecurityCredential(cred: SecurityCredential): void {
  localStorage.setItem(PASS_CRED_KEY, JSON.stringify(cred));
}

/**
 * Evaluate password strength
 */
export interface PasswordStrength {
  score: number; // 0 to 4
  label: 'Very Weak' | 'Weak' | 'Fair' | 'Strong' | 'Robust';
  color: string;
  hasMinLength: boolean;
  hasUpper: boolean;
  hasLower: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
}

export function assessPasswordStrength(password: string): PasswordStrength {
  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  let score = 0;
  if (password.length >= 6) score++;
  if (hasMinLength && (hasUpper || hasNumber)) score++;
  if (hasUpper && hasLower && hasNumber) score++;
  if (hasMinLength && hasUpper && hasLower && hasNumber && hasSpecial) score++;

  const labels: PasswordStrength['label'][] = ['Very Weak', 'Weak', 'Fair', 'Strong', 'Robust'];
  const colors = [
    'text-rose-500',
    'text-amber-500',
    'text-yellow-500',
    'text-sky-500',
    'text-emerald-500',
  ];

  return {
    score,
    label: labels[score],
    color: colors[score],
    hasMinLength,
    hasUpper,
    hasLower,
    hasNumber,
    hasSpecial,
  };
}
