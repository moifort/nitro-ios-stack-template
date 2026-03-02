import { migration0001 } from '~/system/migration/migrations/0001-init'
import type { Migration } from '~/system/migration/types'

export const migrations: Migration[] = [migration0001]
