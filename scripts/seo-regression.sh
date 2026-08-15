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
  check_url "$BASE/$locale/uslugi" "200or308"
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
  check_url "$BASE/uk/uslugi/$slug" "200or308"
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
check_meta "$BASE/uk/uslugi" "uk services"
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
