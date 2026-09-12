# Chitram Frontend

Chitram's frontend is a Next.js App Router application using TypeScript, React, Tailwind CSS, and ESLint.

## Repositories

- Parent repository: `https://github.com/sairahul5/Chitram`
- Frontend repository: `https://github.com/sairahul5/chitram-frontend`
- Backend repository: `https://github.com/sairahul5/chitram-backend`
- Deployed frontend: `https://chitram-frontend.vercel.app`
- Deployed backend: `https://chitram-backend-og9p.onrender.com`

The parent repository tracks `frontend` and `backend` as Git submodules. Commit component changes in the matching submodule first, then update the parent pointer.

## Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

For local development, create `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```

For Vercel, set:

```env
NEXT_PUBLIC_API_URL=https://chitram-backend-og9p.onrender.com/api
```

The production fallback also points to the Render backend, but configuring the Vercel variable explicitly is recommended.

## Frontend Responsibilities

The browser communicates only with Spring Boot through `src/lib/apiClient.ts`. It does not connect directly to PostgreSQL or Supabase.

Implemented areas include:

- Public chronological visual feed with search, categories, pagination, likes, saves, and uploads.
- Optional personalized recommendations with public-feed fallback.
- Admin dashboard, real database tables, users, pin moderation, reports, categories, platform settings, recommendation switch, and admin activity.
- Google sign-in flow started through the deployed Spring Boot backend.
- Admin WebSocket updates for dashboard, users, and pin activity.
- Global error boundary and API error messages.

## Important API Paths

- `GET /api/visual-items/feed`
- `GET /api/auth/session`
- `GET /api/recommendations/status`
- `GET /api/admin/dashboard`
- `GET /api/admin/users`
- `GET /api/admin/settings/platform`
- `GET /api/admin/settings/recommendations`
- `GET /api/admin/categories`
- `GET /api/admin/reports`

All protected operations use the backend session cookie. Do not put database credentials or Supabase service-role keys in frontend environment variables.

## Validation

```bash
npm run lint
npm run build
```
