# Jupiterp

Jupiterp is a website built to help students at the University of Maryland plan their schedules and make informed decisions about their course and section selections. Jupiterp provides a course planner that allows students to search for courses, see sections complete with professor reviews from [PlanetTerp](https://planetterp.com), and visualize their course schedule.

This repository is for the main Jupiterp site, which is built with SvelteKit and TypeScript. In addition to this repository, other components of Jupiterp can be found in the [jupiterp-umd](https://github.com/jupiterp-umd) GitHub group, including:
- The [Jupiterp API](http://api.jupiterp.com/), an open-source API for getting course data
- The Jupiterp web-scraper, which collects course information to be used in the site
- The [@jupiterp/jupiterp](https://www.npmjs.com/package/@jupiterp/jupiterp/) npm package, which provides a TS interface wrapping the Jupiterp API

Jupiterp is not officially affiliated with the University of Maryland; it is primarily managed and maintained by @atcupps. Contact admin@jupiterp.com for any inquiries.

For more information on Jupiterp and on contributing to this project please see `CONTRIBUTING.md`. Otherwise, see the instructions below to learn how to work on this project.

## Getting Started

### Prerequisite Installations

Before working on Jupiterp, make sure your computer has installed [Node.js](https://nodejs.org/en/download) and can use the Node Package Manager (npm). After cloning the repository, navigate to the `/site` folder and run `npm i` to install all dependencies.

#### Site

To test the site, navigate to the `site` folder. Use `npm run dev` to run the site locally, then use a browser to navigate to http://localhost:5173/.

### Optional: Supabase Auth + Cloud Schedules

The site now supports user sign-in (Email magic link + Google OAuth) and per-user schedule sync when Supabase is configured.

1. In `site/.env`, add:

```bash
PUBLIC_SUPABASE_URL=your_supabase_project_url
PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

2. In Supabase SQL editor, create the schedule table and enable row-level security:

```sql
create table if not exists public.user_schedules (
	user_id uuid primary key references auth.users(id) on delete cascade,
	schedules jsonb not null,
	updated_at timestamptz not null default now()
);

alter table public.user_schedules enable row level security;

create policy "users can read own schedules"
on public.user_schedules
for select
using (auth.uid() = user_id);

create policy "users can insert own schedules"
on public.user_schedules
for insert
with check (auth.uid() = user_id);

create policy "users can update own schedules"
on public.user_schedules
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
```

3. In Supabase Auth providers, enable:
	 - Email
	 - Google (with OAuth credentials and redirect URL to your site origin)

## Contributing

See `CONTRIBUTING.md` to view instructions on the collaborative development process for Jupiterp.