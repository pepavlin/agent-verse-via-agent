'use client'

import { useState, useEffect, useCallback } from 'react'
import { signOut, useSession } from 'next-auth/react'

interface ApiKeyStatus {
  hasKey: boolean
  fingerprint?: string
  provider?: string
}

interface AccountSettingsProps {
  isOpen: boolean
  onClose: () => void
}

export default function AccountSettings({ isOpen, onClose }: AccountSettingsProps) {
  const { data: session } = useSession()
  const [keyStatus, setKeyStatus] = useState<ApiKeyStatus | null>(null)
  const [inputKey, setInputKey] = useState('')
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [testResult, setTestResult] = useState<{ valid: boolean; message: string } | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [showInput, setShowInput] = useState(false)

  const loadKeyStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/user/api-key')
      if (res.ok) {
        const data = await res.json()
        setKeyStatus(data)
        setShowInput(!data.hasKey)
      }
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    if (isOpen) {
      loadKeyStatus()
      setInputKey('')
      setTestResult(null)
      setSaveError(null)
    }
  }, [isOpen, loadKeyStatus])

  const handleTest = async () => {
    if (!inputKey.trim()) return
    setTesting(true)
    setTestResult(null)
    try {
      const res = await fetch('/api/user/api-key/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: inputKey.trim() }),
      })
      const data = await res.json()
      setTestResult(data)
    } catch {
      setTestResult({ valid: false, message: 'Chyba při testování.' })
    } finally {
      setTesting(false)
    }
  }

  const handleSave = async () => {
    if (!inputKey.trim()) return
    setSaving(true)
    setSaveError(null)
    try {
      const res = await fetch('/api/user/api-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: inputKey.trim() }),
      })
      const data = await res.json()
      if (res.ok) {
        setKeyStatus(data)
        setInputKey('')
        setShowInput(false)
        setTestResult(null)
      } else {
        setSaveError(data.error ?? 'Nepodařilo se uložit klíč.')
      }
    } catch {
      setSaveError('Nastala chyba. Zkus to znovu.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const res = await fetch('/api/user/api-key', { method: 'DELETE' })
      if (res.ok) {
        setKeyStatus({ hasKey: false })
        setShowInput(true)
        setTestResult(null)
      }
    } catch {
      // ignore
    } finally {
      setDeleting(false)
    }
  }

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login' })
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Nastavení účtu"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-slate-900 rounded-2xl border border-slate-800 w-full max-w-md mx-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800">
          <div>
            <h2 className="text-base font-semibold text-white">Nastavení</h2>
            {session?.user?.email && (
              <p className="text-xs text-slate-500 mt-0.5">{session.user.email}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-300 transition-colors p-1 rounded-lg hover:bg-slate-800"
            aria-label="Zavřít"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-6">
          {/* API Key section */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-medium text-white">API klíč</h3>
                <p className="text-xs text-slate-500 mt-0.5">Anthropic Claude</p>
              </div>
              {keyStatus?.hasKey && !showInput && (
                <button
                  onClick={() => { setShowInput(true); setTestResult(null) }}
                  className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Změnit
                </button>
              )}
            </div>

            {/* Saved key display */}
            {keyStatus?.hasKey && !showInput && (
              <div className="flex items-center gap-3 bg-slate-800/50 rounded-xl px-4 py-3 border border-slate-700/50">
                <div className="flex-1 flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full flex-shrink-0" />
                  <span className="text-sm font-mono text-slate-300">
                    {keyStatus.fingerprint}
                  </span>
                </div>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="text-xs text-slate-500 hover:text-red-400 transition-colors disabled:opacity-50"
                  aria-label="Smazat API klíč"
                >
                  {deleting ? '…' : 'Smazat'}
                </button>
              </div>
            )}

            {/* Key input */}
            {(!keyStatus?.hasKey || showInput) && (
              <div className="space-y-3">
                <input
                  type="password"
                  value={inputKey}
                  onChange={(e) => { setInputKey(e.target.value); setTestResult(null); setSaveError(null) }}
                  placeholder="sk-ant-api03-..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 font-mono focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                  autoComplete="off"
                  autoFocus
                />

                {/* Test result */}
                {testResult && (
                  <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg ${testResult.valid ? 'bg-emerald-950/50 border border-emerald-900/50 text-emerald-400' : 'bg-red-950/50 border border-red-900/50 text-red-400'}`}>
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      {testResult.valid
                        ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                      }
                    </svg>
                    {testResult.message}
                  </div>
                )}

                {saveError && (
                  <p className="text-xs text-red-400">{saveError}</p>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={handleTest}
                    disabled={!inputKey.trim() || testing}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 text-sm py-2.5 rounded-xl transition-colors border border-slate-700"
                  >
                    {testing ? 'Testování…' : 'Otestovat klíč'}
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={!inputKey.trim() || saving}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm py-2.5 rounded-xl transition-colors font-medium"
                  >
                    {saving ? 'Ukládání…' : 'Uložit'}
                  </button>
                </div>

                {keyStatus?.hasKey && showInput && (
                  <button
                    onClick={() => { setShowInput(false); setInputKey(''); setTestResult(null) }}
                    className="w-full text-xs text-slate-500 hover:text-slate-400 transition-colors py-1"
                  >
                    Zrušit změnu
                  </button>
                )}
              </div>
            )}
          </section>

          {/* Divider */}
          <div className="border-t border-slate-800" />

          {/* Sign out */}
          <button
            onClick={handleSignOut}
            className="w-full text-sm text-slate-500 hover:text-red-400 transition-colors py-1 text-left"
          >
            Odhlásit se
          </button>
        </div>
      </div>
    </div>
  )
}
