import { MigrationName, MigrationVersion } from '~/system/migration/primitives'
import type { Migration } from '~/system/migration/types'

export const migration0001: Migration = {
  version: MigrationVersion(1),
  name: MigrationName('Initial migration'),
  migrate: async (_ctx) => {
    console.log('[migration] No transformation needed for init')
    return { ok: true, transformed: 0 }
  },
}
