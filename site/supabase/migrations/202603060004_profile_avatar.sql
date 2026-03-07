-- Profile avatar fields and storage bucket metadata.
-- Safe to run multiple times.

alter table public.profiles
    add column if not exists avatar_url text;

alter table public.profiles
    add column if not exists avatar_color text default '#b90e25';

update public.profiles
set avatar_color = '#b90e25'
where avatar_color is null or length(trim(avatar_color)) = 0;

alter table public.profiles
    alter column avatar_color set default '#b90e25';

insert into storage.buckets (id, name, public)
values ('profile-avatars', 'profile-avatars', true)
on conflict (id) do nothing;

drop policy if exists profile_avatars_public_read on storage.objects;
create policy profile_avatars_public_read
on storage.objects
for select
to public
using (bucket_id = 'profile-avatars');

drop policy if exists profile_avatars_authenticated_insert on storage.objects;
create policy profile_avatars_authenticated_insert
on storage.objects
for insert
to authenticated
with check (
    bucket_id = 'profile-avatars'
    and name like auth.uid()::text || '/%'
);

drop policy if exists profile_avatars_authenticated_update on storage.objects;
create policy profile_avatars_authenticated_update
on storage.objects
for update
to authenticated
using (
    bucket_id = 'profile-avatars'
    and name like auth.uid()::text || '/%'
)
with check (
    bucket_id = 'profile-avatars'
    and name like auth.uid()::text || '/%'
);
