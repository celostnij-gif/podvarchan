import { LoginForm } from './login-form'

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Podvarchan Admin</h1>
          <p className="mt-1 text-sm text-gray-500">Увійдіть у панель керування</p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
