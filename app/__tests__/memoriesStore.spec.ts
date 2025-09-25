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
      title: "初始回忆",
      content: "一次散步的感受",
      eventDate: "2025-09-20"
    });

    expect(store.items.length).toBe(1);
    expect(store.items[0]?.title).toBe("初始回忆");
  });

  it("removes a memory by id", () => {
    const store = useMemoriesStore();
    const first = store.addMemory({
      title: "第一段记忆",
      content: "记录当日的心情。",
      eventDate: "2025-09-20"
    });

    store.addMemory({
      title: "第二段记忆",
      content: "这是第二次散步。",
      eventDate: "2025-09-21"
    });

    expect(store.items.length).toBe(2);

    store.removeMemory(first?.id ?? "");

    expect(store.items.length).toBe(1);
    expect(store.items[0]?.title).toBe("第二段记忆");
  });
});
