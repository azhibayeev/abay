'use client'

import { useState, useCallback } from 'react'
import { CONNECTION_COLORS, CONNECTION_TYPE_LABELS } from '@/lib/graph-types'
import type { Person, Task, TaskStatus, Connection } from '@/lib/graph-types'
import { getConnectionLabel, TaskCardDetailModal } from '@/components/sidebar/kanban-shared'
import { X, Archive, Plus, User, ChevronDown, ChevronUp, LayoutList } from 'lucide-react'

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
  onOpenTasksSection?: () => void
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
  onOpenTasksSection,
}: NodeDetailPanelProps) {
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskDeadline, setNewTaskDeadline] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [showBio, setShowBio] = useState(true)
  const [archiveConfirm, setArchiveConfirm] = useState(false)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)

  const personTasks = tasks.filter((t) => t.person_id === person.id)

  const handleAddTask = useCallback(() => {
    const title = newTaskTitle.trim()
    if (!title) return
    onAddTask(person.id, title, newTaskDeadline || null)
    setNewTaskTitle('')
    setNewTaskDeadline('')
    setShowAddForm(false)
  }, [newTaskTitle, newTaskDeadline, person.id, onAddTask])

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

      <div className="flex-1 px-4 py-3 flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-2">
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
          <div className="mb-3 p-3 rounded-lg bg-white/5 border border-white/8 space-y-2">
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

        <p className="text-slate-400 text-sm mb-2">
          Задач: <span className="text-white font-medium">{personTasks.length}</span>
        </p>
        {onOpenTasksSection && (
          <button
            onClick={onOpenTasksSection}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-violet-400
              hover:bg-violet-500/10 hover:text-violet-300 transition-colors border border-white/10 mb-3"
          >
            <LayoutList size={14} />
            Открыть в Задачах
          </button>
        )}
        <div className="flex-1 overflow-y-auto space-y-1 min-h-0">
          {personTasks.slice(0, 8).map((task) => (
            <button
              key={task.id}
              onClick={() => setSelectedTaskId(task.id)}
              className="w-full text-left px-2 py-1.5 rounded text-sm text-slate-300 hover:bg-white/5
                truncate border border-transparent hover:border-white/10 transition-colors"
            >
              {task.title}
            </button>
          ))}
          {personTasks.length > 8 && (
            <p className="text-slate-500 text-xs px-2 py-1">
              и ещё {personTasks.length - 8}…
            </p>
          )}
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
          personName={person.name}
          onClose={() => setSelectedTaskId(null)}
          onUpdate={(updates) => onUpdateTask(selectedTask.id, updates)}
          isAdmin={isAdmin}
        />
      )}
    </aside>
  )
}
