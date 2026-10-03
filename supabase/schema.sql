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

-- ─────────────────────────────────────────────────────────────
-- Notificações: o robô diário cria uma para cada anime novo no catálogo
create table if not exists public.notifications (
  id bigserial primary key,
  anime_id integer not null,
  title text not null,
  cover text,
  kind text not null default 'new_anime',
  created_at timestamptz default now()
);
create index if not exists notifications_created_idx on public.notifications (created_at desc);
alter table public.notifications enable row level security;
drop policy if exists "notificacoes publicas" on public.notifications;
create policy "notificacoes publicas" on public.notifications for select using (true);

-- Até quando o usuário já viu as notificações (sincroniza entre aparelhos)
alter table public.profiles add column if not exists notif_seen_at timestamptz;

-- Comentários: todo mundo lê, só quem está logado escreve
create table if not exists public.comments (
  id bigserial primary key,
  anime_id integer not null,
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  author_name text not null default '',
  author_avatar text,
  body text not null check (char_length(btrim(body)) between 1 and 1000),
  created_at timestamptz default now()
);
create index if not exists comments_anime_idx on public.comments (anime_id, created_at desc);
alter table public.comments enable row level security;
drop policy if exists "comentarios - ler" on public.comments;
drop policy if exists "comentarios - criar" on public.comments;
drop policy if exists "comentarios - apagar" on public.comments;
create policy "comentarios - ler" on public.comments for select using (true);
create policy "comentarios - criar" on public.comments for insert with check (auth.uid() = user_id);
create policy "comentarios - apagar" on public.comments for delete using (auth.uid() = user_id);

-- Nome e foto do autor vêm da conta (não dá para se passar por outra pessoa)
create or replace function public.comment_author() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  select coalesce(nullif(u.raw_user_meta_data->>'full_name', ''), nullif(u.raw_user_meta_data->>'name', ''), split_part(u.email, '@', 1)),
         u.raw_user_meta_data->>'avatar_url'
    into new.author_name, new.author_avatar
    from auth.users u where u.id = new.user_id;
  new.body := btrim(new.body);
  return new;
end $$;
drop trigger if exists comments_author on public.comments;
create trigger comments_author before insert on public.comments
  for each row execute function public.comment_author();

-- Tempo real (comentários e notificações chegam sem recarregar a página)
do $$
begin
  begin alter publication supabase_realtime add table public.comments; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.notifications; exception when duplicate_object then null; end;
end $$;

-- Avisos de episódio: animes que o usuário marcou para ser avisado
create table if not exists public.episode_alerts (
  user_id uuid references auth.users on delete cascade,
  anime_id integer not null,
  title text, cover text,
  created_at timestamptz default now(),
  primary key (user_id, anime_id)
);
alter table public.episode_alerts enable row level security;
drop policy if exists "meus avisos - ler" on public.episode_alerts;
drop policy if exists "meus avisos - criar" on public.episode_alerts;
drop policy if exists "meus avisos - apagar" on public.episode_alerts;
create policy "meus avisos - ler" on public.episode_alerts for select using (auth.uid() = user_id);
create policy "meus avisos - criar" on public.episode_alerts for insert with check (auth.uid() = user_id);
create policy "meus avisos - apagar" on public.episode_alerts for delete using (auth.uid() = user_id);
