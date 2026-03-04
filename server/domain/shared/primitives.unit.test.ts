import { describe, expect, test } from 'bun:test'
import { Country, Eur, Year } from '~/domain/shared/primitives'

describe('Eur', () => {
  test('accepts a positive number', () => {
    expect(Eur(9.99)).toBe(Eur(9.99))
  })

  test('accepts zero', () => {
    expect(Eur(0)).toBe(Eur(0))
  })

  test('coerces a string to number', () => {
    expect(Eur('12.5')).toBe(Eur(12.5))
  })

  test('rejects a negative number', () => {
    expect(() => Eur(-1)).toThrow()
  })
})

describe('Year', () => {
  test('accepts a valid year', () => {
    expect(Year(2020)).toBe(Year(2020))
  })

  test('coerces a string to number', () => {
    expect(Year('2020')).toBe(Year(2020))
  })

  test('rejects a year before 1800', () => {
    expect(() => Year(1799)).toThrow()
  })

  test('rejects a non-integer', () => {
    expect(() => Year(2020.5)).toThrow()
  })
})

describe('Country', () => {
  test('accepts a non-empty string', () => {
    expect(Country('France')).toBe(Country('France'))
  })

  test('rejects an empty string', () => {
    expect(() => Country('')).toThrow()
  })
})
