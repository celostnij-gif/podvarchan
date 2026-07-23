#!/usr/bin/env node
/**
 * P2 Seed: Insert hero sections for static pages (ABOUT, METHOD, PRICING, CONTACTS)
 * Only inserts if page has zero sections. Uses content from D1 page_translations.
 * 
 * Usage: node scripts/seed-p2-hero-sections.mjs [--dry-run]
 */

import { execSync } from 'child_process';
import crypto from 'crypto';

const DRY_RUN = process.argv.includes('--dry-run');

const PAGES = [
  {
    type: 'ABOUT',
    id: '806b5d28-b788-4836-bdd6-952302a2284a',
    heroRu: { title: 'Вячеслав Подварчан — гипнотерапевт онлайн', subtitle: 'Сертифицированный специалист по работе с подсознанием, тревожными расстройствами и психосоматикой' },
    heroUk: { title: 'Вячеслав Подварчан — гіпнотерапевт онлайн', subtitle: 'Сертифікований спеціаліст з роботи з підсвідомістю, тривожними розладами та психосоматикою' },
  },
  {
    type: 'METHOD',
    id: '7df7aadb-b4f2-4f1c-8722-decda9379aa3',
    heroRu: { title: 'Авторский метод', subtitle: 'Индивидуальный подход к работе с подсознанием через гипнотерапию' },
    heroUk: { title: 'Авторський метод', subtitle: 'Індивідуальний підхід до роботи з підсвідомістю через гіпнотерапію' },
  },
  {
    type: 'PRICING',
    id: '41f764f7-54e5-41d7-b092-f4bcae43ae28',
    heroRu: { title: 'Стоимость гипнотерапии онлайн', subtitle: 'Прозрачные цены на консультации и сессии' },
    heroUk: { title: 'Вартість гіпнотерапії онлайн', subtitle: 'Прозорі ціни на консультації та сесії' },
  },
  {
    type: 'CONTACTS',
    id: '46cae533-e67c-4cc1-b16f-b6dfa951b116',
    heroRu: { title: 'Контакты', subtitle: 'Свяжитесь со мной для записи на консультацию' },
    heroUk: { title: 'Контакти', subtitle: "Зв'яжіться зі мною для запису на консультацію" },
  },
];

function run(cmd) {
  const result = execSync(cmd, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
  try { return JSON.parse(result); } catch { return result; }
}

function uuid() {
  return crypto.randomUUID();
}

const sql = [];

for (const page of PAGES) {
  // Check if page already has sections
  const existing = run(
    `npx wrangler d1 execute podvarchan --remote --command "SELECT count(*) as cnt FROM page_sections WHERE page_id='${page.id}'"`
  );
  
  const count = existing?.results?.[0]?.cnt ?? 0;
  console.log(`${page.type}: ${count} existing sections`);
  
  if (count > 0) {
    console.log(`  → Skipping (already has sections)`);
    continue;
  }
  
  // Insert hero section
  const sectionId = uuid();
  sql.push(
    `INSERT INTO page_sections (id, page_id, key, type, enabled, sort_order, settings_json) VALUES ('${sectionId}', '${page.id}', 'hero', 'hero', 1, 1, '{}');`
  );
  
  // Insert RU translation
  const ruTrId = uuid();
  sql.push(
    `INSERT INTO page_section_translations (id, section_id, locale, content_json) VALUES ('${ruTrId}', '${sectionId}', 'ru', '${JSON.stringify(page.heroRu).replace(/'/g, "''")}');`
  );
  
  // Insert UK translation
  const ukTrId = uuid();
  sql.push(
    `INSERT INTO page_section_translations (id, section_id, locale, content_json) VALUES ('${ukTrId}', '${sectionId}', 'uk', '${JSON.stringify(page.heroUk).replace(/'/g, "''")}');`
  );
  
  console.log(`  → Inserted hero section + RU/UK translations`);
}

if (sql.length === 0) {
  console.log('\nNo sections to insert (all pages already have sections)');
  process.exit(0);
}

console.log(`\nTotal SQL statements: ${sql.length}`);

if (DRY_RUN) {
  console.log('\n--- DRY RUN (not executing) ---');
  sql.forEach(s => console.log(s));
} else {
  // Write to temp SQL file and execute
  const sqlContent = sql.join('\n');
  const fs = await import('fs');
  const path = await import('path');
  const sqlPath = path.join(process.cwd(), 'scripts', 'p2-hero-seed.sql');
  fs.writeFileSync(sqlPath, sqlContent, 'utf-8');
  console.log(`\nSQL written to ${sqlPath}`);
  
  // Execute
  console.log('\nExecuting on D1 remote...');
  const result = run(`npx wrangler d1 execute podvarchan --remote --file=scripts/p2-hero-seed.sql`);
  console.log('Result:', JSON.stringify(result, null, 2));
}
