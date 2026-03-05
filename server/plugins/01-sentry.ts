import * as Sentry from '@sentry/bun'
import { instrumentDomains } from '#domain-instrumentation'
import { config } from '~/system/config/index'
import { cacheKeys, isInRequestCache } from '~/system/request-cache'

export default defineNitroPlugin((nitroApp) => {
  if (typeof Bun === 'undefined') return
  const { sentryDsn } = config()
  if (!sentryDsn) return

  Sentry.init({
    dsn: sentryDsn,
    tracesSampleRate: 1.0,
    integrations: (defaults) =>
      defaults
        // BunServer integration is incompatible with Nitro's localFetch pattern
        .filter((integration) => integration.name !== 'BunServer')
        .concat(Sentry.fsIntegration({ recordFilePaths: true })),
  })

  instrumentDomains()
  instrumentStorage()

  const originalHandler = nitroApp.h3App.handler
  nitroApp.h3App.handler = ((event) =>
    Sentry.startSpan({ name: `${event.method} ${event.path}`, op: 'http.server' }, async (span) => {
      const result = await originalHandler(event)
      const route = event.context.matchedRoute?.path
      if (route) span.updateName(`${event.method} ${route}`)
      return result
    })) as typeof originalHandler

  nitroApp.hooks.hook('error', (error, { event }) => {
    const statusCode = (error as { statusCode?: number }).statusCode
    if (statusCode && statusCode >= 400 && statusCode < 500) return

    Sentry.captureException(error, {
      extra: {
        path: event?.path,
        method: event?.method,
      },
    })
  })
})

const cachedMethods: Record<string, (args: unknown[]) => string> = {
  getItem: cacheKeys.getItem,
  getItems: cacheKeys.getItems,
  getKeys: cacheKeys.getKeys,
}

const instrumentStorage = () => {
  const rootStorage = useStorage()
  const methods = ['getItem', 'getItems', 'setItem', 'removeItem', 'getKeys', 'hasItem'] as const
  methods.forEach((method) => {
    const original = rootStorage[method].bind(rootStorage) as (...args: unknown[]) => unknown
    ;(rootStorage as any)[method] = (...args: unknown[]) => {
      const key = typeof args[0] === 'string' ? args[0] : ''
      const namespace = key.split(':')[0] || 'storage'
      const cacheKeyBuilder = cachedMethods[method]
      const attributes = cacheKeyBuilder
        ? { 'cache.hit': isInRequestCache(cacheKeyBuilder(args)) }
        : {}
      return Sentry.startSpan({ name: `${namespace}.${method}`, op: 'db', attributes }, () =>
        original(...args),
      )
    }
  })
}
