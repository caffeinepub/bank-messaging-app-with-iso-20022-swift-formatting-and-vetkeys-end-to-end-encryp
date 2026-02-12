import { importPublicKey } from './transportKeys';

export async function encryptPayload(
  plaintext: string,
  recipientPublicKeyBytes: Uint8Array
): Promise<{ encryptedPayload: Uint8Array; keyId: Uint8Array }> {
  // Generate a random symmetric key for this message
  const symmetricKey = await window.crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256,
    },
    true,
    ['encrypt', 'decrypt']
  );

  // Encrypt the plaintext with the symmetric key
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encoder = new TextEncoder();
  const plaintextBytes = encoder.encode(plaintext);

  const encryptedData = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    symmetricKey,
    plaintextBytes
  );

  // Export the symmetric key
  const exportedSymmetricKey = await window.crypto.subtle.exportKey('raw', symmetricKey);

  // Encrypt the symmetric key with the recipient's public key
  const recipientPublicKey = await importPublicKey(recipientPublicKeyBytes);
  const encryptedSymmetricKey = await window.crypto.subtle.encrypt(
    {
      name: 'RSA-OAEP',
    },
    recipientPublicKey,
    exportedSymmetricKey
  );

  // Combine IV + encrypted data
  const combined = new Uint8Array(iv.length + encryptedData.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encryptedData), iv.length);

  return {
    encryptedPayload: combined,
    keyId: new Uint8Array(encryptedSymmetricKey),
  };
}

export async function decryptPayload(
  encryptedPayload: Uint8Array,
  keyId: Uint8Array,
  privateKey: CryptoKey
): Promise<string> {
  // Create a new ArrayBuffer copy to ensure proper type
  const keyIdBuffer = new ArrayBuffer(keyId.byteLength);
  const keyIdView = new Uint8Array(keyIdBuffer);
  keyIdView.set(keyId);

  // Decrypt the symmetric key using our private key
  const decryptedSymmetricKeyBuffer = await window.crypto.subtle.decrypt(
    {
      name: 'RSA-OAEP',
    },
    privateKey,
    keyIdBuffer
  );

  // Import the symmetric key
  const symmetricKey = await window.crypto.subtle.importKey(
    'raw',
    decryptedSymmetricKeyBuffer,
    {
      name: 'AES-GCM',
      length: 256,
    },
    false,
    ['decrypt']
  );

  // Extract IV and encrypted data
  const iv = encryptedPayload.slice(0, 12);
  const encryptedData = encryptedPayload.slice(12);

  // Create a new ArrayBuffer copy for encrypted data
  const encryptedDataBuffer = new ArrayBuffer(encryptedData.byteLength);
  const encryptedDataView = new Uint8Array(encryptedDataBuffer);
  encryptedDataView.set(encryptedData);

  // Decrypt the data
  const decryptedData = await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    symmetricKey,
    encryptedDataBuffer
  );

  const decoder = new TextDecoder();
  return decoder.decode(decryptedData);
}
