'use client'

import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'
import type { Task, Person } from '@/lib/graph-types'
import { cn } from '@/lib/utils'

interface CalendarSectionProps {
  tasks: Task[]
  people: Person[]
}

const WEEKDAY_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
const MONTH_LABELS = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
]

function getDeadlineKey(deadline: string | null | undefined): string | null {
  if (!deadline) return null
  const d = new Date(deadline)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function CalendarSection({ tasks, people }: CalendarSectionProps) {
  const [viewDate, setViewDate] = useState(() => new Date())
  const [selectedDay, setSelectedDay] = useState<string | null>(null)

  const tasksByDeadline = useMemo(() => {
    const map = new Map<string, Task[]>()
    for (const task of tasks) {
      const key = getDeadlineKey(task.deadline)
      if (!key) continue
      const list = map.get(key) ?? []
      list.push(task)
      map.set(key, list)
    }
    return map
  }, [tasks])

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startWeekday = firstDay.getDay()
  const startOffset = startWeekday === 0 ? 6 : startWeekday - 1
  const daysInMonth = lastDay.getDate()
  const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7
  const cells: (number | null)[] = []
  for (let i = 0; i < startOffset; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length < totalCells) cells.push(null)

  const prevMonth = () => {
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() - 1))
    setSelectedDay(null)
  }
  const nextMonth = () => {
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + 1))
    setSelectedDay(null)
  }

  const personMap = useMemo(() => new Map(people.map((p) => [p.id, p])), [people])
  const hasTasksWithDeadlines = tasks.some((t) => getDeadlineKey(t.deadline))

  const selectedKey = selectedDay
  const selectedTasks = selectedKey ? tasksByDeadline.get(selectedKey) ?? [] : []

  if (!hasTasksWithDeadlines) {
    return (
      <div className="flex-1 flex flex-col p-6 overflow-hidden">
        <h2 className="text-white text-xl font-semibold flex items-center gap-2 mb-4">
          <CalendarIcon size={22} className="text-slate-400" />
          Календарь
        </h2>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-slate-500">Нет задач с датами</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col p-6 overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white text-xl font-semibold flex items-center gap-2">
          <CalendarIcon size={22} className="text-slate-400" />
          Календарь
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-slate-200 font-medium min-w-[140px] text-center">
            {MONTH_LABELS[month]} {year}
          </span>
          <button
            onClick={nextMonth}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0 overflow-auto">
        <div className="bg-white/5 rounded-xl border border-white/10 p-4">
          <div className="grid grid-cols-7 gap-0.5 mb-2">
            {WEEKDAY_LABELS.map((label) => (
              <div
                key={label}
                className="text-center text-xs text-slate-500 py-1"
              >
                {label}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-0.5">
            {cells.map((day, i) => {
              if (day === null) {
                return <div key={`e-${i}`} className="aspect-square" />
              }
              const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
              const count = tasksByDeadline.get(key)?.length ?? 0
              const isSelected = selectedKey === key
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedDay(isSelected ? null : key)}
                  className={cn(
                    'aspect-square rounded-lg text-sm transition-colors flex flex-col items-center justify-center',
                    isSelected
                      ? 'bg-violet-600 text-white'
                      : count > 0
                        ? 'text-slate-200 hover:bg-white/10 bg-white/5'
                        : 'text-slate-500 hover:bg-white/5'
                  )}
                >
                  {day}
                  {count > 0 && (
                    <span className="text-[10px] opacity-80">
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white/5 rounded-xl border border-white/10 p-4 overflow-y-auto">
          {!selectedKey ? (
            <p className="text-slate-500 text-sm">
              Выберите день, чтобы увидеть задачи с дедлайном
            </p>
          ) : (
            <>
              <h3 className="text-white font-medium mb-3">
                {selectedKey.split('-').reverse().join('.')} — задачи
              </h3>
              {selectedTasks.length === 0 ? (
                <p className="text-slate-500 text-sm">Нет задач на эту дату</p>
              ) : (
                <ul className="space-y-2">
                  {selectedTasks.map((task) => {
                    const person = personMap.get(task.person_id)
                    return (
                      <li
                        key={task.id}
                        className="p-3 rounded-lg bg-white/5 border border-white/10 text-sm"
                      >
                        <p className="text-slate-200">{task.title}</p>
                        {person && (
                          <p className="text-slate-500 text-xs mt-1">
                            {person.name}
                          </p>
                        )}
                      </li>
                    )
                  })}
                </ul>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
