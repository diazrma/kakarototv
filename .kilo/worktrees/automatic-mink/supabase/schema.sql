-- KakarotoTV — rode isto no SQL Editor do Supabase

create table if not exists public.animes (
  id integer primary key,
  data jsonb not null,
  description_pt text,
  updated_at timestamptz default now()
);

create table if not exists public.shelves (
  key text primary key,
  title text not null,
  subtitle text,
  anime_ids integer[] not null default '{}',
  position int default 0
);

create table if not exists public.sync_log (
  id bigserial primary key,
  ran_at timestamptz default now(),
  animes int, new_animes int, translated int
);

create table if not exists public.favorites (
  user_id uuid references auth.users on delete cascade,
  anime_id integer not null,
  title text, cover text,
  created_at timestamptz default now(),
  primary key (user_id, anime_id)
);

-- Progresso nas esferas e nível de poder
create table if not exists public.profiles (
  user_id uuid primary key references auth.users on delete cascade,
  spheres int[] not null default '{}',   -- quais esferas (1..7) coletou no ciclo atual
  sphere_day text,                      -- dia do ciclo (as esferas mudam de lugar todo dia)
  wishes int not null default 0,
  updated_at timestamptz default now()
);

alter table public.animes enable row level security;
alter table public.shelves enable row level security;
alter table public.sync_log enable row level security;
alter table public.favorites enable row level security;
alter table public.profiles enable row level security;

create policy "catalogo publico" on public.animes for select using (true);
create policy "prateleiras publicas" on public.shelves for select using (true);

create policy "meus favoritos - ler" on public.favorites for select using (auth.uid() = user_id);
create policy "meus favoritos - criar" on public.favorites for insert with check (auth.uid() = user_id);
create policy "meus favoritos - apagar" on public.favorites for delete using (auth.uid() = user_id);

create policy "meu perfil - ler" on public.profiles for select using (auth.uid() = user_id);
create policy "meu perfil - criar" on public.profiles for insert with check (auth.uid() = user_id);
create policy "meu perfil - editar" on public.profiles for update using (auth.uid() = user_id);
