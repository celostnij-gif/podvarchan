/**
 * /[locale]/login — публичная страница входа через Google.
 *
 * Позволяет пользователям войти на сайт через Google OAuth.
 * При первом входе создаётся новый пользователь с ролью VIEWER.
 */

import { getTranslations } from 'next-intl/server'
import { generateMetadata as seoMetadata } from '@/lib/seo/metadata'
import LoginClient from './client-page'

type Props = {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'login' })

  return seoMetadata({
    title: t('pageTitle'),
    description: t('pageDescription'),
    path: '/login',
    locale,
  })
}

export default async function LoginPage() {
  return <LoginClient />
}
