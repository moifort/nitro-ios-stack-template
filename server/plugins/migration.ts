import { match } from 'ts-pattern'
import { migrations } from '~/system/migration/migrations/index'
import { runMigrations } from '~/system/migration/runner'

export default defineNitroPlugin(async () => {
  const result = await runMigrations(migrations)
  match(result)
    .with({ outcome: 'up-to-date' }, () => {
      console.log('[migration] Database is up to date')
    })
    .with({ outcome: 'migrated' }, ({ from, to, applied }) => {
      console.log(`[migration] Migrated from v${from} to v${to} (${applied} migrations applied)`)
    })
    .with({ outcome: 'failed' }, ({ version, error }) => {
      console.error(`[migration] Failed at v${version}: ${error}`)
      process.exit(1)
    })
    .exhaustive()
})
