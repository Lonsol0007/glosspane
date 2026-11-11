-- Logical schema. v1 implements these tables as IndexedDB stores (src/lib/db.ts).
-- Written for Postgres (Supabase) so cloud sync can be added later.
-- All times timestamptz in UTC. Access rule: row level security, owner only.

create table manga (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source text not null default 'local',
  url text not null,                       -- stable key of the import (file name + size)
  title text not null,
  author text,
  artist text,
  description text,
  genre text[] not null default '{}',
  status text not null default 'unknown'
    check (status in ('unknown','ongoing','completed','hiatus','cancelled')),
  cover_page_id uuid,                      -- set after pages exist
  favorite boolean not null default true,
  date_added timestamptz not null default now(),
  notes text not null default '',
  reading_mode text not null default 'default'
    check (reading_mode in ('default','ltr','rtl','vertical','webtoon')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, source, url)
);
create index on manga (user_id, favorite, title);

create table chapter (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  manga_id uuid not null references manga(id) on delete cascade,
  url text not null,
  name text not null,
  scanlator text,
  chapter_number real not null default -1,
  source_order integer not null,
  page_count integer not null default 0 check (page_count >= 0),
  read boolean not null default false,
  bookmark boolean not null default false,
  last_page_read integer not null default 0 check (last_page_read >= 0),
  date_fetch timestamptz not null default now(),
  date_upload timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (manga_id, url)
);
create index on chapter (manga_id, source_order);
create index on chapter (user_id, date_fetch desc);

create table page (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  chapter_id uuid not null references chapter(id) on delete cascade,
  page_index integer not null check (page_index >= 0),
  storage_path text not null,              -- a blob locally; object storage if synced
  media_type text not null,
  width integer,
  height integer,
  created_at timestamptz not null default now(),
  unique (chapter_id, page_index)
);

create table category (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  sort integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index on category (user_id, lower(name));

create table manga_category (
  manga_id uuid not null references manga(id) on delete cascade,
  category_id uuid not null references category(id) on delete cascade,  -- deleting a category keeps the series
  primary key (manga_id, category_id)
);
create index on manga_category (category_id);

create table history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  manga_id uuid not null references manga(id) on delete cascade,
  chapter_id uuid not null references chapter(id) on delete cascade,
  read_at timestamptz not null default now(),
  read_duration_ms bigint not null default 0 check (read_duration_ms >= 0),
  unique (chapter_id)                      -- one row per chapter: re-reading updates
);
create index on history (user_id, read_at desc);

create table page_translation (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  chapter_id uuid not null references chapter(id) on delete cascade,
  page_index integer not null,
  target_lang text not null,
  status text not null default 'done' check (status in ('done','failed')),
  model text,
  blocks jsonb not null default '[]',
    -- [{ id, bbox:[x,y,w,h] fractions of the page, source, sourceLang,
    --    translation, sourceEdited, translationEdited, bg, fg }]
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (chapter_id, page_index, target_lang)   -- reruns upsert
);

create table preference (
  user_id uuid not null references auth.users(id) on delete cascade,
  key text not null,
  value jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, key)
);

-- Row level security: the same policy on every owned table.
do $$
declare t text;
begin
  foreach t in array array['manga','chapter','page','category','history','page_translation','preference'] loop
    execute format('alter table %I enable row level security', t);
    execute format('create policy owner_all on %I for all using (user_id = auth.uid()) with check (user_id = auth.uid())', t);
  end loop;
end $$;

alter table manga_category enable row level security;
create policy owner_all on manga_category for all
  using (exists (select 1 from manga m where m.id = manga_id and m.user_id = auth.uid()))
  with check (exists (select 1 from manga m where m.id = manga_id and m.user_id = auth.uid()));
