// Transport key management using real ECDH + AES-GCM encryption
// Keys are stored in localStorage so they persist across sessions.
// Private keys never leave the device.

const KEYPAIR_STORAGE_KEY = "op_dup_keypair_v2";

export interface KeyPair {
  publicKey: CryptoKey;
  privateKey: CryptoKey;
  /** Uncompressed P-256 public key bytes (65 bytes) — stored in the backend */
  publicKeyRaw: Uint8Array;
}

export async function generateKeyPair(): Promise<KeyPair> {
  const kp = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveKey"],
  );
  const publicKeyRaw = new Uint8Array(
    await crypto.subtle.exportKey("raw", kp.publicKey),
  );
  return { publicKey: kp.publicKey, privateKey: kp.privateKey, publicKeyRaw };
}

export async function saveKeyPair(keyPair: KeyPair): Promise<void> {
  const pubJwk = await crypto.subtle.exportKey("jwk", keyPair.publicKey);
  const privJwk = await crypto.subtle.exportKey("jwk", keyPair.privateKey);
  localStorage.setItem(
    KEYPAIR_STORAGE_KEY,
    JSON.stringify({ pub: pubJwk, priv: privJwk }),
  );
}

export async function loadKeyPair(): Promise<KeyPair | null> {
  const stored = localStorage.getItem(KEYPAIR_STORAGE_KEY);
  if (!stored) return null;
  try {
    const { pub, priv } = JSON.parse(stored) as {
      pub: JsonWebKey;
      priv: JsonWebKey;
    };
    const publicKey = await crypto.subtle.importKey(
      "jwk",
      pub,
      { name: "ECDH", namedCurve: "P-256" },
      true,
      [],
    );
    const privateKey = await crypto.subtle.importKey(
      "jwk",
      priv,
      { name: "ECDH", namedCurve: "P-256" },
      true,
      ["deriveKey"],
    );
    const publicKeyRaw = new Uint8Array(
      await crypto.subtle.exportKey("raw", publicKey),
    );
    return { publicKey, privateKey, publicKeyRaw };
  } catch {
    return null;
  }
}

export async function loadOrGenerateKeyPair(): Promise<KeyPair> {
  const existing = await loadKeyPair();
  if (existing) return existing;
  const kp = await generateKeyPair();
  await saveKeyPair(kp);
  return kp;
}

export interface EncryptedMessage {
  encryptedPayload: Uint8Array;
  /** Stores: ephemeral public key (65 bytes) + AES-GCM IV (12 bytes) */
  encryptedSymmetricKey: Uint8Array;
}

async function deriveSharedKey(
  privateKey: CryptoKey,
  publicKey: CryptoKey,
): Promise<CryptoKey> {
  return crypto.subtle.deriveKey(
    { name: "ECDH", public: publicKey },
    privateKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

/**
 * Encrypts a message for a recipient using ECDH + AES-GCM.
 * An ephemeral key pair is generated per message so the shared secret is
 * unique to each message. The ephemeral public key and IV are packed into
 * encryptedSymmetricKey so the recipient can reconstruct the shared secret.
 */
export async function encryptMessage(
  message: string,
  recipientPublicKeyBytes: Uint8Array,
): Promise<EncryptedMessage> {
  const recipientPublicKey = await crypto.subtle.importKey(
    "raw",
    recipientPublicKeyBytes.buffer.slice(
      recipientPublicKeyBytes.byteOffset,
      recipientPublicKeyBytes.byteOffset + recipientPublicKeyBytes.byteLength,
    ) as ArrayBuffer,
    { name: "ECDH", namedCurve: "P-256" },
    true,
    [],
  );

  const ephemeral = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveKey"],
  );

  const sharedKey = await deriveSharedKey(
    ephemeral.privateKey,
    recipientPublicKey,
  );

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(message);
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv }, sharedKey, encoded),
  );

  const ephemeralPubRaw = new Uint8Array(
    await crypto.subtle.exportKey("raw", ephemeral.publicKey),
  );

  // Pack: [ephemeralPublicKey (65 bytes) | iv (12 bytes)]
  const encryptedSymmetricKey = new Uint8Array(65 + 12);
  encryptedSymmetricKey.set(ephemeralPubRaw, 0);
  encryptedSymmetricKey.set(iv, 65);

  return { encryptedPayload: ciphertext, encryptedSymmetricKey };
}

/**
 * Decrypts a message using the recipient's private key.
 * Reconstructs the ECDH shared secret from the ephemeral public key packed
 * in encryptedSymmetricKey, then AES-GCM decrypts the payload.
 */
export async function decryptMessage(
  encryptedPayload: Uint8Array,
  encryptedSymmetricKey: Uint8Array,
  privateKey: CryptoKey,
): Promise<string> {
  if (encryptedSymmetricKey.length < 77) {
    throw new Error(
      "Message was encrypted with an older format and cannot be decrypted.",
    );
  }

  const ephemeralPubBytes = encryptedSymmetricKey.slice(0, 65);
  const iv = encryptedSymmetricKey.slice(65, 77);

  const ephemeralPublicKey = await crypto.subtle.importKey(
    "raw",
    ephemeralPubBytes.buffer.slice(
      ephemeralPubBytes.byteOffset,
      ephemeralPubBytes.byteOffset + ephemeralPubBytes.byteLength,
    ) as ArrayBuffer,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    [],
  );

  const sharedKey = await deriveSharedKey(privateKey, ephemeralPublicKey);

  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    sharedKey,
    encryptedPayload.buffer.slice(
      encryptedPayload.byteOffset,
      encryptedPayload.byteOffset + encryptedPayload.byteLength,
    ) as ArrayBuffer,
  );

  return new TextDecoder().decode(plaintext);
}
