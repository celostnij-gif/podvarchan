'use client'

import { useEffect, useState, useCallback } from 'react'
import { Eye, EyeOff, Settings, Globe, X } from 'lucide-react'
import { getHomePage, updatePageStatus, togglePageSection, updateSectionSettings, updateSectionTranslation } from '@/lib/actions/pages'
import type { Page, PageSection, PageSectionTranslation, PageTranslation } from '@/db/schema'

/* ── Toast ── */

function Toast({ toast, onClose }: { toast: { type: 'success' | 'error'; message: string } | null; onClose: () => void }) {
  if (!toast) return null
  return (
    <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${
      toast.type === 'success' ? 'bg-emerald-900/80 text-emerald-200 border border-emerald-700/50' : 'bg-red-900/80 text-red-200 border border-red-700/50'
    }`}>
      {toast.message}
      <button onClick={onClose} className="ml-3 opacity-60 hover:opacity-100">&times;</button>
    </div>
  )
}

/* ── Section display names ── */

const SECTION_LABELS: Record<string, string> = {
  hero: 'Hero — первый экран',
  problems: 'Проблемы',
  method: 'Метод',
  services: 'Услуги',
  author: 'Об авторе',
  testimonials: 'Отзывы',
  faq: 'FAQ',
  finalCta: 'Финальный CTA',
}

const SECTION_DESCRIPTIONS: Record<string, string> = {
  hero: 'Заголовок, подзаголовок, CTA-кнопка, фоновое изображение',
  problems: 'Список проблем, с которыми работает специалист',
  method: 'Описание метода гипнотерапии',
  services: 'Сетка услуг с иконками и краткими описаниями',
  author: 'Превью об авторе: фото, дипломы, ссылка на полную страницу',
  testimonials: 'Карусель отзывов клиентов',
  faq: 'Блок часто задаваемых вопросов',
  finalCta: 'Финальный призыв к записи на консультацию',
}

/* ── Section type icons ── */

const SECTION_ICONS: Record<string, string> = {
  hero: '🏠', problems: '⚠️', method: '🧠', services: '🛠️',
  author: '👤', testimonials: '⭐', faq: '❓', finalCta: '📞',
}

/* ── Settings field config ── */

interface SettingsField {
  key: string
  label: string
  type: 'select' | 'number'
  options?: { value: string; label: string }[]
}

const SECTION_SETTINGS: Record<string, SettingsField[]> = {
  hero: [
    { key: 'background', label: 'Фон', type: 'select', options: [{ value: 'default', label: 'По умолчанию' }, { value: 'dark', label: 'Тёмный' }, { value: 'gradient', label: 'Градиент' }] },
    { key: 'alignment', label: 'Выравнивание', type: 'select', options: [{ value: 'center', label: 'По центру' }, { value: 'left', label: 'Слева' }] },
  ],
  services: [
    { key: 'itemCount', label: 'Количество услуг', type: 'number' },
    { key: 'showCta', label: 'Показать CTA', type: 'select', options: [{ value: 'true', label: 'Да' }, { value: 'false', label: 'Нет' }] },
  ],
  testimonials: [
    { key: 'itemCount', label: 'Количество отзывов', type: 'number' },
  ],
  faq: [
    { key: 'itemCount', label: 'Количество вопросов', type: 'number' },
  ],
}

/* ── Component ── */

interface SectionWithTranslations extends PageSection {
  translations: PageSectionTranslation[]
}

interface HomePageData extends Page {
  sections: SectionWithTranslations[]
  translations: PageTranslation[]
}

export default function HomeEditorPage() {
  const [pageData, setPageData] = useState<HomePageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [editSectionId, setEditSectionId] = useState<string | null>(null)
  const [editSettings, setEditSettings] = useState<Record<string, string>>({})
  const [savingSettings, setSavingSettings] = useState(false)
  const [editContentSectionId, setEditContentSectionId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState<Record<string, string>>({ ru: '', uk: '' })
  const [savingContent, setSavingContent] = useState(false)

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 3000)
  }, [])

  const reload = useCallback(async () => {
    setError('')
    const result = await getHomePage()
    if ('data' in result) {
      setPageData(result.data!)
    } else {
      setError(result.error ?? 'Ошибка загрузки')
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true)
      reload().then(() => setLoading(false))
    }, 0)
    return () => clearTimeout(timer)
  }, [reload])

  /* ── Page status toggle ── */

  async function handleStatusToggle() {
    if (!pageData) return
    const newStatus = pageData.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED'
    const result = await updatePageStatus(pageData.id, newStatus)
    if ('data' in result) {
      showToast('success', `Страница переведена в статус «${newStatus}»`)
      reload()
    } else {
      showToast('error', result.error ?? 'Ошибка изменения статуса')
    }
  }

  /* ── Section toggle ── */

  async function handleSectionToggle(section: SectionWithTranslations) {
    const result = await togglePageSection(section.id, !section.enabled)
    if ('data' in result) {
      showToast('success', section.enabled ? 'Секция отключена' : 'Секция включена')
      reload()
    } else {
      showToast('error', result.error ?? 'Ошибка')
    }
  }

  /* ── Settings editor ── */

  function openSettings(section: SectionWithTranslations) {
    const settings = parseSettings(section.settingsJson)
    setEditSettings(settings)
    setEditSectionId(section.id)
  }

  async function saveSettings() {
    if (!editSectionId) return
    setSavingSettings(true)
    const result = await updateSectionSettings(editSectionId, editSettings)
    if ('data' in result) {
      showToast('success', 'Настройки сохранены')
      setEditSectionId(null)
      reload()
    } else {
      showToast('error', result.error ?? 'Ошибка')
    }
    setSavingSettings(false)
  }

  /* ── Content editor ── */

  function openContent(section: SectionWithTranslations) {
    const ru = section.translations.find(t => t.locale === 'ru')?.contentJson ?? ''
    const uk = section.translations.find(t => t.locale === 'uk')?.contentJson ?? ''
    setEditContent({ ru, uk })
    setEditContentSectionId(section.id)
  }

  async function saveContent() {
    if (!editContentSectionId) return
    setSavingContent(true)
    // Save RU
    let result = await updateSectionTranslation(editContentSectionId, 'ru', editContent.ru)
    if (!('data' in result)) {
      showToast('error', result.error ?? 'Ошибка сохранения RU')
      setSavingContent(false)
      return
    }
    // Save UK
    result = await updateSectionTranslation(editContentSectionId, 'uk', editContent.uk)
    if ('data' in result) {
      showToast('success', 'Контент секции сохранён')
      setEditContentSectionId(null)
      reload()
    } else {
      showToast('error', result.error ?? 'Ошибка сохранения UK')
    }
    setSavingContent(false)
  }

  /* ── Helpers ── */

  function parseSettings(json: string | null): Record<string, string> {
    if (!json) return {}
    try { return JSON.parse(json) as Record<string, string> } catch { return {} }
  }

  /* ── Render ── */

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-red-400 text-sm">{error}</p>
        <button onClick={() => reload()} className="mt-3 text-gold text-sm hover:underline">Повторить</button>
      </div>
    )
  }

  if (!pageData) return null

  return (
    <div className="space-y-6">
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">Редактор главной страницы</h1>
          <p className="text-sm text-zinc-500 mt-1">Управление секциями и контентом главной страницы</p>
        </div>
        <button onClick={handleStatusToggle}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all text-sm font-medium ${
            pageData.status === 'PUBLISHED'
              ? 'bg-amber-900/20 text-amber-400 border-amber-700/30 hover:bg-amber-900/30'
              : 'bg-emerald-900/20 text-emerald-400 border-emerald-700/30 hover:bg-emerald-900/30'
          }`}
        >
          {pageData.status === 'PUBLISHED' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          {pageData.status === 'PUBLISHED' ? 'Снять с публикации' : 'Опубликовать'}
        </button>
      </div>

      {/* Status bar */}
      <div className="flex items-center gap-4 px-4 py-3 rounded-xl bg-zinc-900/30 border border-zinc-800/50 text-sm">
        <span className="text-zinc-500">Статус:</span>
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium ${
          pageData.status === 'PUBLISHED' ? 'bg-emerald-900/30 text-emerald-400' : 'bg-zinc-800/50 text-zinc-400'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${pageData.status === 'PUBLISHED' ? 'bg-emerald-400' : 'bg-zinc-500'}`} />
          {pageData.status === 'PUBLISHED' ? 'Опубликована' : 'Черновик'}
        </span>
        <span className="text-zinc-700">|</span>
        <span className="text-zinc-500">Секций: <span className="text-zinc-300">{pageData.sections.length}</span></span>
        <span className="text-zinc-700">|</span>
        <span className="text-zinc-500">Включено: <span className="text-zinc-300">{pageData.sections.filter(s => s.enabled).length}</span></span>
      </div>

      {/* Sections grid */}
      <div className="space-y-3">
        {pageData.sections.map((section) => {
          const settings = parseSettings(section.settingsJson)
          const label = SECTION_LABELS[section.key] ?? section.key
          const desc = SECTION_DESCRIPTIONS[section.key] ?? ''
          const icon = SECTION_ICONS[section.key] ?? '📄'

          return (
            <div key={section.id}
              className={`rounded-xl border transition-all duration-200 ${
                section.enabled
                  ? 'bg-zinc-900/30 border-zinc-800/50 hover:border-zinc-700/50'
                  : 'bg-zinc-900/10 border-zinc-800/30 opacity-60'
              }`}
            >
              {/* Section row */}
              <div className="flex items-center gap-3 px-4 py-3">
                <button onClick={() => handleSectionToggle(section)}
                  className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm transition-all ${
                    section.enabled
                      ? 'bg-emerald-900/30 text-emerald-400 hover:bg-emerald-900/40'
                      : 'bg-zinc-800/50 text-zinc-600 hover:bg-zinc-800'
                  }`}
                  title={section.enabled ? 'Отключить секцию' : 'Включить секцию'}
                >
                  {section.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>

                <span className="text-lg">{icon}</span>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-zinc-200">{label}</span>
                    {!section.enabled && <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500 font-medium">Выкл</span>}
                  </div>
                  <p className="text-xs text-zinc-600 truncate">{desc}</p>
                </div>

                <span className="text-[10px] text-zinc-700 font-mono hidden sm:inline">#{section.sortOrder}</span>

                {/* Settings */}
                {SECTION_SETTINGS[section.key] && SECTION_SETTINGS[section.key]!.length > 0 && (
                  <button onClick={() => openSettings(section)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-all"
                    title="Настройки секции"
                  >
                    <Settings className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Content editor */}
                {(section.key === 'hero' || section.key === 'finalCta') && (
                  <button onClick={() => openContent(section)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-500 hover:text-gold hover:bg-gold/10 transition-all"
                    title="Редактировать контент"
                  >
                    <Globe className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Settings preview */}
                {Object.keys(settings).length > 0 && (
                  <div className="hidden md:flex items-center gap-1.5">
                    {Object.entries(settings).map(([k, v]) => (
                      <span key={k} className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800/50 text-zinc-600 font-mono">
                        {k}: {v}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Settings modal */}
      {editSectionId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-zinc-900 rounded-2xl border border-zinc-800 shadow-2xl p-6 mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-zinc-100">Настройки секции</h3>
              <button onClick={() => setEditSectionId(null)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
              ><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-4">
              {Object.entries(editSettings).map(([key, value]) => {
                const section = pageData?.sections.find(s => s.id === editSectionId)
                const fields = SECTION_SETTINGS[section?.key ?? ''] ?? []
                const field = fields.find(f => f.key === key)
                if (!field) return null

                if (field.type === 'select' && field.options) {
                  return (
                    <div key={key}>
                      <label className="block text-xs font-medium text-zinc-500 mb-1">{field.label}</label>
                      <select value={value} onChange={e => setEditSettings(s => ({ ...s, [key]: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl bg-zinc-800/50 border border-zinc-700 text-zinc-200 text-sm"
                      >
                        {field.options.map(o => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </div>
                  )
                }
                if (field.type === 'number') {
                  return (
                    <div key={key}>
                      <label className="block text-xs font-medium text-zinc-500 mb-1">{field.label}</label>
                      <input type="number" value={value} onChange={e => setEditSettings(s => ({ ...s, [key]: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl bg-zinc-800/50 border border-zinc-700 text-zinc-200 text-sm"
                      />
                    </div>
                  )
                }
                return null
              })}
            </div>
            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-zinc-800">
              <button onClick={() => setEditSectionId(null)}
                className="px-4 py-2 rounded-xl text-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
              >Отмена</button>
              <button onClick={saveSettings} disabled={savingSettings}
                className="px-5 py-2 rounded-xl bg-gold/10 text-gold border border-gold/20 hover:bg-gold/20 text-sm font-medium disabled:opacity-50"
              >
                {savingSettings ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content editor modal */}
      {editContentSectionId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-zinc-900 rounded-2xl border border-zinc-800 shadow-2xl p-6 mx-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-zinc-100">
                Контент секции «{SECTION_LABELS[pageData?.sections.find(s => s.id === editContentSectionId)?.key ?? ''] ?? ''}»
              </h3>
              <button onClick={() => setEditContentSectionId(null)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
              ><X className="w-4 h-4" /></button>
            </div>
            <p className="text-xs text-zinc-600 mb-4">
              Редактируйте JSON-контент секции для каждого языка. Hero-секция: заголовок, подзаголовок, описание, CTA-текст.
            </p>

            {/* RU */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-900/30 text-blue-400">RU</span>
                <span className="text-[10px] text-zinc-600">JSON-контент для русского языка</span>
              </div>
              <textarea
                value={editContent.ru}
                onChange={e => setEditContent(c => ({ ...c, ru: e.target.value }))}
                rows={6}
                className="w-full px-3 py-2 rounded-xl bg-zinc-800/50 border border-zinc-700 text-zinc-200 text-sm font-mono focus:outline-none focus:border-gold/50 resize-y"
                placeholder='{"title": "Заголовок", "subtitle": "Подзаголовок"}'
              />
            </div>

            {/* UK */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-900/30 text-blue-400">UK</span>
                <span className="text-[10px] text-zinc-600">JSON-контент для украинского языка</span>
              </div>
              <textarea
                value={editContent.uk}
                onChange={e => setEditContent(c => ({ ...c, uk: e.target.value }))}
                rows={6}
                className="w-full px-3 py-2 rounded-xl bg-zinc-800/50 border border-zinc-700 text-zinc-200 text-sm font-mono focus:outline-none focus:border-gold/50 resize-y"
                placeholder='{"title": "Заголовок", "subtitle": "Підзаголовок"}'
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
              <button onClick={() => setEditContentSectionId(null)}
                className="px-4 py-2 rounded-xl text-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
              >Отмена</button>
              <button onClick={saveContent} disabled={savingContent}
                className="px-5 py-2 rounded-xl bg-gold/10 text-gold border border-gold/20 hover:bg-gold/20 text-sm font-medium disabled:opacity-50"
              >
                {savingContent ? 'Сохранение...' : 'Сохранить контент'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
