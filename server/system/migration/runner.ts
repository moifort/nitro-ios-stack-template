import { sortBy } from 'lodash-es'
import { createLogger } from '~/system/logger'
import { MigrationVersion } from '~/system/migration/primitives'
import type { Migration, MigrationMeta } from '~/system/migration/types'

const log = createLogger('migration')

export const runMigrations = async (migrations: Migration[]) => {
  const metaStorage = useStorage('migration-meta')
  const meta = (await metaStorage.getItem<MigrationMeta>('state')) ?? {
    version: MigrationVersion(0),
    appliedAt: new Date(0),
  }
  const fromVersion = meta.version

  const pending = sortBy(
    migrations.filter((migration) => migration.version > meta.version),
    ({ version }) => version,
  )
  if (pending.length === 0) return { outcome: 'up-to-date' as const }

  const ctx = { storage: (namespace: string) => useStorage(namespace) }

  for (const migration of pending) {
    try {
      const result = await migration.migrate(ctx)
      if (!result.ok)
        return { outcome: 'failed' as const, version: migration.version, error: result.error }
      await metaStorage.setItem<MigrationMeta>('state', {
        version: migration.version,
        appliedAt: new Date(),
      })
      log.info(
        `Applied v${migration.version} "${migration.name}" (${result.transformed} transformed)`,
      )
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      return { outcome: 'failed' as const, version: migration.version, error: message }
    }
  }
  const lastVersion = pending[pending.length - 1].version
  return {
    outcome: 'migrated' as const,
    from: fromVersion,
    to: lastVersion,
    applied: pending.length,
  }
}
