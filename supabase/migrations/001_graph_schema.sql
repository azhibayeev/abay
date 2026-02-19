-- 001_graph_schema.sql
-- Knowledge Graph schema: people, connections, tasks

-- Connection type enum
create type public.connection_type as enum (
  'philosophical',
  'business',
  'psychological',
  'practical',
  'synthesis'
);

-- People (nodes)
create table public.people (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  bio         text,
  connection_type connection_type not null default 'practical',
  archived    boolean not null default false,
  pos_x       float8 not null default 0,
  pos_y       float8 not null default 0,
  pos_z       float8 not null default 0,
  created_at  timestamptz not null default now()
);

alter table public.people enable row level security;

create policy "Users can select own people"
  on public.people for select
  using (auth.uid() = user_id);

create policy "Users can insert own people"
  on public.people for insert
  with check (auth.uid() = user_id);

create policy "Users can update own people"
  on public.people for update
  using (auth.uid() = user_id);

create policy "Users can delete own people"
  on public.people for delete
  using (auth.uid() = user_id);

-- Connections (edges)
create table public.connections (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  from_person_id  uuid not null references public.people(id) on delete cascade,
  to_person_id    uuid not null references public.people(id) on delete cascade,
  created_at      timestamptz not null default now(),
  constraint no_self_connection check (from_person_id <> to_person_id)
);

alter table public.connections enable row level security;

create policy "Users can select own connections"
  on public.connections for select
  using (auth.uid() = user_id);

create policy "Users can insert own connections"
  on public.connections for insert
  with check (auth.uid() = user_id);

create policy "Users can update own connections"
  on public.connections for update
  using (auth.uid() = user_id);

create policy "Users can delete own connections"
  on public.connections for delete
  using (auth.uid() = user_id);

-- Tasks (per person to-do items)
create table public.tasks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  person_id   uuid not null references public.people(id) on delete cascade,
  title       text not null,
  completed   boolean not null default false,
  deadline    date,
  created_at  timestamptz not null default now()
);

alter table public.tasks enable row level security;

create policy "Users can select own tasks"
  on public.tasks for select
  using (auth.uid() = user_id);

create policy "Users can insert own tasks"
  on public.tasks for insert
  with check (auth.uid() = user_id);

create policy "Users can update own tasks"
  on public.tasks for update
  using (auth.uid() = user_id);

create policy "Users can delete own tasks"
  on public.tasks for delete
  using (auth.uid() = user_id);

-- Indexes for performance
create index people_user_id_idx on public.people(user_id);
create index connections_user_id_idx on public.connections(user_id);
create index connections_from_idx on public.connections(from_person_id);
create index connections_to_idx on public.connections(to_person_id);
create index tasks_person_id_idx on public.tasks(person_id);
create index tasks_user_id_idx on public.tasks(user_id);

-- Enable Realtime for all three tables
alter publication supabase_realtime add table public.people;
alter publication supabase_realtime add table public.connections;
alter publication supabase_realtime add table public.tasks;
