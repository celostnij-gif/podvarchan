import { execSync } from 'child_process'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

const hash = await bcrypt.hash('09d03m83Y!', 12)
const id = crypto.randomUUID()
const now = Date.now()

// Use environment variable to pass the hash safely, avoiding shell escaping issues
process.env._HASH = hash
process.env._ID = id

const sql = `INSERT OR REPLACE INTO users (id, email, password_hash, name, role, is_active, created_at, updated_at) VALUES ('${id}', 'celostnij@gmail.com', '${hash}', 'Администратор', 'OWNER', 1, ${now}, ${now})`

const cmd = `npx wrangler d1 execute DB --local --command="${sql}"`
console.log('Running:', cmd.substring(0, 100) + '...')

try {
  const result = execSync(cmd, {
    cwd: 'C:\\buff\\Podvarchan.com',
    encoding: 'utf8',
    shell: true,
    timeout: 30000
  })
  console.log('SUCCESS!')
  console.log(result)
} catch (e) {
  console.error('ERROR:', e.stderr?.toString() || e.message)
  process.exit(1)
}
