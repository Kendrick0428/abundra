# Abundra

Courses, community, and teaching tools for pastors, coaches, and schools. Each customer gets a private workspace.

## What works today (Phase 1 and 2)

- Accounts: sign up, sign in, email confirmation
- Workspaces: create one, set its name, brand color, and logo
- Invite links: students join a workspace at `/join/<workspace-address>`
- Roles: owner, admin, instructor, student
- Courses: modules, lessons with YouTube, Vimeo, or video-file links, lesson text, free previews, scheduled unlocking ("drip"), draft and published states
- Students: free enrollment, lesson player, mark complete, progress tracking
- Community: posts, comments, pinning, deleting

Coming next: payments (Stripe Connect), certificates, email, AI agents.

## Technology

- Next.js 14 (App Router), Tailwind CSS
- Supabase: database, logins, row-level security that keeps each workspace's data private
- Database project: `Abundra` (qpvqvtaerqpafgbqdqjm), US East

## Environment variables

Both values are public by design (they are sent to every visitor's browser). Security comes from the database's row-level security rules, not from hiding these.

```
NEXT_PUBLIC_SUPABASE_URL=https://qpvqvtaerqpafgbqdqjm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=(see .env.example)
```

Never put the Supabase **service role** key in this project or in any `NEXT_PUBLIC_` variable.

## Run it on your own computer

```
npm install
cp .env.example .env.local
npm run dev
```

Then open http://localhost:3000
