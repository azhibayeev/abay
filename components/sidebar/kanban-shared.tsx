'use client'

import { useState, useCallback, useEffect } from 'react'
import { cn } from '@/lib/utils'
import type { Task, TaskComment, TaskStatus, Connection, Person } from '@/lib/graph-types'
import { fetchTaskComments, addTaskComment } from '@/lib/graph-service'
import { X, Calendar, Link2, MessageSquare, Trash2, User } from 'lucide-react'

export const KANBAN_COLUMNS: { id: TaskStatus; label: string }[] = [
  { id: 'todo', label: 'Надо сделать' },
  { id: 'in_progress', label: 'В работе' },
  { id: 'done', label: 'Готово' },
]

export function getTaskStatus(task: Task): TaskStatus {
  if (task.status) return task.status
  return task.completed ? 'done' : 'todo'
}

export function getConnectionLabel(
  connectionId: string | null | undefined,
  connections: Connection[],
  people: Person[]
): string | null {
  if (!connectionId) return null
  const conn = connections.find((c) => c.id === connectionId)
  if (!conn) return null
  const from = people.find((p) => p.id === conn.from_person_id)
  const to = people.find((p) => p.id === conn.to_person_id)
  if (!from || !to) return null
  return `${from.name} — ${to.name}`
}

export function getPersonName(personId: string, people: Person[]): string {
  const p = people.find((x) => x.id === personId)
  return p?.name ?? '—'
}

// ── Kanban card (draggable) ─────────────────────────────────────────────────

export function KanbanCard({
  task,
  connectionLabel,
  personName,
  isAdmin,
  onSelect,
  onUpdate,
  onDelete,
}: {
  task: Task
  connectionLabel: string | null
  personName?: string
  isAdmin: boolean
  onSelect: () => void
  onUpdate: (updates: Partial<Pick<Task, 'status'>>) => void
  onDelete: () => void
}) {
  const status = getTaskStatus(task)
  const isOverdue =
    task.deadline && status !== 'done' && new Date(task.deadline) < new Date()

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('application/task-id', task.id)
    e.dataTransfer.setData('application/task-status', status)
    e.dataTransfer.effectAllowed = 'move'
  }

  return (
    <div
      draggable={isAdmin}
      onDragStart={handleDragStart}
      onClick={onSelect}
      className={cn(
        'group relative rounded-lg border border-white/10 bg-white/5 p-2.5 cursor-pointer transition-colors',
        'hover:bg-white/8 hover:border-white/15'
      )}
    >
      <p className="text-sm text-slate-200 line-clamp-2">{task.title}</p>
      {personName !== undefined && (
        <p className="flex items-center gap-1 text-xs mt-1 text-slate-400">
          <User size={10} />
          {personName}
        </p>
      )}
      {task.deadline && (
        <p
          className={cn(
            'flex items-center gap-1 text-xs mt-1',
            isOverdue ? 'text-red-400' : 'text-slate-500'
          )}
        >
          <Calendar size={10} />
          {new Date(task.deadline).toLocaleDateString('ru-RU')}
          {isOverdue && ' · просрочено'}
        </p>
      )}
      {connectionLabel && (
        <p className="flex items-center gap-1 text-xs mt-1 text-slate-500 truncate" title={connectionLabel}>
          <Link2 size={10} />
          {connectionLabel}
        </p>
      )}
      {isAdmin && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          className="absolute top-1.5 right-1.5 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Trash2 size={12} />
        </button>
      )}
    </div>
  )
}

// ── Task card detail modal (comments + connection) ────────────────────────────

export function TaskCardDetailModal({
  task,
  connectionLabel,
  personName,
  onClose,
  onUpdate,
  isAdmin,
}: {
  task: Task
  connectionLabel: string | null
  personName?: string
  onClose: () => void
  onUpdate: (updates: Partial<Pick<Task, 'title' | 'deadline' | 'status' | 'connection_id'>>) => void
  isAdmin: boolean
}) {
  const [comments, setComments] = useState<TaskComment[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetchTaskComments(task.id).then((data) => {
      if (!cancelled) setComments(data)
    }).finally(() => {
      if (!cancelled) setLoading(false)
    })
    return () => { cancelled = true }
  }, [task.id])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
      }
    }
    document.addEventListener('keydown', onKeyDown, true)
    return () => document.removeEventListener('keydown', onKeyDown, true)
  }, [onClose])

  const handleAddComment = useCallback(async () => {
    const body = newComment.trim()
    if (!body) return
    try {
      const c = await addTaskComment(task.id, body)
      setComments((prev) => [...prev, c])
      setNewComment('')
    } catch {
      // ignore
    }
  }, [task.id, newComment])

  const status = getTaskStatus(task)
  const isOverdue =
    task.deadline && status !== 'done' && new Date(task.deadline) < new Date()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-md max-h-[85vh] flex flex-col bg-[#0d1117] rounded-xl border border-white/10 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-white/5 flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-semibold text-base">{task.title}</h3>
            {personName !== undefined && (
              <p className="flex items-center gap-1.5 text-xs mt-1 text-slate-400">
                <User size={12} />
                {personName}
              </p>
            )}
            {task.deadline && (
              <p
                className={cn(
                  'flex items-center gap-1 text-xs mt-1',
                  isOverdue ? 'text-red-400' : 'text-slate-500'
                )}
              >
                <Calendar size={12} />
                {new Date(task.deadline).toLocaleDateString('ru-RU')}
                {isOverdue && ' · просрочено'}
              </p>
            )}
            {connectionLabel && (
              <p className="flex items-center gap-1.5 text-xs mt-1.5 text-slate-400">
                <Link2 size={12} />
                Связь: {connectionLabel}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-200 transition-colors p-1 rounded shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 border-t border-white/5">
          <p className="text-slate-500 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <MessageSquare size={12} />
            История и комментарии
          </p>
          {loading ? (
            <p className="text-slate-500 text-sm">Загрузка…</p>
          ) : comments.length === 0 ? (
            <p className="text-slate-600 text-sm italic">Пока нет комментариев</p>
          ) : (
            <ul className="space-y-3">
              {comments.map((c) => (
                <li
                  key={c.id}
                  className="text-sm text-slate-300 bg-white/5 rounded-lg px-3 py-2 border border-white/5"
                >
                  <p className="whitespace-pre-wrap">{c.body}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {new Date(c.created_at).toLocaleString('ru-RU')}
                  </p>
                </li>
              ))}
            </ul>
          )}

          {isAdmin && (
            <div className="mt-4">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Добавить комментарий…"
                rows={2}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 outline-none focus:border-violet-500/50 resize-none"
              />
              <button
                onClick={handleAddComment}
                disabled={!newComment.trim()}
                className="mt-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-violet-600 hover:bg-violet-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Отправить
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
