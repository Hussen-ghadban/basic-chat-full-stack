export async function generateAESKey() {
  return await window.crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

export async function encryptWithAES(aesKey: CryptoKey, plaintext: string) {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encodedText = new TextEncoder().encode(plaintext);

  const ciphertext = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    aesKey,
    encodedText
  );

  return {
    iv: btoa(String.fromCharCode(...iv)),
    ciphertext: btoa(String.fromCharCode(...new Uint8Array(ciphertext))),
  };
}

export async function decryptWithAES(aesKey: CryptoKey, base64Ciphertext: string, base64Iv: string) {
  const ciphertext = Uint8Array.from(atob(base64Ciphertext), c => c.charCodeAt(0));
  const iv = Uint8Array.from(atob(base64Iv), c => c.charCodeAt(0));

  const plaintextBuffer = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    aesKey,
    ciphertext
  );

  return new TextDecoder().decode(plaintextBuffer);
}

export async function encryptAESKeyWithRSA(aesKey: CryptoKey, publicKey: CryptoKey) {
  const rawKey = await window.crypto.subtle.exportKey("raw", aesKey);
  const encrypted = await window.crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    publicKey,
    rawKey
  );
  return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
}

export async function decryptAESKeyWithRSA(encryptedKeyBase64: string, privateKey: CryptoKey) {
  const encryptedKey = Uint8Array.from(atob(encryptedKeyBase64), c => c.charCodeAt(0));
  const rawKey = await window.crypto.subtle.decrypt(
    { name: "RSA-OAEP" },
    privateKey,
    encryptedKey
  );

  return await window.crypto.subtle.importKey(
    "raw",
    rawKey,
    "AES-GCM",
    true,
    ["encrypt", "decrypt"]
  );
}

// More robust base64 encoding
export function arrayBufferToBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Fixed base64 decoding with enhanced cleaning and validation
export function base64ToArrayBuffer(base64: string) {
  try {
    // Clean and validate the base64 string
    const cleanedBase64 = cleanBase64(base64);
    
    if (!isValidBase64(cleanedBase64)) {
      throw new Error('Invalid base64 format after cleaning');
    }
    
    const binary = atob(cleanedBase64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  } catch (error) {
    console.error('Base64 decoding error:', error);
    console.error('Original base64 string length:', base64?.length);
    console.error('Base64 string preview:', base64?.substring(0, 100) + '...');
    throw new Error(`Failed to decode base64 string: ${error}`);
  }
}

// More robust validation and cleaning
export function isValidBase64(str: string): boolean {
  if (!str || typeof str !== 'string') {
    return false;
  }
  
  try {
    // Remove whitespace and newlines
    const cleanStr = str.replace(/\s+/g, '');
    
    // Check if it matches base64 pattern
    const base64Pattern = /^[A-Za-z0-9+/]*={0,2}$/;
    if (!base64Pattern.test(cleanStr)) {
      return false;
    }
    
    // Check length is multiple of 4
    if (cleanStr.length % 4 !== 0) {
      return false;
    }
    
    // Try to decode to verify it's valid
    atob(cleanStr);
    return true;
  } catch {
    return false;
  }
}

// Enhanced base64 cleaning and validation
export function cleanBase64(base64: string): string {
  if (!base64 || typeof base64 !== 'string') {
    throw new Error('Invalid input: expected non-empty string');
  }
  
  // Remove all whitespace, newlines, and non-base64 characters
  let cleaned = base64.replace(/\s+/g, '').replace(/[^A-Za-z0-9+/=]/g, '');
  
  // Ensure proper padding
  while (cleaned.length % 4 !== 0) {
    cleaned += '=';
  }
  
  return cleaned;
}