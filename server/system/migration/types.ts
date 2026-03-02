import type { Brand } from 'ts-brand'

export type MigrationVersion = Brand<number, 'MigrationVersion'>
export type MigrationName = Brand<string, 'MigrationName'>

export type Migration = {
  version: MigrationVersion
  name: MigrationName
  migrate: (ctx: MigrationContext) => Promise<MigrationResult>
}
export type MigrationContext = { storage: (namespace: string) => ReturnType<typeof useStorage> }
export type MigrationMeta = { version: MigrationVersion; appliedAt: Date }
export type MigrationResult = { ok: true; transformed: number } | { ok: false; error: string }
