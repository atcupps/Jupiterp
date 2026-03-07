-- Profile privacy levels shared between Profile and Settings pages.
-- Safe to run multiple times in development environments.

alter table public.profiles
    add column if not exists profile_privacy text default 'friends_only';

update public.profiles
set profile_privacy = 'friends_only'
where profile_privacy is null;

alter table public.profiles
    alter column profile_privacy set default 'friends_only';

alter table public.profiles
    drop constraint if exists profiles_profile_privacy_check;

alter table public.profiles
    add constraint profiles_profile_privacy_check
    check (profile_privacy in (
        'public',
        'friends_only',
        'umd_only',
        'private'
    ));
