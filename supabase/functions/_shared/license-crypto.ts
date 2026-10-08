const encoder = new TextEncoder();

const getEncryptionKey = async (secret: string, usage: KeyUsage[]) => {
  if (secret.length < 32) {
    throw new Error('LICENSE_ENCRYPTION_KEY must contain at least 32 characters');
  }

  const keyBytes = await crypto.subtle.digest('SHA-256', encoder.encode(secret));
  return crypto.subtle.importKey('raw', keyBytes, { name: 'AES-GCM' }, false, usage);
};

const toBase64 = (bytes: Uint8Array) => {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
};

const fromBase64 = (value: string) => {
  const binary = atob(value);
  return Uint8Array.from(binary, character => character.charCodeAt(0));
};

export const hashLicenseKey = async (licenseKey: string) => {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(licenseKey));
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
};

export const encryptLicenseKey = async (licenseKey: string, secret: string) => {
  const key = await getEncryptionKey(secret, ['encrypt']);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoder.encode(licenseKey));
  return `${toBase64(iv)}.${toBase64(new Uint8Array(ciphertext))}`;
};

export const decryptLicenseKey = async (encryptedLicenseKey: string, secret: string) => {
  const [encodedIv, encodedCiphertext] = encryptedLicenseKey.split('.');
  if (!encodedIv || !encodedCiphertext) throw new Error('Invalid encrypted license key');

  const key = await getEncryptionKey(secret, ['decrypt']);
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: fromBase64(encodedIv) },
    key,
    fromBase64(encodedCiphertext)
  );
  return new TextDecoder().decode(plaintext);
};