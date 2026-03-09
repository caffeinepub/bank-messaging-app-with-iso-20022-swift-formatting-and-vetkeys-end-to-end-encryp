/**
 * VetKey utilities for session-scoped transport key persistence
 *
 * A vetKey is a session-scoped identifier that allows transport keypairs
 * to be persisted and restored across navigation and page reloads within
 * the same browser session, without ever sending the private key to the backend.
 */

const VETKEY_STORAGE_KEY = "transport_vetkey";
const VETKEY_PREFIX = "vetkey_";

/**
 * Generates a new random vetKey identifier
 * Format: vetkey_<random-hex-string>
 */
export function generateVetKey(): string {
  const randomBytes = new Uint8Array(16);
  crypto.getRandomValues(randomBytes);
  const hexString = Array.from(randomBytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `${VETKEY_PREFIX}${hexString}`;
}

/**
 * Validates that a string is a properly formatted vetKey
 */
export function isValidVetKey(vetKey: string): boolean {
  if (!vetKey || typeof vetKey !== "string") {
    return false;
  }
  return (
    vetKey.startsWith(VETKEY_PREFIX) && vetKey.length > VETKEY_PREFIX.length
  );
}

/**
 * Stores the active vetKey in sessionStorage
 */
export function storeActiveVetKey(vetKey: string): void {
  if (!isValidVetKey(vetKey)) {
    throw new Error("Invalid vetKey format");
  }
  try {
    sessionStorage.setItem(VETKEY_STORAGE_KEY, vetKey);
  } catch (error) {
    console.error("Failed to store active vetKey:", error);
    throw error;
  }
}

/**
 * Retrieves the active vetKey from sessionStorage
 */
export function getActiveVetKey(): string | null {
  try {
    const vetKey = sessionStorage.getItem(VETKEY_STORAGE_KEY);
    if (vetKey && isValidVetKey(vetKey)) {
      return vetKey;
    }
    return null;
  } catch (error) {
    console.error("Failed to retrieve active vetKey:", error);
    return null;
  }
}

/**
 * Clears the active vetKey from sessionStorage
 */
export function clearActiveVetKey(): void {
  try {
    sessionStorage.removeItem(VETKEY_STORAGE_KEY);
  } catch (error) {
    console.error("Failed to clear active vetKey:", error);
  }
}

/**
 * Builds the sessionStorage key for storing transport keypair data
 * associated with a specific vetKey
 */
export function getTransportKeyStorageKey(vetKey: string): string {
  if (!isValidVetKey(vetKey)) {
    throw new Error("Invalid vetKey format");
  }
  return `transport_keypair_${vetKey}`;
}

/**
 * Clears all transport keypair data associated with a vetKey
 */
export function clearTransportKeyData(vetKey: string): void {
  if (!isValidVetKey(vetKey)) {
    return;
  }
  try {
    const storageKey = getTransportKeyStorageKey(vetKey);
    sessionStorage.removeItem(storageKey);
  } catch (error) {
    console.error("Failed to clear transport key data:", error);
  }
}
