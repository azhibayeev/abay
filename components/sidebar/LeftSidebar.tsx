'use client'

import { cn } from '@/lib/utils'
import { NAV_SECTIONS, CONNECTION_COLORS, ALL_CONNECTION_TYPES, CONNECTION_TYPE_LABELS } from '@/lib/graph-types'
import type { NavSection, Person, Connection } from '@/lib/graph-types'
import {
  Network,
  Archive,
  Brain,
  BookOpen,
  BarChart2,
  Cpu,
  Calendar,
  LayoutList,
  Plus,
  LogOut,
  UserCircle,
} from 'lucide-react'

const NAV_ICONS: Record<NavSection, React.ReactNode> = {
  research: <Network size={16} />,
  archive: <Archive size={16} />,
  graph: <Brain size={16} />,
  knowledge: <BookOpen size={16} />,
  analytics: <BarChart2 size={16} />,
  models: <Cpu size={16} />,
  calendar: <Calendar size={16} />,
  tasks: <LayoutList size={16} />,
}

interface LeftSidebarProps {
  activePeople: Person[]
  connections: Connection[]
  activeSection: NavSection
  onSectionChange: (section: NavSection) => void
  onAddPerson: () => void
  onLogout: () => void
  isAdmin: boolean
  onLoginClick: () => void
}

export function LeftSidebar({
  activePeople,
  connections,
  activeSection,
  onSectionChange,
  onAddPerson,
  onLogout,
  isAdmin,
  onLoginClick,
}: LeftSidebarProps) {
  const typeBreakdown = ALL_CONNECTION_TYPES.map((type) => ({
    type,
    count: activePeople.filter((p) => p.connection_type === type).length,
  })).filter((t) => t.count > 0)

  return (
    <aside className="flex flex-col w-60 min-h-screen bg-[#0d1117] border-r border-white/5 shrink-0">
      {/* Logo / title */}
      <div className="px-5 py-5 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center shadow-lg">
              <Brain size={14} className="text-white" />
            </div>
            <span className="text-white font-semibold text-sm tracking-wide">
              Knowledge Graph
            </span>
          </div>

          {/* User icon */}
          <button
            onClick={isAdmin ? undefined : onLoginClick}
            title={isAdmin ? 'Вы вошли как admin' : 'Войти'}
            className={cn(
              'relative p-1 rounded-lg transition-colors',
              isAdmin
                ? 'text-violet-400 cursor-default'
                : 'text-slate-500 hover:text-slate-300 hover:bg-white/5 cursor-pointer'
            )}
          >
            <UserCircle size={18} />
            {isAdmin && (
              <span className="absolute bottom-0.5 right-0.5 w-2 h-2 rounded-full bg-emerald-400 border border-[#0d1117]" />
            )}
          </button>
        </div>
      </div>

      {/* Stats counter */}
      <div className="px-5 py-3 border-b border-white/5">
        <p className="text-slate-400 text-xs">
          <span className="text-white font-medium">{activePeople.length}</span>
          {' концепций · '}
          <span className="text-white font-medium">{connections.length}</span>
          {' связей'}
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3 space-y-0.5">
        {NAV_SECTIONS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => onSectionChange(id)}
            className={cn(
              'flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm transition-all duration-150',
              activeSection === id
                ? 'bg-white/10 text-white'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            )}
          >
            <span className={cn(activeSection === id ? 'text-violet-400' : 'text-slate-500')}>
              {NAV_ICONS[id]}
            </span>
            {label}
            {id === 'archive' && (
              <span className="ml-auto text-xs text-slate-500 bg-white/5 rounded px-1.5 py-0.5">
                архив
              </span>
            )}
            {id === 'graph' && (
              <span className="ml-auto text-xs text-violet-400 bg-violet-500/10 rounded px-1.5 py-0.5">
                активно
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Connection type legend */}
      {typeBreakdown.length > 0 && (
        <div className="px-5 py-3 border-t border-white/5">
          <p className="text-slate-500 text-xs uppercase tracking-wider mb-2">Типы связей</p>
          <div className="space-y-1.5">
            {typeBreakdown.map(({ type, count }) => (
              <div key={type} className="flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: CONNECTION_COLORS[type] }}
                />
                <span className="text-slate-400 text-xs flex-1 truncate">
                  {CONNECTION_TYPE_LABELS[type]}
                </span>
                <span className="text-slate-500 text-xs">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add person button — admin only */}
      {isAdmin && (
        <div className="px-4 py-4 border-t border-white/5">
          <button
            onClick={onAddPerson}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm font-medium
              bg-violet-600 hover:bg-violet-500 text-white transition-colors duration-150 shadow-lg shadow-violet-900/30"
          >
            <Plus size={15} />
            Добавить человека
          </button>
        </div>
      )}

      {/* Logout — admin only */}
      {isAdmin && (
        <div className={cn('px-4 pb-4', !isAdmin && 'pt-4')}>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs text-slate-500
              hover:text-slate-300 hover:bg-white/5 transition-all duration-150"
          >
            <LogOut size={14} />
            Выйти
          </button>
        </div>
      )}
    </aside>
  )
}
