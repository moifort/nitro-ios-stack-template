import { describe, test } from 'bun:test'

export const feature = describe
export const scenario = test

export const given = (description: string) => console.log(`  Given ${description}`)
export const when = (description: string) => console.log(`  When ${description}`)
export const then = (description: string) => console.log(`  Then ${description}`)
export const and = (description: string) => console.log(`  And ${description}`)
