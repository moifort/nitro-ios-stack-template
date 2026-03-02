import { make } from 'ts-brand'
import { z } from 'zod'
import type { ApiToken as ApiTokenType, SentryDsn as SentryDsnType } from '~/system/config/types'

export const ApiToken = (value: unknown) => {
  const v = z.string().min(1).parse(value)
  return make<ApiTokenType>()(v)
}

export const SentryDsn = (value: unknown) => {
  const v = z.string().min(1).parse(value)
  return make<SentryDsnType>()(v)
}
