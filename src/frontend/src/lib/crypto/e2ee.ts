import { importPublicKey } from "./transportKeys";

/**
 * Encrypts a plaintext message using hybrid encryption (AES-GCM + RSA-OAEP).
 * Generates a fresh AES-256-GCM key for this message, encrypts the plaintext,
 * then wraps the symmetric key with the recipient's RSA-OAEP public key.
 * This is the E2EE encryption step - only the recipient can decrypt.
 */
export async function encryptPayload(
  plaintext: string,
  recipientPublicKeyBytes: Uint8Array,
): Promise<{
  encryptedPayload: Uint8Array;
  encryptedSymmetricKey: Uint8Array;
}> {
  // Generate a random symmetric key for this message (fresh per message)
  const symmetricKey = await window.crypto.subtle.generateKey(
    {
      name: "AES-GCM",
      length: 256,
    },
    true,
    ["encrypt", "decrypt"],
  );

  // Encrypt the plaintext with the symmetric key
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encoder = new TextEncoder();
  const plaintextBytes = encoder.encode(plaintext);

  const encryptedData = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv,
    },
    symmetricKey,
    plaintextBytes,
  );

  // Export the symmetric key
  const exportedSymmetricKey = await window.crypto.subtle.exportKey(
    "raw",
    symmetricKey,
  );

  // Encrypt the symmetric key with the recipient's public key (RSA-OAEP)
  // This is the E2EE key wrapping - only recipient's private key can unwrap
  const recipientPublicKey = await importPublicKey(recipientPublicKeyBytes);
  const encryptedSymmetricKey = await window.crypto.subtle.encrypt(
    {
      name: "RSA-OAEP",
    },
    recipientPublicKey,
    exportedSymmetricKey,
  );

  // Combine IV + encrypted data
  const combined = new Uint8Array(iv.length + encryptedData.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encryptedData), iv.length);

  return {
    encryptedPayload: combined,
    encryptedSymmetricKey: new Uint8Array(encryptedSymmetricKey),
  };
}

/**
 * Decrypts an encrypted message using the local private key.
 * First unwraps the per-message symmetric key using RSA-OAEP private key,
 * then decrypts the payload using AES-GCM.
 * This is the E2EE decryption step - only works with the correct private key.
 */
export async function decryptPayload(
  encryptedPayload: Uint8Array,
  encryptedSymmetricKey: Uint8Array,
  privateKey: CryptoKey,
): Promise<string> {
  // Create a new ArrayBuffer copy to ensure proper type
  const keyBuffer = new ArrayBuffer(encryptedSymmetricKey.byteLength);
  const keyView = new Uint8Array(keyBuffer);
  keyView.set(encryptedSymmetricKey);

  // Decrypt the symmetric key using our private key (RSA-OAEP unwrap)
  const decryptedSymmetricKeyBuffer = await window.crypto.subtle.decrypt(
    {
      name: "RSA-OAEP",
    },
    privateKey,
    keyBuffer,
  );

  // Import the symmetric key
  const symmetricKey = await window.crypto.subtle.importKey(
    "raw",
    decryptedSymmetricKeyBuffer,
    {
      name: "AES-GCM",
      length: 256,
    },
    false,
    ["decrypt"],
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
      name: "AES-GCM",
      iv,
    },
    symmetricKey,
    encryptedDataBuffer,
  );

  const decoder = new TextDecoder();
  return decoder.decode(decryptedData);
}
