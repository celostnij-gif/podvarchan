#!/usr/bin/env bash
# SEO Regression Check
# Verifies all public pages return HTTP 200
# Usage: ./scripts/seo-regression.sh [base_url]
# Default: https://podvarchan.com
set -eo pipefail

BASE="${1:-https://podvarchan.com}"
PASS=0
FAIL=0
RESULTS=()

check_url() {
  local url="$1"
  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$url" || echo "000")
  if [[ "$code" == "200" || "$code" == "308" || "$code" == "301" || "$code" == "410" ]]; then
    echo "  \xE2\x9C\x93 $url ($code)"
    PASS=$((PASS + 1))
  else
    echo "  \xE2\x9C\x97 $url ($code)"
    FAIL=$((FAIL + 1))
    RESULTS+=("$url ($code)")
  fi
}

echo "Checking $BASE ..."
echo

# Static routes
for locale in ru uk; do
  check_url "$BASE/$locale"
  check_url "$BASE/$locale/uslugi"
  check_url "$BASE/$locale/blog"
  check_url "$BASE/$locale/ob-avtore"
  check_url "$BASE/$locale/metod"
  check_url "$BASE/$locale/faq"
  check_url "$BASE/$locale/tseny"
  check_url "$BASE/$locale/kontakty"
done

# Ukrainian-only routes
check_url "$BASE/uk/pro-avtora"
check_url "$BASE/uk/tsiny"

# Service pages (RU slugs)
for slug in gipnoterapiya-onlayn psikhosomatika-onlayn rabotonos-travma trevozhnye-rasstroystva; do
  check_url "$BASE/ru/uslugi/$slug"
done

# Service pages (UK slugs)
for slug in hipnoterapiya-onlayn psykhosomatyka-onlayn robotonos-trauma tryvozhni-rozlady; do
  check_url "$BASE/uk/uslugi/$slug"
done

# Blog pages
for slug in chto-takoe-gipnoterapiya kak-prokhodit-priyom-u; do
  check_url "$BASE/ru/blog/$slug"
  check_url "$BASE/uk/blog/$slug"
done

# Technical files
check_url "$BASE/sitemap.xml"
check_url "$BASE/robots.txt"

echo
echo "Result: $PASS passed, $FAIL failed"

if [[ $FAIL -gt 0 ]]; then
  echo
  echo "Failed URLs:"
  for r in "${RESULTS[@]}"; do
    echo "  \xE2\x9C\x97 $r"
  done
  exit 1
fi
