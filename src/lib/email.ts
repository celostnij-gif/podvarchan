import { Resend } from 'resend'

/* ── Singleton ── */

let _resend: Resend | null = null

function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY ?? '')
  }
  return _resend
}

/* ── Constants ── */

const CONTACT_EMAIL = process.env.CONTACT_EMAIL ?? process.env.EMAIL_TO ?? 'podvarchan@gmail.com'
const FROM_EMAIL = process.env.EMAIL_FROM ?? 'noreply@podvarchan.com'
const FROM_NAME = 'Вячеслав Подварчан'
const FROM_EMAIL_FULL = `${FROM_NAME} <${FROM_EMAIL}>`

/* ── Helpers ── */

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function formatDate(): string {
  return new Date().toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  })
}

/* ── Dark theme email styles ── */

const EMAIL_STYLES = `
body {
  margin: 0; padding: 0;
  background-color: #0A0A12;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  line-height: 1.6;
  color: #E8E8ED;
}
.container {
  max-width: 560px;
  margin: 40px auto;
  background: #12121C;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 40px rgba(0,0,0,0.4);
}
.header {
  background: linear-gradient(135deg, #0D0D0D 0%, #1A1A1A 100%);
  padding: 36px 40px 28px;
  text-align: center;
  border-bottom: 1px solid #1E1E2A;
}
.header h1 {
  margin: 0;
  color: #C9A96E;
  font-size: 22px;
  font-weight: 600;
  letter-spacing: 0.5px;
}
.header p {
  margin: 8px 0 0;
  color: #888;
  font-size: 13px;
}
.body {
  padding: 32px 40px;
}
.meta {
  background: #0D0D18;
  border-radius: 12px;
  padding: 16px 20px;
  margin-bottom: 28px;
  border: 1px solid #1E1E2A;
}
.meta-row {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
}
.meta-item {
  font-size: 12px;
  color: #888;
}
.meta-item strong {
  color: #C9A96E;
}
.field {
  margin-bottom: 22px;
}
.label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: #666;
  margin-bottom: 6px;
}
.value {
  background: #0D0D18;
  border: 1px solid #1E1E2A;
  border-radius: 10px;
  padding: 14px 18px;
  font-size: 14px;
  color: #E8E8ED;
  margin-top: 4px;
  white-space: pre-wrap;
  word-break: break-word;
}
.value a {
  color: #C9A96E;
  text-decoration: none;
}
.value a:hover { text-decoration: underline; }
.footer {
  padding: 24px 40px;
  border-top: 1px solid #1E1E2A;
  text-align: center;
  font-size: 12px;
  color: #555;
}
.btn {
  display: inline-block;
  background: #C9A96E;
  color: #0A0A12 !important;
  text-decoration: none;
  padding: 10px 24px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  margin-top: 8px;
}
`

/* ── Admin notification template ── */

function buildAdminTemplate(name: string, email: string, message: string, phone?: string): string {
  const date = formatDate()

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>${EMAIL_STYLES}</style></head>
<body>
  <div class="container">
    <div class="header">
      <h1>✉️ Новая заявка</h1>
      <p>Кто-то заполнил форму на podvarchan.com</p>
    </div>
    <div class="body">
      <div class="meta">
        <div class="meta-row">
          <span class="meta-item"><strong>Дата:</strong> ${date}</span>
          <span class="meta-item"><strong>Страница:</strong> /kontakty/</span>
        </div>
      </div>

      <div class="field">
        <div class="label">Имя</div>
        <div class="value">${escapeHtml(name)}</div>
      </div>

      <div class="field">
        <div class="label">Email для ответа</div>
        <div class="value"><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></div>
      </div>

      ${phone ? `
      <div class="field">
        <div class="label">Телефон</div>
        <div class="value">${escapeHtml(phone)}</div>
      </div>` : ''}

      <div class="field">
        <div class="label">Сообщение</div>
        <div class="value">${escapeHtml(message)}</div>
      </div>

      <div style="text-align:center;margin-top:24px;">
        <a href="mailto:${escapeHtml(email)}" class="btn">Ответить клиенту</a>
      </div>
    </div>
    <div class="footer">
      podvarchan.com &bull; Отправлено через форму обратной связи
    </div>
  </div>
</body>
</html>`
}

/* ── Auto-reply to client template ── */

function buildAutoReplyTemplate(name: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>${EMAIL_STYLES}</style></head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Заявка получена</h1>
      <p>Спасибо, что доверились — я отвечу в ближайшее время</p>
    </div>
    <div class="body">
      <div class="field">
        <div class="value" style="font-size:16px; text-align:center; padding:20px;">
          Здравствуйте, <strong>${escapeHtml(name)}</strong>!
        </div>
      </div>

      <p style="font-size:14px; color:#B0B0B8; margin-bottom:16px;">
        Я получил вашу заявку и свяжусь с вами в течение нескольких часов, 
        чтобы обсудить ваш запрос и выбрать удобное время для первой встречи.
      </p>

      <p style="font-size:14px; color:#B0B0B8; margin-bottom:24px;">
        <strong>Что вас ждёт:</strong>
      </p>

      <div style="background: #0D0D18; border: 1px solid #1E1E2A; border-radius: 10px; padding: 16px 20px; margin-bottom: 20px;">
        <p style="margin:0 0 8px; font-size:14px; color:#C9A96E;">1. Знакомство</p>
        <p style="margin:0; font-size:13px; color:#B0B0B8;">Первая 15-минутная консультация — бесплатно. Мы обсудим ваш запрос, я расскажу как будет строиться работа.</p>
      </div>

      <div style="background: #0D0D18; border: 1px solid #1E1E2A; border-radius: 10px; padding: 16px 20px; margin-bottom: 20px;">
        <p style="margin:0 0 8px; font-size:14px; color:#C9A96E;">2. Онлайн-формат</p>
        <p style="margin:0; font-size:13px; color:#B0B0B8;">Сессии проходят онлайн, через видеосвязь. Вам нужен только компьютер или телефон с камерой — никакой специальной подготовки.</p>
      </div>

      <div style="background: #0D0D18; border: 1px solid #1E1E2A; border-radius: 10px; padding: 16px 20px; margin-bottom: 28px;">
        <p style="margin:0 0 8px; font-size:14px; color:#C9A96E;">3. Конфиденциальность</p>
        <p style="margin:0; font-size:13px; color:#B0B0B8;">Все сессии строго конфиденциальны. Ваши данные и содержание встреч остаются только между нами.</p>
      </div>

      <div style="background: #0D0D18; border: 1px solid #1E1E2A; border-radius: 10px; padding: 16px 20px; text-align:center;">
        <p style="margin:0 0 8px; font-size:12px; color:#666;">Если вопрос срочный — напишите мне напрямую:</p>
        <a href="mailto:${escapeHtml(CONTACT_EMAIL)}" style="color:#C9A96E; font-size:14px; text-decoration:none;">${escapeHtml(CONTACT_EMAIL)}</a>
      </div>

      <p style="font-size:13px; color:#666; margin-top:32px; text-align:center;">
        С уважением,<br/>
        <strong style="color:#C9A96E;">Вячеслав Подварчан</strong><br/>
        <span style="font-size:12px;">Гипнотерапевт онлайн</span>
      </p>
    </div>
    <div class="footer">
      podvarchan.com &bull; Вы получили это письмо, потому что оставили заявку на сайте
    </div>
  </div>
</body>
</html>`
}

/* ── Types ── */

export interface SendContactEmailParams {
  name: string
  email: string
  message: string
  phone?: string
}

export interface SendContactEmailResult {
  success: boolean
  error?: string
}

/* ── Send notification to owner ── */

export async function sendContactNotification(
  params: SendContactEmailParams,
): Promise<SendContactEmailResult> {
  const { name, email, message, phone } = params

  if (!process.env.RESEND_API_KEY) {
    return { success: true }
  }

  try {
    const { error } = await getResend().emails.send({
      from: FROM_EMAIL_FULL,
      to: [CONTACT_EMAIL],
      replyTo: email,
      subject: `Новая заявка от ${name} — podvarchan.com`,
      html: buildAdminTemplate(name, email, message, phone),
    })

    if (error) {
      console.error('[Resend] Send error')
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[Resend] Unexpected error')
    return { success: false, error: message }
  }
}

/* ── Send auto-reply to client ── */

export async function sendAutoReply(
  params: SendContactEmailParams,
): Promise<SendContactEmailResult> {
  const { name, email } = params

  if (!process.env.RESEND_API_KEY) {
    return { success: true }
  }

  try {
    const { error } = await getResend().emails.send({
      from: FROM_EMAIL_FULL,
      to: [email],
      subject: 'Ваша заявка получена — podvarchan.com',
      html: buildAutoReplyTemplate(name),
    })

    if (error) {
      console.error('[Resend] Auto-reply error')
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[Resend] Auto-reply unexpected')
    return { success: false, error: message }
  }
}
