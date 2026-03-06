# Supabase setup for Friends feature

If the app shows:

- `Could not find the table 'public.profiles' in the schema cache`
- or similar schema-cache / missing-table errors on `/friends`

the Friends DB migration has not been applied to your Supabase project yet.

## 1) Link your Supabase project (once)

```bash
cd site
supabase link --project-ref <your-project-ref>
```

## 2) Apply migrations

```bash
cd site
supabase db push
```

This applies:

- `profiles` (with `friend_code`, `friends_visibility`)
- `friends`
- `user_schedules`
- RLS policies and helper triggers/functions

Migration file:

- `supabase/migrations/202603050001_friends_feature.sql`

## 3) Regenerate TypeScript DB types (recommended)

```bash
cd site
supabase gen types typescript --project-id <your-project-ref> --schema public > src/lib/supabase.generated.ts
```

Then import those generated types in data-access modules as needed.

## 4) Restart dev server

```bash
cd site
npm run dev
```

## Notes

- Until migration is applied, `/friends` will show a friendly setup message instead of raw PostgREST errors.
- Existing auth users get profile rows lazily through app code (`ensureUserProfile`) when they open friends/profile pages.
