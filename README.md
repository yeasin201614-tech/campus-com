# Campus.com — Connect • Collaborate • Grow

A production-ready, multi-university campus community, academic operations, and institutional SaaS platform built with **Next.js (App Router)**, **Supabase (PostgreSQL + Auth + Storage + Realtime + Edge Functions)**, and **React Native + Expo**.

## Architecture

```
campus-com/
├── packages/shared/       # Shared TypeScript database types, RBAC matrix, Zod validation, brand tokens
├── supabase/
│   ├── migrations/        # 7 PostgreSQL migrations (all 29 tables, triggers, indexes, RLS, storage, realtime)
│   ├── seed.sql           # Subscription plans, marketplace categories, CMS pages, sample universities & depts
│   └── functions/         # Supabase Edge Functions (check-in-event, global-search, admin-manage-user, billing-webhook)
├── apps/web/              # Next.js App Router website, Student/Faculty/University Portal & 20-module Super Admin
└── apps/mobile/           # Expo React Native iOS & Android application
```

## Quick Start

### 1. Configure Supabase
1. Create a project at [supabase.com](https://supabase.com).
2. Run the SQL migrations in `supabase/migrations/` in numeric order (`0001` through `0007`), then run `supabase/seed.sql`.
3. Deploy Edge Functions (`check-in-event`, `global-search`, `admin-manage-user`, `billing-webhook`) via `supabase functions deploy`.
4. Copy `apps/web/.env.example` to `apps/web/.env.local` and fill in:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (server-only)
5. Copy `apps/mobile/.env.example` to `apps/mobile/.env` and fill in `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`.

### 2. Install & Run Locally
```bash
npm install
npm run typecheck
npm run dev:web
```

To promote an initial Super Admin after signing up:
```sql
UPDATE public.profiles SET global_role = 'super_admin', is_verified = true WHERE email = 'admin@campus.com';
```

### 3. Build & Deploy
- **Web (Vercel):** Set root directory to `apps/web`, build command `npm run build`, and configure environment variables.
- **Mobile (Expo EAS):** Inside `apps/mobile`, run `eas build --platform all --profile production`.
