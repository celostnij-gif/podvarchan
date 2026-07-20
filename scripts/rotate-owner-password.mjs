#!/usr/bin/env node
/**
 * Rotate OWNER password in D1.
 *
 * Usage:
 *   node scripts/rotate-owner-password.mjs [new-password]
 *
 * If no password is given, a random 24-char password is generated.
 * Prints the new password — save it somewhere safe!
 *
 * Runs against PRODUCTION D1 via wrangler.
 * Must be run from the repo root.
 */

import { execSync } from 'node:child_process'
import { randomBytes } from 'node:crypto'

const DB_NAME = 'podvarchan'
const OWNER_EMAIL = 'podvarchan@gmail.com'

// Generate or use provided password
let newPassword = process.argv[2]
if (!newPassword) {
  newPassword = randomBytes(18).toString('base64url').slice(0, 24)
}

console.log(`\n  New password: ${newPassword}\n`)

// Hash with bcryptjs (use admin app's copy)
let hash
try {
  // Node 24: use --input-type=commonjs
  const result = execSync(
    `node --input-type=commonjs -e "const b = require('bcryptjs'); process.stdout.write(b.hashSync(JSON.parse(process.argv[1]), 10))" -- ${JSON.stringify(newPassword)}`,
    { encoding: 'utf-8' }
  )
  hash = result.trim()
} catch {
  // Fallback: install bcryptjs temporarily
  console.log('  bcryptjs not found at root, using admin node_modules...')
  const result = execSync(
    `node --input-type=commonjs -e "const b = require('bcryptjs'); process.stdout.write(b.hashSync(JSON.parse(process.argv[1]), 10))" -- ${JSON.stringify(newPassword)}`,
    { encoding: 'utf-8', cwd: 'apps/admin' }
  )
  hash = result.trim()
}

console.log(`  Hash generated (${hash.length} chars)`)

// Build SQL — use wrangler with file to avoid escaping issues
const sql = `UPDATE users SET password_hash = '${hash.replace(/'/g, "''")}', updated_at = datetime('now') WHERE email = '${OWNER_EMAIL}' AND role = 'OWNER'`

console.log(`  Executing D1 update for ${OWNER_EMAIL}...`)

try {
  const result = execSync(
    `npx wrangler d1 execute ${DB_NAME} --remote --command "${sql.replace(/"/g, '\\"')}"`,
    { encoding: 'utf-8' }
  )
  console.log(result)
  console.log(`  Done. Save the new password somewhere safe!\n`)
} catch (err) {
  console.error('  Failed:', err.message)
  process.exit(1)
}
