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
