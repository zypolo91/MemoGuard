import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";

import { useMemoriesStore } from "@/stores/memories";

const originalLocalStorage = globalThis.localStorage;

describe("memories store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    const storage = new Map<string, string>();
    const mockStorage = {
      getItem: vi.fn((key: string) => storage.get(key) ?? null),
      setItem: vi.fn((key: string, value: string) => storage.set(key, value)),
      removeItem: vi.fn((key: string) => storage.delete(key)),
      clear: vi.fn(() => storage.clear())
    } as unknown as Storage;
    Object.defineProperty(window, "localStorage", {
      value: mockStorage,
      configurable: true
    });
  });

  afterEach(() => {
    Object.defineProperty(window, "localStorage", {
      value: originalLocalStorage,
      configurable: true
    });
  });

  it("adds a new memory to the top of the list", () => {
    const store = useMemoriesStore();

    store.addMemory({
      title: "测试回忆",
      content: "一起散步的午后",
      eventDate: "2025-09-20"
    });

    expect(store.items.length).toBe(1);
    expect(store.items[0]?.title).toBe("测试回忆");
  });
});
