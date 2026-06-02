-- Migration: Create content_articles table for wisdom and advisory content.
-- This supports elder/expert/official articles and content operations.

create table if not exists public.content_articles (
  id bigint generated always as identity primary key,
  slug text unique,
  title text not null,
  summary text,
  body text not null,
  type text not null check (type in ('text', 'audio', 'video', 'card')),
  source text not null check (source in ('elder', 'expert', 'official')),
  status text not null default 'draft' check (status in ('draft', 'pending_review', 'published', 'archived')),
  author_id bigint,
  author_name text not null,
  location text,
  season text not null default 'any' check (season in ('winter', 'spring', 'summer', 'autumn', 'any')),
  species text[] not null default array['all']::text[],
  metadata jsonb not null default '{}'::jsonb,
  views integer not null default 0,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists content_articles_source_idx on public.content_articles (source);
create index if not exists content_articles_status_idx on public.content_articles (status);
create index if not exists content_articles_season_idx on public.content_articles (season);
create index if not exists content_articles_published_at_idx on public.content_articles (published_at);

create or replace function public.trigger_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger content_articles_set_updated_at
  before update on public.content_articles
  for each row execute function public.trigger_set_updated_at();
