# Agent-Ready Infrastructure — podvarchan.com

## Статус проекту (07.06.2026)

### ✅ Реалізовано

#### 1. DNS-AID (Agent Discovery)
| Файл | Призначення |
|---|---|
| `public/.well-known/agents.json` | Індекс AI-агентів, посилається на A2A та MCP |
| `src/app/_a2a/index/route.ts` → rewrite `/_a2a/:path*` | A2A Agent-to-Agent index з metadata |
| `src/middleware.ts` | Exclusions для `_a2a`, `a2a` |

#### 2. Markdown for Agents
| Файл | Призначення |
|---|---|
| `src/middleware.ts` | Перехоплює `Accept: text/markdown`, rewrite на `/_markdown/` |
| `src/app/markdown/[[...slug]]/route.ts` | Фетчить HTML сторінку, конвертує в Markdown |
| `src/lib/html-to-markdown.ts` | Легкий HTML→Markdown конвертер (0 dependencies, edge сумісний) |
| `next.config.mjs` | Rewrite `/_markdown/:path*` → `/markdown/:path*` |

#### 3. API Catalog (RFC 9727)
| Файл | Призначення |
|---|---|
| `src/app/.well-known/api-catalog/route.ts` | `Content-Type: application/linkset+json` |
| `src/app/api/health/route.ts` | `{ status: 'ok', timestamp }` |
| `src/app/api/openapi.json/route.ts` | OpenAPI 3.1 spec з `/health` |

#### 4. OAuth/OIDC Discovery
| Файл | Призначення |
|---|---|
| `src/app/.well-known/openid-configuration/route.ts` | OIDC Discovery (issuer, endpoints, scopes, algs) |
| `src/app/.well-known/oauth-authorization-server/route.ts` | RFC 8414 OAuth AS Metadata |
| `src/app/.well-known/jwks.json/route.ts` | Пустий JWKS (HS256 symmetric, немає public keys) |
| `src/app/.well-known/oauth-protected-resource/route.ts` | RFC 9728 OAuth Protected Resource Metadata |

#### 5. Agent Authentication Guide
| Файл | Призначення |
|---|---|
| `src/app/auth.md/route.ts` | Route handler — повертає Markdown (inline const) |
| `public/auth.md` | Source of truth для інструкцій аутентифікації |

#### 6. MCP Server Card (SEP-1649)
| Файл | Призначення |
|---|---|
| `src/app/.well-known/mcp/server-card.json/route.ts` | MCP Server Card з tools, transport, capabilities |
| `src/app/api/mcp/route.ts` | JSON-RPC 2.0 endpoint (tools/list, tools/call + CORS preflight) |
| `src/lib/mcp/tools.ts` | Спільні визначення інструментів |

#### 7. Agent Skills Discovery Index (RFC v0.2.0)
| Файл | Призначення |
|---|---|
| `src/app/.well-known/agent-skills/index.json/route.ts` | Реєстр навичок з SHA256 |
| `public/.well-known/agent-skills/booking.md` | Skill: бронювання сеансу |
| `public/.well-known/agent-skills/services.md` | Skill: каталог послуг |

---

### 🔜 Залишилося зробити

#### 8. WebMCP (Client-Side Browser Agents)
**Опис:** Реалізувати WebMCP для браузерних AI-агентів через `navigator.modelContext`.
- [ ] `src/types/webmcp.d.ts` — типізація `navigator.modelContext`
- [ ] `src/components/WebMCPProvider.tsx` — клієнтський компонент реєстрації tools
- [ ] `src/app/layout.tsx` — підключити `WebMCPProvider`
- [ ] `src/app/api/services/route.ts` — ендпоінт списку послуг

#### 9. Verification Script
- [ ] `scripts/verify-agent-ready.sh` — bash скрипт для перевірки всіх endpoint'ів

#### 10. DNS-AID DNS записи (Cloudflare Dashboard)
- [ ] `HTTPS _index._agents.podvarchan.com` → `endpoint="/.well-known/agents.json"`
- [ ] `HTTPS _a2a._agents.podvarchan.com` → `endpoint="/_a2a/index"`

#### 11. DNSSEC
- [ ] Увімкнути в Cloudflare Dashboard (DNS → Settings → DNSSEC)

#### 12. Деploy (GitHub Actions)
- [ ] Оновити `CLOUDFLARE_API_TOKEN` в GitHub Secrets
- [ ] Перевірити що деплой проходить успішно

---

### 📋 Карта всіх .well-known endpoint'ів

```
/.well-known/agents.json              ← DNS-AID
/.well-known/api-catalog              ← RFC 9727
/.well-known/openid-configuration     ← OIDC Discovery
/.well-known/oauth-authorization-server ← RFC 8414
/.well-known/oauth-protected-resource ← RFC 9728
/.well-known/jwks.json                ← JWKS
/.well-known/mcp/server-card.json     ← SEP-1649
/.well-known/agent-skills/index.json  ← RFC v0.2.0
/.well-known/agent-skills/booking.md  ← Skill file
/.well-known/agent-skills/services.md ← Skill file
/auth.md                              ← Agent auth guide
```

### 📋 API endpoints

```
/api/health                     ← Health check
/api/openapi.json               ← OpenAPI 3.1 spec
/api/mcp                        ← JSON-RPC 2.0 (POST)
/api/contact                    ← Contact form (POST)
```

### 🔧 Технічні деталі

- **Runtime:** `edge` (Cloudflare Workers) на всіх роутах
- **Middleware:** next-intl + перехват `Accept: text/markdown`
- **Rewrite rules:** `/_a2a/:path*` → `/a2a/:path*`, `/_markdown/:path*` → `/markdown/:path*`
- **Всі .well-known роути** виключені з middleware через наявність `.` в path
- **Всі /api/ роути** виключені з middleware через matcher
