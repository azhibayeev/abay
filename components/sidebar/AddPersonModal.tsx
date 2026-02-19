'use client'

import { useState, useCallback, useEffect } from 'react'
import { X, User, Link2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  ALL_CONNECTION_TYPES,
  CONNECTION_COLORS,
  CONNECTION_TYPE_LABELS,
} from '@/lib/graph-types'
import type { ConnectionType, Person } from '@/lib/graph-types'

interface AddPersonModalProps {
  existingPeople: Person[]
  onClose: () => void
  onSubmit: (
    data: { name: string; bio: string; connection_type: ConnectionType },
    connectToIds: string[]
  ) => Promise<void>
}

const CORE_NODE_NAME = 'Абай'

export function AddPersonModal({ existingPeople, onClose, onSubmit }: AddPersonModalProps) {
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [connectionType, setConnectionType] = useState<ConnectionType>('practical')
  const [selectedConnections, setSelectedConnections] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Default connection to core node "Абай" when present
  useEffect(() => {
    const abay = existingPeople.find((p) => p.name === CORE_NODE_NAME)
    if (abay && selectedConnections.length === 0) {
      setSelectedConnections([abay.id])
    }
  }, [existingPeople])

  const toggleConnection = useCallback((id: string) => {
    setSelectedConnections((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }, [])

  const handleSubmit = useCallback(async () => {
    if (!name.trim()) {
      setError('Имя обязательно')
      return
    }
    setLoading(true)
    setError(null)
    try {
      await onSubmit(
        { name: name.trim(), bio: bio.trim(), connection_type: connectionType },
        selectedConnections
      )
      onClose()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [name, bio, connectionType, selectedConnections, onSubmit, onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-[#0d1117] rounded-xl border border-white/10 shadow-2xl
        shadow-black/60 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-violet-600/20 border border-violet-500/30 flex items-center justify-center">
              <User size={14} className="text-violet-400" />
            </div>
            <h2 className="text-white font-semibold text-base">Добавить человека</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-200 transition-colors p-1 rounded"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">
              Имя <span className="text-violet-400">*</span>
            </label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="Введите имя…"
              className="w-full bg-white/5 border border-white/8 rounded-lg px-3 py-2.5 text-sm text-white
                placeholder-slate-600 outline-none focus:border-violet-500/50 focus:bg-white/8 transition-all"
            />
          </div>

          {/* Bio */}
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Биография</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              placeholder="Краткое описание…"
              className="w-full bg-white/5 border border-white/8 rounded-lg px-3 py-2.5 text-sm text-white
                placeholder-slate-600 outline-none focus:border-violet-500/50 focus:bg-white/8 transition-all
                resize-none"
            />
          </div>

          {/* Connection type */}
          <div>
            <label className="block text-xs text-slate-400 mb-2">Тип связи</label>
            <div className="grid grid-cols-5 gap-1.5">
              {ALL_CONNECTION_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => setConnectionType(type)}
                  className={cn(
                    'flex flex-col items-center gap-1 py-2 px-1 rounded-lg border text-xs transition-all',
                    connectionType === type
                      ? 'border-opacity-60 bg-opacity-15'
                      : 'border-white/8 bg-white/3 hover:bg-white/8'
                  )}
                  style={
                    connectionType === type
                      ? {
                          borderColor: CONNECTION_COLORS[type],
                          backgroundColor: `${CONNECTION_COLORS[type]}20`,
                        }
                      : {}
                  }
                >
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: CONNECTION_COLORS[type] }}
                  />
                  <span
                    className={cn(
                      'leading-tight text-center',
                      connectionType === type ? 'text-white' : 'text-slate-500'
                    )}
                  >
                    {CONNECTION_TYPE_LABELS[type].slice(0, 4)}
                  </span>
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-xs text-slate-500">
              Выбрано:{' '}
              <span style={{ color: CONNECTION_COLORS[connectionType] }}>
                {CONNECTION_TYPE_LABELS[connectionType]}
              </span>
            </p>
          </div>

          {/* Connect to existing people */}
          {existingPeople.length > 0 && (
            <div>
              <label className="flex items-center gap-1.5 text-xs text-slate-400 mb-2">
                <Link2 size={11} />
                Связать с ({selectedConnections.length} выбрано)
              </label>
              <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                {existingPeople.map((person) => (
                  <button
                    key={person.id}
                    onClick={() => toggleConnection(person.id)}
                    className={cn(
                      'flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm transition-all text-left',
                      selectedConnections.includes(person.id)
                        ? 'bg-white/10 text-white'
                        : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                    )}
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: CONNECTION_COLORS[person.connection_type] }}
                    />
                    <span className="flex-1 truncate">{person.name}</span>
                    {selectedConnections.includes(person.id) && (
                      <span className="text-violet-400 text-xs">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <p className="text-red-400 text-xs bg-red-500/10 rounded-lg px-3 py-2 border border-red-500/20">
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 px-6 py-4 border-t border-white/8">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg text-sm text-slate-400 hover:text-slate-200
              hover:bg-white/5 transition-colors border border-white/8"
          >
            Отмена
          </button>
          <button
            onClick={handleSubmit}
            disabled={!name.trim() || loading}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-violet-600 hover:bg-violet-500
              text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-lg
              shadow-violet-900/30"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-3.5 h-3.5 border border-white/40 border-t-white rounded-full animate-spin" />
                Добавление…
              </span>
            ) : (
              'Добавить'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
