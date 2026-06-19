# Промпти для виконання кожного кроку ТЗ

Використовуйте ці промпти для запуску агентів `task` або для роботи в цьому чаті.
Кожен крок = окремий атомарний коміт.

---

## Step 1.1 — Онлайн-консультація психолога

### Context
```
Goal: Add new service page "Онлайн-консультація психолога" (slug: onlajn-konsultaciya-psyhologa)
Constraints: Follow existing service pattern in constants/index.ts, messages/ru.json, messages/uk.json
Contract: Use existing types (Service, ServiceData), existing getSymptoms() read pattern from serviceSymptoms in messages
```

### Assignment
```
Target files:
- src/constants/index.ts:45-62 (SERVICES array)
- messages/ru.json (servicesData + serviceSymptoms)
- messages/uk.json (servicesData + serviceSymptoms)

Change:
1. In SERVICES array add after line 61:
   { slug: 'onlajn-konsultaciya-psyhologa', category: 'zagalni-zapit', priority: 1, icon: '👤', ctaLink: '/kontakty/' },
2. In messages/ru.json servicesData add entry with slug 'onlajn-konsultaciya-psyhologa'
   - title, shortTitle, description, metaDescription, keywords, cta (all in Russian)
3. In messages/uk.json servicesData add entry with slug 'onlajn-konsultaciya-psyhologa'
   - All fields in Ukrainian
   - H1 (UK): Консультація психолога онлайн: професійна допомога у складні моменти
   - Title (UK): Психолог онлайн | Консультація практичного психолога — В'ячеслав Подварчан
   - Description (UK): Індивідуальні онлайн-консультації психолога. Бережний підхід, робота з тривожністю, депресією, кризами та міжособистісними стосунками.
4. In messages/ru.json serviceSymptoms add array for 'onlajn-konsultaciya-psyhologa' (6 symptoms)
   Symptoms: Постоянная тревога, проблемы в отношениях, потеря смысла жизни, эмоциональные качели, низкая самооценка, хронический стресс
5. In messages/uk.json serviceSymptoms add array for 'onlajn-konsultaciya-psyhologa' (6 symptoms, Ukrainian)

Acceptance: Build passes, service card appears on /uk/uslugi/, service page accessible at /uk/uslugi/onlajn-konsultaciya-psyhologa/
```

---

## Step 1.2 — Психолог-біоенергетик

### Context
```
Goal: Add new service page "Психолог-біоенергетик" (slug: psyholog-bioenergetyk)
Constraints: Same pattern as Step 1.1
```

### Assignment
```
Target files:
- src/constants/index.ts (SERVICES array)
- messages/ru.json (servicesData + serviceSymptoms)
- messages/uk.json (servicesData + serviceSymptoms)

Change:
1. In SERVICES array add:
   { slug: 'psyholog-bioenergetyk', category: 'zagalni-zapit', priority: 1, icon: '🔮', ctaLink: '/kontakty/' },
2. messages/ru.json servicesData entry with SEO fields (Russian)
3. messages/uk.json servicesData entry with SEO fields (Ukrainian)
   - H1 (UK): Психолог-біоенергетик: відновлення життєвих сил та ментального балансу
   - Title (UK): Психолог-біоенергетик онлайн | Послуги енергопрактика — В'ячеслав Подварчан
   - Description (UK): Синергія класичної психотерапії та біоенергетичних практик. Діагностика причин вигорання, відновлення енергетичного балансу та життєвих сил онлайн.
4. serviceSymptoms for 'psyholog-bioenergetyk' (RU + UK, 6 symptoms each)
   Symptoms: синдром хронической усталости / синдром хронічної втоми, энергетическое выгорание / енергетичне вигорання, "затики" в бизнесе и финансах / "затики" в бізнесі та фінансах, ощущение опустошенности / відчуття спустошеності, психосоматические боли / психосоматичні болі

Acceptance: Build passes, service card appears, page accessible at /uk/uslugi/psyholog-bioenergetyk/
```

---

## Step 2.1 — HSTS заголовок

### Context
```
Goal: Add Strict-Transport-Security header
Constraints: next.config.mjs, existing headers pattern
```

### Assignment
```
Target file: next.config.mjs (lines 23-56, headers array)

Change: Add after line 31 (Referrer-Policy):
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },

Acceptance: Build passes, header appears in responses (check via curl or browser devtools)
```

---

## Step 2.2 — Preload шрифтів

### Context
```
Goal: Preload Inter and Cormorant Garamond fonts for LCP optimization
Constraints: Font files are served from /fonts/ directory in public/
```

### Assignment
```
Target file: src/app/layout.tsx

Current state:
- Inter and CormorantGaramond are loaded via next/font with display: 'swap' but no preload
- next/font Google does not support preload for self-hosted fonts

Change:
1. Add <link> tags in head with rel="preload" for font files
2. Determine actual font file paths (check public/fonts/ directory)
3. Use format: <link rel="preload" href="/fonts/Inter-Variable.woff2" as="font" type="font/woff2" crossorigin />
4. Add these in the root layout <head> or via metadata objects

Acceptance: Font preload links appear in HTML source, fonts load earlier
```

---

## Step 2.3 — Кастомна 404 сторінка

### Context
```
Goal: Create styled 404 error page matching design system
Constraints: next-intl for locale-aware text, existing components (AnimatedSection, SectionContainer, Link, font-display)
```

### Assignment
```
Target file: src/app/[locale]/not-found.tsx (NEW)

Content:
- Use 'use client' for animations
- Read translations from 'common' namespace (or create 'notFound' keys in messages/*.json)
- Large "404" heading with gold gradient
- Subtitle: "Сторінку не знайдено" (UK) / "Страница не найдена" (RU)
- Description: "Можливо, її перемістили або вона більше не існує" / "Возможно, её переместили или она больше не существует"
- CTA button → main page
- Use AnimatedSection, SectionContainer for layout
- Add messages keys to ru.json and uk.json under "notFound" namespace

Acceptance: Navigating to /uk/nonexistent-page shows styled 404, not default Next.js 404
```

---

## Step 2.4 — Оптимізація ContactForm.tsx

### Context
```
Goal: Reduce ContactForm.tsx from 455 lines / 14.8 KB to ~250-300 lines
Constraints: Must preserve all functionality — validation, Turnstile, Resend API
```

### Assignment
```
Target file: src/components/ContactForm.tsx

Change:
1. Merge isSubmitting/status states → single union type: 'idle' | 'submitting' | 'success' | 'error'
2. Extract repeated Tailwind class strings into component-level consts or CSS module
3. Simplify animation wrappers — remove unnecessary motion.div nesting
4. Remove dead code / commented-out sections
5. Extract form field config into array, map over it instead of repeating JSX

Acceptance: All existing fields work, Turnstile renders, form submits to Resend API, validation messages appear
```

---

## Step 3.2 — Українські юридичні сторінки

### Context
```
Goal: Add Ukrainian content for disclaimer and privacy pages
Constraints: pages already read from messages (t('content')), just need message keys
```

### Assignment
```
Target file: messages/uk.json

Change:
1. Under "disclaimer" key, add "content" field with full Ukrainian legal disclaimer text
2. Under "privacy" key, add "content" field with full Ukrainian privacy policy text
3. Must be proper Ukrainian legal translations, not machine-translated

The original Russian texts are in messages/ru.json under:
- disclaimer.content (lines ~1386-1393 in ru.json)
- privacy.content (line ~1398 in ru.json)

Acceptance: /uk/disclaimer/ and /uk/politika-konfidentsialnosti/ show Ukrainian text
```

---

## Step 4 — Валідація

### Assignment
```
1. Run: npm run build
   - Expect: Compiled successfully, no type/lint errors

2. Verify new service pages:
   - Visit /uk/uslugi/onlajn-konsultaciya-psyhologa/ — loads with schema
   - Visit /uk/uslugi/psyholog-bioenergetyk/ — loads with schema

3. Verify legal pages:
   - Visit /uk/disclaimer/ — Ukrainian text
   - Visit /uk/politika-konfidentsialnosti/ — Ukrainian text

4. Verify 404:
   - Visit /uk/nonexistent/ — styled 404 page

5. Verify ContactForm:
   - Form renders, fields validate, Turnstile loads
```

---

## Коміти (порядок виконання)

```bash
git checkout -b feature/site-modernization

# Step 1.1
git add src/constants/index.ts messages/ru.json messages/uk.json
git commit -m "feat: add psychologist consultation service page (RU+UK)"

# Step 1.2
git commit -m "feat: add bioenergeticist service page (RU+UK)"

# Step 2.1
git add next.config.mjs
git commit -m "fix: add HSTS header to security headers"

# Step 2.2
git add src/app/layout.tsx
git commit -m "perf: add font preload for Inter and Cormorant Garamond"

# Step 2.3
git add src/app/[locale]/not-found.tsx messages/ru.json messages/uk.json
git commit -m "feat: add styled 404 error page"

# Step 2.4
git add src/components/ContactForm.tsx
git commit -m "refactor: optimize ContactForm.tsx size and reduce complexity"

# Step 3.2
git add messages/uk.json
git commit -m "feat: add Ukrainian legal page content (disclaimer + privacy)"

# Step 4
git commit --allow-empty -m "chore: verify build, schema.org, and ContactForm functionality"
```
