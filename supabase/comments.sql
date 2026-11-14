-- Выполнить в Supabase SQL Editor для общей ленты комментариев.
create table if not exists public.comments (
  id bigint generated always as identity primary key,
  article_slug text not null,
  nickname text not null check (char_length(nickname) between 2 and 24),
  body text not null check (char_length(body) between 1 and 1500),
  created_at timestamptz not null default now()
);

alter table public.comments enable row level security;

drop policy if exists "Anyone can read comments" on public.comments;
create policy "Anyone can read comments"
on public.comments for select
to anon, authenticated
using (true);

drop policy if exists "Anyone can post comments" on public.comments;
create policy "Anyone can post comments"
on public.comments for insert
to anon, authenticated
with check (
  char_length(article_slug) between 1 and 80
  and char_length(nickname) between 2 and 24
  and char_length(body) between 1 and 1500
);

-- Публичный клиент не получает прав UPDATE/DELETE.
grant select, insert on public.comments to anon, authenticated;
grant usage, select on sequence public.comments_id_seq to anon, authenticated;
