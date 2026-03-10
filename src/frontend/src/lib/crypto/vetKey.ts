// vetKey simulation — deterministic per principal, stored in localStorage

function simpleHash32(input: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

function deriveVetKey(principal: string): string {
  const salts = ["", "_s1", "_s2", "_s3"];
  const hex = salts.map((s) => simpleHash32(principal + s)).join("");
  return `vetkey_${hex}`;
}

export function generateVetKey(principal: string): string {
  const storageKey = `op_dup_vetkey_${principal}`;
  const stored = localStorage.getItem(storageKey);
  if (stored) return stored;
  const vetKey = deriveVetKey(principal);
  localStorage.setItem(storageKey, vetKey);
  return vetKey;
}

export function loadVetKey(principal: string): string | null {
  return localStorage.getItem(`op_dup_vetkey_${principal}`);
}

export function clearVetKey(principal: string): void {
  localStorage.removeItem(`op_dup_vetkey_${principal}`);
}
