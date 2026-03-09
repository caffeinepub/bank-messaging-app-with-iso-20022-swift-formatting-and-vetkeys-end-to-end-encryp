export interface TransportKeyPair {
  publicKey: CryptoKey;
  privateKey: CryptoKey;
}

export interface ExportedTransportKeyPair {
  publicKey: string; // base64-encoded SPKI
  privateKey: string; // base64-encoded PKCS8
}

export async function generateTransportKeyPair(): Promise<TransportKeyPair> {
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"],
  );

  return {
    publicKey: keyPair.publicKey,
    privateKey: keyPair.privateKey,
  };
}

export async function exportPublicKey(
  publicKey: CryptoKey,
): Promise<Uint8Array> {
  const exported = await window.crypto.subtle.exportKey("spki", publicKey);
  return new Uint8Array(exported);
}

export async function importPublicKey(
  publicKeyBytes: Uint8Array,
): Promise<CryptoKey> {
  // Create a new ArrayBuffer copy to ensure proper type
  const buffer = new ArrayBuffer(publicKeyBytes.byteLength);
  const view = new Uint8Array(buffer);
  view.set(publicKeyBytes);

  return window.crypto.subtle.importKey(
    "spki",
    buffer,
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    true,
    ["encrypt"],
  );
}

/**
 * Exports a transport keypair for local-only persistence
 * The private key is exported in PKCS8 format and base64-encoded
 * This should NEVER be sent to the backend or transmitted over the network
 */
export async function exportTransportKeyPair(
  keyPair: TransportKeyPair,
): Promise<ExportedTransportKeyPair> {
  const publicKeyBuffer = await window.crypto.subtle.exportKey(
    "spki",
    keyPair.publicKey,
  );
  const privateKeyBuffer = await window.crypto.subtle.exportKey(
    "pkcs8",
    keyPair.privateKey,
  );

  // Convert to base64 for storage
  const publicKeyBase64 = btoa(
    String.fromCharCode(...new Uint8Array(publicKeyBuffer)),
  );
  const privateKeyBase64 = btoa(
    String.fromCharCode(...new Uint8Array(privateKeyBuffer)),
  );

  return {
    publicKey: publicKeyBase64,
    privateKey: privateKeyBase64,
  };
}

/**
 * Imports a transport keypair from exported format
 * Restores both public and private CryptoKey objects from base64-encoded data
 */
export async function importTransportKeyPair(
  exported: ExportedTransportKeyPair,
): Promise<TransportKeyPair> {
  // Decode base64 to ArrayBuffer
  const publicKeyBuffer = Uint8Array.from(atob(exported.publicKey), (c) =>
    c.charCodeAt(0),
  ).buffer;
  const privateKeyBuffer = Uint8Array.from(atob(exported.privateKey), (c) =>
    c.charCodeAt(0),
  ).buffer;

  const publicKey = await window.crypto.subtle.importKey(
    "spki",
    publicKeyBuffer,
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    true,
    ["encrypt"],
  );

  const privateKey = await window.crypto.subtle.importKey(
    "pkcs8",
    privateKeyBuffer,
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    true,
    ["decrypt"],
  );

  return {
    publicKey,
    privateKey,
  };
}
