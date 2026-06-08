/**
 * setup-local-db.mjs
 *
 * Автоматичне налаштування локальної D1 бази даних для dev-сервера.
 * Застосовує міграції та створює адмін-користувача.
 *
 * Викликається автоматично перед `next dev` через predev скрипт.
 */

import { execSync } from 'child_process'
import { existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import crypto from 'crypto'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = join(__dirname, '..')

function run(cmd, label) {
  console.log(`\n▶ [${label}] ${cmd.slice(0, 100)}...`)
  try {
    execSync(cmd, {
      cwd: PROJECT_ROOT,
      encoding: 'utf8',
      shell: true,
      timeout: 60000,
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    console.log(`  ✅ [${label}] Успішно`)
    return true
  } catch (e) {
    const stderr = e.stderr?.toString() || ''
    // SQLite ALTER TABLE кидає ці помилки, якщо колонка/таблиця вже існує
    if (stderr.includes('already exists') || stderr.includes('duplicate column name')) {
      console.log(`  ✅ [${label}] Вже існує`)
      return true
    }
    console.error(`  ❌ [${label}] Помилка:`, stderr.slice(0, 300))
    return false
  }
}

/** Витягує JSON з виводу wrangler d1 execute */
function parseWranglerOutput(output) {
  try {
    const match = output.match(/\[[\s\S]*\]/)
    if (!match) return null
    return JSON.parse(match[0])
  } catch {
    return null
  }
}

async function main() {
  const adminEmail = process.env.ADMIN_SEED_EMAIL
  const adminPassword = process.env.ADMIN_SEED_PASSWORD

  if (!adminEmail || !adminPassword) {
    console.warn('  ⚠️  ADMIN_SEED_EMAIL / ADMIN_SEED_PASSWORD не встановлені в .env.local')
    console.warn('  ⚠️  Адмін-користувач не буде створений.')
    console.warn('  ⚠️  Додайте їх до .env.local:')
    console.warn('      ADMIN_SEED_EMAIL=your@email.com')
    console.warn('      ADMIN_SEED_PASSWORD=your_password')
  }

  console.log('═══════════════════════════════════════')
  console.log('🔧  Налаштування локальної D1 бази')
  console.log('═══════════════════════════════════════')

  /* ── 1. Міграції ── */
  console.log('\n📦  Застосування міграцій...')
  const migrationsDir = join(PROJECT_ROOT, 'drizzle', 'migrations')
  const migrationFiles = [
    '0000_serious_diamondback.sql',
    '0001_add_scheduled_to_services.sql',
    '0002_add_google_id_to_users.sql',
  ]

  for (const file of migrationFiles) {
    const filePath = join(migrationsDir, file)
    if (!existsSync(filePath)) {
      console.warn(`  ⚠️  Файл не знайдено: ${file}`)
      continue
    }
    run(`npx wrangler d1 execute DB --local --file="${filePath}"`, file)
  }

  /* ── 2. Адмін-користувач (якщо не існує) ── */
  if (adminEmail && adminPassword) {
    console.log('\n👤  Адмін-користувач...')

    try {
      const checkResult = execSync(
        `npx wrangler d1 execute DB --local --command="SELECT COUNT(*) as cnt FROM users WHERE email='${adminEmail.replace(/'/g, "''")}'"`,
        { cwd: PROJECT_ROOT, encoding: 'utf8', shell: true, timeout: 30000 }
      )

      const data = parseWranglerOutput(checkResult)
      const userCount = data?.[0]?.results?.[0]?.cnt ?? 1
      const userExists = userCount > 0

      if (!userExists) {
        // Динамічний імпорт bcryptjs (ESM-сумісність)
        const bcrypt = await import('bcryptjs')
        const hash = await bcrypt.hash(adminPassword, 12)
        const id = crypto.randomUUID()
        const now = Date.now()

        // Екрануємо лапки в SQL
        const safeEmail = adminEmail.replace(/'/g, "''")
        const sql = `INSERT INTO users (id, email, password_hash, name, role, is_active, created_at, updated_at) VALUES ('${id}', '${safeEmail}', '${hash}', 'Администратор', 'OWNER', 1, ${now}, ${now})`

        execSync(`npx wrangler d1 execute DB --local --command="${sql}"`, {
          cwd: PROJECT_ROOT,
          encoding: 'utf8',
          shell: true,
          timeout: 30000,
        })
        console.log(`  ✅ Створено адмін-користувача: ${adminEmail}`)
      } else {
        console.log(`  ✅ Адмін-користувач вже існує: ${adminEmail}`)
      }
    } catch (e) {
      if (e.stderr?.toString().includes('no such table')) {
        console.warn('  ⚠️  Таблиця users ще не створена. Міграції будуть застосовані при наступному запуску.')
      } else {
        console.error('  ❌ Помилка:', e.message)
      }
    }
  }

  /* ── 3. Підсумок ── */
  console.log('\n📊  Стан бази даних:')
  try {
    const result = execSync(
      `npx wrangler d1 execute DB --local --command="SELECT COUNT(*) as users FROM users; SELECT COUNT(*) as tables FROM sqlite_master WHERE type='table'"`,
      { cwd: PROJECT_ROOT, encoding: 'utf8', shell: true, timeout: 30000 }
    )
    const data = parseWranglerOutput(result)
    if (data) {
      for (const row of data) {
        if (row.results) {
          for (const r of row.results) {
            console.log(`  ${JSON.stringify(r)}`)
          }
        }
      }
    }
  } catch {
    console.log('  (не вдалося отримати статистику)')
  }

  console.log('\n═══════════════════════════════════════')
  console.log('✅  Налаштування завершено!')
  console.log('═══════════════════════════════════════')
}

main().catch((err) => {
  console.error('❌ Критична помилка:', err)
  process.exit(1)
})
