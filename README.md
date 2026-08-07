# Razd

Mobile-first personal finance tracker — balances across multiple accounts, transactions,
and monthly spending by category. Next.js 16 + Supabase.

On a phone it reads as a native iOS app, with a frosted-glass bottom tab bar. On a laptop
it renders as a centered phone-shaped column rather than a stretched web page.

## Setup

1. `npm install`
2. Copy `.env.example` to `.env` and fill in your Supabase project values.
3. Apply `supabase/migrations/0001_init.sql` to your Supabase project (dashboard SQL
   editor, `supabase db push`, or `psql`).
4. `npm run dev`

### Email confirmation

Supabase requires email confirmation by default, so a new signup gets no session until
the emailed link is clicked. For local development and for the end-to-end tests, turn it
off under **Authentication → Providers → Email → Confirm email**. Leave it **on** in
production.

## Scripts

| Command | Does |
|---|---|
| `npm run dev` | Development server |
| `npm test` | Unit and component tests (Vitest) |
| `npm run test:e2e` | End-to-end tests (Playwright) |
| `npm run build` | Production build |

## Architecture

Server Components read from Supabase through a cookie-bound client, so the first paint
already contains data. Every write goes through a Server Action that validates with Zod
and revalidates the affected routes. There is no client state library and no API routes.

**Balances are never stored.** The `account_balances` view derives each account's balance
from its `opening_balance` plus the signed sum of its transactions. The home screen's
headline total and its per-account breakdown come from that one query, so they cannot
disagree, and no trigger or reconcile job can leave a stale number behind.

Row Level Security is enabled on every table with `user_id = auth.uid()` policies, so a
user's rows are isolated in the database rather than by application code. The view is
declared `security_invoker`, which keeps those policies in force when reading through it.

```
app/(auth)/     login, signup — no navbar
app/(app)/      home, accounts, add, stats, profile, transactions — phone frame + navbar
components/     shared UI (bottom nav, sheet, balance card, transaction row)
lib/queries/    server-side reads, one module per concern
lib/            formatting, money arithmetic, Zod schemas, types
supabase/       SQL migrations
e2e/            Playwright specs
```

## Notes

- All amounts are INR, formatted with `en-IN` grouping (₹1,23,456.00).
- Money is added in integer paise via `lib/money.ts` — never sum rupee floats directly.
- `amount` is always positive; `kind` (`income`/`expense`) carries the sign.
