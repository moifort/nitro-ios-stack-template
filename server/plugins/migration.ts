import { match } from 'ts-pattern'
import { createLogger } from '~/system/logger'
import { migrations } from '~/system/migration/migrations/index'
import { runMigrations } from '~/system/migration/runner'

const log = createLogger('migration')

export default defineNitroPlugin(async () => {
  const result = await runMigrations(migrations)
  match(result)
    .with({ outcome: 'up-to-date' }, () => {
      log.info('Database is up to date')
    })
    .with({ outcome: 'migrated' }, ({ from, to, applied }) => {
      log.info(`Migrated from v${from} to v${to} (${applied} migrations applied)`)
    })
    .with({ outcome: 'failed' }, ({ version, error }) => {
      log.error(`Failed at v${version}: ${error}`)
      process.exit(1)
    })
    .exhaustive()
})
