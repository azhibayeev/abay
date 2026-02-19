'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/client'
import { useGraphData } from '@/hooks/useGraphData'
import { useGraphInteraction } from '@/hooks/useGraphInteraction'
import { GraphCanvas } from '@/components/graph/GraphCanvas'
import { LeftSidebar } from '@/components/sidebar/LeftSidebar'
import { NodeDetailPanel } from '@/components/sidebar/NodeDetailPanel'
import { AddPersonModal } from '@/components/sidebar/AddPersonModal'
import { CalendarSection } from '@/components/sidebar/CalendarSection'
import { LoginModal } from '@/components/LoginModal'
import type { Person } from '@/lib/graph-types'
import { CONNECTION_COLORS, CONNECTION_TYPE_LABELS, ALL_CONNECTION_TYPES } from '@/lib/graph-types'
import { Archive, RotateCcw } from 'lucide-react'

// ── Archive section ──────────────────────────────────────────────────────────

function ArchiveSection({
  archivedPeople,
  onUnarchive,
}: {
  archivedPeople: Person[]
  onUnarchive: (id: string) => void
}) {
  return (
    <div className="flex-1 p-8 overflow-y-auto">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Archive size={20} className="text-slate-400" />
          <h2 className="text-white text-xl font-semibold">Архив связей</h2>
          <span className="text-slate-500 text-sm">({archivedPeople.length})</span>
        </div>

        {archivedPeople.length === 0 ? (
          <div className="text-center py-20">
            <Archive size={48} className="text-slate-700 mx-auto mb-4" />
            <p className="text-slate-500">Архив пуст</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {archivedPeople.map((person) => (
              <div
                key={person.id}
                className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/8
                  hover:bg-white/8 transition-colors"
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: `${CONNECTION_COLORS[person.connection_type]}20`,
                    border: `1.5px solid ${CONNECTION_COLORS[person.connection_type]}40`,
                  }}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: CONNECTION_COLORS[person.connection_type] }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{person.name}</p>
                  <p
                    className="text-xs"
                    style={{ color: CONNECTION_COLORS[person.connection_type] }}
                  >
                    {CONNECTION_TYPE_LABELS[person.connection_type]}
                  </p>
                  {person.bio && (
                    <p className="text-slate-500 text-xs mt-1 truncate">{person.bio}</p>
                  )}
                </div>
                <button
                  onClick={() => onUnarchive(person.id)}
                  className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs
                    text-slate-400 hover:text-white hover:bg-white/10 transition-all border border-white/8"
                >
                  <RotateCcw size={12} />
                  Восстановить
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main app component ───────────────────────────────────────────────────────

export function GraphApp() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)

  const {
    activePeople,
    archivedPeople,
    connections,
    tasks,
    loading,
    addPerson,
    archivePerson,
    unarchivePerson,
    updatePosition,
    addTask,
    updateTask,
    deleteTask,
  } = useGraphData()

  const {
    selectedPerson,
    hoveredPersonId,
    activeSection,
    showAddModal,
    selectPerson,
    hoverPerson,
    setActiveSection,
    openAddModal,
    closeAddModal,
    closePanel,
  } = useGraphInteraction()

  // Track Supabase auth state
  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getSession().then(({ data }) => {
      setIsAdmin(!!data.session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAdmin(!!session)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = useCallback(async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
  }, [])

  const handleNodeSelect = useCallback(
    (person: Person | null) => {
      selectPerson(person)
    },
    [selectPerson]
  )

  const handleDragEnd = useCallback(
    (id: string, x: number, y: number, z: number) => {
      updatePosition(id, x, y, z)
    },
    [updatePosition]
  )

  const isGraphSection = activeSection === 'graph'
  const isArchiveSection = activeSection === 'archive'
  const isCalendarSection = activeSection === 'calendar'

  // Active connections (between non-archived people)
  const activePersonIds = new Set(activePeople.map((p) => p.id))
  const activeConnections = connections.filter(
    (c) => activePersonIds.has(c.from_person_id) && activePersonIds.has(c.to_person_id)
  )

  return (
    <div className="flex h-screen w-screen bg-[#080c14] overflow-hidden">
      <LeftSidebar
        activePeople={activePeople}
        connections={activeConnections}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        onAddPerson={openAddModal}
        onLogout={handleLogout}
        isAdmin={isAdmin}
        onLoginClick={() => setShowLoginModal(true)}
      />

      <main className="flex-1 relative flex overflow-hidden">
        {isGraphSection && (
          <GraphCanvas
            loading={loading}
            people={activePeople}
            connections={activeConnections}
            selectedPersonId={selectedPerson?.id ?? null}
            hoveredPersonId={hoveredPersonId}
            onSelect={handleNodeSelect}
            onHover={hoverPerson}
            onDragEnd={handleDragEnd}
          />
        )}

        {isArchiveSection && (
          <ArchiveSection
            archivedPeople={archivedPeople}
            onUnarchive={unarchivePerson}
          />
        )}

        {isCalendarSection && (
          <CalendarSection tasks={tasks} people={activePeople} />
        )}

        {!isGraphSection && !isArchiveSection && !isCalendarSection && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-slate-500 text-lg mb-2">Раздел в разработке</p>
              <p className="text-slate-600 text-sm">Переключитесь на «Граф знаний»</p>
            </div>
          </div>
        )}

        {/* Node detail panel (right side) */}
        {selectedPerson && isGraphSection && (
          <NodeDetailPanel
            person={selectedPerson}
            tasks={tasks}
            connections={activeConnections}
            people={activePeople}
            onClose={closePanel}
            onArchive={archivePerson}
            onAddTask={addTask}
            onUpdateTask={updateTask}
            onDeleteTask={deleteTask}
            isAdmin={isAdmin}
          />
        )}
      </main>

      {/* Add person modal — only for admin */}
      {showAddModal && isAdmin && (
        <AddPersonModal
          existingPeople={activePeople}
          onClose={closeAddModal}
          onSubmit={addPerson}
        />
      )}

      {/* Login modal */}
      {showLoginModal && (
        <LoginModal
          onClose={() => setShowLoginModal(false)}
          onSuccess={() => setShowLoginModal(false)}
        />
      )}
    </div>
  )
}
