# Agent-Ready Infrastructure — podvarchan.com

**Дата:** 07.06.2026  
**Сесія:** Повна Agent-Ready інтеграція (10 комітів)

---

## ✅ Що реалізовано сьогодні

### 1. DNS-AID (Agent Discovery)
- `public/.well-known/agents.json` — індекс AI-агентів (A2A + MCP)
- `src/app/a2a/index/route.ts` + rewrite `/_a2a/:path*` — A2A metadata endpoint
- `src/middleware.ts` — exclusions для `_a2a`, `a2a`

### 2. Markdown for Agents
- `src/middleware.ts` — перехват `Accept: text/markdown` → rewrite на `/_markdown/`
- `src/app/markdown/[[...slug]]/route.ts` — фетчить HTML, конвертує в Markdown
- `src/lib/html-to-markdown.ts` — конвертер HTML→Markdown (0 dependencies, edge сумісний)
- `next.config.mjs` — rewrite `/_markdown/:path*` → `/markdown/:path*`

### 3. HTML→Markdown конвертер

- `src/lib/html-to-markdown.ts` — **кастомний конвертер** (0 dependencies)
- **Чому не `turndown`:**
  1. Встановлення `npm install turndown` провалилось (`Invalid Version`)
  2. `turndown` потребує DOM API (`document`), якого немає на Cloudflare Workers edge runtime
  3. Кастомний конвертер використовує string-based regex трансформацію — повністю edge-сумісний

### 4. API Catalog (RFC 9727)
- `src/app/.well-known/api-catalog/route.ts` — `Content-Type: application/linkset+json`
- `src/app/api/health/route.ts` — `{ status: 'ok', timestamp }`
- `src/app/api/openapi.json/route.ts` — OpenAPI 3.1 spec

### 4. OAuth / OIDC Discovery
- `src/app/.well-known/openid-configuration/route.ts` — OIDC Discovery
- `src/app/.well-known/oauth-authorization-server/route.ts` — RFC 8414
- `src/app/.well-known/jwks.json/route.ts` — JWKS (пустий — HS256 symmetric)
- `src/app/.well-known/oauth-protected-resource/route.ts` — RFC 9728

### 5. Agent Authentication Guide
- `src/app/auth.md/route.ts` — Markdown route handler (inline const, без fs)
- `public/auth.md` — source of truth для AI-агентів

### 6. MCP Server Card (SEP-1649)
- `src/app/.well-known/mcp/server-card.json/route.ts` — Server Card
- `src/app/api/mcp/route.ts` — JSON-RPC 2.0 (tools/list, tools/call, CORS)
- `src/lib/mcp/tools.ts` — shared tools definitions

### 7. Agent Skills Discovery Index (RFC v0.2.0)
- `src/app/.well-known/agent-skills/index.json/route.ts` — index з SHA256 (booking: `a8ae83...`, services: `652285...`)
- `public/.well-known/agent-skills/booking.md` — skill-документ
- `public/.well-known/agent-skills/services.md` — skill-документ

### 8. WebMCP (Browser AI Agents)
- `src/types/webmcp.d.ts` — типізація `navigator.modelContext`
- `src/components/WebMCPProvider.tsx` — реєстрація tools (`get_services`, `submit_contact_inquiry`)
- `src/app/layout.tsx` — підключено `WebMCPProvider`
- `src/app/api/services/route.ts` — список послуг (статичний, очікує D1)

### 9. Документація та інструменти
- `AGENT.md` — повна карта .well-known endpoint'ів
- `scripts/verify-agent-ready.sh` — bash скрипт валідації всіх endpoint'ів

---

## 📋 Карта всіх .well-known endpoint'ів

```
/.well-known/agents.json                ← DNS-AID Agent Index
/.well-known/api-catalog                ← RFC 9727 (application/linkset+json)
/.well-known/openid-configuration       ← OIDC Discovery
/.well-known/oauth-authorization-server ← RFC 8414
/.well-known/oauth-protected-resource   ← RFC 9728
/.well-known/jwks.json                  ← JWKS (empty)
/.well-known/mcp/server-card.json       ← SEP-1649 MCP Server Card
/.well-known/agent-skills/index.json    ← Agent Skills Discovery RFC v0.2.0
/.well-known/agent-skills/booking.md    ← Skill: booking
/.well-known/agent-skills/services.md   ← Skill: services
/auth.md                                ← Agent auth guide
```

## 📋 API endpoints

| Endpoint | Метод | Призначення |
|---|---|---|
| `/api/health` | GET | Health check |
| `/api/openapi.json` | GET | OpenAPI 3.1 spec |
| `/api/mcp` | POST | JSON-RPC 2.0 MCP |
| `/api/contact` | POST | Contact form |
| `/api/services` | GET | Services list |
| `/_a2a/index` | GET | A2A Agent metadata |
| `/_markdown/*` | GET | Markdown version of pages |

## 🛠 Технічні деталі

- **Runtime:** `edge` (Cloudflare Workers) на всіх роутах
- **Middleware:** next-intl + перехват `Accept: text/markdown` → rewrite на `/_markdown/`
- **Rewrite rules:** `/_a2a/:path*` → `/a2a/:path*`, `/_markdown/:path*` → `/markdown/:path*`
- **Matcher exclusions:** `api`, `_next`, `_vercel`, `_a2a`, `a2a`, `_markdown`, `markdown`
- **Всі `.well-known` роути** виключені з middleware (наявність `.` в path)
- **Пакетний менеджер:** npm (не pnpm)

---

## 🔜 Що залишилося зробити

### Пріоритет 1 (деплой)

- [ ] **Оновити `CLOUDFLARE_API_TOKEN` в GitHub Secrets** — токен прострочився, GitHub Actions падає
- [ ] **Увімкнути DNSSEC** — Cloudflare Dashboard → DNS → Settings → DNSSEC → Enable

### ✅ Вже зроблено (DNS)

- ✅ **HTTPS DNS запити додані** в Cloudflare Dashboard:
  - `HTTPS _index._agents.podvarchan.com` → `endpoint="/.well-known/agents.json"`
  - `HTTPS _a2a._agents.podvarchan.com` → `endpoint="/_a2a/index"`

### Пріоритет 2 (функціонал)

- [ ] **Підключити `/api/services` до Cloudflare D1** — замість статичного масиву
- [ ] **Створити `/api/docs`** — HTML документація по API
- [ ] **Додати e2e тести** для всіх `.well-known` endpoint'ів

### Пріоритет 3 (розширення)

- [ ] **/.well-known/ai-plugin.json** — ChatGPT Plugin manifest
- [ ] **Нові skill-файли** (faq.md, testimonials.md)
- [ ] **Англійська версія skill-файлів** для консистентності з index.json

---

## 📊 Зміни в коді (сьогодні)

| Файл | Тип | Зміна |
|---|---|---|
| `public/.well-known/agents.json` | new | DNS-AID index |
| `public/.well-known/agent-skills/booking.md` | new | Skill document |
| `public/.well-known/agent-skills/services.md` | new | Skill document |
| `public/auth.md` | new | Auth guide |
| `src/lib/html-to-markdown.ts` | new | HTML→MD converter |
| `src/lib/mcp/tools.ts` | new | Shared MCP tools |
| `src/types/webmcp.d.ts` | new | WebMCP types |
| `src/components/WebMCPProvider.tsx` | new | WebMCP client provider |
| `src/middleware.ts` | modified | Added Accept header check + exclusions |
| `next.config.mjs` | modified | Added rewrites + headers |
| `src/app/layout.tsx` | modified | Added WebMCPProvider |
| `src/app/a2a/index/route.ts` | new | A2A metadata |
| `src/app/markdown/[[...slug]]/route.ts` | new | Markdown route |
| `src/app/.well-known/api-catalog/route.ts` | new | RFC 9727 |
| `src/app/.well-known/openid-configuration/route.ts` | new | OIDC |
| `src/app/.well-known/oauth-authorization-server/route.ts` | new | RFC 8414 |
| `src/app/.well-known/oauth-protected-resource/route.ts` | new | RFC 9728 |
| `src/app/.well-known/jwks.json/route.ts` | new | JWKS |
| `src/app/.well-known/mcp/server-card.json/route.ts` | new | MCP Server Card |
| `src/app/.well-known/agent-skills/index.json/route.ts` | new | Skills Index |
| `src/app/api/health/route.ts` | new | Health check |
| `src/app/api/openapi.json/route.ts` | new | OpenAPI spec |
| `src/app/api/mcp/route.ts` | new | MCP JSON-RPC endpoint |
| `src/app/api/services/route.ts` | new | Services API |
| `src/app/auth.md/route.ts` | new | auth.md handler |
| `AGENT.md` | new | This file |
| `scripts/verify-agent-ready.sh` | new | Verification script |
