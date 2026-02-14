/**
 * Crypto Utilities
 * 
 * Provides encryption and decryption for sensitive data like API keys.
 * Uses crypto-js for AES encryption with a device-specific key.
 */

import CryptoJS from 'crypto-js';

/**
 * Encryption prefix to identify encrypted data
 */
const ENCRYPTION_PREFIX = 'enc:';

/**
 * Get or generate the encryption key.
 * Uses a combination of browser fingerprint and stored salt.
 * Note: This provides obfuscation, not absolute security.
 */
const getEncryptionKey = (): string => {
  const storageKey = 'loom2-crypto-key';
  let key = localStorage.getItem(storageKey);
  
  if (!key) {
    // Generate a random key if none exists
    key = CryptoJS.lib.WordArray.random(256 / 8).toString();
    localStorage.setItem(storageKey, key);
  }
  
  return key;
};

/**
 * Encrypt sensitive data using AES encryption
 * @param data - Plain text data to encrypt
 * @returns Encrypted string with prefix
 */
export const encryptData = (data: string): string => {
  if (!data) return '';
  if (data.startsWith(ENCRYPTION_PREFIX)) return data; // Already encrypted
  
  try {
    const key = getEncryptionKey();
    const encrypted = CryptoJS.AES.encrypt(data, key, {
      mode: CryptoJS.mode.GCM,
      padding: CryptoJS.pad.Pkcs7,
    }).toString();
    
    return `${ENCRYPTION_PREFIX}${encrypted}`;
  } catch (error) {
    console.error('Encryption failed:', error);
    return '';
  }
};

/**
 * Decrypt encrypted data
 * @param encryptedData - Encrypted string with prefix
 * @returns Decrypted plain text
 */
export const decryptData = (encryptedData: string): string => {
  if (!encryptedData) return '';
  if (!encryptedData.startsWith(ENCRYPTION_PREFIX)) return encryptedData; // Not encrypted
  
  try {
    const key = getEncryptionKey();
    const ciphertext = encryptedData.slice(ENCRYPTION_PREFIX.length);
    const decrypted = CryptoJS.AES.decrypt(ciphertext, key, {
      mode: CryptoJS.mode.GCM,
      padding: CryptoJS.pad.Pkcs7,
    });
    
    return decrypted.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('Decryption failed:', error);
    return '';
  }
};

/**
 * Check if data is encrypted
 * @param data - Data to check
 * @returns True if encrypted
 */
export const isEncrypted = (data: string): boolean => {
  return data?.startsWith(ENCRYPTION_PREFIX) ?? false;
};

/**
 * Hash data using SHA-256 (for non-reversible hashing)
 * @param data - Data to hash
 * @returns SHA-256 hash
 */
export const hashData = (data: string): string => {
  return CryptoJS.SHA256(data).toString();
};

/**
 * Generate a secure random token
 * @param length - Token length in bytes (default: 32)
 * @returns Random hex string
 */
export const generateToken = (length: number = 32): string => {
  return CryptoJS.lib.WordArray.random(length).toString();
};
