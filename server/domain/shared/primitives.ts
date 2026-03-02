import { make } from 'ts-brand'
import { z } from 'zod'
import type {
  Country as CountryType,
  Count as CountType,
  Eur as EurType,
  Year as YearType,
} from '~/domain/shared/types'

export const Eur = (value: unknown) => {
  const v = z
    .preprocess((v) => (typeof v === 'string' ? Number(v) : v), z.number().nonnegative())
    .parse(value)
  return make<EurType>()(v)
}

export const Year = (value: unknown) => {
  const v = z
    .preprocess((v) => (typeof v === 'string' ? Number(v) : v), z.number().int().min(1800))
    .parse(value)
  return make<YearType>()(v)
}

export const Country = (value: unknown) => {
  const v = z.string().min(1).parse(value)
  return make<CountryType>()(v)
}

export const Count = (value: number) => make<CountType>()(value)
