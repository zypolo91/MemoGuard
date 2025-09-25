/// <reference types='vite/client' />

type NoInfer<T> = [T][T extends any ? 0 : never];
