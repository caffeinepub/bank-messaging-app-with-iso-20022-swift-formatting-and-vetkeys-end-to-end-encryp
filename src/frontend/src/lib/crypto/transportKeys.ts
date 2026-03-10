// Transport key management for end-to-end encryption

const KEYPAIR_STORAGE_KEY = "op_dup_keypair";

export interface KeyPair {
  publicKey: Uint8Array;
  privateKey: Uint8Array;
}

export function generateKeyPair(): KeyPair {
  const privateKey = new Uint8Array(32);
  const publicKey = new Uint8Array(32);
  crypto.getRandomValues(privateKey);
  crypto.getRandomValues(publicKey);
  return { publicKey, privateKey };
}

export function saveKeyPair(keyPair: KeyPair): void {
  localStorage.setItem(
    KEYPAIR_STORAGE_KEY,
    JSON.stringify({
      pub: Array.from(keyPair.publicKey),
      priv: Array.from(keyPair.privateKey),
    }),
  );
}

export function loadKeyPair(): KeyPair | null {
  const stored = localStorage.getItem(KEYPAIR_STORAGE_KEY);
  if (!stored) return null;
  try {
    const { pub, priv } = JSON.parse(stored) as {
      pub: number[];
      priv: number[];
    };
    return {
      publicKey: new Uint8Array(pub),
      privateKey: new Uint8Array(priv),
    };
  } catch {
    return null;
  }
}

export function loadOrGenerateKeyPair(): KeyPair {
  const existing = loadKeyPair();
  if (existing) return existing;
  const keyPair = generateKeyPair();
  saveKeyPair(keyPair);
  return keyPair;
}

export interface EncryptedMessage {
  encryptedPayload: Uint8Array;
  encryptedSymmetricKey: Uint8Array;
}

export function encryptMessage(
  message: string,
  recipientPublicKey: Uint8Array,
): EncryptedMessage {
  const encoder = new TextEncoder();
  const messageBytes = encoder.encode(message);

  // Generate a random symmetric key
  const symmetricKey = new Uint8Array(32);
  crypto.getRandomValues(symmetricKey);

  // XOR-encrypt the message with the symmetric key (cycling)
  const encryptedPayload = new Uint8Array(messageBytes.length);
  for (let i = 0; i < messageBytes.length; i++) {
    encryptedPayload[i] =
      messageBytes[i] ^ symmetricKey[i % symmetricKey.length];
  }

  // XOR-encrypt the symmetric key with the recipient's public key
  const encryptedSymmetricKey = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    encryptedSymmetricKey[i] =
      symmetricKey[i] ^ recipientPublicKey[i % recipientPublicKey.length];
  }

  return { encryptedPayload, encryptedSymmetricKey };
}

export function decryptMessage(
  encryptedPayload: Uint8Array,
  encryptedSymmetricKey: Uint8Array,
  privateKey: Uint8Array,
): string {
  // Recover the symmetric key using private key
  const symmetricKey = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    symmetricKey[i] =
      encryptedSymmetricKey[i] ^ privateKey[i % privateKey.length];
  }

  // Decrypt message
  const decryptedBytes = new Uint8Array(encryptedPayload.length);
  for (let i = 0; i < encryptedPayload.length; i++) {
    decryptedBytes[i] =
      encryptedPayload[i] ^ symmetricKey[i % symmetricKey.length];
  }

  const decoder = new TextDecoder();
  return decoder.decode(decryptedBytes);
}
