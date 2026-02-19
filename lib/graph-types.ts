export type ConnectionType =
  | 'philosophical'
  | 'business'
  | 'psychological'
  | 'practical'
  | 'synthesis'

export interface Person {
  id: string
  user_id: string
  name: string
  bio: string | null
  connection_type: ConnectionType
  archived: boolean
  pos_x: number
  pos_y: number
  pos_z: number
  created_at: string
}

export interface Connection {
  id: string
  user_id: string
  from_person_id: string
  to_person_id: string
  created_at: string
}

export type TaskStatus = 'todo' | 'in_progress' | 'done'

export interface Task {
  id: string
  user_id: string
  person_id: string
  title: string
  completed: boolean
  deadline: string | null
  status?: TaskStatus
  connection_id?: string | null
  created_at: string
}

export interface TaskComment {
  id: string
  task_id: string
  user_id: string
  body: string
  created_at: string
}

export const CONNECTION_COLORS: Record<ConnectionType, string> = {
  philosophical: '#8B5CF6',
  business: '#3B82F6',
  psychological: '#06B6D4',
  practical: '#EF4444',
  synthesis: '#EC4899',
}

export const CONNECTION_TYPE_LABELS: Record<ConnectionType, string> = {
  philosophical: 'Philosophical',
  business: 'Business',
  psychological: 'Psychological',
  practical: 'Practical',
  synthesis: 'Synthesis',
}

export const ALL_CONNECTION_TYPES: ConnectionType[] = [
  'philosophical',
  'business',
  'psychological',
  'practical',
  'synthesis',
]

export type NavSection =
  | 'research'
  | 'archive'
  | 'graph'
  | 'knowledge'
  | 'analytics'
  | 'models'
  | 'calendar'

export const NAV_SECTIONS: { id: NavSection; label: string }[] = [
  { id: 'research', label: 'Исследования' },
  { id: 'archive', label: 'Чертовщина' },
  { id: 'graph', label: 'Граф знаний' },
  { id: 'knowledge', label: 'База знаний' },
  { id: 'analytics', label: 'Аналитика' },
  { id: 'models', label: 'Модели' },
  { id: 'calendar', label: 'Календарь' },
]
