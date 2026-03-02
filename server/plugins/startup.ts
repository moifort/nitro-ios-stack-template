import { config } from '~/system/config/index'

export default defineNitroPlugin(() => {
  console.log(`${JSON.stringify(config())}`)
})
