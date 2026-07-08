import { getDB } from '@/db'
import { users } from '@/db/schema/auth'
import { desc } from 'drizzle-orm'

export default async function UsersListPage() {
  const db = getDB()
  const allUsers = await db.select().from(users).orderBy(desc(users.createdAt)).all()

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Пользователи</h1>
      </div>
      <div className="overflow-x-auto rounded-lg border">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Email</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Имя</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Роль</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Статус</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Последний вход</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {allUsers.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">Пользователей пока нет.</td></tr>
            ) : allUsers.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">{user.email}</td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">{user.name ?? '—'}</td>
                <td className="whitespace-nowrap px-4 py-3"><RoleBadge role={user.role} /></td>
                <td className="whitespace-nowrap px-4 py-3"><ActiveBadge active={user.isActive} /></td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString('uk-UA') : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function RoleBadge({ role }: { role: string }) {
  const styles: Record<string, string> = {
    OWNER: 'bg-purple-100 text-purple-800',
    ADMIN: 'bg-blue-100 text-blue-800',
    EDITOR: 'bg-green-100 text-green-800',
    VIEWER: 'bg-gray-100 text-gray-800',
    USER: 'bg-gray-100 text-gray-600',
  }
  const labels: Record<string, string> = {
    OWNER: 'Владелец', ADMIN: 'Админ', EDITOR: 'Редактор', VIEWER: 'Наблюдатель', USER: 'Пользователь',
  }
  return <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${styles[role] ?? styles.USER}`}>{labels[role] ?? role}</span>
}

function ActiveBadge({ active }: { active: boolean }) {
  return active
    ? <span className="inline-block rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">Активен</span>
    : <span className="inline-block rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">Неактивен</span>
}
