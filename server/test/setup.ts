import { afterEach, mock } from 'bun:test'

type StorageItem = { base: string; key: string; value: unknown }

const stores = new Map<string, Map<string, unknown>>()

export const getStore = (namespace: string) => {
  if (!stores.has(namespace)) stores.set(namespace, new Map())
  return stores.get(namespace)!
}

export const clearAllStores = () => {
  for (const store of stores.values()) store.clear()
  stores.clear()
}

const createMockStorage = (namespace: string) => {
  const store = getStore(namespace)
  return {
    getItem: async <T>(key: string) => (store.get(key) as T) ?? null,
    setItem: async <T>(_key: string, value: T) => {
      store.set(_key, value)
    },
    removeItem: async (key: string) => {
      store.delete(key)
    },
    getKeys: async (base?: string) => {
      const keys = [...store.keys()]
      return base ? keys.filter((k) => k.startsWith(`${base}:`)) : keys
    },
    getItems: async <T>(keys: string[]) =>
      keys
        .filter((key) => store.has(key))
        .map((key) => ({
          base: namespace,
          key,
          value: store.get(key) as T,
        })) as StorageItem[],
  }
}

// @ts-expect-error — global mock for Nitro's useStorage
globalThis.useStorage = (namespace: string) => createMockStorage(namespace)

// @ts-expect-error — global mock for Nitro's defineEventHandler
globalThis.defineEventHandler = (handler: (...args: never[]) => unknown) => handler

// @ts-expect-error — global mock for Nitro's createError
globalThis.createError = (opts: { statusCode: number; statusMessage: string }) =>
  Object.assign(new Error(opts.statusMessage), opts)

// @ts-expect-error — global mock for h3's readBody
globalThis.readBody = (_event: MockEvent) => Promise.resolve(_event.__body)

// @ts-expect-error — global mock for h3's getQuery
globalThis.getQuery = (_event: MockEvent) => _event.__query ?? {}

// @ts-expect-error — global mock for h3's getRouterParam
globalThis.getRouterParam = (_event: MockEvent, name: string) => _event.__params?.[name]

type MockEvent = {
  __body?: unknown
  __query?: Record<string, string>
  __params?: Record<string, string>
}

export const mockEvent = (opts?: {
  body?: unknown
  query?: Record<string, string>
  params?: Record<string, string>
}): MockEvent => ({
  __body: opts?.body,
  __query: opts?.query,
  __params: opts?.params,
})

mock.module('~/system/logger', () => ({
  createLogger: () => ({
    info: () => {},
    warn: () => {},
    error: () => {},
    debug: () => {},
  }),
}))

afterEach(() => {
  clearAllStores()
})
