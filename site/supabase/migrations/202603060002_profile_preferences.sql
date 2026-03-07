-- Profile preference fields for degree planning.
-- Safe to run multiple times in development environments.

alter table public.profiles
    add column if not exists degree_type text default 'Undergraduate';
alter table public.profiles
    add column if not exists majors text[] default '{}';
alter table public.profiles
    add column if not exists minors text[] default '{}';
alter table public.profiles
    add column if not exists graduation_year integer;

update public.profiles
set degree_type = 'Undergraduate'
where degree_type is null;

update public.profiles
set majors = '{}'
where majors is null;

update public.profiles
set minors = '{}'
where minors is null;

alter table public.profiles
    alter column degree_type set default 'Undergraduate';
alter table public.profiles
    alter column majors set default '{}';
alter table public.profiles
    alter column minors set default '{}';

alter table public.profiles
    drop constraint if exists profiles_degree_type_check;

alter table public.profiles
    add constraint profiles_degree_type_check
    check (degree_type in (
        'Undergraduate',
        'Dual-Degree',
        'Double Major',
        'Masters',
        'P.H.D.'
    ));
