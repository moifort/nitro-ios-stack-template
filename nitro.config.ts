import { generateDomainInstrumentation } from './server/system/sentry/generate-domain-instrumentation'

export default defineNitroConfig({
  compatibilityDate: '2026-02-06',
  experimental: { asyncContext: true },
  srcDir: 'server',
  virtual: {
    '#domain-instrumentation': generateDomainInstrumentation,
  },
  runtimeConfig: {
    apiToken: '',
    sentryDsn: '',
  },
  storage: {
    'migration-meta': { driver: 'fs', base: './.data/db/migration-meta' },
    // Add your domain storage namespaces here:
    // example: { driver: 'fs', base: './.data/db/example' },
  },
})
