export function createId() {
  return globalThis.crypto?.randomUUID?.() ?? Math.random().toString(16).slice(2);
}
