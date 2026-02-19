import { createClient } from '@/lib/client'
import type { ConnectionType, Person, Connection, Task, TaskComment } from '@/lib/graph-types'

// ── People ─────────────────────────────────────────────────────────────────

export async function fetchPeople(): Promise<Person[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('people')
    .select('*')
    .order('created_at', { ascending: true })
  if (error) throw error
  return data as Person[]
}

export async function addPerson(
  person: Omit<Person, 'id' | 'user_id' | 'created_at'>
): Promise<Person> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('people')
    .insert({ ...person, user_id: user.id })
    .select()
    .single()
  if (error) throw error
  return data as Person
}

export async function updatePersonPosition(
  id: string,
  pos_x: number,
  pos_y: number,
  pos_z: number
): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('people')
    .update({ pos_x, pos_y, pos_z })
    .eq('id', id)
  if (error) throw error
}

export async function archivePerson(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('people')
    .update({ archived: true })
    .eq('id', id)
  if (error) throw error
}

export async function unarchivePerson(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('people')
    .update({ archived: false })
    .eq('id', id)
  if (error) throw error
}

// ── Connections ─────────────────────────────────────────────────────────────

export async function fetchConnections(): Promise<Connection[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('connections')
    .select('*')
    .order('created_at', { ascending: true })
  if (error) throw error
  return data as Connection[]
}

export async function addConnections(
  fromPersonId: string,
  toPersonIds: string[]
): Promise<Connection[]> {
  if (toPersonIds.length === 0) return []
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const rows = toPersonIds.map((toId) => ({
    user_id: user.id,
    from_person_id: fromPersonId,
    to_person_id: toId,
  }))

  const { data, error } = await supabase
    .from('connections')
    .insert(rows)
    .select()
  if (error) throw error
  return data as Connection[]
}

export async function removeConnection(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('connections').delete().eq('id', id)
  if (error) throw error
}

// ── Tasks ───────────────────────────────────────────────────────────────────

export async function fetchTasks(): Promise<Task[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('created_at', { ascending: true })
  if (error) throw error
  return data as Task[]
}

export async function addTask(
  personId: string,
  title: string,
  deadline?: string | null,
  connectionId?: string | null
): Promise<Task> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('tasks')
    .insert({
      user_id: user.id,
      person_id: personId,
      title,
      deadline: deadline ?? null,
      completed: false,
      status: 'todo',
      connection_id: connectionId ?? null,
    })
    .select()
    .single()
  if (error) throw error
  return data as Task
}

export async function updateTask(
  id: string,
  updates: Partial<Pick<Task, 'title' | 'completed' | 'deadline' | 'status' | 'connection_id'>>
): Promise<void> {
  const supabase = createClient()
  const payload = { ...updates }
  if (updates.status !== undefined) {
    (payload as Record<string, unknown>).completed = updates.status === 'done'
  }
  const { error } = await supabase.from('tasks').update(payload).eq('id', id)
  if (error) throw error
}

export async function deleteTask(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('tasks').delete().eq('id', id)
  if (error) throw error
}

// ── Task comments ───────────────────────────────────────────────────────────

export async function fetchTaskComments(taskId: string): Promise<TaskComment[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('task_comments')
    .select('*')
    .eq('task_id', taskId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data as TaskComment[]
}

export async function addTaskComment(taskId: string, body: string): Promise<TaskComment> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('task_comments')
    .insert({ task_id: taskId, user_id: user.id, body })
    .select()
    .single()
  if (error) throw error
  return data as TaskComment
}

export async function deleteTaskComment(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('task_comments').delete().eq('id', id)
  if (error) throw error
}
