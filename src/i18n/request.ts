import { getRequestConfig } from 'next-intl/server'
import { hasLocale } from 'next-intl'
import { routing } from './routing'

// Static imports — loaded once at module level, not per-request
import ruMessages from '../../messages/ru.json'
import ukMessages from '../../messages/uk.json'

const messagesByLocale = {
  ru: ruMessages,
  uk: ukMessages,
} as const

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale

  return {
    locale,
    messages: messagesByLocale[locale as keyof typeof messagesByLocale],
  }
})
