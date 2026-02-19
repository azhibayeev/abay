'use client'

import { useState } from 'react'
import { createClient } from '@/lib/client'
import { X, User, Lock, Brain } from 'lucide-react'

interface LoginModalProps {
  onClose: () => void
  onSuccess: () => void
}

export function LoginModal({ onClose, onSuccess }: LoginModalProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (username !== 'admin') {
      setError('Неверный логин или пароль')
      return
    }

    setIsLoading(true)
    try {
      const supabase = createClient()
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: 'admin@graph.app',
        password,
      })
      if (authError) {
        setError('Неверный логин или пароль')
        return
      }
      onSuccess()
      onClose()
    } catch {
      setError('Произошла ошибка при входе')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="w-full max-w-sm mx-4 bg-[#0d1117] border border-white/10 rounded-2xl shadow-2xl shadow-black/50 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center shadow-lg">
              <Brain size={15} className="text-white" />
            </div>
            <span className="text-white font-semibold text-sm">Knowledge Graph</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-300 transition-colors p-1 rounded-lg hover:bg-white/5"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <p className="text-white font-medium text-base mb-1">Вход в систему</p>
            <p className="text-slate-500 text-sm">Введите данные администратора</p>
          </div>

          <div className="space-y-3">
            <div className="relative">
              <User
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
              />
              <input
                type="text"
                placeholder="Логин"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
                className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm
                  text-white placeholder-slate-600 outline-none focus:border-violet-500/50 focus:bg-white/8
                  transition-all"
              />
            </div>

            <div className="relative">
              <Lock
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
              />
              <input
                type="password"
                placeholder="Пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm
                  text-white placeholder-slate-600 outline-none focus:border-violet-500/50 focus:bg-white/8
                  transition-all"
              />
            </div>
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 rounded-xl text-sm font-medium bg-violet-600 hover:bg-violet-500
              text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg
              shadow-violet-900/30"
          >
            {isLoading ? 'Вход…' : 'Войти'}
          </button>
        </form>
      </div>
    </div>
  )
}
