'use client'

import { useTranslations } from 'next-intl'
import { AnimatedText, SectionContainer, PageHero } from '@/components/ui'
import ContactForm from '@/components/ContactForm'
import { TelegramIcon, WhatsAppIcon, EmailIcon } from '@/components/ui/Icons'

export default function KontaktyClient() {
  const t = useTranslations('contacts')
  const commonT = useTranslations('common')

  return (
    <>
      <PageHero
        title={t('pageTitle')}
        description={t('pageDescription')}
        breadcrumbItems={[
          { label: commonT('nav.home'), href: '/' },
          { label: t('pageTitle') },
        ]}
        clean
      />

      {/* ── Content ── */}
      <SectionContainer size="sm">
        <div className="grid gap-10 lg:grid-cols-5">
          {/* ── Left column: steps + contacts + confidentiality ── */}
          <div className="lg:col-span-2 space-y-8">
            {/* Steps */}
            <AnimatedText direction="up" className="p-6 rounded-xl bg-bg-surface border border-border-base">
              <h2 className="text-lg font-display text-gold mb-4">{t('stepsTitle')}</h2>
              <ol className="space-y-4">
                <li className="flex gap-3 items-start">
                  <span className="shrink-0 w-7 h-7 rounded-full bg-gold/10 text-gold text-xs font-bold flex items-center justify-center mt-0.5">
                    1
                  </span>
                  <span className="text-sm text-text-secondary">{t('step1')}</span>
                </li>
                <li className="flex gap-3 items-start">
                  <span className="shrink-0 w-7 h-7 rounded-full bg-gold/10 text-gold text-xs font-bold flex items-center justify-center mt-0.5">
                    2
                  </span>
                  <span className="text-sm text-text-secondary">{t('step2')}</span>
                </li>
                <li className="flex gap-3 items-start">
                  <span className="shrink-0 w-7 h-7 rounded-full bg-gold/10 text-gold text-xs font-bold flex items-center justify-center mt-0.5">
                    3
                  </span>
                  <span className="text-sm text-text-secondary">{t('step3')}</span>
                </li>
              </ol>
            </AnimatedText>

            {/* Contact info */}
            <AnimatedText direction="up" className="p-6 rounded-xl bg-bg-surface border border-border-base">
              <h2 className="text-lg font-display text-gold mb-4">{t('bookingTitle')}</h2>
              <p className="mt-0 mb-5 text-sm text-text-muted">
                {t('bookingDescription')}
              </p>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="shrink-0 w-9 h-9 flex items-center justify-center rounded-full bg-[#0088cc]/10 text-[#0088cc]">
                    <TelegramIcon size={18} />
                  </span>
                  <div>
                    <p className="text-xs text-text-muted">Telegram</p>
                    <a
                      href="https://t.me/SLAVKA_VIP"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-gold hover:text-gold-light underline-offset-4 hover:underline"
                    >
                      @SLAVKA_VIP
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="shrink-0 w-9 h-9 flex items-center justify-center rounded-full bg-[#25D366]/10 text-[#25D366]">
                    <WhatsAppIcon size={18} />
                  </span>
                  <div>
                    <p className="text-xs text-text-muted">WhatsApp</p>
                    <a
                      href="https://wa.me/380663122069"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-gold hover:text-gold-light underline-offset-4 hover:underline"
                    >
                      +380 66 312 2069
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="shrink-0 w-9 h-9 flex items-center justify-center rounded-full bg-gold/10 text-gold">
                    <EmailIcon size={18} />
                  </span>
                  <div>
                    <p className="text-xs text-text-muted">Email</p>
                    <a
                      href="mailto:podvarchan@gmail.com"
                      className="text-sm text-gold hover:text-gold-light underline-offset-4 hover:underline"
                    >
                      podvarchan@gmail.com
                    </a>
                  </div>
                </div>
              </div>
            </AnimatedText>

            {/* Confidentiality */}
            <AnimatedText direction="up" className="p-6 rounded-xl bg-bg-surface/50 border border-border-base">
              <div className="flex gap-3 items-start">
                <span className="shrink-0 w-9 h-9 flex items-center justify-center rounded-full bg-gold/5 text-gold/60 text-sm" aria-hidden="true">
                  🔒
                </span>
                <div>
                  <h3 className="text-sm font-medium text-text-primary mb-1">{t('confidentialityTitle')}</h3>
                  <p className="text-xs text-text-muted leading-relaxed">
                    {t('confidentialityText')}
                  </p>
                </div>
              </div>
            </AnimatedText>
          </div>

          {/* ── Right column: form ── */}
          <AnimatedText direction="up" delay={100} className="lg:col-span-3 p-6 md:p-8 rounded-xl bg-bg-surface border border-border-base">
            <h2 className="text-lg font-display text-gold mb-2">{t('formTitle')}</h2>
            <p className="text-sm text-text-muted mb-6">
              {t('formDescription')}
            </p>
            <ContactForm />
          </AnimatedText>
        </div>
      </SectionContainer>
    </>
  )
}
