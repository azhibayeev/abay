'use client'

import { useState, useCallback } from 'react'
import type { Person } from '@/lib/graph-types'
import type { NavSection } from '@/lib/graph-types'

export function useGraphInteraction() {
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null)
  const [hoveredPersonId, setHoveredPersonId] = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState<NavSection>('graph')
  const [showAddModal, setShowAddModal] = useState(false)

  const selectPerson = useCallback((person: Person | null) => {
    setSelectedPerson(person)
  }, [])

  const hoverPerson = useCallback((id: string | null) => {
    setHoveredPersonId(id)
  }, [])

  const openAddModal = useCallback(() => {
    setShowAddModal(true)
  }, [])

  const closeAddModal = useCallback(() => {
    setShowAddModal(false)
  }, [])

  const closePanel = useCallback(() => {
    setSelectedPerson(null)
  }, [])

  return {
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
  }
}
