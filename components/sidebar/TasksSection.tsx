'use client'

import { useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import type { Person, Task, TaskStatus, Connection } from '@/lib/graph-types'
import {
  KANBAN_COLUMNS,
  getTaskStatus,
  getConnectionLabel,
  getPersonName,
  KanbanCard,
  TaskCardDetailModal,
} from '@/components/sidebar/kanban-shared'

interface TasksSectionProps {
  tasks: Task[]
  people: Person[]
  connections: Connection[]
  onUpdateTask: (
    id: string,
    updates: Partial<Pick<Task, 'title' | 'completed' | 'deadline' | 'status' | 'connection_id'>>
  ) => void
  onDeleteTask: (id: string) => void
  isAdmin: boolean
}

export function TasksSection({
  tasks,
  people,
  connections,
  onUpdateTask,
  onDeleteTask,
  isAdmin,
}: TasksSectionProps) {
  const [filterPersonId, setFilterPersonId] = useState<string | null>(null)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null)

  const filteredTasks = filterPersonId
    ? tasks.filter((t) => t.person_id === filterPersonId)
    : tasks

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

  const selectedTask = selectedTaskId ? tasks.find((t) => t.id === selectedTaskId) : null
  const selectedTaskConnectionLabel = selectedTask
    ? getConnectionLabel(selectedTask.connection_id, connections, people)
    : null
  const selectedTaskPersonName = selectedTask
    ? getPersonName(selectedTask.person_id, people)
    : undefined

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#080c14]">
      <div className="px-6 py-4 border-b border-white/5 flex items-center gap-4 flex-wrap">
        <h2 className="text-white font-semibold text-lg">Все задачи</h2>
        <div className="flex items-center gap-2">
          <span className="text-slate-500 text-sm">Человек:</span>
          <select
            value={filterPersonId ?? ''}
            onChange={(e) => setFilterPersonId(e.target.value || null)}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white
              focus:outline-none focus:border-violet-500/50 min-w-[160px]"
          >
            <option value="">Все</option>
            {people.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-3 gap-4 p-6 min-h-0 overflow-hidden">
        {KANBAN_COLUMNS.map((col) => {
          const columnTasks = filteredTasks.filter((t) => getTaskStatus(t) === col.id)
          return (
            <div
              key={col.id}
              onDragOver={(e) => handleDragOver(e, col.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, col.id)}
              className={cn(
                'rounded-xl border border-white/10 flex flex-col min-h-0 transition-colors bg-[#0d1117]/50',
                dragOverColumn === col.id && 'border-violet-500/50 bg-violet-500/5'
              )}
            >
              <p className="px-4 py-3 text-sm font-medium text-slate-400 shrink-0 border-b border-white/5">
                {col.label} ({columnTasks.length})
              </p>
              <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
                {columnTasks.length === 0 ? (
                  <p className="text-slate-600 text-sm py-4 text-center">Нет задач</p>
                ) : (
                  columnTasks.map((task) => (
                    <div key={task.id} className="relative">
                      <KanbanCard
                        task={task}
                        connectionLabel={getConnectionLabel(
                          task.connection_id,
                          connections,
                          people
                        )}
                        personName={getPersonName(task.person_id, people)}
                        isAdmin={isAdmin}
                        onSelect={() => setSelectedTaskId(task.id)}
                        onUpdate={(updates) => onUpdateTask(task.id, updates)}
                        onDelete={() => onDeleteTask(task.id)}
                      />
                    </div>
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>

      {selectedTask && (
        <TaskCardDetailModal
          task={selectedTask}
          connectionLabel={selectedTaskConnectionLabel ?? null}
          personName={selectedTaskPersonName}
          onClose={() => setSelectedTaskId(null)}
          onUpdate={(updates) => onUpdateTask(selectedTask.id, updates)}
          isAdmin={isAdmin}
        />
      )}
    </div>
  )
}
