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

type FieldId = keyof Omit<FormErrors, 'agreed'>

interface FieldConfig {
  id: FieldId
  label: string
  required: boolean
  type: 'text' | 'email' | 'tel' | 'textarea'
  placeholderKey: string
  maxLength?: number
  autoComplete: string
}

const MAX_MESSAGE_LENGTH = 2000

const FIELDS: FieldConfig[] = [
  { id: 'name', label: 'nameLabel', required: true, type: 'text', placeholderKey: 'namePlaceholder', maxLength: 100, autoComplete: 'name' },
  { id: 'email', label: 'emailLabel', required: true, type: 'email', placeholderKey: 'emailPlaceholder', autoComplete: 'email' },
  { id: 'phone', label: 'phoneLabel', required: false, type: 'tel', placeholderKey: 'phonePlaceholder', maxLength: 30, autoComplete: 'tel' },
  { id: 'message', label: 'messageLabel', required: true, type: 'textarea', placeholderKey: 'messagePlaceholder', maxLength: MAX_MESSAGE_LENGTH, autoComplete: 'off' },
]

/* ── Component ── */

export default function ContactForm() {
  const t = useTranslations('contactForm')
  const [values, setValues] = useState<Record<string, string>>({ name: '', email: '', phone: '', message: '' })
  const [agreed, setAgreed] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [status, setStatus] = useState<SubmitStatus>('idle')
  const [serverError, setServerError] = useState('')

  const nameRef = useRef<HTMLInputElement>(null)
  const emailRef = useRef<HTMLInputElement>(null)
  const phoneRef = useRef<HTMLInputElement>(null)
  const messageRef = useRef<HTMLTextAreaElement>(null)
  const agreedRef = useRef<HTMLInputElement>(null)

  const widgetContainerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | undefined>(undefined)

  /* ── Lazy viewport detection for Turnstile ── */
  const formRef = useRef<HTMLFormElement>(null)
  const [isNearViewport, setIsNearViewport] = useState(false)
  const [turnstileReady, setTurnstileReady] = useState(false)

  useEffect(() => {
    const el = formRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setIsNearViewport(true); observer.disconnect() } },
      { rootMargin: '200px 0px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  const inputClass = [
    'w-full bg-bg-elevated border border-border-light rounded-lg px-4 py-3 text-text-primary',
    'placeholder:text-text-muted/60 font-body text-sm transition-all duration-300',
    'focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold-muted hover:border-border-light/80',
  ].join(' ')

  const inputErrClass = 'border-error/40 focus:ring-error/30 focus:border-error'
  const labelClass = 'block text-sm font-medium text-text-secondary mb-1.5'
  const errorTextClass = 'mt-1 text-xs text-error'

  /* ── Turnstile ── */

  /* ── Turnstile widget init (only when form is near viewport) ── */

  const isLocalhost =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')

  useEffect(() => {
    if (!isNearViewport) return
    const container = widgetContainerRef.current
    if (!TURNSTILE_SITE_KEY || isLocalhost) {
      queueMicrotask(() => setTurnstileReady(true))
      return
    }
    const timer = setTimeout(() => {
      const script = document.querySelector<HTMLScriptElement>('script[src*="challenges.cloudflare.com/turnstile/v0/api.js"]')

      function renderWidget() {
        if (!widgetContainerRef.current || !window.turnstile) return
        widgetIdRef.current = window.turnstile!.render(widgetContainerRef.current, {
          sitekey: TURNSTILE_SITE_KEY!,
          callback: () => setTurnstileReady(true),
          'expired-callback': () => setTurnstileReady(false),
          'error-callback': () => setTurnstileReady(false),
          theme: 'dark',
        })
      }

      if (script && window.turnstile) {
        renderWidget()
      } else {
        const s = document.createElement('script')
        s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js'
        s.async = true; s.defer = true; s.onload = renderWidget
        document.head.appendChild(s)
      }
    }, 100)
    return () => {
      clearTimeout(timer)
      if (container && window.turnstile?.remove) window.turnstile.remove(container)
    }
  }, [isLocalhost, isNearViewport])

  /* ── Validation ── */

  function getValue(field: FieldId) { return (values[field] ?? '').trim() }

  function validate() {
    const errs: FormErrors = {}
    if (getValue('name').length < 2) errs.name = t('nameError')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(getValue('email'))) errs.email = t('emailError')
    const p = getValue('phone')
    if (p && !/^[\d\s+\-()]+$/.test(p)) errs.phone = t('phoneError')
    if (getValue('message').length < 10) errs.message = t('messageError')
    if (!agreed) errs.agreed = t('agreeError')
    return errs
  }

  function validateField(field: FieldId): string | undefined {
    const val = getValue(field)
    switch (field) {
      case 'name': return val.length < 2 ? t('nameError') : undefined
      case 'email': return !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) ? t('emailError') : undefined
      case 'phone': return val && !/^[\d\s+\-()]+$/.test(val) ? t('phoneError') : undefined
      case 'message': return val.length < 10 ? t('messageError') : undefined
    }
  }

  /* ── Handlers ── */

  function onChange(field: string, maxLength?: number) {
    return (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const v = maxLength ? e.target.value.slice(0, maxLength) : e.target.value
      setValues((prev) => ({ ...prev, [field]: v }))
      if (errors[field as keyof FormErrors]) setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  function onBlur(field: FieldId) {
    setErrors((prev) => ({ ...prev, [field]: validateField(field) }))
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setServerError('')
    const errs = validate()
    setErrors(errs)
    if (Object.keys(errs).length > 0) {
      const order: (keyof FormErrors)[] = ['name', 'email', 'phone', 'message', 'agreed']
      for (const f of order) {
        if (errs[f]) {
          const ref = f === 'name' ? nameRef : f === 'email' ? emailRef : f === 'phone' ? phoneRef : f === 'message' ? messageRef : agreedRef
          ref?.current?.focus()
          ref?.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
          break
        }
      }
      return
    }
    setStatus('loading')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, turnstileToken: getTurnstileToken() }),
      })
      const data: { error?: string } = await res.json()
      if (!res.ok) { setStatus('error'); setServerError(data.error || t('errorDefault')); return }
      setStatus('success')
      resetTurnstile()
    } catch {
      setStatus('error')
      setServerError(t('errorDefault'))
    }
  }

  function reset() {
    setValues({ name: '', email: '', phone: '', message: '' })
    setAgreed(false); setErrors({}); setStatus('idle'); setServerError(''); setTurnstileReady(false)
  }

  /* ── Success view ── */

  if (status === 'success') {
    return (
      <div className="flex flex-col items-center text-center py-8 px-4">
        <div className="w-16 h-16 rounded-full bg-success/10 border border-success/30 flex items-center justify-center mb-5">
          <svg className="w-8 h-8 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-display text-text-primary mb-2">{t('successTitle')}</h3>
        <p className="text-sm text-text-muted max-w-sm">{t('successDescription')}</p>
        <Button type="button" variant="secondary" size="md" className="mt-6" onClick={reset}>{t('sendAnother')}</Button>
      </div>
    )
  }

  /* ── Form ── */

  function renderInput(field: FieldConfig) {
    const error = errors[field.id]
    const inputId = `cf-${field.id}`
    const errorId = `${inputId}-error`
    const base = `${inputClass} ${error ? inputErrClass : ''}`

    if (field.type === 'textarea') {
      return (
        <div key={field.id}>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor={inputId} className={labelClass}>{t(field.label)} {field.required && <span className="text-gold">*</span>}</label>
            {values[field.id].length > 0 && <span className="text-[11px] text-text-muted/60 tabular-nums">{values[field.id].length} / {MAX_MESSAGE_LENGTH}</span>}
          </div>
          <textarea ref={messageRef} id={inputId} rows={4} value={values[field.id]}
            onChange={onChange(field.id, field.maxLength)} onBlur={() => onBlur(field.id)}
            placeholder={t(field.placeholderKey)} className={`${base} resize-y min-h-[7rem]`}
            aria-invalid={!!error} aria-describedby={error ? errorId : undefined} required={field.required} />
          {error && <p id={errorId} className={errorTextClass} role="alert">{error}</p>}
        </div>
      )
    }

    const inputRef = field.id === 'name' ? nameRef : field.id === 'email' ? emailRef : phoneRef
    return (
      <div key={field.id}>
        <label htmlFor={inputId} className={labelClass}>{t(field.label)} {field.required && <span className="text-gold">*</span>}</label>
        <input ref={inputRef} id={inputId} type={field.type} value={values[field.id]}
          onChange={onChange(field.id, field.maxLength)} onBlur={() => onBlur(field.id)}
          placeholder={t(field.placeholderKey)} className={base}
          aria-invalid={!!error} aria-describedby={error ? errorId : undefined}
          autoComplete={field.autoComplete} required={field.required} />
        {error && <p id={errorId} className={errorTextClass} role="alert">{error}</p>}
      </div>
    )
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="space-y-5">
      {FIELDS.map(renderInput)}

      {status === 'error' && serverError && (
        <div className="p-3 rounded-lg bg-error-bg border border-error/30 text-sm text-error" role="alert">{serverError}</div>
      )}

      {TURNSTILE_SITE_KEY && (
        <div className="flex justify-center"><div ref={widgetContainerRef} /></div>
      )}

      {Object.keys(errors).length > 0 && (
        <div role="alert" aria-live="polite" className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400 flex items-center gap-2">
          <span aria-hidden="true">⚠</span> {t('fieldErrorBanner')}
        </div>
      )}

      <div className="mt-2">
        <label className="flex items-start gap-3 cursor-pointer group">
          <div className="relative mt-0.5 flex-shrink-0">
            <input ref={agreedRef} type="checkbox" checked={agreed}
              onChange={(e) => { setAgreed(e.target.checked); if (e.target.checked) setErrors((prev) => ({ ...prev, agreed: undefined })) }}
              className="sr-only peer" aria-required="true" aria-describedby={errors.agreed ? 'cf-agreed-error' : undefined} />
            <div className="w-5 h-5 rounded border border-border-light bg-bg-elevated peer-checked:bg-gold/20 peer-checked:border-gold/60 peer-focus-visible:ring-2 peer-focus-visible:ring-gold/30 transition-all duration-200 flex items-center justify-center">
              {agreed && (
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden="true">
                  <path d="M1 4L3.5 6.5L9 1" stroke="#C9A96E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
          </div>
          <span className="text-sm text-text-secondary leading-relaxed">{t('agreeText')} <Link href="/politika-konfidentsialnosti/" className="text-gold hover:text-gold-light underline underline-offset-2 transition-colors">{t('privacyLink')}</Link></span>
        </label>
        {errors.agreed && (
          <p id="cf-agreed-error" className="mt-1 text-xs text-error flex items-center gap-1.5" role="alert">
            <span aria-hidden="true">⚠</span> {errors.agreed}
          </p>
        )}
      </div>

      <Button type="submit" variant="primary" size="lg" fullWidth loading={status === 'loading'} disabled={status === 'loading' || !turnstileReady}>
        {status === 'loading' ? t('sending') : t('submit')}
      </Button>
    </form>
  )
}
