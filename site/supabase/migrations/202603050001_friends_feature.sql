-- Friends feature schema additions for Jupiterp
-- Safe to run multiple times in development environments.

create extension if not exists pgcrypto;

create or replace function public.generate_friend_code()
returns text
language plpgsql
as $$
declare
    chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    result text := '';
    i integer;
begin
    for i in 1..8 loop
        result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    end loop;
    return result;
end;
$$;

create or replace function public.generate_unique_friend_code()
returns text
language plpgsql
as $$
declare
    candidate text;
begin
    loop
        candidate := public.generate_friend_code();
        exit when not exists (
            select 1 from public.profiles where friend_code = candidate
        );
    end loop;
    return candidate;
end;
$$;

create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    email text unique,
    display_name text,
    friend_code text unique not null default public.generate_unique_friend_code(),
    friends_visibility text not null default 'full'
        check (friends_visibility in ('full', 'busy_free', 'off')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

alter table public.profiles
    add column if not exists email text;
alter table public.profiles
    add column if not exists display_name text;
alter table public.profiles
    add column if not exists friend_code text;
alter table public.profiles
    add column if not exists friends_visibility text;
alter table public.profiles
    add column if not exists created_at timestamptz default now();
alter table public.profiles
    add column if not exists updated_at timestamptz default now();

update public.profiles
set friend_code = public.generate_unique_friend_code()
where friend_code is null or length(friend_code) = 0;

update public.profiles
set friends_visibility = 'full'
where friends_visibility is null;

alter table public.profiles
    alter column friend_code set not null;
alter table public.profiles
    alter column friend_code set default public.generate_unique_friend_code();
alter table public.profiles
    alter column friends_visibility set not null;
alter table public.profiles
    alter column friends_visibility set default 'full';

create unique index if not exists profiles_friend_code_key
    on public.profiles(friend_code);

create table if not exists public.friends (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles(id) on delete cascade,
    friend_id uuid not null references public.profiles(id) on delete cascade,
    status text not null check (status in ('pending', 'accepted')),
    visibility text not null default 'full'
        check (visibility in ('full', 'busy_free', 'off')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint friends_user_friend_unique unique(user_id, friend_id),
    constraint friends_no_self check (user_id <> friend_id)
);

create unique index if not exists friends_pending_pair_unique
    on public.friends(
        least(user_id::text, friend_id::text),
        greatest(user_id::text, friend_id::text)
    )
    where status = 'pending';

create table if not exists public.user_schedules (
    user_id uuid primary key references public.profiles(id) on delete cascade,
    schedules jsonb not null,
    updated_at timestamptz not null default now()
);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
before update on public.profiles
for each row
execute procedure public.touch_updated_at();

drop trigger if exists friends_touch_updated_at on public.friends;
create trigger friends_touch_updated_at
before update on public.friends
for each row
execute procedure public.touch_updated_at();

alter table public.profiles enable row level security;
alter table public.friends enable row level security;
alter table public.user_schedules enable row level security;

drop policy if exists profiles_select_authenticated on public.profiles;
create policy profiles_select_authenticated
on public.profiles
for select
to authenticated
using (true);

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own
on public.profiles
for insert
to authenticated
with check (id = auth.uid());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists friends_select_involved on public.friends;
create policy friends_select_involved
on public.friends
for select
to authenticated
using (user_id = auth.uid() or friend_id = auth.uid());

drop policy if exists friends_insert_self on public.friends;
create policy friends_insert_self
on public.friends
for insert
to authenticated
with check (user_id = auth.uid() and friend_id <> auth.uid());

drop policy if exists friends_update_involved on public.friends;
create policy friends_update_involved
on public.friends
for update
to authenticated
using (user_id = auth.uid() or friend_id = auth.uid())
with check (user_id = auth.uid() or friend_id = auth.uid());

drop policy if exists friends_delete_involved on public.friends;
create policy friends_delete_involved
on public.friends
for delete
to authenticated
using (user_id = auth.uid() or friend_id = auth.uid());

drop policy if exists user_schedules_select_own on public.user_schedules;
create policy user_schedules_select_own
on public.user_schedules
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists user_schedules_upsert_own on public.user_schedules;
create policy user_schedules_upsert_own
on public.user_schedules
for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());
