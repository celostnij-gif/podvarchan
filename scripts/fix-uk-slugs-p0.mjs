import { SERVICE_SLUG_UK, BLOG_SLUG_UK, CATEGORY_SLUG_UK } from '../src/lib/slugMapping.ts';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

console.log('=== P0 UK SLUG MIGRATION GENERATOR & EXECUTOR ===');

let sqlStatements = [];
const now = new Date().toISOString();

// 1. Service translations
let serviceCount = 0;
for (const [ruSlug, ukSlug] of Object.entries(SERVICE_SLUG_UK)) {
  if (ruSlug === ukSlug) continue; // skip identical
  serviceCount++;
  // Update service translation
  sqlStatements.push(
    `UPDATE service_translations SET slug = '${ukSlug}' WHERE locale = 'uk' AND slug = '${ruSlug}';`
  );
  // Add 301 redirect rule from old RU-slug path under /uk/uslugi/ to new UK-slug path
  const ruleId = 'redir_svc_' + crypto.randomBytes(6).toString('hex');
  const fromPath = `/uk/uslugi/${ruSlug}/`;
  const toPath = `/uk/uslugi/${ukSlug}/`;
  sqlStatements.push(
    `INSERT OR IGNORE INTO redirect_rules (id, from_path, to_path, status_code, is_enabled, hit_count, created_at) VALUES ('${ruleId}', '${fromPath}', '${toPath}', 301, 1, 0, '${now}');`
  );
  // Also non-trailing slash version
  const ruleId2 = 'redir_svc_' + crypto.randomBytes(6).toString('hex');
  const fromPath2 = `/uk/uslugi/${ruSlug}`;
  sqlStatements.push(
    `INSERT OR IGNORE INTO redirect_rules (id, from_path, to_path, status_code, is_enabled, hit_count, created_at) VALUES ('${ruleId2}', '${fromPath2}', '${toPath}', 301, 1, 0, '${now}');`
  );
}

// 2. Blog post translations
let blogCount = 0;
for (const [ruSlug, ukSlug] of Object.entries(BLOG_SLUG_UK)) {
  if (ruSlug === ukSlug) continue;
  blogCount++;
  sqlStatements.push(
    `UPDATE blog_post_translations SET slug = '${ukSlug}' WHERE locale = 'uk' AND slug = '${ruSlug}';`
  );
  const ruleId = 'redir_blog_' + crypto.randomBytes(6).toString('hex');
  const fromPath = `/uk/blog/${ruSlug}/`;
  const toPath = `/uk/blog/${ukSlug}/`;
  sqlStatements.push(
    `INSERT OR IGNORE INTO redirect_rules (id, from_path, to_path, status_code, is_enabled, hit_count, created_at) VALUES ('${ruleId}', '${fromPath}', '${toPath}', 301, 1, 0, '${now}');`
  );
  const ruleId2 = 'redir_blog_' + crypto.randomBytes(6).toString('hex');
  const fromPath2 = `/uk/blog/${ruSlug}`;
  sqlStatements.push(
    `INSERT OR IGNORE INTO redirect_rules (id, from_path, to_path, status_code, is_enabled, hit_count, created_at) VALUES ('${ruleId2}', '${fromPath2}', '${toPath}', 301, 1, 0, '${now}');`
  );
}

// 3. Blog category translations
let catCount = 0;
for (const [ruSlug, ukSlug] of Object.entries(CATEGORY_SLUG_UK)) {
  if (ruSlug === ukSlug) continue;
  catCount++;
  sqlStatements.push(
    `UPDATE blog_category_translations SET slug = '${ukSlug}' WHERE locale = 'uk' AND slug = '${ruSlug}';`
  );
  const ruleId = 'redir_cat_' + crypto.randomBytes(6).toString('hex');
  const fromPath = `/uk/blog/kategoriya/${ruSlug}/`;
  const toPath = `/uk/blog/kategoriya/${ukSlug}/`;
  sqlStatements.push(
    `INSERT OR IGNORE INTO redirect_rules (id, from_path, to_path, status_code, is_enabled, hit_count, created_at) VALUES ('${ruleId}', '${fromPath}', '${toPath}', 301, 1, 0, '${now}');`
  );
}

console.log(`Generated migration for ${serviceCount} services, ${blogCount} blog posts, ${catCount} categories.`);

const sqlContent = sqlStatements.join('\n');
const sqlPath = path.join(process.cwd(), 'scripts', 'fix-p0-uk-slugs.sql');
fs.writeFileSync(sqlPath, sqlContent, 'utf-8');
console.log(`SQL written to ${sqlPath}`);
