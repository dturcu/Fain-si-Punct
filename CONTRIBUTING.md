# Contributing to Fain si Punct

## Development Setup

1. Clone the repo and install dependencies:
   ```bash
   git clone https://github.com/dturcu/Fain-si-Punct.git
   cd Fain-si-Punct
   npm install
   ```

2. Copy `.env.example` to `.env.local` and fill in your credentials.

3. Run the database schema:
   - `supabase/schema.sql` — table definitions
   - `supabase/checkout.sql` — transactional checkout function
   - `supabase/rls-policies.sql` — Row Level Security policies

4. Start the dev server:
   ```bash
   npm run dev
   ```

## Code Standards

- JavaScript (ES modules) with incremental TypeScript adoption.
- ESLint with Next.js config (`npm run lint`).
- Jest for testing (`npm test`).

## TypeScript

The repo is bootstrapped with TypeScript in `allowJs` mode. Existing `.js` files
keep working unchanged; new code should prefer `.ts`/`.tsx`.

- **New files:** write in `.ts` / `.tsx`. Use `@/…` path aliases (defined in `tsconfig.json`).
- **Existing `.js` files:** converted opportunistically as they're touched — don't do mass rewrites. Runtime behavior must stay byte-for-byte identical; types only.
- **Per-file strictness:** add `// @ts-check` at the top of a `.js` file to opt into type-checking without renaming. `checkJs` and `strict` are off globally by design — they'll be tightened in future PRs.
- **Before a PR:** run `npm run typecheck` (alias for `tsc --noEmit`). Zero type errors is the bar.
- **Supabase types:** regenerate with `npm run types:supabase` (requires the Supabase CLI linked to the project). The generated file lives at `types/supabase.ts` and is currently a placeholder.

## Branch Naming

- `feat/<description>` for features
- `fix/<description>` for bug fixes
- `docs/<description>` for documentation

## Pull Request Process

1. Create a feature branch from `main`
2. Make your changes
3. Ensure `npm run lint`, `npm test`, and `npm run build` pass
4. Open a PR against `main`
5. CI must pass before merge

## Project Structure

See `ARCHITECTURE.md` for system overview and `README.md` for setup.
