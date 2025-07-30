import { scrypt, randomBytes, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

// Secure defaults for scrypt
const SCRYPT_PARAMS = {
    keylen: 32,    // Length of derived key
    saltlen: 16    // Length of salt
};

/**
 * Hash a password using scrypt with secure parameters
 */
export async function hashPassword(password: string): Promise<string> {
    const salt = randomBytes(SCRYPT_PARAMS.saltlen);

    const derivedKey = await scryptAsync(
        password,
        salt,
        SCRYPT_PARAMS.keylen
    ) as Buffer;

    // Store salt + derivedKey in a single string
    // Format: salt(hex):derivedKey(hex)
    return `${salt.toString('hex')}:${derivedKey.toString('hex')}`;
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    try {
        const [saltHex, keyHex] = hash.split(':');

        if (!saltHex || !keyHex) {
            return false;
        }

        const salt = Buffer.from(saltHex, 'hex');
        const key = Buffer.from(keyHex, 'hex');

        const derivedKey = await scryptAsync(
            password,
            salt,
            SCRYPT_PARAMS.keylen
        ) as Buffer;

        // Use timing-safe comparison to prevent timing attacks
        return timingSafeEqual(key, derivedKey);

    } catch (error) {
        console.error('Error verifying password:', error);
        return false;
    }
}

/**
 * Check if a hash is using the old plain text format
 */
export function isPlainTextPassword(hash: string): boolean {
    return !hash.includes(':');
}
