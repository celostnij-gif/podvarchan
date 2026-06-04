/**
 * Перевірки ролей та дозволів для адмін-панелі.
 *
 * Ієрархія: OWNER > ADMIN > EDITOR > VIEWER
 * Кожна наступна роль включає дозволи попередньої.
 */

import type { UserRole } from '@/types/auth'

const ROLE_HIERARCHY: Record<UserRole, number> = {
  VIEWER: 0,
  EDITOR: 1,
  ADMIN: 2,
  OWNER: 3,
}

function hasMinRole(userRole: UserRole, minRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[minRole]
}

/** Публікація контенту (потрібен EDITOR або вище) */
export function canPublish(role: UserRole): boolean {
  return hasMinRole(role, 'EDITOR')
}

/** Видалення контенту (потрібен ADMIN або вище) */
export function canDelete(role: UserRole): boolean {
  return hasMinRole(role, 'ADMIN')
}

/** Управління користувачами (тільки OWNER) */
export function canManageUsers(role: UserRole): boolean {
  return role === 'OWNER'
}

/** Управління налаштуваннями сайту (тільки OWNER) */
export function canManageSettings(role: UserRole): boolean {
  return role === 'OWNER'
}

/** Редагування контенту (потрібен EDITOR або вище) */
export function canEditContent(role: UserRole): boolean {
  return hasMinRole(role, 'EDITOR')
}

/** Перегляд заявок CRM (потрібен VIEWER або вище) */
export function canViewLeads(role: UserRole): boolean {
  return hasMinRole(role, 'VIEWER')
}

/** Завантаження медіафайлів (потрібен EDITOR або вище) */
export function canUploadMedia(role: UserRole): boolean {
  return hasMinRole(role, 'EDITOR')
}

/** Доступ до журналу дій (потрібен ADMIN або вище) */
export function canViewAuditLog(role: UserRole): boolean {
  return hasMinRole(role, 'ADMIN')
}
