import { config } from '~/system/config/index'
import { createLogger } from '~/system/logger'

const log = createLogger('startup')

export default defineNitroPlugin(() => {
  log.info('Config:', config())
})
