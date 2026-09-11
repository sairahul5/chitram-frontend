# Chitram Frontend

Independent Next.js frontend foundation for Chitram. The frontend uses the App Router, TypeScript, Tailwind CSS, and ESLint.

## Development

Install dependencies and start the development server from this directory:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Set `NEXT_PUBLIC_API_URL` in `.env.local` when connecting to the Spring Boot backend. The example value is available in `.env.example`.

The frontend communicates with Spring Boot through `src/lib/apiClient.ts`. It does not connect directly to PostgreSQL or Supabase.
