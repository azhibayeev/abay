'use client'

import { useEffect, useCallback, useReducer, useRef } from 'react'
import { createClient } from '@/lib/client'
import type { Person, Connection, Task, ConnectionType } from '@/lib/graph-types'
import {
  fetchPeople,
  fetchConnections,
  fetchTasks,
  addPerson as svcAddPerson,
  addConnections as svcAddConnections,
  archivePerson as svcArchivePerson,
  unarchivePerson as svcUnarchivePerson,
  updatePersonPosition as svcUpdatePosition,
  addTask as svcAddTask,
  updateTask as svcUpdateTask,
  deleteTask as svcDeleteTask,
} from '@/lib/graph-service'

// ── State ───────────────────────────────────────────────────────────────────

interface GraphState {
  people: Person[]
  connections: Connection[]
  tasks: Task[]
  loading: boolean
  error: string | null
}

type GraphAction =
  | { type: 'LOADED'; people: Person[]; connections: Connection[]; tasks: Task[] }
  | { type: 'ERROR'; message: string }
  | { type: 'UPSERT_PERSON'; person: Person }
  | { type: 'REMOVE_PERSON'; id: string }
  | { type: 'UPSERT_CONNECTION'; connection: Connection }
  | { type: 'REMOVE_CONNECTION'; id: string }
  | { type: 'UPSERT_TASK'; task: Task }
  | { type: 'REMOVE_TASK'; id: string }

function reducer(state: GraphState, action: GraphAction): GraphState {
  switch (action.type) {
    case 'LOADED':
      return {
        ...state,
        people: action.people,
        connections: action.connections,
        tasks: action.tasks,
        loading: false,
        error: null,
      }
    case 'ERROR':
      return { ...state, loading: false, error: action.message }
    case 'UPSERT_PERSON': {
      const exists = state.people.find((p) => p.id === action.person.id)
      return {
        ...state,
        people: exists
          ? state.people.map((p) => (p.id === action.person.id ? action.person : p))
          : [...state.people, action.person],
      }
    }
    case 'REMOVE_PERSON':
      return { ...state, people: state.people.filter((p) => p.id !== action.id) }
    case 'UPSERT_CONNECTION': {
      const exists = state.connections.find((c) => c.id === action.connection.id)
      return {
        ...state,
        connections: exists
          ? state.connections.map((c) =>
              c.id === action.connection.id ? action.connection : c
            )
          : [...state.connections, action.connection],
      }
    }
    case 'REMOVE_CONNECTION':
      return {
        ...state,
        connections: state.connections.filter((c) => c.id !== action.id),
      }
    case 'UPSERT_TASK': {
      const exists = state.tasks.find((t) => t.id === action.task.id)
      return {
        ...state,
        tasks: exists
          ? state.tasks.map((t) => (t.id === action.task.id ? action.task : t))
          : [...state.tasks, action.task],
      }
    }
    case 'REMOVE_TASK':
      return { ...state, tasks: state.tasks.filter((t) => t.id !== action.id) }
    default:
      return state
  }
}

// ── Hook ────────────────────────────────────────────────────────────────────

export function useGraphData() {
  const [state, dispatch] = useReducer(reducer, {
    people: [],
    connections: [],
    tasks: [],
    loading: true,
    error: null,
  })

  const seedAbayAttempted = useRef(false)

  // Initial load
  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const [people, connections, tasks] = await Promise.all([
          fetchPeople(),
          fetchConnections(),
          fetchTasks(),
        ])
        if (!cancelled) {
          dispatch({ type: 'LOADED', people, connections, tasks })
        }
      } catch (err) {
        if (!cancelled) {
          dispatch({ type: 'ERROR', message: (err as Error).message })
        }
      }
    }

    load()
    return () => { cancelled = true }
  }, [])

  // Seed core node "Абай" when user has no people (empty graph)
  useEffect(() => {
    if (state.loading || state.people.length > 0 || seedAbayAttempted.current) return

    seedAbayAttempted.current = true

    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) return
      try {
        const abay = await svcAddPerson({
          name: 'Абай',
          bio: null,
          connection_type: 'synthesis',
          archived: false,
          pos_x: 0,
          pos_y: 0,
          pos_z: 0,
        })
        dispatch({ type: 'UPSERT_PERSON', person: abay })
      } catch {
        seedAbayAttempted.current = false
      }
    })
  }, [state.loading, state.people.length])

  // Realtime subscriptions
  useEffect(() => {
    const supabase = createClient()

    const peopleChannel = supabase
      .channel('realtime:people')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'people' }, (payload) => {
        if (payload.eventType === 'DELETE') {
          dispatch({ type: 'REMOVE_PERSON', id: (payload.old as Person).id })
        } else {
          dispatch({ type: 'UPSERT_PERSON', person: payload.new as Person })
        }
      })
      .subscribe()

    const connectionsChannel = supabase
      .channel('realtime:connections')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'connections' }, (payload) => {
        if (payload.eventType === 'DELETE') {
          dispatch({ type: 'REMOVE_CONNECTION', id: (payload.old as Connection).id })
        } else {
          dispatch({ type: 'UPSERT_CONNECTION', connection: payload.new as Connection })
        }
      })
      .subscribe()

    const tasksChannel = supabase
      .channel('realtime:tasks')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, (payload) => {
        if (payload.eventType === 'DELETE') {
          dispatch({ type: 'REMOVE_TASK', id: (payload.old as Task).id })
        } else {
          dispatch({ type: 'UPSERT_TASK', task: payload.new as Task })
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(peopleChannel)
      supabase.removeChannel(connectionsChannel)
      supabase.removeChannel(tasksChannel)
    }
  }, [])

  // ── Actions ──────────────────────────────────────────────────────────────

  const addPerson = useCallback(
    async (
      personData: { name: string; bio: string; connection_type: ConnectionType },
      connectToIds: string[]
    ) => {
      // Distribute on a sphere surface
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const r = 8 + Math.random() * 4
      const pos_x = r * Math.sin(phi) * Math.cos(theta)
      const pos_y = r * Math.sin(phi) * Math.sin(theta)
      const pos_z = r * Math.cos(phi)

      const person = await svcAddPerson({
        ...personData,
        archived: false,
        pos_x,
        pos_y,
        pos_z,
      })
      dispatch({ type: 'UPSERT_PERSON', person })

      if (connectToIds.length > 0) {
        const newConns = await svcAddConnections(person.id, connectToIds)
        newConns.forEach((c) => dispatch({ type: 'UPSERT_CONNECTION', connection: c }))
      }

      return person
    },
    []
  )

  const archivePerson = useCallback(async (id: string) => {
    await svcArchivePerson(id)
    dispatch({
      type: 'UPSERT_PERSON',
      person: { ...state.people.find((p) => p.id === id)!, archived: true },
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.people])

  const unarchivePerson = useCallback(async (id: string) => {
    await svcUnarchivePerson(id)
    dispatch({
      type: 'UPSERT_PERSON',
      person: { ...state.people.find((p) => p.id === id)!, archived: false },
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.people])

  const updatePosition = useCallback(
    async (id: string, x: number, y: number, z: number) => {
      const prev = state.people.find((p) => p.id === id)
      if (prev) {
        dispatch({
          type: 'UPSERT_PERSON',
          person: { ...prev, pos_x: x, pos_y: y, pos_z: z },
        })
      }
      await svcUpdatePosition(id, x, y, z)
    },
    [state.people]
  )

  const addTask = useCallback(
    async (
      personId: string,
      title: string,
      deadline?: string | null,
      connectionId?: string | null
    ) => {
      const task = await svcAddTask(personId, title, deadline, connectionId)
      dispatch({ type: 'UPSERT_TASK', task })
      return task
    },
    []
  )

  const updateTask = useCallback(
    async (
      id: string,
      updates: Partial<
        Pick<Task, 'title' | 'completed' | 'deadline' | 'status' | 'connection_id'>
      >
    ) => {
      await svcUpdateTask(id, updates)
      const existing = state.tasks.find((t) => t.id === id)
      if (existing) {
        dispatch({ type: 'UPSERT_TASK', task: { ...existing, ...updates } })
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.tasks]
  )

  const deleteTask = useCallback(async (id: string) => {
    await svcDeleteTask(id)
    dispatch({ type: 'REMOVE_TASK', id })
  }, [])

  return {
    ...state,
    activePeople: state.people.filter((p) => !p.archived),
    archivedPeople: state.people.filter((p) => p.archived),
    addPerson,
    archivePerson,
    unarchivePerson,
    updatePosition,
    addTask,
    updateTask,
    deleteTask,
  }
}
