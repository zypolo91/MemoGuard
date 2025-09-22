export function delay(ms = 200) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}
