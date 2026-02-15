import AuthForm from '../components/AuthForm'

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-neutral-50 dark:from-neutral-950 dark:to-neutral-900">
      <AuthForm mode="register" />
    </div>
  )
}
