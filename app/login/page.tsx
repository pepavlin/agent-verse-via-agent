'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

type Mode = 'login' | 'register'

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (mode === 'register') {
        const res = await fetch('/api/user/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, name: name || undefined }),
        })
        const data = await res.json()

        if (!res.ok) {
          setError(data.error ?? 'Registrace se nezdařila')
          setLoading(false)
          return
        }
      }

      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError(mode === 'register' ? 'Registrace proběhla, ale přihlášení selhalo. Zkus se přihlásit ručně.' : 'Nesprávný email nebo heslo')
        setLoading(false)
        return
      }

      router.push('/')
      router.refresh()
    } catch {
      setError('Nastala chyba. Zkus to znovu.')
      setLoading(false)
    }
  }

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login')
    setError(null)
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo / Title */}
        <div className="text-center mb-10">
          <div className="w-14 h-14 bg-indigo-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Agent Verse</h1>
          <p className="text-slate-500 text-sm mt-1">
            {mode === 'login' ? 'Přihlas se ke svému světu' : 'Vytvoř nový účet'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Jméno (volitelné)
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jak ti říkají agenti?"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                autoComplete="name"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tvuj@email.cz"
              required
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Heslo</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === 'register' ? 'Alespoň 8 znaků' : '••••••••'}
              required
              minLength={mode === 'register' ? 8 : undefined}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
          </div>

          {error && (
            <div className="bg-red-950/50 border border-red-900/50 rounded-xl px-4 py-3">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 rounded-xl text-sm transition-colors mt-2"
          >
            {loading
              ? mode === 'login'
                ? 'Přihlašování…'
                : 'Registrace…'
              : mode === 'login'
                ? 'Přihlásit se'
                : 'Vytvořit účet'}
          </button>
        </form>

        {/* Toggle mode */}
        <p className="text-center text-sm text-slate-500 mt-6">
          {mode === 'login' ? 'Nemáš účet?' : 'Máš účet?'}{' '}
          <button
            onClick={switchMode}
            className="text-indigo-400 hover:text-indigo-300 transition-colors font-medium"
          >
            {mode === 'login' ? 'Zaregistruj se' : 'Přihlas se'}
          </button>
        </p>
      </div>
    </div>
  )
}
