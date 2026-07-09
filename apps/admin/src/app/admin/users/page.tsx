import { getDB } from '@/db'
import { users } from '@/db/schema/auth'
import { desc } from 'drizzle-orm'

export default async function UsersListPage() {
  const db = getDB()
  const allUsers = await db.select().from(users).orderBy(desc(users.createdAt)).all()

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-100">Пользователи</h1>
      </div>
      <div className="overflow-hidden rounded-xl border border-zinc-800">
        <table className="min-w-full divide-y divide-zinc-800">
          <thead className="bg-zinc-800/30">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">Email</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">Имя</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">Роль</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">Статус</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">Последний вход</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {allUsers.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-zinc-500">Пользователей пока нет.</td></tr>
            ) : allUsers.map((user) => (
              <tr key={user.id} className="hover:bg-zinc-800/30">
                <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-zinc-200">{user.email}</td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-500">{user.name ?? '—'}</td>
                <td className="whitespace-nowrap px-4 py-3"><RoleBadge role={user.role} /></td>
                <td className="whitespace-nowrap px-4 py-3"><ActiveBadge active={user.isActive} /></td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-500">{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString('uk-UA') : '—'}</td>
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
    OWNER: 'bg-purple-900/30 text-purple-400 border border-purple-700/30',
    ADMIN: 'bg-blue-900/30 text-blue-400 border border-blue-700/30',
    EDITOR: 'bg-green-900/30 text-green-400 border border-green-700/30',
    VIEWER: 'bg-zinc-800 text-zinc-400 border border-zinc-700/50',
    USER: 'bg-zinc-800 text-zinc-500 border border-zinc-700/50',
  }
  const labels: Record<string, string> = {
    OWNER: 'Владелец', ADMIN: 'Админ', EDITOR: 'Редактор', VIEWER: 'Наблюдатель', USER: 'Пользователь',
  }
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[role] ?? styles.USER}`}>{labels[role] ?? role}</span>
}

function ActiveBadge({ active }: { active: boolean }) {
  return active
    ? <span className="inline-block rounded-full bg-green-900/30 px-2.5 py-0.5 text-xs font-medium text-green-400 border border-green-700/30">Активен</span>
    : <span className="inline-block rounded-full bg-red-900/30 px-2.5 py-0.5 text-xs font-medium text-red-400 border border-red-700/30">Неактивен</span>
}
