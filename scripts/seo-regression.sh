#!/usr/bin/env bash
# SEO Regression Check
# Verifies all public pages return correct HTTP codes.
# SEO content tags (hreflang, canonical, OG, JSON-LD) are verified via Playwright E2E tests.
# Usage: ./scripts/seo-regression.sh [base_url]
# Default: https://podvarchan.com
set -eo pipefail

BASE="${1:-https://podvarchan.com}"
PASS=0
FAIL=0
RESULTS=()

check_url() {
  local url="$1"
  local expected="${2:-200}"
  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$url" || echo "000")
  if [[ "$code" == "$expected" || "$expected" == "any" && ( "$code" == "200" || "$code" == "301" || "$code" == "308" ) ]]; then
    echo "  ✅ $url → $code (expected $expected)"
    PASS=$((PASS + 1))
  elif [[ "$expected" == "200or308" && ( "$code" == "200" || "$code" == "308" ) ]]; then
    echo "  ✅ $url → $code (expected $expected)"
    PASS=$((PASS + 1))
  else
    echo "  ❌ $url → $code (expected $expected)"
    FAIL=$((FAIL + 1))
    RESULTS+=("$url → $code (expected $expected)")
  fi
}

echo "============================================"
echo "  SEO Regression: $BASE"
echo "============================================"
echo

# ── 1. Static routes ──
echo "--- Static pages ---"
for locale in ru uk; do
  check_url "$BASE/$locale" "200or308"
  if [[ "$locale" == "uk" ]]; then
    # UK services catalog is /uk/poslugy/ (cutover 2026-08-08)
    check_url "$BASE/uk/poslugy" "200or308"
  else
    check_url "$BASE/$locale/uslugi" "200or308"
  fi
  check_url "$BASE/$locale/blog" "200or308"
  check_url "$BASE/$locale/ob-avtore" "200or308"
  check_url "$BASE/$locale/metod" "200or308"
  check_url "$BASE/$locale/faq" "200or308"
  check_url "$BASE/$locale/tseny" "200or308"
  check_url "$BASE/$locale/kontakty" "200or308"
done

echo "--- UK aliases ---"
check_url "$BASE/uk/pro-avtora" "200or308"
check_url "$BASE/uk/tsiny" "200or308"

# ── 2. Service pages ──
echo "--- Service pages (RU) ---"
for slug in gipnoterapiya-onlayn psikhosomatika-onlayn rabotonos-travma trevozhnye-rasstroystva; do
  check_url "$BASE/ru/uslugi/$slug" "200or308"
done

echo "--- Service pages (UK) ---"
for slug in hipnoterapiya-onlayn psykhosomatyka-onlayn robotonos-trauma tryvozhni-rozlady; do
  check_url "$BASE/uk/poslugy/$slug" "200or308"
done

# ── 3. Blog pages ──
echo "--- Blog posts (RU) ---"
for slug in chto-takoe-gipnoterapiya kak-prokhodit-priyom-u psikhosomatika-chto-eto trevoga-polnyy-putevoditel panicheskiye-ataki-chto-delat; do
  check_url "$BASE/ru/blog/$slug" "200or308"
done

echo "--- Blog posts (UK) ---"
for slug in chto-takoe-gipnoterapiya yak-prokhodyt-pryyom-u psykhosomatyka-shcho-tse tryvoga-povnyy-putivnyk; do
  check_url "$BASE/uk/blog/$slug" "200or308"
done

# ── 4. Blog categories ──
echo "--- Blog categories ---"
check_url "$BASE/ru/blog/kategoriya/trevoga" "200or308"
check_url "$BASE/ru/blog/kategoriya/ptsr" "200or308"
check_url "$BASE/uk/blog/kategoriya/trivoga" "200or308"

# ── 5. Legal pages ──
echo "--- Legal ---"
check_url "$BASE/ru/disclaimer" "200or308"
check_url "$BASE/uk/disclaimer" "200or308"
check_url "$BASE/ru/politika-konfidentsialnosti" "200or308"
check_url "$BASE/uk/politika-konfidentsialnosti" "200or308"

# ── 6. Technical files ──
echo "--- Technical ---"
check_url "$BASE/sitemap.xml" 200
check_url "$BASE/robots.txt" 200

# ── 7. Redirect checks ──
echo "--- Redirects ---"
check_url "$BASE/" 301
check_url "$BASE/ua/uslugi/" 301
check_url "$BASE/uk/uslugi/" 301
check_url "$BASE/otzyvy.html" 301
check_url "$BASE/diagnostika.html" 301

# ── 8. 404 check ──
echo "--- 404 ---"
check_url "$BASE/ru/etoy-stranitsy-ne-sushchestvuet" "200or308"
check_url "$BASE/uk/neisnuyucha-storinka" "200or308"

# ── 9. SEO meta sanity: title/description present, no i18n key literals ──
echo "--- SEO meta (static pages RU/UK) ---"
check_meta() {
  local url="$1"
  local label="$2"
  local tmp html title desc code tlen dlen
  tmp=$(mktemp)
  code=$(curl -sL --max-time 15 -w "%{http_code}" -o "$tmp" "$url" || echo "000")
  html=$(<"$tmp")
  rm -f "$tmp"
  title=$(printf '%s\n' "$html" | grep -o '<title>[^<]*</title>' | head -1 | sed -E 's/^<title>//; s#</title>$##')
  desc=$(printf '%s\n' "$html" | grep -o '<meta name="description" content="[^"]*"' | head -1 | sed -E 's/.*content="//; s/"$//')
  tlen=${#title}
  dlen=${#desc}
  if [[ "$code" != "200" ]]; then
    echo "  ❌ $label HTTP $code (want 200)"
    FAIL=$((FAIL + 1)); RESULTS+=("$label HTTP $code")
    return
  fi
  if [[ $tlen -lt 15 || $tlen -gt 70 ]]; then
    echo "  ❌ $label <title> length $tlen (want 15-70): $title"
    FAIL=$((FAIL + 1)); RESULTS+=("$label title length $tlen")
    return
  fi
  if [[ $dlen -lt 40 || $dlen -gt 220 ]]; then
    echo "  ❌ $label meta description length $dlen (want 40-220): $desc"
    FAIL=$((FAIL + 1)); RESULTS+=("$label desc length $dlen")
    return
  fi
  if printf '%s %s\n' "$title" "$desc" | grep -qE 'pageTitle|pageDescription|metaTitle|metaDescription|heroSubtitle|heading'; then
    echo "  ❌ $label i18n key literal leaked into meta: $title | $desc"
    FAIL=$((FAIL + 1)); RESULTS+=("$label i18n literal")
    return
  fi
  echo "  ✅ $label title($tlen) desc($dlen)"
  PASS=$((PASS + 1))
}

check_meta "$BASE/ru" "ru home"
check_meta "$BASE/uk" "uk home"
check_meta "$BASE/ru/uslugi" "ru services"
check_meta "$BASE/uk/poslugy" "uk services"
check_meta "$BASE/ru/blog" "ru blog list"
check_meta "$BASE/uk/blog" "uk blog list"
check_meta "$BASE/ru/faq" "ru faq"
check_meta "$BASE/uk/faq" "uk faq"
check_meta "$BASE/ru/tseny" "ru prices"
check_meta "$BASE/uk/tsiny" "uk prices"
check_meta "$BASE/ru/kontakty" "ru contacts"
check_meta "$BASE/uk/kontakty" "uk contacts"
check_meta "$BASE/ru/metod" "ru method"
check_meta "$BASE/uk/metod" "uk method"
check_meta "$BASE/ru/ob-avtore" "ru about"
check_meta "$BASE/uk/pro-avtora" "uk about"
check_meta "$BASE/ru/disclaimer" "ru disclaimer"
check_meta "$BASE/uk/disclaimer" "uk disclaimer"
check_meta "$BASE/ru/politika-konfidentsialnosti" "ru privacy"
check_meta "$BASE/uk/politika-konfidentsialnosti" "uk privacy"
check_meta "$BASE/ru/search" "ru search"
check_meta "$BASE/uk/search" "uk search"

# ── 10. JSON-LD pricing: offers/priceRange построены из pricing_plans (D1) ──
echo "--- JSON-LD pricing (D1 pricing_plans: 0/50/210/400) ---"
check_pricing_schema() {
  local url="$1" label="$2" tmp html code prices pr
  tmp=$(mktemp)
  code=$(curl -sL --max-time 15 -w "%{http_code}" -o "$tmp" "$url" || echo "000")
  html=$(<"$tmp")
  rm -f "$tmp"
  if [[ "$code" != "200" ]]; then
    echo "  ❌ $label HTTP $code (want 200)"
    FAIL=$((FAIL + 1)); RESULTS+=("$label HTTP $code")
    return
  fi
  prices=$(printf '%s\n' "$html" | grep -o '"price":"[0-9]*"' | sort -u | tr '\n' ' ')
  for want in '"price":"0"' '"price":"50"' '"price":"210"' '"price":"400"'; do
    if [[ "$prices" != *"$want"* ]]; then
      echo "  ❌ $label JSON-LD lacks $want (got: $prices)"
      FAIL=$((FAIL + 1)); RESULTS+=("$label missing $want")
      return
    fi
  done
  pr=$(printf '%s\n' "$html" | grep -o '"priceRange":"[^"]*"' | head -1)
  if [[ "$pr" != *'400$'* ]]; then
    echo "  ❌ $label priceRange malformed: $pr"
    FAIL=$((FAIL + 1)); RESULTS+=("$label priceRange")
    return
  fi
  echo "  ✅ $label pricing ($prices| $pr)"
  PASS=$((PASS + 1))
}

check_pricing_schema "$BASE/ru" "ru home"
check_pricing_schema "$BASE/uk" "uk home"
check_pricing_schema "$BASE/ru/tseny" "ru prices"
check_pricing_schema "$BASE/uk/tsiny" "uk prices"

# ── 11. llms-full.txt: цены из pricing_plans (D1), не хардкод ──
echo "--- llms-full.txt pricing (D1 pricing_plans) ---"
check_llms_pricing() {
  local url="$1" label="$2" tmp html code
  tmp=$(mktemp)
  code=$(curl -sL --max-time 15 -w "%{http_code}" -o "$tmp" "$url" || echo "000")
  html=$(<"$tmp")
  rm -f "$tmp"
  if [[ "$code" != "200" ]]; then
    echo "  ❌ $label HTTP $code (want 200)"
    FAIL=$((FAIL + 1)); RESULTS+=("$label HTTP $code")
    return
  fi
  for want in '| Free |' '| $50 |' '| $210 |' '| $400 |'; do
    if [[ "$html" != *"$want"* ]]; then
      echo "  ❌ $label llms-full lacks pricing row ($want)"
      FAIL=$((FAIL + 1)); RESULTS+=("$label missing $want")
      return
    fi
  done
  echo "  ✅ $label llms-full pricing from D1"
  PASS=$((PASS + 1))
}

check_llms_pricing "$BASE/llms-full.txt" "llms-full"

# ── 12. JSON-LD SSR: блоки присутствуют в исходном HTML (curl без JS), парсятся, без дублей (@type,@id) ──
echo "--- JSON-LD SSR (server-rendered, no JS execution) ---"
check_jsonld() {
  local url="$1" label="$2" want_type="$3" tmp html code
  tmp=$(mktemp)
  code=$(curl -sL --max-time 15 -w "%{http_code}" -o "$tmp" "$url" || echo "000")
  if [[ "$code" != "200" ]]; then
    echo "  ❌ $label HTTP $code (want 200)"
    FAIL=$((FAIL + 1)); RESULTS+=("$label HTTP $code")
    rm -f "$tmp"
    return
  fi
  local out types has_want
  out=$(node - "$tmp" <<'NODE'
const fs = require('fs');
const html = fs.readFileSync(process.argv[2], 'utf8');
const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m => m[1]);
if (blocks.length === 0) { console.log('NO_JSONLD'); process.exit(0); }
const seen = new Set(); let dups = 0;
const types = [];
for (const raw of blocks) {
  try {
    const obj = JSON.parse(raw);
    const t = Array.isArray(obj['@type']) ? obj['@type'].join('|') : obj['@type'];
    types.push(t);
    const key = `${t}::${obj['@id'] ?? ''}`;
    if (seen.has(key)) { dups++; console.log('DUP:' + key); }
    seen.add(key);
  } catch (e) { console.log('PARSE_ERROR:' + e.message); }
}
console.log('TYPES:' + types.join(','));
console.log('DUPS:' + dups);
NODE
)
  rm -f "$tmp"
  if printf '%s' "$out" | grep -q 'NO_JSONLD'; then
    echo "  ❌ $label no application/ld+json blocks in server HTML"
    FAIL=$((FAIL + 1)); RESULTS+=("$label no JSON-LD")
    return
  fi
  if printf '%s' "$out" | grep -q 'PARSE_ERROR'; then
    echo "  ❌ $label JSON-LD parse error: $(printf '%s' "$out" | grep PARSE_ERROR | head -1)"
    FAIL=$((FAIL + 1)); RESULTS+=("$label JSON-LD parse error")
    return
  fi
  local dups
  dups=$(printf '%s' "$out" | grep -o 'DUPS:[0-9]*' | cut -d: -f2)
  if [[ -n "$dups" && "$dups" != "0" ]]; then
    echo "  ❌ $label duplicate (@type,@id): $(printf '%s' "$out" | grep '^DUP:' | tr '\n' ' ')"
    FAIL=$((FAIL + 1)); RESULTS+=("$label JSON-LD dups")
    return
  fi
  if [[ -n "$want_type" ]]; then
    if ! printf '%s' "$out" | grep -qF "$want_type"; then
      echo "  ❌ $label missing $want_type (got: $(printf '%s' "$out" | grep '^TYPES:' | cut -d: -f2-))"
      FAIL=$((FAIL + 1)); RESULTS+=("$label missing $want_type")
      return
    fi
  fi
  echo "  ✅ $label JSON-LD ok ($(printf '%s' "$out" | grep '^TYPES:' | cut -d: -f2-))"
  PASS=$((PASS + 1))
}

# BreadcrumbList обязателен в SSR на каждой навигируемой странице (AGENTS.md §5)
check_jsonld "$BASE/ru/faq" "ru faq" "BreadcrumbList"
check_jsonld "$BASE/uk/faq" "uk faq" "BreadcrumbList"
check_jsonld "$BASE/ru/tseny" "ru prices" "BreadcrumbList"
check_jsonld "$BASE/uk/tsiny" "uk prices" "BreadcrumbList"
check_jsonld "$BASE/ru/blog" "ru blog list" "BreadcrumbList"
check_jsonld "$BASE/ru/metod" "ru method" "BreadcrumbList"
check_jsonld "$BASE/ru/ob-avtore" "ru about" "BreadcrumbList"
check_jsonld "$BASE/ru/uslugi" "ru services list" "BreadcrumbList"
check_jsonld "$BASE/uk/poslugy" "uk services list" "BreadcrumbList"
check_jsonld "$BASE/ru/uslugi/gipnoterapiya-onlayn" "ru service detail" "BreadcrumbList"
check_jsonld "$BASE/uk/poslugy/hipnoterapiya-onlayn" "uk service detail" "BreadcrumbList"
check_jsonld "$BASE/ru/blog/panicheskiye-ataki-chto-delat" "ru clinical post" "BreadcrumbList"
check_jsonld "$BASE/uk/kontakty" "uk contacts" "BreadcrumbList"
check_jsonld "$BASE/ru/disclaimer" "ru disclaimer" "BreadcrumbList"
check_jsonld "$BASE/ru/politika-konfidentsialnosti" "ru privacy" "BreadcrumbList"
check_jsonld "$BASE/ru/blog/kategoriya/ptsr" "ru category" "BreadcrumbList"

# ── 13. reviewedBy/medicallyReviewedBy: обязательны на клинических статьях, отсутствуют на не-клинических ──
echo "--- reviewedBy/medicallyReviewedBy (YMYL, AGENTS.md §5) ---"
check_reviewed() {
  local url="$1" label="$2" expect="$3" tmp html code
  tmp=$(mktemp)
  code=$(curl -sL --max-time 15 -w "%{http_code}" -o "$tmp" "$url" || echo "000")
  html=$(<"$tmp")
  rm -f "$tmp"
  if [[ "$code" != "200" ]]; then
    echo "  ❌ $label HTTP $code (want 200)"
    FAIL=$((FAIL + 1)); RESULTS+=("$label HTTP $code")
    return
  fi
  if [[ "$expect" == "present" ]]; then
    if [[ "$html" != *'"reviewedBy"'* || "$html" != *'"medicallyReviewedBy"'* ]]; then
      echo "  ❌ $label missing reviewedBy/medicallyReviewedBy in server HTML"
      FAIL=$((FAIL + 1)); RESULTS+=("$label missing YMYL review")
      return
    fi
    echo "  ✅ $label reviewedBy + medicallyReviewedBy present"
  else
    if [[ "$html" == *'"reviewedBy"'* ]]; then
      echo "  ❌ $label has reviewedBy but category is not clinical"
      FAIL=$((FAIL + 1)); RESULTS+=("$label unexpected reviewedBy")
      return
    fi
    echo "  ✅ $label no reviewedBy (non-clinical)"
  fi
  PASS=$((PASS + 1))
}

check_reviewed "$BASE/ru/blog/panicheskiye-ataki-chto-delat" "ru clinical post" present
check_reviewed "$BASE/uk/blog/panichni-ataki-shcho-robiti" "uk clinical post" present
check_reviewed "$BASE/ru/blog/chto-takoe-gipnoterapiya" "ru non-clinical post" absent
check_reviewed "$BASE/ru" "ru home" absent

echo
echo "============================================"
echo "  Result: $PASS passed, $FAIL failed"
echo "============================================"

if [[ $FAIL -gt 0 ]]; then
  echo
  echo "Failed URLs:"
  for r in "${RESULTS[@]}"; do
    echo "  ❌ $r"
  done
  exit 1
fi
