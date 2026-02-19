-- 20250219120000_task_kanban_and_comments.sql
-- Purpose: Add task status (Kanban), optional connection_id, and task_comments for card history.
-- Affected: public.tasks (new columns), new table public.task_comments.

-- Task status enum for Kanban columns
create type public.task_status as enum (
  'todo',
  'in_progress',
  'done'
);

-- Add status to tasks; keep completed for backward compatibility, sync with status
alter table public.tasks
  add column if not exists status task_status not null default 'todo';

-- Sync existing completed -> status
update public.tasks
set status = 'done'
where completed = true;

-- Optional: link task to a connection ("с кем связь создана")
alter table public.tasks
  add column if not exists connection_id uuid references public.connections(id) on delete set null;

comment on column public.tasks.status is 'Kanban column: todo, in_progress, done';
comment on column public.tasks.connection_id is 'Optional link to connection (person pair) this task is about';

-- Index for filtering by status
create index if not exists tasks_status_idx on public.tasks(status);
create index if not exists tasks_connection_id_idx on public.tasks(connection_id);

-- Task comments: history and comments inside a task card
create table public.task_comments (
  id          uuid primary key default gen_random_uuid(),
  task_id     uuid not null references public.tasks(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  body        text not null,
  created_at  timestamptz not null default now()
);

alter table public.task_comments enable row level security;

-- Users can only see comments for tasks they own (task belongs to user)
create policy "Users can select own task comments"
  on public.task_comments for select
  to authenticated
  using (
    task_id in (
      select id from public.tasks where user_id = (select auth.uid())
    )
  );

create policy "Users can insert own task comments"
  on public.task_comments for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and task_id in (
      select id from public.tasks where user_id = (select auth.uid())
    )
  );

create policy "Users can update own task comments"
  on public.task_comments for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Users can delete own task comments"
  on public.task_comments for delete
  to authenticated
  using (user_id = (select auth.uid()));

create index task_comments_task_id_idx on public.task_comments(task_id);
create index task_comments_user_id_idx on public.task_comments(user_id);

-- Enable Realtime for task_comments so UI can subscribe
alter publication supabase_realtime add table public.task_comments;
