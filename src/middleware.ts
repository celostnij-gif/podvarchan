import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'

export default createMiddleware(routing)

export const config = {
  matcher: [
    '/((?!api|_next|_vercel|_a2a|a2a|.*\\..*).*)',
  ],
}
