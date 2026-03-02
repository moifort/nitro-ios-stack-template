/** biome-ignore-all lint/suspicious/noExplicitAny: any is ok here, this is a plugin */
import { cacheKeys, evictFromRequestCache, memoizedPerRequest } from '~/system/request-cache'

export default defineNitroPlugin(() => {
  const rootStorage = useStorage()

  const originalGetItem = rootStorage.getItem.bind(rootStorage) as (...args: unknown[]) => unknown
  ;(rootStorage as any).getItem = (...args: unknown[]) =>
    memoizedPerRequest(cacheKeys.getItem(args), () => originalGetItem(...args))

  const originalGetKeys = rootStorage.getKeys.bind(rootStorage) as (...args: unknown[]) => unknown
  ;(rootStorage as any).getKeys = (...args: unknown[]) =>
    memoizedPerRequest(cacheKeys.getKeys(args), () => originalGetKeys(...args))

  const originalGetItems = rootStorage.getItems.bind(rootStorage) as (...args: unknown[]) => unknown
  ;(rootStorage as any).getItems = (...args: unknown[]) =>
    memoizedPerRequest(cacheKeys.getItems(args), () => originalGetItems(...args))

  const originalSetItem = rootStorage.setItem.bind(rootStorage) as (...args: unknown[]) => unknown
  ;(rootStorage as any).setItem = (...args: unknown[]) => {
    evictFromRequestCache(cacheKeys.getItem(args))
    return originalSetItem(...args)
  }

  const originalRemoveItem = rootStorage.removeItem.bind(rootStorage) as (
    ...args: unknown[]
  ) => unknown
  ;(rootStorage as any).removeItem = (...args: unknown[]) => {
    evictFromRequestCache(cacheKeys.getItem(args))
    return originalRemoveItem(...args)
  }
})
