#!/bin/bash
# Agent-Ready Verification Script — podvarchan.com
# Usage: bash scripts/verify-agent-ready.sh

DOMAIN='https://podvarchan.com'
PASS=0
FAIL=0

check() {
  URL=$1
  EXPECT=$2
  LABEL=$3
  RESULT=$(curl -s -o /dev/null -w '%{http_code}' "$URL")
  CT=$(curl -sI "$URL" | grep -i content-type | head -1)
  if [ "$RESULT" = '200' ]; then
    echo "✅ $LABEL — $CT"
    PASS=$((PASS+1))
  else
    echo "❌ $LABEL — HTTP $RESULT"
    FAIL=$((FAIL+1))
  fi
}

check_markdown() {
  URL=$1
  LABEL=$2
  CT=$(curl -s -I -H 'Accept: text/markdown' "$URL" | grep -i content-type)
  if echo "$CT" | grep -q 'text/markdown'; then
    echo "✅ $LABEL — Markdown OK"
    PASS=$((PASS+1))
  else
    echo "❌ $LABEL — $CT"
    FAIL=$((FAIL+1))
  fi
}

echo '--- Agent-Ready Verification: '"$DOMAIN"' ---'

check "$DOMAIN/.well-known/agents.json"        'application/json'  'DNS-AID agents.json'
check "$DOMAIN/.well-known/api-catalog"        'linkset+json'       'API Catalog'
check "$DOMAIN/.well-known/openid-configuration" 'application/json' 'OIDC Discovery'
check "$DOMAIN/.well-known/oauth-authorization-server" 'json'       'OAuth AS Metadata'
check "$DOMAIN/.well-known/oauth-protected-resource"  'json'        'OAuth PR Metadata'
check "$DOMAIN/.well-known/mcp/server-card.json"      'json'        'MCP Server Card'
check "$DOMAIN/.well-known/agent-skills/index.json"   'json'        'Agent Skills Index'
check "$DOMAIN/auth.md"                                'text/markdown' 'auth.md'
check "$DOMAIN/api/health"                             'json'          'API Health'
check_markdown "$DOMAIN"                               'Markdown for Agents'

echo ''
echo "Passed: $PASS | Failed: $FAIL"
