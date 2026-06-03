'use client'

import { useState, useEffect, useRef, type FormEvent, type ChangeEvent } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui'
import { Link } from '@/i18n/routing'
import { getTurnstileToken, resetTurnstile, TURNSTILE_SITE_KEY } from '@/lib/turnstile'

/* ── Types ── */

interface FormErrors {
  name?: string
  email?: string
  phone?: string
  message?: string
  agreed?: string
}

type SubmitStatus = 'idle' | 'loading' | 'success' | 'error'

const MAX_MESSAGE_LENGTH = 2000

/* ── Component ── */

export default function ContactForm() {
  const t = useTranslations('contactForm')
  const commonT = useTranslations('common')

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [status, setStatus] = useState<SubmitStatus>('idle')
  const [serverError, setServerError] = useState('')
  const [turnstileReady, setTurnstileReady] = useState(false)

  const widgetContainerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | undefined>(undefined)

  /* ── Turnstile widget ── */

  /* ── Detect localhost (dev mode) ── */

  const isLocalhost =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY || isLocalhost) {
      // dev mode or localhost — no captcha needed
      setTurnstileReady(true)
      return
    }

    // Отложенная загрузка — даём React отрисовать container div
    const timer = setTimeout(() => {
      const script = document.querySelector<HTMLScriptElement>(
        'script[src*="challenges.cloudflare.com/turnstile/v0/api.js"]',
      )

      function renderWidget() {
        if (!widgetContainerRef.current || !window.turnstile) return

        widgetIdRef.current = window.turnstile!.render(
          widgetContainerRef.current,
          {
            sitekey: TURNSTILE_SITE_KEY!,
            callback: () => setTurnstileReady(true),
            'expired-callback': () => setTurnstileReady(false),
            'error-callback': () => setTurnstileReady(false),
            theme: 'dark',
          },
        )
      }

      if (script && window.turnstile) {
        renderWidget()
      } else {
        const newScript = document.createElement('script')
        newScript.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js'
        newScript.async = true
        newScript.defer = true
        newScript.onload = renderWidget
        document.head.appendChild(newScript)
      }
    }, 100)

    return () => {
      clearTimeout(timer)
      if (widgetContainerRef.current && window.turnstile?.remove) {
        window.turnstile.remove(widgetContainerRef.current)
      }
    }
  }, [])

  /* ── Validation ── */

  function validate(): FormErrors {
    const errs: FormErrors = {}
    if (name.trim().length < 2) errs.name = t('nameError')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = t('emailError')
    if (phone.trim() && !/^[\d\s+\-()]+$/.test(phone.trim())) errs.phone = t('phoneError')
    if (message.trim().length < 10) errs.message = t('messageError')
    if (!agreed) errs.agreed = t('agreeError')
    return errs
  }

  /* ── Field-specific validation ── */

  function validateField(field: keyof FormErrors): string | undefined {
    switch (field) {
      case 'name':
        return name.trim().length < 2 ? t('nameError') : undefined
      case 'email':
        return !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? t('emailError') : undefined
      case 'phone':
        return phone.trim() && !/^[\d\s+\-()]+$/.test(phone.trim()) ? t('phoneError') : undefined
      case 'message':
        return message.trim().length < 10 ? t('messageError') : undefined
    }
  }

  /* ── Handlers ── */

  function handleBlur(field: keyof FormErrors) {
    const error = validateField(field)
    setErrors((prev) => ({ ...prev, [field]: error }))
  }

  function handleChange(
    setter: (v: string) => void,
    field: keyof FormErrors,
    maxLength?: number,
  ) {
    return (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = maxLength ? e.target.value.slice(0, maxLength) : e.target.value
      setter(value)
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }))
      }
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setServerError('')

    const validationErrors = validate()
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) {
      focusFirstError(validationErrors)
      return
    }

    setStatus('loading')

    // Получить Turnstile токен
    const turnstileToken = getTurnstileToken()

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, message, turnstileToken }),
      })

      const data: { error?: string } = await res.json()

      if (!res.ok) {
        setStatus('error')
        setServerError(data.error || t('errorDefault'))
        return
      }

      setStatus('success')
      resetTurnstile()
    } catch {
      setStatus('error')
      setServerError(t('errorDefault'))
    }
  }

  function focusFirstError(errs: FormErrors) {
    const order = ['name', 'email', 'phone', 'message', 'agreed'] as const
    const refs: Record<string, React.RefObject<HTMLElement | null>> = {
      name: nameRef,
      email: emailRef,
      phone: phoneRef,
      message: messageRef,
      agreed: agreedRef,
    }
    for (const field of order) {
      if (errs[field]) {
        refs[field]?.current?.focus()
        refs[field]?.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        break
      }
    }
  }

  // Refs for focus management
  const nameRef = useRef<HTMLInputElement>(null)
  const emailRef = useRef<HTMLInputElement>(null)
  const phoneRef = useRef<HTMLInputElement>(null)
  const messageRef = useRef<HTMLTextAreaElement>(null)
  const agreedRef = useRef<HTMLInputElement>(null)

  function handleReset() {
    setName('')
    setEmail('')
    setPhone('')
    setMessage('')
    setAgreed(false)
    setErrors({})
    setStatus('idle')
    setServerError('')
    setTurnstileReady(false)
  }

  /* ── Styles ── */

  const inputBase =
    'w-full bg-bg-elevated border border-border-light rounded-lg px-4 py-3 text-text-primary ' +
    'placeholder:text-text-muted/60 font-body text-sm transition-all duration-300 ' +
    'focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold-muted ' +
    'hover:border-border-light/80'

  const inputError =
    'border-error/40 focus:ring-error/30 focus:border-error'

  const labelClass = 'block text-sm font-medium text-text-secondary mb-1.5'

  const errorTextClass = 'mt-1 text-xs text-error'

  /* ── Render: Success ── */

  if (status === 'success') {
    return (
      <div className="flex flex-col items-center text-center py-8 px-4">
        {/* Green checkmark */}
        <div className="w-16 h-16 rounded-full bg-success/10 border border-success/30 flex items-center justify-center mb-5">
          <svg className="w-8 h-8 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h3 className="text-xl font-display text-text-primary mb-2">
          {t('successTitle')}
        </h3>
        <p className="text-sm text-text-muted max-w-sm">
          {t('successDescription')}
        </p>

        <Button
          type="button"
          variant="secondary"
          size="md"
          className="mt-6"
          onClick={handleReset}
        >
          {t('sendAnother')}
        </Button>
      </div>
    )
  }

  /* ── Render: Form ── */

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {/* ── Name ── */}
      <div>
        <label htmlFor="cf-name" className={labelClass}>
          {t('nameLabel')} <span className="text-gold">*</span>
        </label>
        <input
          ref={nameRef}
          id="cf-name"
          type="text"
          value={name}
          onChange={handleChange(setName, 'name', 100)}
          onBlur={() => handleBlur('name')}
          placeholder={t('namePlaceholder')}
          className={`${inputBase} ${errors.name ? inputError : ''}`}
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? 'cf-name-error' : undefined}
          autoComplete="name"
          required
        />
        {errors.name && (
          <p id="cf-name-error" className={errorTextClass} role="alert">
            {errors.name}
          </p>
        )}
      </div>

      {/* ── Email ── */}
      <div>
        <label htmlFor="cf-email" className={labelClass}>
          {t('emailLabel')} <span className="text-gold">*</span>
        </label>
        <input
          ref={emailRef}
          id="cf-email"
          type="email"
          value={email}
          onChange={handleChange(setEmail, 'email')}
          onBlur={() => handleBlur('email')}
          placeholder={t('emailPlaceholder')}
          className={`${inputBase} ${errors.email ? inputError : ''}`}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'cf-email-error' : undefined}
          autoComplete="email"
          required
        />
        {errors.email && (
          <p id="cf-email-error" className={errorTextClass} role="alert">
            {errors.email}
          </p>
        )}
      </div>

      {/* ── Phone ── */}
      <div>
        <label htmlFor="cf-phone" className={labelClass}>
          {t('phoneLabel')}
        </label>
        <input
          ref={phoneRef}
          id="cf-phone"
          type="tel"
          value={phone}
          onChange={handleChange(setPhone, 'phone', 30)}
          onBlur={() => handleBlur('phone')}
          placeholder={t('phonePlaceholder')}
          className={`${inputBase} ${errors.phone ? inputError : ''}`}
          aria-invalid={!!errors.phone}
          aria-describedby={errors.phone ? 'cf-phone-error' : undefined}
          autoComplete="tel"
        />
        {errors.phone && (
          <p id="cf-phone-error" className={errorTextClass} role="alert">
            {errors.phone}
          </p>
        )}
      </div>

      {/* ── Message ── */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label htmlFor="cf-message" className={labelClass}>
            {t('messageLabel')} <span className="text-gold">*</span>
          </label>
          {message.length > 0 && (
            <span className="text-[11px] text-text-muted/60 tabular-nums">
              {message.length} / {MAX_MESSAGE_LENGTH}
            </span>
          )}
        </div>
        <textarea
          ref={messageRef}
          id="cf-message"
          rows={4}
          value={message}
          onChange={handleChange(setMessage, 'message', MAX_MESSAGE_LENGTH)}
          onBlur={() => handleBlur('message')}
          placeholder={t('messagePlaceholder')}
          className={`${inputBase} resize-y min-h-[7rem] ${errors.message ? inputError : ''}`}
          aria-invalid={!!errors.message}
          aria-describedby={errors.message ? 'cf-message-error' : undefined}
          required
        />
        {errors.message && (
          <p id="cf-message-error" className={errorTextClass} role="alert">
            {errors.message}
          </p>
        )}
      </div>

      {/* ── Server error ── */}
      {status === 'error' && serverError && (
        <div className="p-3 rounded-lg bg-error-bg border border-error/30 text-sm text-error" role="alert">
          {serverError}
        </div>
      )}

      {/* ── Turnstile widget ── */}
      {TURNSTILE_SITE_KEY && (
        <div className="flex justify-center">
          <div ref={widgetContainerRef} />
        </div>
      )}

      {/* ── Error banner ── */}
      {Object.keys(errors).length > 0 && (
        <div
          role="alert"
          aria-live="polite"
          className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400 flex items-center gap-2"
        >
          <span aria-hidden="true">⚠</span>
          {t('fieldErrorBanner')}
        </div>
      )}

      {/* ── Consent checkbox ── */}
      <div className="mt-2">
        <label className="flex items-start gap-3 cursor-pointer group">
          <div className="relative mt-0.5 flex-shrink-0">
            <input
              ref={agreedRef}
              type="checkbox"
              checked={agreed}
              onChange={(e) => {
                setAgreed(e.target.checked)
                if (e.target.checked) setErrors((prev) => ({ ...prev, agreed: undefined }))
              }}
              className="sr-only peer"
              aria-required="true"
              aria-describedby={errors.agreed ? 'cf-agreed-error' : undefined}
            />
            <div className="w-5 h-5 rounded border border-border-light bg-bg-elevated peer-checked:bg-gold/20 peer-checked:border-gold/60 peer-focus-visible:ring-2 peer-focus-visible:ring-gold/30 transition-all duration-200 flex items-center justify-center">
              {agreed && (
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden="true">
                  <path d="M1 4L3.5 6.5L9 1" stroke="#C9A96E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
          </div>
          <span className="text-sm text-text-secondary leading-relaxed">
            {t('agreeText')}
          </span>
        </label>
        {errors.agreed && (
          <p id="cf-agreed-error" className="mt-1 text-xs text-error flex items-center gap-1.5" role="alert">
            <span aria-hidden="true">⚠</span> {errors.agreed}
          </p>
        )}
      </div>

      {/* ── Submit ── */}
      <Button
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        loading={status === 'loading'}
        disabled={status === 'loading' || !turnstileReady}
      >
        {status === 'loading' ? t('sending') : t('submit')}
      </Button>
    </form>
  )
}
