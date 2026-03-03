import { createLogger } from '~/system/logger'

const log = createLogger('http')

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('request', (event) => {
    log.info('on request', event.path)
  })
  nitroApp.hooks.hook('beforeResponse', (event, { body }) => {
    log.info('on response', event.path, { body })
  })
  nitroApp.hooks.hook('error', (error) => {
    log.error('on error', error)
  })
})
