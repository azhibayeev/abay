'use client'

import { useState, useCallback, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { CONNECTION_COLORS, CONNECTION_TYPE_LABELS } from '@/lib/graph-types'
import type { Person, Task, TaskComment, TaskStatus, Connection } from '@/lib/graph-types'
import { fetchTaskComments, addTaskComment } from '@/lib/graph-service'
import {
  X,
  Archive,
  Plus,
  Trash2,
  Calendar,
  User,
  ChevronDown,
  ChevronUp,
  Link2,
  MessageSquare,
} from 'lucide-react'

const KANBAN_COLUMNS: { id: TaskStatus; label: string }[] = [
  { id: 'todo', label: 'Надо сделать' },
  { id: 'in_progress', label: 'В работе' },
  { id: 'done', label: 'Готово' },
]

interface NodeDetailPanelProps {
  person: Person
  tasks: Task[]
  connections: Connection[]
  people: Person[]
  onClose: () => void
  onArchive: (id: string) => void
  onAddTask: (
    personId: string,
    title: string,
    deadline?: string | null,
    connectionId?: string | null
  ) => void
  onUpdateTask: (
    id: string,
    updates: Partial<Pick<Task, 'title' | 'completed' | 'deadline' | 'status' | 'connection_id'>>
  ) => void
  onDeleteTask: (id: string) => void
  isAdmin: boolean
}

function getTaskStatus(task: Task): TaskStatus {
  if (task.status) return task.status
  return task.completed ? 'done' : 'todo'
}

function getConnectionLabel(
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

// ── Kanban card (draggable) ─────────────────────────────────────────────────

function KanbanCard({
  task,
  connectionLabel,
  isAdmin,
  onSelect,
  onUpdate,
  onDelete,
}: {
  task: Task
  connectionLabel: string | null
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
        'group rounded-lg border border-white/10 bg-white/5 p-2.5 cursor-pointer transition-colors',
        'hover:bg-white/8 hover:border-white/15'
      )}
    >
      <p className="text-sm text-slate-200 line-clamp-2">{task.title}</p>
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

function TaskCardDetailModal({
  task,
  connectionLabel,
  onClose,
  onUpdate,
  isAdmin,
}: {
  task: Task
  connectionLabel: string | null
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

export function NodeDetailPanel({
  person,
  tasks,
  connections,
  people,
  onClose,
  onArchive,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  isAdmin,
}: NodeDetailPanelProps) {
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskDeadline, setNewTaskDeadline] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [showBio, setShowBio] = useState(true)
  const [archiveConfirm, setArchiveConfirm] = useState(false)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null)

  const personTasks = tasks.filter((t) => t.person_id === person.id)

  const handleAddTask = useCallback(() => {
    const title = newTaskTitle.trim()
    if (!title) return
    onAddTask(person.id, title, newTaskDeadline || null)
    setNewTaskTitle('')
    setNewTaskDeadline('')
    setShowAddForm(false)
  }, [newTaskTitle, newTaskDeadline, person.id, onAddTask])

  const handleDrop = useCallback(
    (e: React.DragEvent, columnStatus: TaskStatus) => {
      e.preventDefault()
      setDragOverColumn(null)
      const taskId = e.dataTransfer.getData('application/task-id')
      if (!taskId) return
      onUpdateTask(taskId, { status: columnStatus })
    },
    [onUpdateTask]
  )

  const handleDragOver = useCallback((e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverColumn(status)
  }, [])

  const handleDragLeave = useCallback(() => {
    setDragOverColumn(null)
  }, [])

  const selectedTask = selectedTaskId ? personTasks.find((t) => t.id === selectedTaskId) : null
  const selectedTaskConnectionLabel = selectedTask
    ? getConnectionLabel(selectedTask.connection_id, connections, people)
    : null

  const accentColor = CONNECTION_COLORS[person.connection_type]

  return (
    <aside
      className="flex flex-col w-80 h-full bg-[#0d1117] border-l border-white/5 overflow-y-auto shrink-0
        animate-in slide-in-from-right duration-300"
    >
      <div
        className="px-5 py-4 border-b border-white/5"
        style={{ borderTopColor: accentColor, borderTopWidth: 2 }}
      >
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white shrink-0"
              style={{
                backgroundColor: `${accentColor}33`,
                border: `1.5px solid ${accentColor}`,
              }}
            >
              <User size={14} style={{ color: accentColor }} />
            </div>
            <div>
              <h2 className="text-white font-semibold text-base leading-tight">{person.name}</h2>
              <p className="text-xs" style={{ color: accentColor }}>
                {CONNECTION_TYPE_LABELS[person.connection_type]}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-200 transition-colors p-1 rounded"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {person.bio && (
        <div className="px-5 py-3 border-b border-white/5">
          <button
            onClick={() => setShowBio((v) => !v)}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 mb-2 transition-colors"
          >
            {showBio ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            Биография
          </button>
          {showBio && (
            <p className="text-slate-400 text-sm leading-relaxed">{person.bio}</p>
          )}
        </div>
      )}

      <div className="flex-1 px-2 py-3 flex flex-col min-h-0">
        <div className="flex items-center justify-between px-3 mb-2">
          <p className="text-slate-500 text-xs uppercase tracking-wider">Задачи</p>
          {isAdmin && (
            <button
              onClick={() => setShowAddForm((v) => !v)}
              className="text-slate-500 hover:text-violet-400 transition-colors"
            >
              <Plus size={14} />
            </button>
          )}
        </div>

        {isAdmin && showAddForm && (
          <div className="mx-3 mb-3 p-3 rounded-lg bg-white/5 border border-white/8 space-y-2">
            <input
              autoFocus
              placeholder="Название задачи…"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddTask()
                if (e.key === 'Escape') setShowAddForm(false)
              }}
              className="w-full bg-transparent text-sm text-white placeholder-slate-600 outline-none border-b border-white/10 pb-1"
            />
            <input
              type="date"
              value={newTaskDeadline}
              onChange={(e) => setNewTaskDeadline(e.target.value)}
              className="w-full bg-transparent text-xs text-slate-400 outline-none"
            />
            <div className="flex gap-2">
              <button
                onClick={handleAddTask}
                disabled={!newTaskTitle.trim()}
                className="flex-1 py-1.5 rounded-md text-xs font-medium bg-violet-600 hover:bg-violet-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Добавить
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 rounded-md text-xs text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors"
              >
                Отмена
              </button>
            </div>
          </div>
        )}

        <div className="flex-1 grid grid-cols-1 gap-2 overflow-hidden min-h-0">
          {KANBAN_COLUMNS.map((col) => {
            const columnTasks = personTasks.filter((t) => getTaskStatus(t) === col.id)
            return (
              <div
                key={col.id}
                onDragOver={(e) => handleDragOver(e, col.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, col.id)}
                className={cn(
                  'rounded-lg border border-dashed border-white/10 flex flex-col min-h-0 transition-colors',
                  dragOverColumn === col.id && 'border-violet-500/50 bg-violet-500/5'
                )}
              >
                <p className="px-2 py-1.5 text-xs font-medium text-slate-500 shrink-0">
                  {col.label} ({columnTasks.length})
                </p>
                <div className="flex-1 overflow-y-auto space-y-2 px-2 pb-2 min-h-0">
                  {columnTasks.map((task) => (
                    <div key={task.id} className="relative">
                      <KanbanCard
                        task={task}
                        connectionLabel={getConnectionLabel(
                          task.connection_id,
                          connections,
                          people
                        )}
                        isAdmin={isAdmin}
                        onSelect={() => setSelectedTaskId(task.id)}
                        onUpdate={(updates) => onUpdateTask(task.id, updates)}
                        onDelete={() => onDeleteTask(task.id)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {isAdmin && (
        <div className="px-5 py-4 border-t border-white/5 space-y-2">
          {archiveConfirm ? (
            <div className="flex items-center gap-2">
              <p className="text-xs text-slate-400 flex-1">Архивировать?</p>
              <button
                onClick={() => {
                  onArchive(person.id)
                  setArchiveConfirm(false)
                  onClose()
                }}
                className="px-3 py-1.5 rounded text-xs font-medium bg-amber-600/20 text-amber-400 hover:bg-amber-600/30 transition-colors border border-amber-600/30"
              >
                Да
              </button>
              <button
                onClick={() => setArchiveConfirm(false)}
                className="px-3 py-1.5 rounded text-xs text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors"
              >
                Отмена
              </button>
            </div>
          ) : (
            <button
              onClick={() => setArchiveConfirm(true)}
              className="flex items-center justify-center gap-2 w-full py-2 rounded-lg text-sm text-amber-500 hover:bg-amber-500/10 transition-colors border border-amber-500/20 hover:border-amber-500/40"
            >
              <Archive size={14} />
              Архивировать связь
            </button>
          )}
        </div>
      )}

      {selectedTask && (
        <TaskCardDetailModal
          task={selectedTask}
          connectionLabel={selectedTaskConnectionLabel ?? null}
          onClose={() => setSelectedTaskId(null)}
          onUpdate={(updates) => onUpdateTask(selectedTask.id, updates)}
          isAdmin={isAdmin}
        />
      )}
    </aside>
  )
}
