/**
 * Architecture unit tests — validates project-wide conventions.
 * This file is intentionally at the server root and self-excluded from the co-location rule.
 */
import { describe, expect, test } from 'bun:test'
import { globSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { basename, dirname, join } from 'node:path'

const SERVER_DIR = join(import.meta.dir)
const DOMAIN_DIR = join(SERVER_DIR, 'domain')

const domains = readdirSync(DOMAIN_DIR).filter((d) => statSync(join(DOMAIN_DIR, d)).isDirectory())

const readFile = (path: string) => readFileSync(path, 'utf-8')

const glob = (pattern: string) => globSync(pattern, { cwd: join(SERVER_DIR, '..') })

describe('architecture', () => {
  describe('each domain has a types.ts', () => {
    for (const domain of domains) {
      test(domain, () => {
        const typesPath = join(DOMAIN_DIR, domain, 'types.ts')
        expect(statSync(typesPath).isFile()).toBe(true)
      })
    }
  })

  describe('primitives.ts imports ts-brand and zod', () => {
    const primitivesFiles = glob('server/domain/*/primitives.ts')

    // Skip pure re-export files (e.g. files that only re-export from shared)
    const ownPrimitives = primitivesFiles.filter((f) => {
      const content = readFile(join(SERVER_DIR, '..', f))
      return !content.split('\n').every((l) => l.trim() === '' || l.startsWith('export '))
    })

    for (const file of ownPrimitives) {
      const fullPath = join(SERVER_DIR, '..', file)
      const domain = file.split('/')[2]

      test(domain, () => {
        const content = readFile(fullPath)
        expect(content).toContain('ts-brand')
        expect(content).toContain('zod')
      })
    }
  })

  describe('no console.log/error/warn in server code', () => {
    const serverFiles = glob('server/**/*.ts').filter(
      (f) => !f.includes('test/') && !f.endsWith('.test.ts'),
    )

    test('no console statements found', () => {
      const violations: string[] = []
      for (const file of serverFiles) {
        const content = readFile(join(SERVER_DIR, '..', file))
        const lines = content.split('\n')
        for (let i = 0; i < lines.length; i++) {
          if (/console\.(log|error|warn)/.test(lines[i])) {
            violations.push(`${file}:${i + 1}: ${lines[i].trim()}`)
          }
        }
      }
      expect(violations).toEqual([])
    })
  })

  describe('no cross-domain repository imports', () => {
    const domainFiles = glob('server/domain/**/*.ts').filter((f) => !f.endsWith('.test.ts'))

    test('production code does not import repository from another domain', () => {
      const violations: string[] = []
      for (const file of domainFiles) {
        const parts = file.split('/')
        const currentDomain = parts[2]
        const content = readFile(join(SERVER_DIR, '..', file))
        const lines = content.split('\n')
        for (let i = 0; i < lines.length; i++) {
          const match = lines[i].match(/from\s+['"]~\/domain\/(\w+)\/repository['"]/)
          if (match && match[1] !== currentDomain) {
            violations.push(`${file}:${i + 1}: imports ${match[1]}/repository`)
          }
        }
      }
      expect(violations).toEqual([])
    })
  })

  describe('tests are co-located with source files', () => {
    const testFiles = glob('server/**/*.test.ts').filter(
      (f) => f !== 'server/architecture.unit.test.ts',
    )
    const validSuffixes = ['.unit.test.ts', '.int.test.ts', '.func.test.ts']

    test('each test file uses a valid suffix', () => {
      const violations = testFiles.filter(
        (f) => !validSuffixes.some((suffix) => f.endsWith(suffix)),
      )
      expect(violations).toEqual([])
    })

    test('each test file is in the same directory as a source file', () => {
      const violations: string[] = []
      for (const testFile of testFiles) {
        const dir = dirname(join(SERVER_DIR, '..', testFile))
        const sourceFiles = readdirSync(dir).filter(
          (f) => f.endsWith('.ts') && !f.endsWith('.test.ts'),
        )
        if (sourceFiles.length === 0) {
          violations.push(testFile)
        }
      }
      expect(violations).toEqual([])
    })
  })

  describe('no throw in domain query.ts and command.ts', () => {
    const targets = glob('server/domain/*/{query,command}.ts')

    for (const file of targets) {
      test(`${basename(dirname(file))}/${basename(file)}`, () => {
        const content = readFile(join(SERVER_DIR, '..', file))
        const lines = content.split('\n')
        const violations: string[] = []
        for (let i = 0; i < lines.length; i++) {
          if (/throw\s+new\s+Error/.test(lines[i])) {
            violations.push(`${file}:${i + 1}: ${lines[i].trim()}`)
          }
        }
        expect(violations).toEqual([])
      })
    }
  })
})
