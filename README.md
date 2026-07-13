# Just Try Media

Premium media hub for Just Try Media with a public site, admin dashboard, Supabase-backed content, events, applications, and collaboration requests.

## Run locally

```sh
npm install
npm run dev
```

## Supabase

1. Apply `supabase/migrations/001_media_hub.sql` in your Supabase SQL editor.
2. Add the values from `.env.example` to your local `.env` and Vercel environment variables.
3. Create an auth user in Supabase, then insert that user's ID into `admin_profiles` to unlock admin writes.

The public site shows polished coming-soon content if Supabase has no published content yet.
