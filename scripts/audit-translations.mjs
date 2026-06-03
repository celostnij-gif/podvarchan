import { readFileSync } from 'fs'

const ru = JSON.parse(readFileSync('messages/ru.json', 'utf-8'))
const uk = JSON.parse(readFileSync('messages/uk.json', 'utf-8'))

function getFlattenedKeys(obj, prefix = '') {
  const keys = []
  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${k}` : k
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      keys.push(...getFlattenedKeys(v, path))
    } else if (Array.isArray(v)) {
      keys.push(path)
      v.forEach((item, i) => {
        if (item !== null && typeof item === 'object') {
          keys.push(...getFlattenedKeys(item, `${path}[${i}]`))
        }
      })
    } else {
      keys.push(path)
    }
  }
  return keys
}

function getLeafValues(obj, prefix = '') {
  const result = {}
  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${k}` : k
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      Object.assign(result, getLeafValues(v, path))
    } else if (Array.isArray(v)) {
      v.forEach((item, i) => {
        if (item !== null && typeof item === 'object') {
          Object.assign(result, getLeafValues(item, `${path}[${i}]`))
        } else {
          result[`${path}[${i}]`] = item
        }
      })
    } else {
      result[path] = v
    }
  }
  return result
}

const ruKeys = new Set(getFlattenedKeys(ru))
const ukKeys = new Set(getFlattenedKeys(uk))
const ruValues = getLeafValues(ru)
const ukValues = getLeafValues(uk)

let issues = []
let totalKeys = 0

// Check keys in RU but missing in UK
for (const key of ruKeys) {
  totalKeys++
  if (!ukKeys.has(key)) {
    issues.push({ type: 'MISSING_IN_UK', key })
  }
}

// Check keys in UK but missing in RU
for (const key of ukKeys) {
  if (!ruKeys.has(key)) {
    issues.push({ type: 'MISSING_IN_RU', key })
  }
}

// Check empty values in RU
for (const [key, val] of Object.entries(ruValues)) {
  if (typeof val === 'string' && val.trim() === '') {
    issues.push({ type: 'EMPTY_IN_RU', key })
  }
  if (val === null) {
    issues.push({ type: 'NULL_IN_RU', key })
  }
}

// Check empty values in UK
for (const [key, val] of Object.entries(ukValues)) {
  if (typeof val === 'string' && val.trim() === '') {
    issues.push({ type: 'EMPTY_IN_UK', key })
  }
  if (val === null) {
    issues.push({ type: 'NULL_IN_UK', key })
  }
}

// Check for {{placeholder}} — same placeholders in both languages
for (const [key, ruVal] of Object.entries(ruValues)) {
  if (!ukValues[key]) continue
  const ukVal = ukValues[key]
  if (typeof ruVal === 'string' && typeof ukVal === 'string') {
    const ruPlaceholders = ruVal.match(/\{[\w]+\}/g) || []
    const ukPlaceholders = ukVal.match(/\{[\w]+\}/g) || []
    if (ruPlaceholders.sort().join(',') !== ukPlaceholders.sort().join(',')) {
      issues.push({ type: 'MISMATCHED_PLACEHOLDERS', key, ru: ruPlaceholders, uk: ukPlaceholders })
    }
  }
}

console.log(`=== TRANSLATION AUDIT REPORT ===`)
console.log(`Total top-level namespaces: ${Object.keys(ru).length} (RU) / ${Object.keys(uk).length} (UK)`)
console.log(`Total leaf keys checked: ${totalKeys}\n`)

if (issues.length === 0) {
  console.log('✅ ALL CLEAN — No issues found!')
} else {
  console.log(`Found ${issues.length} issue(s):\n`)
  for (const issue of issues) {
    switch (issue.type) {
      case 'MISSING_IN_UK':
        console.log(`❌ MISSING IN UK: ${issue.key}`)
        break
      case 'MISSING_IN_RU':
        console.log(`❌ MISSING IN RU: ${issue.key}`)
        break
      case 'EMPTY_IN_RU':
        console.log(`⚠️  EMPTY IN RU: ${issue.key}`)
        break
      case 'EMPTY_IN_UK':
        console.log(`⚠️  EMPTY IN UK: ${issue.key}`)
        break
      case 'NULL_IN_RU':
        console.log(`❌ NULL IN RU: ${issue.key}`)
        break
      case 'NULL_IN_UK':
        console.log(`❌ NULL IN UK: ${issue.key}`)
        break
      case 'MISMATCHED_PLACEHOLDERS':
        console.log(`⚠️  PLACEHOLDER MISMATCH: ${issue.key}`)
        console.log(`   RU: ${issue.ru?.join(', ')}`)
        console.log(`   UK: ${issue.uk?.join(', ')}`)
        break
    }
  }
}

// Also check for duplicate top-level namespace names between the two files
console.log(`\n=== NAMESPACE COMPARISON ===`)
const ruNamespaces = Object.keys(ru).sort()
const ukNamespaces = Object.keys(uk).sort()
const onlyRU = ruNamespaces.filter(n => !ukNamespaces.includes(n))
const onlyUK = ukNamespaces.filter(n => !ruNamespaces.includes(n))
if (onlyRU.length) console.log(`Only in RU: ${onlyRU.join(', ')}`)
if (onlyUK.length) console.log(`Only in UK: ${onlyUK.join(', ')}`)
if (!onlyRU.length && !onlyUK.length) console.log('✅ Namespaces match perfectly')
