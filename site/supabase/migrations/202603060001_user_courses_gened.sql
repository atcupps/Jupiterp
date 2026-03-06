-- User course history for profile Gen Ed progress views.
-- Safe to run multiple times in development environments.

create extension if not exists pgcrypto;

create table if not exists public.user_courses (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles(id) on delete cascade,
    course_id text not null,
    course_title text not null,
    term_code text not null,
    gen_ed_tags text[] not null default '{}',
    grade text,
    is_completed boolean not null default true,
    is_outside_major boolean,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

alter table public.user_courses
    add column if not exists course_title text;
alter table public.user_courses
    add column if not exists grade text;
alter table public.user_courses
    add column if not exists is_completed boolean default true;
alter table public.user_courses
    add column if not exists is_outside_major boolean;
alter table public.user_courses
    add column if not exists created_at timestamptz default now();
alter table public.user_courses
    add column if not exists updated_at timestamptz default now();

update public.user_courses
set course_title = coalesce(course_title, course_id)
where course_title is null;

update public.user_courses
set is_completed = true
where is_completed is null;

alter table public.user_courses
    alter column course_title set not null;
alter table public.user_courses
    alter column is_completed set not null;
alter table public.user_courses
    alter column is_completed set default true;

create index if not exists user_courses_user_id_idx
    on public.user_courses(user_id);

create index if not exists user_courses_term_code_idx
    on public.user_courses(term_code);

create index if not exists user_courses_completed_idx
    on public.user_courses(user_id, is_completed);

create index if not exists user_courses_gen_ed_tags_gin_idx
    on public.user_courses using gin(gen_ed_tags);

drop trigger if exists user_courses_touch_updated_at on public.user_courses;
create trigger user_courses_touch_updated_at
before update on public.user_courses
for each row
execute procedure public.touch_updated_at();

alter table public.user_courses enable row level security;

drop policy if exists user_courses_select_own on public.user_courses;
create policy user_courses_select_own
on public.user_courses
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists user_courses_insert_own on public.user_courses;
create policy user_courses_insert_own
on public.user_courses
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists user_courses_update_own on public.user_courses;
create policy user_courses_update_own
on public.user_courses
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists user_courses_delete_own on public.user_courses;
create policy user_courses_delete_own
on public.user_courses
for delete
to authenticated
using (user_id = auth.uid());
