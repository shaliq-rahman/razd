# Razd Finance App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a mobile-first personal finance web app where a signed-in user tracks balances across multiple accounts, logs transactions, and sees spending by category.

**Architecture:** Next.js 15 App Router with Supabase Postgres + Auth. Server Components read data directly through a cookie-bound Supabase client; Server Actions perform writes and revalidate. Account balances are never stored — they are derived in a Postgres view from `opening_balance` plus signed transactions, so the home total and the per-account breakdown come from one query and cannot disagree. Row Level Security isolates every user's rows in the database.

**Tech Stack:** Next.js 15 (App Router, TypeScript), Tailwind CSS v4, `@supabase/ssr`, `@supabase/supabase-js`, Zod, Vitest + Testing Library, Playwright.

## Global Constraints

- Node 20+. Next.js 15 App Router only — no Pages Router, no API routes; writes go through Server Actions.
- Currency is INR everywhere. Format with `Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' })`. Never hand-roll grouping.
- `SUPABASE_SECRET_KEY` and `DATABASE_PASSWORD` must never be imported by application code or prefixed with `NEXT_PUBLIC_`. Only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` may reach the browser.
- Every table has `user_id uuid not null references auth.users(id) on delete cascade`, RLS enabled, and one policy per operation using `user_id = auth.uid()`. No table ships without RLS.
- Money columns are `numeric(14,2)`. `amount` is always positive; `kind` (`'income'` | `'expense'`) carries the sign. Never store a negative amount.
- App frame is `max-width: 480px`, centered. Layout must be fluid from 320px upward. No fixed pixel heights on content containers.
- Bottom navbar uses `backdrop-filter` with an opaque `@supports not` fallback, and clears the iOS home indicator via `env(safe-area-inset-bottom)`.
- Tab order is fixed: Home / Accounts / Add (raised center) / Stats / Profile.
- Commit after every task. Never commit `.env`.

---

## File Structure

```
.env.example                      placeholder env values (committed)
.gitignore                        ignores .env*, node_modules, .next
middleware.ts                     session refresh + route protection

lib/
  supabase/client.ts              browser client
  supabase/server.ts              cookie-bound server client
  supabase/middleware.ts          session refresh helper
  format.ts                       INR currency + date formatting
  money.ts                        drift-free rupee addition (pure; client and server)
  schemas.ts                      Zod schemas for all forms
  types.ts                        DB row types

supabase/migrations/
  0001_init.sql                   tables, RLS, view, signup trigger

app/
  layout.tsx                      root html, fonts, viewport-fit=cover
  globals.css                     Tailwind + glass tokens
  (auth)/layout.tsx               centered card frame
  (auth)/login/page.tsx
  (auth)/signup/page.tsx
  (auth)/actions.ts               signIn, signUp, signOut
  auth/callback/route.ts          email confirmation exchange
  (app)/layout.tsx                phone frame + BottomNav
  (app)/page.tsx                  Home
  (app)/accounts/page.tsx
  (app)/accounts/actions.ts
  (app)/transactions/page.tsx
  (app)/add/page.tsx
  (app)/add/actions.ts
  (app)/stats/page.tsx
  (app)/profile/page.tsx
  (app)/profile/actions.ts

components/
  bottom-nav.tsx                  glass tab bar
  sheet.tsx                       bottom sheet primitive
  balance-card.tsx                home hero + info trigger
  account-breakdown-sheet.tsx     per-account balances
  amount.tsx                      formatted signed amount
  submit-button.tsx               pending-aware submit
  empty-state.tsx

lib/queries/
  balances.ts                     account_balances reads
  transactions.ts                 transaction reads
  stats.ts                        monthly category aggregation

e2e/
  money-flow.spec.ts              Playwright: signup → accounts → expense → total
playwright.config.ts
```

Query functions live in `lib/queries/` so Server Components stay presentational and the same query can be unit-tested and reused by two screens.

---

### Task 1: Scaffold project, git, and environment

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `app/layout.tsx`, `app/globals.css`, `.gitignore`, `.env.example`, `vitest.config.ts`
- Modify: none

**Interfaces:**
- Consumes: nothing
- Produces: a running Next.js dev server; `npm test` wired to Vitest

- [ ] **Step 1: Scaffold Next.js in the existing directory**

```bash
cd /Users/apple/Documents/PP/Razd
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*" --eslint --use-npm
```

Answer "yes" if it asks to proceed in a non-empty directory. It will not delete `.env` or `docs/`.

- [ ] **Step 2: Write `.gitignore` additions before anything is committed**

Confirm `.gitignore` contains these lines; add any that are missing:

```
.env
.env.local
.env*.local
node_modules
.next
/playwright-report
/test-results
```

- [ ] **Step 3: Verify `.env` is ignored**

Run: `git check-ignore -v .env`
Expected: a line naming `.gitignore` and the `.env` rule. If it prints nothing, `.env` is NOT ignored — fix `.gitignore` before continuing.

- [ ] **Step 4: Create `.env.example`**

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx
SUPABASE_SECRET_KEY=sb_secret_xxx
```

- [ ] **Step 5: Add the browser-safe variable names to `.env`**

The existing `.env` uses `SUPABASE_URL` / `SUPABASE_PUBLISHABLE_KEY`, which Next.js will not expose to the browser. Append these two lines to `.env`, copying the values from the existing keys:

```
NEXT_PUBLIC_SUPABASE_URL=<value of SUPABASE_URL>
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<value of SUPABASE_PUBLISHABLE_KEY>
```

- [ ] **Step 6: Install runtime and test dependencies**

```bash
npm install @supabase/supabase-js @supabase/ssr zod
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

- [ ] **Step 7: Create `vitest.config.ts`**

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
    exclude: ['**/node_modules/**', '**/e2e/**'],
  },
  resolve: { alias: { '@': path.resolve(__dirname, '.') } },
})
```

- [ ] **Step 8: Create `vitest.setup.ts`**

```typescript
import '@testing-library/jest-dom/vitest'
```

- [ ] **Step 9: Add the test script to `package.json`**

In the `"scripts"` block, add:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 10: Verify the app boots**

Run: `npm run dev`
Expected: server starts, `http://localhost:3000` renders the Next.js starter page. Stop it with Ctrl-C.

- [ ] **Step 11: Verify the test runner boots**

Run: `npm test`
Expected: exits successfully reporting "No test files found" (this is the expected state — no tests exist yet).

- [ ] **Step 12: Commit**

```bash
git init
git add -A
git status --short | grep -E '^\S+\s+\.env$' && echo "STOP: .env is staged" && exit 1
git commit -m "chore: scaffold Next.js app with Tailwind, Supabase deps, and Vitest"
```

---

### Task 2: Currency, money arithmetic, and date formatting

**Files:**
- Create: `lib/format.ts`, `lib/money.ts`
- Test: `lib/format.test.ts`, `lib/money.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces: `formatINR(amount: number): string`, `formatSignedINR(amount: number, kind: 'income' | 'expense'): string`, `formatDayLabel(iso: string, today?: Date): string`, `sumAmounts(values: number[]): number`

`lib/money.ts` is a pure module with no server imports, so both Server Components and
Client Components can use it. Every place that adds rupee amounts must call `sumAmounts`
rather than hand-rolling a reduce — float addition on paise drifts.

- [ ] **Step 1: Write the failing tests**

Create `lib/format.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { formatINR, formatSignedINR, formatDayLabel } from './format'

describe('formatINR', () => {
  it('formats with Indian digit grouping', () => {
    expect(formatINR(123456)).toBe('₹1,23,456.00')
  })

  it('formats a value above one crore', () => {
    expect(formatINR(12345678.5)).toBe('₹1,23,45,678.50')
  })

  it('formats zero', () => {
    expect(formatINR(0)).toBe('₹0.00')
  })

  it('formats a negative total with the sign before the symbol', () => {
    expect(formatINR(-2500)).toBe('-₹2,500.00')
  })

  it('rounds to two decimal places', () => {
    expect(formatINR(99.999)).toBe('₹100.00')
  })
})

describe('formatSignedINR', () => {
  it('prefixes income with a plus', () => {
    expect(formatSignedINR(500, 'income')).toBe('+₹500.00')
  })

  it('prefixes expense with a minus', () => {
    expect(formatSignedINR(500, 'expense')).toBe('-₹500.00')
  })
})

describe('formatDayLabel', () => {
  const today = new Date('2026-08-07T10:00:00')

  it('labels today', () => {
    expect(formatDayLabel('2026-08-07', today)).toBe('Today')
  })

  it('labels yesterday', () => {
    expect(formatDayLabel('2026-08-06', today)).toBe('Yesterday')
  })

  it('formats older dates as day and month', () => {
    expect(formatDayLabel('2026-07-30', today)).toBe('30 Jul 2026')
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run lib/format.test.ts`
Expected: FAIL — cannot resolve `./format`.

- [ ] **Step 3: Implement `lib/format.ts`**

```typescript
const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

/** Formats a rupee amount with Indian digit grouping, e.g. ₹1,23,456.00 */
export function formatINR(amount: number): string {
  return inr.format(amount)
}

/** Formats a positive amount with an explicit +/- based on transaction kind. */
export function formatSignedINR(amount: number, kind: 'income' | 'expense'): string {
  const sign = kind === 'income' ? '+' : '-'
  return `${sign}${inr.format(Math.abs(amount))}`
}

const dayMonth = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

function toLocalMidnight(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** Returns "Today", "Yesterday", or "30 Jul 2026" for a YYYY-MM-DD date string. */
export function formatDayLabel(iso: string, today: Date = new Date()): string {
  const date = toLocalMidnight(iso)
  const ref = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const dayMs = 86_400_000
  const diff = Math.round((ref.getTime() - date.getTime()) / dayMs)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  return dayMonth.format(date)
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run lib/format.test.ts`
Expected: 10 passing.

If `formatINR(-2500)` produces `₹-2,500.00` instead of `-₹2,500.00` on this Node version, add `signDisplay: 'auto'` and normalise in the function rather than changing the expected value — the minus must precede the symbol.

- [ ] **Step 5: Write the failing money-arithmetic tests**

`lib/money.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { sumAmounts } from './money'

describe('sumAmounts', () => {
  it('returns zero for an empty list', () => {
    expect(sumAmounts([])).toBe(0)
  })

  it('adds whole rupee amounts', () => {
    expect(sumAmounts([1500, 2500])).toBe(4000)
  })

  it('handles negative amounts such as an overdrawn card', () => {
    expect(sumAmounts([5000, -1200])).toBe(3800)
  })

  it('avoids floating point drift on paise', () => {
    expect(sumAmounts([0.1, 0.2])).toBe(0.3)
  })

  it('avoids drift across many fractional amounts', () => {
    expect(sumAmounts(Array(10).fill(0.1))).toBe(1)
  })
})
```

- [ ] **Step 6: Run the tests to verify they fail**

Run: `npx vitest run lib/money.test.ts`
Expected: FAIL — cannot resolve `./money`.

- [ ] **Step 7: Implement `lib/money.ts`**

```typescript
/**
 * Adds rupee amounts in integer paise so repeated float addition cannot drift.
 * Every total shown in the UI goes through this.
 */
export function sumAmounts(values: number[]): number {
  const paise = values.reduce((acc, v) => acc + Math.round(v * 100), 0)
  return paise / 100
}
```

- [ ] **Step 8: Run the tests to verify they pass**

Run: `npx vitest run lib/money.test.ts`
Expected: 5 passing.

- [ ] **Step 9: Commit**

```bash
git add lib/format.ts lib/format.test.ts lib/money.ts lib/money.test.ts
git commit -m "feat: add INR formatting and drift-free money arithmetic"
```

---

### Task 3: Database schema, RLS, balance view, and signup trigger

**Files:**
- Create: `supabase/migrations/0001_init.sql`
- Create: `lib/types.ts`

**Interfaces:**
- Consumes: nothing
- Produces: tables `profiles`, `accounts`, `categories`, `transactions`; view `account_balances` with an added `balance` column; TypeScript types `Account`, `Category`, `Transaction`, `AccountBalance`, `Profile`

- [ ] **Step 1: Write the migration**

Create `supabase/migrations/0001_init.sql`:

```sql
-- Profiles ------------------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  currency text not null default 'INR',
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "profiles are self-readable" on profiles
  for select using (id = auth.uid());
create policy "profiles are self-writable" on profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- Accounts ------------------------------------------------------------------
create table accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null check (type in ('bank','cash','card','wallet','investment')),
  opening_balance numeric(14,2) not null default 0,
  color text not null default '#5B8DEF',
  is_archived boolean not null default false,
  created_at timestamptz not null default now()
);

create index accounts_user_idx on accounts (user_id);
alter table accounts enable row level security;

create policy "accounts select own" on accounts
  for select using (user_id = auth.uid());
create policy "accounts insert own" on accounts
  for insert with check (user_id = auth.uid());
create policy "accounts update own" on accounts
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "accounts delete own" on accounts
  for delete using (user_id = auth.uid());

-- Categories ----------------------------------------------------------------
create table categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  icon text not null default '📦',
  kind text not null check (kind in ('income','expense')),
  is_default boolean not null default false,
  unique (user_id, name, kind)
);

create index categories_user_idx on categories (user_id);
alter table categories enable row level security;

create policy "categories select own" on categories
  for select using (user_id = auth.uid());
create policy "categories insert own" on categories
  for insert with check (user_id = auth.uid());
create policy "categories update own" on categories
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "categories delete own" on categories
  for delete using (user_id = auth.uid());

-- Transactions --------------------------------------------------------------
create table transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid not null references accounts(id) on delete cascade,
  category_id uuid references categories(id) on delete set null,
  amount numeric(14,2) not null check (amount > 0),
  kind text not null check (kind in ('income','expense')),
  note text,
  occurred_at date not null default current_date,
  created_at timestamptz not null default now()
);

create index transactions_user_date_idx on transactions (user_id, occurred_at desc);
create index transactions_account_idx on transactions (account_id);
alter table transactions enable row level security;

create policy "transactions select own" on transactions
  for select using (user_id = auth.uid());
create policy "transactions insert own" on transactions
  for insert with check (user_id = auth.uid());
create policy "transactions update own" on transactions
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "transactions delete own" on transactions
  for delete using (user_id = auth.uid());

-- Derived balances ----------------------------------------------------------
-- security_invoker keeps the caller's RLS policies in force through the view.
create view account_balances with (security_invoker = true) as
select
  a.id,
  a.user_id,
  a.name,
  a.type,
  a.opening_balance,
  a.color,
  a.is_archived,
  a.created_at,
  a.opening_balance + coalesce(
    sum(case when t.kind = 'income' then t.amount else -t.amount end),
    0
  ) as balance
from accounts a
left join transactions t on t.account_id = a.id
group by a.id;

-- Signup bootstrap ----------------------------------------------------------
create function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, display_name)
  values (new.id, split_part(new.email, '@', 1));

  insert into categories (user_id, name, icon, kind, is_default) values
    (new.id, 'Food',          '🍔', 'expense', true),
    (new.id, 'Transport',     '🚌', 'expense', true),
    (new.id, 'Shopping',      '🛍️', 'expense', true),
    (new.id, 'Bills',         '🧾', 'expense', true),
    (new.id, 'Health',        '💊', 'expense', true),
    (new.id, 'Entertainment', '🎬', 'expense', true),
    (new.id, 'Salary',        '💰', 'income',  true),
    (new.id, 'Other',         '✨', 'income',  true);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
```

- [ ] **Step 2: Apply the migration to the Supabase project**

Use the Supabase MCP `apply_migration` tool with name `0001_init` and the SQL above, or paste it into the Supabase dashboard SQL editor.

- [ ] **Step 3: Verify the schema landed**

Run the Supabase MCP `list_tables` tool.
Expected: `profiles`, `accounts`, `categories`, `transactions` present, each with RLS enabled.

- [ ] **Step 4: Verify the balance view arithmetic**

Run this in the SQL editor (service role, so RLS is bypassed for the check). It creates a throwaway user-less fixture, so run it inside a transaction that rolls back:

```sql
begin;
-- Borrow any existing auth user id, or skip this check until after first signup.
with u as (select id from auth.users limit 1)
insert into accounts (user_id, name, type, opening_balance)
select id, 'Test', 'cash', 1000 from u
returning id \gset

insert into transactions (user_id, account_id, amount, kind)
select user_id, id, 300, 'expense' from accounts where name = 'Test';
insert into transactions (user_id, account_id, amount, kind)
select user_id, id, 500, 'income' from accounts where name = 'Test';

select balance from account_balances where name = 'Test';
-- Expected: 1200.00  (1000 - 300 + 500)
rollback;
```

Expected: `1200.00`. If `auth.users` is empty, defer this check to after Task 5 and note it.

- [ ] **Step 5: Create `lib/types.ts`**

```typescript
export type AccountType = 'bank' | 'cash' | 'card' | 'wallet' | 'investment'
export type TxKind = 'income' | 'expense'

export type Profile = {
  id: string
  display_name: string | null
  currency: string
  created_at: string
}

export type Account = {
  id: string
  user_id: string
  name: string
  type: AccountType
  opening_balance: number
  color: string
  is_archived: boolean
  created_at: string
}

/** An account row plus its derived balance, from the account_balances view. */
export type AccountBalance = Account & { balance: number }

export type Category = {
  id: string
  user_id: string
  name: string
  icon: string
  kind: TxKind
  is_default: boolean
}

export type Transaction = {
  id: string
  user_id: string
  account_id: string
  category_id: string | null
  amount: number
  kind: TxKind
  note: string | null
  occurred_at: string
  created_at: string
}

/** A transaction joined with the display fields of its account and category. */
export type TransactionWithRefs = Transaction & {
  accounts: Pick<Account, 'name' | 'color'> | null
  categories: Pick<Category, 'name' | 'icon'> | null
}
```

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/0001_init.sql lib/types.ts
git commit -m "feat: add schema, RLS policies, balance view, and signup trigger"
```

---

### Task 4: Supabase clients and auth middleware

**Files:**
- Create: `lib/supabase/client.ts`, `lib/supabase/server.ts`, `lib/supabase/middleware.ts`, `middleware.ts`

**Interfaces:**
- Consumes: nothing
- Produces: `createBrowserSupabase()`, `createServerSupabase(): Promise<SupabaseClient>`, `updateSession(request: NextRequest): Promise<NextResponse>`

- [ ] **Step 1: Create the browser client**

`lib/supabase/client.ts`:

```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createBrowserSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )
}
```

- [ ] **Step 2: Create the server client**

`lib/supabase/server.ts`:

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createServerSupabase() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Called from a Server Component, where cookies are read-only.
            // The middleware refreshes the session, so this is safe to ignore.
          }
        },
      },
    }
  )
}
```

- [ ] **Step 3: Create the session-refresh helper**

`lib/supabase/middleware.ts`:

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_PATHS = ['/login', '/signup', '/auth']

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Do not remove: this call refreshes the auth token cookie.
  const { data: { user } } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname
  const isPublic = PUBLIC_PATHS.some((p) => path.startsWith(p))

  if (!user && !isPublic) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user && (path === '/login' || path === '/signup')) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return response
}
```

- [ ] **Step 4: Wire up root `middleware.ts`**

```typescript
import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
```

- [ ] **Step 5: Verify redirect protection works**

Run `npm run dev`, then in another terminal:

```bash
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" http://localhost:3000/
```

Expected: `307 http://localhost:3000/login` — an anonymous request to the home route is redirected to login.

- [ ] **Step 6: Commit**

```bash
git add lib/supabase middleware.ts
git commit -m "feat: add Supabase browser/server clients and auth middleware"
```

---

### Task 5: Login and signup

**Files:**
- Create: `lib/schemas.ts`, `app/(auth)/layout.tsx`, `app/(auth)/login/page.tsx`, `app/(auth)/signup/page.tsx`, `app/(auth)/actions.ts`, `app/auth/callback/route.ts`, `components/submit-button.tsx`
- Test: `lib/schemas.test.ts`

**Interfaces:**
- Consumes: `createServerSupabase` (Task 4)
- Produces: `credentialsSchema`; actions `signIn(prev, formData)`, `signUp(prev, formData)`, `signOut()`; `SubmitButton({ children, pendingLabel })`; action state shape `{ error?: string; message?: string }`

- [ ] **Step 1: Write the failing schema tests**

`lib/schemas.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { credentialsSchema } from './schemas'

describe('credentialsSchema', () => {
  it('accepts a valid email and password', () => {
    const r = credentialsSchema.safeParse({ email: 'a@b.com', password: 'secret12' })
    expect(r.success).toBe(true)
  })

  it('rejects a malformed email', () => {
    const r = credentialsSchema.safeParse({ email: 'not-an-email', password: 'secret12' })
    expect(r.success).toBe(false)
  })

  it('rejects a password shorter than 8 characters', () => {
    const r = credentialsSchema.safeParse({ email: 'a@b.com', password: 'short' })
    expect(r.success).toBe(false)
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run lib/schemas.test.ts`
Expected: FAIL — cannot resolve `./schemas`.

- [ ] **Step 3: Create `lib/schemas.ts`**

```typescript
import { z } from 'zod'

export const credentialsSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export const accountSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(50),
  type: z.enum(['bank', 'cash', 'card', 'wallet', 'investment']),
  opening_balance: z.coerce.number().finite('Enter a valid amount'),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Pick a colour'),
})

export const transactionSchema = z.object({
  account_id: z.string().uuid('Choose an account'),
  category_id: z.string().uuid().optional().or(z.literal('').transform(() => undefined)),
  amount: z.coerce.number().positive('Enter an amount greater than zero'),
  kind: z.enum(['income', 'expense']),
  note: z.string().trim().max(120).optional(),
  occurred_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Choose a date'),
})

export const profileSchema = z.object({
  display_name: z.string().trim().min(1, 'Name is required').max(50),
})
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run lib/schemas.test.ts`
Expected: 3 passing.

- [ ] **Step 5: Create `components/submit-button.tsx`**

```tsx
'use client'

import { useFormStatus } from 'react-dom'

export function SubmitButton({
  children,
  pendingLabel = 'Please wait…',
}: {
  children: React.ReactNode
  pendingLabel?: string
}) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-500 py-3.5 font-semibold text-white shadow-lg shadow-indigo-500/25 transition active:scale-[0.98] disabled:opacity-60"
    >
      {pending ? pendingLabel : children}
    </button>
  )
}
```

- [ ] **Step 6: Create `app/(auth)/actions.ts`**

```typescript
'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { createServerSupabase } from '@/lib/supabase/server'
import { credentialsSchema } from '@/lib/schemas'

export type AuthState = { error?: string; message?: string }

function friendly(message: string): string {
  const m = message.toLowerCase()
  if (m.includes('invalid login credentials')) return 'Wrong email or password.'
  if (m.includes('already registered')) return 'That email is already registered.'
  if (m.includes('rate limit')) return 'Too many attempts. Try again in a minute.'
  return 'Something went wrong. Please try again.'
}

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = credentialsSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = await createServerSupabase()
  const { error } = await supabase.auth.signInWithPassword(parsed.data)
  if (error) return { error: friendly(error.message) }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = credentialsSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const origin = (await headers()).get('origin') ?? 'http://localhost:3000'
  const supabase = await createServerSupabase()
  const { data, error } = await supabase.auth.signUp({
    ...parsed.data,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  })
  if (error) return { error: friendly(error.message) }

  // When email confirmation is on, no session is returned yet.
  if (!data.session) {
    return { message: 'Check your inbox to confirm your email, then sign in.' }
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signOut() {
  const supabase = await createServerSupabase()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}
```

Note: `redirect()` throws a control-flow error by design. It must be called outside any `try`/`catch`, as written above.

- [ ] **Step 7: Create `app/auth/callback/route.ts`**

```typescript
import { NextResponse, type NextRequest } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createServerSupabase()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(`${origin}/`)
  }

  return NextResponse.redirect(`${origin}/login?error=confirm`)
}
```

- [ ] **Step 8: Create `app/(auth)/layout.tsx`**

```tsx
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-[radial-gradient(120%_120%_at_50%_0%,#eef2ff_0%,#f8fafc_55%,#eef2ff_100%)] px-5">
      <div className="w-full max-w-[420px] rounded-[28px] border border-white/70 bg-white/70 p-7 shadow-[0_20px_60px_-20px_rgba(30,41,59,0.35)] backdrop-blur-2xl">
        {children}
      </div>
    </div>
  )
}
```

- [ ] **Step 9: Create `app/(auth)/login/page.tsx`**

```tsx
'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { signIn, type AuthState } from '../actions'
import { SubmitButton } from '@/components/submit-button'

const field =
  'w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100'

export default function LoginPage() {
  const [state, action] = useActionState<AuthState, FormData>(signIn, {})

  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">Welcome back</h1>
      <p className="mt-1 mb-6 text-sm text-slate-500">Sign in to your Razd account.</p>

      <form action={action} className="space-y-3">
        <input className={field} name="email" type="email" placeholder="Email" autoComplete="email" required />
        <input className={field} name="password" type="password" placeholder="Password" autoComplete="current-password" required />

        {state.error && (
          <p role="alert" className="rounded-xl bg-rose-50 px-4 py-2.5 text-sm text-rose-600">
            {state.error}
          </p>
        )}

        <SubmitButton pendingLabel="Signing in…">Sign in</SubmitButton>
      </form>

      <p className="mt-5 text-center text-sm text-slate-500">
        New here?{' '}
        <Link href="/signup" className="font-semibold text-indigo-600">
          Create an account
        </Link>
      </p>
    </>
  )
}
```

- [ ] **Step 10: Create `app/(auth)/signup/page.tsx`**

Identical structure to login, with these differences: import `signUp` instead of `signIn`; heading "Create your account"; subtitle "Track every rupee across your accounts."; `autoComplete="new-password"`; button label "Create account" / pending "Creating account…"; render `state.message` in an emerald box above the error box; footer link to `/login` reading "Already have an account? Sign in".

```tsx
'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { signUp, type AuthState } from '../actions'
import { SubmitButton } from '@/components/submit-button'

const field =
  'w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100'

export default function SignupPage() {
  const [state, action] = useActionState<AuthState, FormData>(signUp, {})

  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">Create your account</h1>
      <p className="mt-1 mb-6 text-sm text-slate-500">Track every rupee across your accounts.</p>

      <form action={action} className="space-y-3">
        <input className={field} name="email" type="email" placeholder="Email" autoComplete="email" required />
        <input className={field} name="password" type="password" placeholder="Password (min 8 characters)" autoComplete="new-password" required />

        {state.message && (
          <p role="status" className="rounded-xl bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">
            {state.message}
          </p>
        )}
        {state.error && (
          <p role="alert" className="rounded-xl bg-rose-50 px-4 py-2.5 text-sm text-rose-600">
            {state.error}
          </p>
        )}

        <SubmitButton pendingLabel="Creating account…">Create account</SubmitButton>
      </form>

      <p className="mt-5 text-center text-sm text-slate-500">
        Already have an account?{' '}
        <Link href="/login" className="font-semibold text-indigo-600">
          Sign in
        </Link>
      </p>
    </>
  )
}
```

- [ ] **Step 11: Manually verify signup end to end**

Run `npm run dev`, open `http://localhost:3000/signup`, and register a real email. Then confirm in the Supabase dashboard that a `profiles` row and 8 `categories` rows exist for the new user — this proves the Task 3 trigger fires.

If Supabase has email confirmation enabled, either confirm via the emailed link or disable confirmation for development under Authentication → Providers → Email.

- [ ] **Step 12: Commit**

```bash
git add lib/schemas.ts lib/schemas.test.ts components/submit-button.tsx "app/(auth)" app/auth
git commit -m "feat: add email/password login and signup"
```

---

### Task 6: App shell — phone frame and glass bottom navbar

**Files:**
- Create: `components/bottom-nav.tsx`, `app/(app)/layout.tsx`
- Modify: `app/layout.tsx`, `app/globals.css`
- Test: `components/bottom-nav.test.tsx`

**Interfaces:**
- Consumes: nothing
- Produces: `<BottomNav />`; the `(app)` layout that every authenticated screen renders inside

- [ ] **Step 1: Write the failing navbar test**

`components/bottom-nav.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BottomNav } from './bottom-nav'

vi.mock('next/navigation', () => ({ usePathname: () => '/accounts' }))

describe('BottomNav', () => {
  it('renders all five tabs in order', () => {
    render(<BottomNav />)
    const labels = screen.getAllByRole('link').map((l) => l.textContent)
    expect(labels).toEqual(['Home', 'Accounts', 'Add', 'Stats', 'Profile'])
  })

  it('marks the tab matching the current path as current', () => {
    render(<BottomNav />)
    expect(screen.getByRole('link', { name: 'Accounts' })).toHaveAttribute('aria-current', 'page')
  })

  it('does not mark non-matching tabs as current', () => {
    render(<BottomNav />)
    expect(screen.getByRole('link', { name: 'Home' })).not.toHaveAttribute('aria-current')
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run components/bottom-nav.test.tsx`
Expected: FAIL — cannot resolve `./bottom-nav`.

- [ ] **Step 3: Implement `components/bottom-nav.tsx`**

```tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  { href: '/', label: 'Home', icon: 'M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z' },
  { href: '/accounts', label: 'Accounts', icon: 'M3 7h18v12H3zM3 7l2-3h14l2 3M7 13h4' },
  { href: '/add', label: 'Add', icon: 'M12 5v14M5 12h14' },
  { href: '/stats', label: 'Stats', icon: 'M4 20V10M10 20V4M16 20v-7M22 20H2' },
  { href: '/profile', label: 'Profile', icon: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 21a8 8 0 0 1 16 0' },
] as const

function isActive(pathname: string, href: string) {
  return href === '/' ? pathname === '/' : pathname.startsWith(href)
}

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Primary"
      className="glass-nav fixed bottom-0 left-1/2 z-40 w-full max-w-[480px] -translate-x-1/2 border-t border-white/60 pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="flex items-end justify-around px-2 pt-2 pb-1">
        {TABS.map((tab) => {
          const active = isActive(pathname, tab.href)
          const isAdd = tab.label === 'Add'

          if (isAdd) {
            return (
              <li key={tab.href} className="-mt-7">
                <Link
                  href={tab.href}
                  aria-current={active ? 'page' : undefined}
                  className="flex flex-col items-center gap-1"
                >
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/40 transition active:scale-95">
                    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d={tab.icon} />
                    </svg>
                  </span>
                  <span className="sr-only">Add</span>
                </Link>
              </li>
            )
          }

          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={active ? 'page' : undefined}
                className={`flex w-16 flex-col items-center gap-1 rounded-xl py-1.5 transition ${
                  active ? 'text-indigo-600' : 'text-slate-400'
                }`}
              >
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                  <path d={tab.icon} />
                </svg>
                <span className="text-[10px] font-medium tracking-wide">{tab.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
```

The `Add` tab's visible text lives in an `sr-only` span so the accessible name stays "Add" while the label is visually replaced by the raised button — the test reads `textContent`, which includes `sr-only` text.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run components/bottom-nav.test.tsx`
Expected: 3 passing.

- [ ] **Step 5: Add glass tokens to `app/globals.css`**

Append below the existing `@import "tailwindcss";` line:

```css
:root {
  --app-bg: radial-gradient(130% 100% at 50% 0%, #eef2ff 0%, #f8fafc 45%, #eef2ff 100%);
}

html, body { height: 100%; }

body {
  background: var(--app-bg);
  color: #0f172a;
  -webkit-font-smoothing: antialiased;
  overscroll-behavior-y: none;
}

/* Frosted surfaces ------------------------------------------------------- */
.glass {
  background: rgba(255, 255, 255, 0.62);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.75);
  box-shadow: 0 12px 40px -18px rgba(30, 41, 59, 0.35);
}

.glass-nav {
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  box-shadow: 0 -8px 30px -12px rgba(30, 41, 59, 0.25);
}

/* Browsers without backdrop-filter get opaque surfaces, never unreadable ones. */
@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  .glass { background: rgba(255, 255, 255, 0.97); }
  .glass-nav { background: rgba(255, 255, 255, 0.98); }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}

@keyframes sheet-in {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}
.animate-sheet-in { animation: sheet-in 0.28s cubic-bezier(0.32, 0.72, 0, 1); }
```

- [ ] **Step 6: Set viewport and metadata in `app/layout.tsx`**

Replace the file's metadata exports with:

```tsx
import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Razd — Money, tracked',
  description: 'Track balances and spending across all your accounts.',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'Razd' },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: '#eef2ff',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  )
}
```

- [ ] **Step 7: Create `app/(app)/layout.tsx`**

```tsx
import { BottomNav } from '@/components/bottom-nav'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto min-h-dvh w-full max-w-[480px] sm:my-6 sm:min-h-[calc(100dvh-3rem)] sm:rounded-[36px] sm:border sm:border-white/70 sm:shadow-[0_30px_80px_-30px_rgba(30,41,59,0.4)]">
      <main className="px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-32">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
```

- [ ] **Step 8: Create a placeholder home page so the shell is viewable**

`app/(app)/page.tsx`:

```tsx
export default function HomePage() {
  return <h1 className="text-2xl font-bold">Home</h1>
}
```

- [ ] **Step 9: Verify the shell renders at both sizes**

Run `npm run dev`, sign in, and check:
- At a 390×844 viewport (device toolbar, iPhone), the navbar is pinned to the bottom, the five tabs are reachable, and the raised "+" overlaps the bar.
- At full desktop width, the app renders as a centered 480px column with rounded corners, not a stretched page.
- At 320px width, no horizontal scrollbar appears.

- [ ] **Step 10: Commit**

```bash
git add components/bottom-nav.tsx components/bottom-nav.test.tsx "app/(app)" app/layout.tsx app/globals.css
git commit -m "feat: add app shell with responsive phone frame and glass bottom nav"
```

---

### Task 7: Accounts — list, create, edit, delete

**Files:**
- Create: `lib/queries/balances.ts`, `app/(app)/accounts/page.tsx`, `app/(app)/accounts/actions.ts`, `app/(app)/accounts/account-form-sheet.tsx`, `components/sheet.tsx`, `components/empty-state.tsx`

**Interfaces:**
- Consumes: `createServerSupabase` (Task 4), `accountSchema` (Task 5), `AccountBalance` (Task 3), `formatINR` (Task 2)
- Produces: `getAccountBalances(): Promise<AccountBalance[]>`; actions `createAccount`, `updateAccount`, `deleteAccount`; `<Sheet open onClose title>`

- [ ] **Step 1: Implement `lib/queries/balances.ts`**

```typescript
import 'server-only'
import { createServerSupabase } from '@/lib/supabase/server'
import type { AccountBalance } from '@/lib/types'

/** Reads every non-archived account with its derived balance, richest first. */
export async function getAccountBalances(): Promise<AccountBalance[]> {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase
    .from('account_balances')
    .select('*')
    .eq('is_archived', false)
    .order('balance', { ascending: false })

  if (error) throw new Error(`Failed to load accounts: ${error.message}`)
  return (data ?? []).map((r) => ({
    ...r,
    balance: Number(r.balance),
    opening_balance: Number(r.opening_balance),
  })) as AccountBalance[]
}
```

This module is `server-only` and hits the network, so it has no unit test — its behaviour
is covered by the Task 14 end-to-end test. The arithmetic it feeds is tested in Task 2.

- [ ] **Step 2: Create `components/sheet.tsx`**

```tsx
'use client'

import { useEffect } from 'react'

export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <button
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/25 backdrop-blur-[2px]"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="animate-sheet-in relative w-full max-w-[480px] rounded-t-[28px] border-t border-white/80 bg-white/95 px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-20px_60px_-20px_rgba(30,41,59,0.45)] backdrop-blur-2xl"
      >
        <div className="mx-auto mb-4 h-1.5 w-11 rounded-full bg-slate-300" />
        <h2 className="mb-4 text-lg font-bold text-slate-900">{title}</h2>
        <div className="max-h-[70dvh] overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create `components/empty-state.tsx`**

```tsx
export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: string
  title: string
  body: string
  action?: React.ReactNode
}) {
  return (
    <div className="glass rounded-3xl px-6 py-10 text-center">
      <div className="mb-3 text-4xl">{icon}</div>
      <h3 className="font-semibold text-slate-900">{title}</h3>
      <p className="mx-auto mt-1 max-w-[28ch] text-sm text-slate-500">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
```

- [ ] **Step 4: Create `app/(app)/accounts/actions.ts`**

```typescript
'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabase } from '@/lib/supabase/server'
import { accountSchema } from '@/lib/schemas'

export type ActionState = { error?: string; ok?: boolean }

function fields(formData: FormData) {
  return {
    name: formData.get('name'),
    type: formData.get('type'),
    opening_balance: formData.get('opening_balance'),
    color: formData.get('color'),
  }
}

export async function createAccount(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = accountSchema.safeParse(fields(formData))
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Your session expired. Please sign in again.' }

  const { error } = await supabase.from('accounts').insert({ ...parsed.data, user_id: user.id })
  if (error) return { error: 'Could not save the account. Please try again.' }

  revalidatePath('/accounts')
  revalidatePath('/')
  return { ok: true }
}

export async function updateAccount(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const id = String(formData.get('id') ?? '')
  if (!id) return { error: 'Missing account.' }

  const parsed = accountSchema.safeParse(fields(formData))
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createServerSupabase()
  const { error } = await supabase.from('accounts').update(parsed.data).eq('id', id)
  if (error) return { error: 'Could not update the account. Please try again.' }

  revalidatePath('/accounts')
  revalidatePath('/')
  return { ok: true }
}

export async function deleteAccount(formData: FormData): Promise<void> {
  const id = String(formData.get('id') ?? '')
  if (!id) return

  const supabase = await createServerSupabase()
  await supabase.from('accounts').delete().eq('id', id)

  revalidatePath('/accounts')
  revalidatePath('/')
}
```

RLS restricts every one of these to the signed-in user's rows, so an `id` belonging to someone else simply matches nothing.

- [ ] **Step 5: Create `app/(app)/accounts/account-form-sheet.tsx`**

```tsx
'use client'

import { useActionState, useEffect, useState } from 'react'
import { Sheet } from '@/components/sheet'
import { SubmitButton } from '@/components/submit-button'
import { createAccount, updateAccount, deleteAccount, type ActionState } from './actions'
import type { AccountBalance } from '@/lib/types'

const TYPES = [
  { value: 'bank', label: 'Bank' },
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
  { value: 'wallet', label: 'Wallet' },
  { value: 'investment', label: 'Investment' },
] as const

const COLORS = ['#5B8DEF', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#0EA5E9']

const field =
  'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100'

export function AccountFormSheet({
  open,
  onClose,
  account,
}: {
  open: boolean
  onClose: () => void
  account?: AccountBalance
}) {
  const editing = Boolean(account)
  const [state, action] = useActionState<ActionState, FormData>(
    editing ? updateAccount : createAccount,
    {}
  )
  const [color, setColor] = useState(account?.color ?? COLORS[0])
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    if (state.ok) onClose()
  }, [state.ok, onClose])

  return (
    <Sheet open={open} onClose={onClose} title={editing ? 'Edit account' : 'New account'}>
      <form action={action} className="space-y-3 pb-2">
        {editing && <input type="hidden" name="id" value={account!.id} />}
        <input type="hidden" name="color" value={color} />

        <input className={field} name="name" placeholder="Account name" defaultValue={account?.name} required maxLength={50} />

        <select className={field} name="type" defaultValue={account?.type ?? 'bank'}>
          {TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-500">
            Opening balance (before any logged transactions)
          </label>
          <input
            className={field}
            name="opening_balance"
            type="number"
            step="0.01"
            inputMode="decimal"
            defaultValue={account?.opening_balance ?? 0}
            required
          />
        </div>

        <div className="flex gap-2 pt-1">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={`Colour ${c}`}
              aria-pressed={color === c}
              onClick={() => setColor(c)}
              style={{ background: c }}
              className={`h-8 w-8 rounded-full transition ${color === c ? 'ring-2 ring-slate-900 ring-offset-2' : ''}`}
            />
          ))}
        </div>

        {state.error && (
          <p role="alert" className="rounded-xl bg-rose-50 px-4 py-2.5 text-sm text-rose-600">
            {state.error}
          </p>
        )}

        <SubmitButton pendingLabel="Saving…">{editing ? 'Save changes' : 'Add account'}</SubmitButton>
      </form>

      {editing && (
        <div className="border-t border-slate-100 pt-3">
          {confirmDelete ? (
            <form action={deleteAccount} className="space-y-2">
              <input type="hidden" name="id" value={account!.id} />
              <p className="text-sm text-slate-600">
                Delete “{account!.name}”? Its transactions will be deleted too. This cannot be undone.
              </p>
              <div className="flex gap-2">
                <button type="button" onClick={() => setConfirmDelete(false)} className="flex-1 rounded-2xl border border-slate-200 py-3 font-medium text-slate-600">
                  Cancel
                </button>
                <button type="submit" className="flex-1 rounded-2xl bg-rose-500 py-3 font-semibold text-white">
                  Delete
                </button>
              </div>
            </form>
          ) : (
            <button type="button" onClick={() => setConfirmDelete(true)} className="w-full py-3 text-sm font-medium text-rose-500">
              Delete account
            </button>
          )}
        </div>
      )}
    </Sheet>
  )
}
```

- [ ] **Step 6: Create `app/(app)/accounts/page.tsx`**

```tsx
import { getAccountBalances } from '@/lib/queries/balances'
import { AccountsClient } from './accounts-client'

export default async function AccountsPage() {
  const accounts = await getAccountBalances()
  return <AccountsClient accounts={accounts} />
}
```

- [ ] **Step 7: Create `app/(app)/accounts/accounts-client.tsx`**

```tsx
'use client'

import { useState } from 'react'
import { formatINR } from '@/lib/format'
import { EmptyState } from '@/components/empty-state'
import { AccountFormSheet } from './account-form-sheet'
import type { AccountBalance } from '@/lib/types'

const TYPE_ICON: Record<string, string> = {
  bank: '🏦', cash: '💵', card: '💳', wallet: '👛', investment: '📈',
}

export function AccountsClient({ accounts }: { accounts: AccountBalance[] }) {
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<AccountBalance | undefined>()

  return (
    <>
      <header className="mb-5 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Accounts</h1>
        <button
          onClick={() => setCreating(true)}
          className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white active:scale-95"
        >
          + New
        </button>
      </header>

      {accounts.length === 0 ? (
        <EmptyState
          icon="🏦"
          title="No accounts yet"
          body="Add your bank, cash, or card to start tracking your balance."
          action={
            <button onClick={() => setCreating(true)} className="rounded-2xl bg-indigo-600 px-5 py-3 font-semibold text-white">
              Add your first account
            </button>
          }
        />
      ) : (
        <ul className="space-y-3">
          {accounts.map((a) => (
            <li key={a.id}>
              <button onClick={() => setEditing(a)} className="glass flex w-full items-center gap-3 rounded-3xl px-4 py-4 text-left active:scale-[0.99]">
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-lg"
                  style={{ background: `${a.color}22` }}
                >
                  {TYPE_ICON[a.type] ?? '📦'}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold text-slate-900">{a.name}</span>
                  <span className="block text-xs capitalize text-slate-400">{a.type}</span>
                </span>
                <span className={`shrink-0 font-bold tabular-nums ${a.balance < 0 ? 'text-rose-500' : 'text-slate-900'}`}>
                  {formatINR(a.balance)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <AccountFormSheet open={creating} onClose={() => setCreating(false)} />
      <AccountFormSheet
        key={editing?.id}
        open={Boolean(editing)}
        onClose={() => setEditing(undefined)}
        account={editing}
      />
    </>
  )
}
```

The `key={editing?.id}` forces a fresh form state when a different account is opened, so stale defaults never leak between edits.

- [ ] **Step 8: Verify manually**

Run `npm run dev`, sign in, go to `/accounts`. Confirm: the empty state shows first; adding an account with opening balance 5000 makes it appear with `₹5,000.00`; editing changes the name; deleting asks for confirmation and removes it.

- [ ] **Step 9: Commit**

```bash
git add lib/queries/balances.ts components/sheet.tsx components/empty-state.tsx "app/(app)/accounts"
git commit -m "feat: add accounts list with create, edit, and delete"
```

---

### Task 8: Home — total balance with per-account breakdown

**Files:**
- Create: `lib/queries/transactions.ts`, `components/balance-card.tsx`, `components/account-breakdown-sheet.tsx`, `components/amount.tsx`
- Modify: `app/(app)/page.tsx`
- Test: `components/account-breakdown-sheet.test.tsx`

**Interfaces:**
- Consumes: `getAccountBalances`, `sumBalances` (Task 7), `formatINR`, `formatSignedINR`, `formatDayLabel` (Task 2)
- Produces: `getRecentTransactions(limit: number)`, `getMonthTotals()`; `<BalanceCard accounts>`, `<AccountBreakdownSheet open onClose accounts>`, `<Amount value kind>`

- [ ] **Step 1: Write the failing breakdown-sheet test**

`components/account-breakdown-sheet.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AccountBreakdownSheet } from './account-breakdown-sheet'
import type { AccountBalance } from '@/lib/types'

const acct = (name: string, balance: number): AccountBalance => ({
  id: name, user_id: 'u', name, type: 'bank', opening_balance: 0,
  color: '#5B8DEF', is_archived: false, created_at: '', balance,
})

const accounts = [acct('HDFC', 45000), acct('Cash', 2500), acct('Card', -1200)]

describe('AccountBreakdownSheet', () => {
  it('renders one row per account', () => {
    render(<AccountBreakdownSheet open onClose={() => {}} accounts={accounts} />)
    expect(screen.getByText('HDFC')).toBeInTheDocument()
    expect(screen.getByText('Cash')).toBeInTheDocument()
    expect(screen.getByText('Card')).toBeInTheDocument()
  })

  it('shows each account balance formatted in INR', () => {
    render(<AccountBreakdownSheet open onClose={() => {}} accounts={accounts} />)
    expect(screen.getByText('₹45,000.00')).toBeInTheDocument()
    expect(screen.getByText('-₹1,200.00')).toBeInTheDocument()
  })

  it('shows a total equal to the sum of the listed balances', () => {
    render(<AccountBreakdownSheet open onClose={() => {}} accounts={accounts} />)
    expect(screen.getByTestId('breakdown-total')).toHaveTextContent('₹46,300.00')
  })

  it('renders nothing when closed', () => {
    render(<AccountBreakdownSheet open={false} onClose={() => {}} accounts={accounts} />)
    expect(screen.queryByText('HDFC')).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run components/account-breakdown-sheet.test.tsx`
Expected: FAIL — cannot resolve `./account-breakdown-sheet`.

- [ ] **Step 3: Implement `components/account-breakdown-sheet.tsx`**

```tsx
'use client'

import { Sheet } from './sheet'
import { formatINR } from '@/lib/format'
import { sumAmounts } from '@/lib/money'
import type { AccountBalance } from '@/lib/types'

const TYPE_ICON: Record<string, string> = {
  bank: '🏦', cash: '💵', card: '💳', wallet: '👛', investment: '📈',
}

export function AccountBreakdownSheet({
  open,
  onClose,
  accounts,
}: {
  open: boolean
  onClose: () => void
  accounts: AccountBalance[]
}) {
  return (
    <Sheet open={open} onClose={onClose} title="Balance by account">
      <ul className="space-y-1">
        {accounts.map((a) => (
          <li key={a.id} className="flex items-center gap-3 rounded-2xl px-1 py-3">
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
              style={{ background: `${a.color}22` }}
            >
              {TYPE_ICON[a.type] ?? '📦'}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium text-slate-900">{a.name}</span>
              <span className="block text-xs capitalize text-slate-400">{a.type}</span>
            </span>
            <span className={`shrink-0 font-semibold tabular-nums ${a.balance < 0 ? 'text-rose-500' : 'text-slate-900'}`}>
              {formatINR(a.balance)}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-4">
        <span className="text-sm font-medium text-slate-500">Total</span>
        <span data-testid="breakdown-total" className="text-lg font-bold tabular-nums text-slate-900">
          {formatINR(sumAmounts(accounts.map((a) => a.balance)))}
        </span>
      </div>
    </Sheet>
  )
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run components/account-breakdown-sheet.test.tsx`
Expected: 4 passing.

- [ ] **Step 5: Create `components/amount.tsx`**

```tsx
import { formatSignedINR } from '@/lib/format'
import type { TxKind } from '@/lib/types'

export function Amount({ value, kind }: { value: number; kind: TxKind }) {
  return (
    <span className={`font-semibold tabular-nums ${kind === 'income' ? 'text-emerald-600' : 'text-slate-900'}`}>
      {formatSignedINR(value, kind)}
    </span>
  )
}
```

- [ ] **Step 6: Create `components/balance-card.tsx`**

```tsx
'use client'

import { useEffect, useState } from 'react'
import { formatINR } from '@/lib/format'
import { sumAmounts } from '@/lib/money'
import { AccountBreakdownSheet } from './account-breakdown-sheet'
import type { AccountBalance } from '@/lib/types'

const HIDE_KEY = 'razd:hide-amounts'

export function BalanceCard({ accounts }: { accounts: AccountBalance[] }) {
  const [open, setOpen] = useState(false)
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    setHidden(localStorage.getItem(HIDE_KEY) === '1')
  }, [])

  function toggleHidden() {
    setHidden((h) => {
      localStorage.setItem(HIDE_KEY, h ? '0' : '1')
      return !h
    })
  }

  const total = sumAmounts(accounts.map((a) => a.balance))

  return (
    <>
      <section className="glass relative overflow-hidden rounded-[28px] px-6 py-7">
        <div className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full bg-gradient-to-br from-indigo-400/35 to-violet-400/25 blur-2xl" />

        <div className="relative flex items-start justify-between">
          <p className="text-sm font-medium text-slate-500">Total balance</p>
          <div className="flex gap-1">
            <button
              onClick={toggleHidden}
              aria-label={hidden ? 'Show amounts' : 'Hide amounts'}
              className="rounded-full p-1.5 text-slate-400 active:scale-90"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
                <circle cx="12" cy="12" r="3" />
                {hidden && <path d="m4 4 16 16" strokeLinecap="round" />}
              </svg>
            </button>
            <button
              onClick={() => setOpen(true)}
              aria-label="Show balance by account"
              className="rounded-full p-1.5 text-slate-400 active:scale-90"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 11v5M12 8h.01" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

        <p className={`relative mt-2 font-bold tabular-nums tracking-tight text-slate-900 ${hidden ? 'text-3xl' : 'text-[clamp(1.9rem,9vw,2.6rem)]'}`}>
          {hidden ? '••••••' : formatINR(total)}
        </p>

        <button
          onClick={() => setOpen(true)}
          className="relative mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3.5 py-1.5 text-xs font-medium text-slate-600"
        >
          Across {accounts.length} {accounts.length === 1 ? 'account' : 'accounts'}
          <span aria-hidden>›</span>
        </button>
      </section>

      <AccountBreakdownSheet open={open} onClose={() => setOpen(false)} accounts={accounts} />
    </>
  )
}
```

- [ ] **Step 7: Create `lib/queries/transactions.ts`**

```typescript
import 'server-only'
import { createServerSupabase } from '@/lib/supabase/server'
import { sumAmounts } from '@/lib/money'
import type { TransactionWithRefs } from '@/lib/types'

function normalise(rows: unknown[]): TransactionWithRefs[] {
  return (rows as TransactionWithRefs[]).map((t) => ({ ...t, amount: Number(t.amount) }))
}

/** Most recent transactions, newest first, with account and category display fields. */
export async function getRecentTransactions(limit = 5): Promise<TransactionWithRefs[]> {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase
    .from('transactions')
    .select('*, accounts(name, color), categories(name, icon)')
    .order('occurred_at', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw new Error(`Failed to load transactions: ${error.message}`)
  return normalise(data ?? [])
}

/** Every transaction, newest first. */
export async function getAllTransactions(): Promise<TransactionWithRefs[]> {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase
    .from('transactions')
    .select('*, accounts(name, color), categories(name, icon)')
    .order('occurred_at', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(500)

  if (error) throw new Error(`Failed to load transactions: ${error.message}`)
  return normalise(data ?? [])
}

/** Income and expense totals for the current calendar month. */
export async function getMonthTotals(): Promise<{ income: number; expense: number }> {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const startIso = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-01`

  const supabase = await createServerSupabase()
  const { data, error } = await supabase
    .from('transactions')
    .select('amount, kind')
    .gte('occurred_at', startIso)

  if (error) throw new Error(`Failed to load month totals: ${error.message}`)

  const rows = data ?? []
  return {
    income: sumAmounts(rows.filter((r) => r.kind === 'income').map((r) => Number(r.amount))),
    expense: sumAmounts(rows.filter((r) => r.kind === 'expense').map((r) => Number(r.amount))),
  }
}
```

- [ ] **Step 8: Implement `app/(app)/page.tsx`**

```tsx
import Link from 'next/link'
import { getAccountBalances } from '@/lib/queries/balances'
import { getRecentTransactions, getMonthTotals } from '@/lib/queries/transactions'
import { BalanceCard } from '@/components/balance-card'
import { EmptyState } from '@/components/empty-state'
import { Amount } from '@/components/amount'
import { formatINR, formatDayLabel } from '@/lib/format'

export default async function HomePage() {
  const [accounts, recent, month] = await Promise.all([
    getAccountBalances(),
    getRecentTransactions(5),
    getMonthTotals(),
  ])

  const monthName = new Intl.DateTimeFormat('en-IN', { month: 'long' }).format(new Date())

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm text-slate-500">
          {new Intl.DateTimeFormat('en-IN', { weekday: 'long', day: 'numeric', month: 'short' }).format(new Date())}
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Your money</h1>
      </header>

      {accounts.length === 0 ? (
        <EmptyState
          icon="🏦"
          title="No accounts yet"
          body="Add your first account to see your total balance here."
          action={
            <Link href="/accounts" className="inline-block rounded-2xl bg-indigo-600 px-5 py-3 font-semibold text-white">
              Add an account
            </Link>
          }
        />
      ) : (
        <BalanceCard accounts={accounts} />
      )}

      <section className="grid grid-cols-2 gap-3">
        <div className="glass rounded-3xl px-4 py-4">
          <p className="text-xs font-medium text-slate-500">In · {monthName}</p>
          <p className="mt-1 text-lg font-bold tabular-nums text-emerald-600">{formatINR(month.income)}</p>
        </div>
        <div className="glass rounded-3xl px-4 py-4">
          <p className="text-xs font-medium text-slate-500">Out · {monthName}</p>
          <p className="mt-1 text-lg font-bold tabular-nums text-rose-500">{formatINR(month.expense)}</p>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Recent</h2>
          {recent.length > 0 && (
            <Link href="/transactions" className="text-sm font-medium text-indigo-600">
              See all
            </Link>
          )}
        </div>

        {recent.length === 0 ? (
          <EmptyState icon="🧾" title="Nothing logged yet" body="Tap the + button to add your first transaction." />
        ) : (
          <ul className="glass divide-y divide-slate-100/80 rounded-3xl px-4">
            {recent.map((t) => (
              <li key={t.id} className="flex items-center gap-3 py-3.5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-lg">
                  {t.categories?.icon ?? '📦'}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-slate-900">
                    {t.note || t.categories?.name || 'Transaction'}
                  </span>
                  <span className="block truncate text-xs text-slate-400">
                    {t.accounts?.name} · {formatDayLabel(t.occurred_at)}
                  </span>
                </span>
                <Amount value={t.amount} kind={t.kind} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
```

- [ ] **Step 9: Verify manually**

Run `npm run dev` and open the home screen with at least two accounts. Confirm: the total equals the sum shown in the ⓘ sheet; tapping ⓘ opens the sheet; Escape and scrim tap both close it; the eye toggle hides amounts and survives a page reload.

- [ ] **Step 10: Commit**

```bash
git add lib/queries/transactions.ts components/balance-card.tsx components/account-breakdown-sheet.tsx components/account-breakdown-sheet.test.tsx components/amount.tsx "app/(app)/page.tsx"
git commit -m "feat: add home screen with total balance and per-account breakdown"
```

---

### Task 9: Add transaction

**Files:**
- Create: `app/(app)/add/page.tsx`, `app/(app)/add/actions.ts`, `app/(app)/add/add-form.tsx`

**Interfaces:**
- Consumes: `transactionSchema` (Task 5), `getAccountBalances` (Task 7), `createServerSupabase` (Task 4)
- Produces: `createTransaction(prev, formData)` returning `{ error?: string }` and redirecting to `/` on success

- [ ] **Step 1: Create `app/(app)/add/actions.ts`**

```typescript
'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createServerSupabase } from '@/lib/supabase/server'
import { transactionSchema } from '@/lib/schemas'

export type ActionState = { error?: string }

export async function createTransaction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = transactionSchema.safeParse({
    account_id: formData.get('account_id'),
    category_id: formData.get('category_id') ?? '',
    amount: formData.get('amount'),
    kind: formData.get('kind'),
    note: formData.get('note') ?? undefined,
    occurred_at: formData.get('occurred_at'),
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Your session expired. Please sign in again.' }

  const { error } = await supabase
    .from('transactions')
    .insert({ ...parsed.data, user_id: user.id })

  if (error) return { error: 'Could not save the transaction. Please try again.' }

  revalidatePath('/')
  revalidatePath('/accounts')
  revalidatePath('/transactions')
  revalidatePath('/stats')
  redirect('/')
}
```

- [ ] **Step 2: Create `app/(app)/add/page.tsx`**

```tsx
import Link from 'next/link'
import { getAccountBalances } from '@/lib/queries/balances'
import { createServerSupabase } from '@/lib/supabase/server'
import { EmptyState } from '@/components/empty-state'
import { AddForm } from './add-form'
import type { Category } from '@/lib/types'

export default async function AddPage() {
  const supabase = await createServerSupabase()
  const [accounts, categoriesResult] = await Promise.all([
    getAccountBalances(),
    supabase.from('categories').select('*').order('name'),
  ])

  if (accounts.length === 0) {
    return (
      <EmptyState
        icon="🏦"
        title="Add an account first"
        body="Transactions need an account to belong to."
        action={
          <Link href="/accounts" className="inline-block rounded-2xl bg-indigo-600 px-5 py-3 font-semibold text-white">
            Go to accounts
          </Link>
        }
      />
    )
  }

  return (
    <AddForm
      accounts={accounts.map((a) => ({ id: a.id, name: a.name }))}
      categories={(categoriesResult.data ?? []) as Category[]}
    />
  )
}
```

- [ ] **Step 3: Create `app/(app)/add/add-form.tsx`**

```tsx
'use client'

import { useActionState, useState } from 'react'
import { SubmitButton } from '@/components/submit-button'
import { createTransaction, type ActionState } from './actions'
import type { Category, TxKind } from '@/lib/types'

const field =
  'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100'

function todayIso() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function AddForm({
  accounts,
  categories,
}: {
  accounts: { id: string; name: string }[]
  categories: Category[]
}) {
  const [state, action] = useActionState<ActionState, FormData>(createTransaction, {})
  const [kind, setKind] = useState<TxKind>('expense')
  const [categoryId, setCategoryId] = useState('')

  const visible = categories.filter((c) => c.kind === kind)

  return (
    <form action={action} className="space-y-5">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">Add transaction</h1>

      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="category_id" value={categoryId} />

      <div className="grid grid-cols-2 gap-1 rounded-2xl bg-slate-100 p-1">
        {(['expense', 'income'] as const).map((k) => (
          <button
            key={k}
            type="button"
            aria-pressed={kind === k}
            onClick={() => { setKind(k); setCategoryId('') }}
            className={`rounded-xl py-2.5 text-sm font-semibold capitalize transition ${
              kind === k ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
            }`}
          >
            {k}
          </button>
        ))}
      </div>

      <div className="glass rounded-3xl px-5 py-6 text-center">
        <label htmlFor="amount" className="text-xs font-medium text-slate-500">
          Amount
        </label>
        <div className="mt-1 flex items-center justify-center gap-1">
          <span className="text-2xl font-bold text-slate-400">₹</span>
          <input
            id="amount"
            name="amount"
            type="number"
            step="0.01"
            min="0.01"
            inputMode="decimal"
            placeholder="0.00"
            required
            autoFocus
            className="w-full max-w-[220px] bg-transparent text-center text-4xl font-bold tabular-nums text-slate-900 outline-none placeholder:text-slate-300"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-slate-500">Category</label>
        <div className="flex flex-wrap gap-2">
          {visible.map((c) => (
            <button
              key={c.id}
              type="button"
              aria-pressed={categoryId === c.id}
              onClick={() => setCategoryId(c.id)}
              className={`rounded-full border px-3.5 py-2 text-sm transition ${
                categoryId === c.id
                  ? 'border-indigo-500 bg-indigo-50 font-semibold text-indigo-700'
                  : 'border-slate-200 bg-white text-slate-600'
              }`}
            >
              <span className="mr-1">{c.icon}</span>
              {c.name}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="account_id" className="text-xs font-medium text-slate-500">Account</label>
        <select id="account_id" name="account_id" className={field} required defaultValue={accounts[0]?.id}>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label htmlFor="occurred_at" className="text-xs font-medium text-slate-500">Date</label>
        <input id="occurred_at" name="occurred_at" type="date" className={field} defaultValue={todayIso()} required />
      </div>

      <input name="note" className={field} placeholder="Note (optional)" maxLength={120} />

      {state.error && (
        <p role="alert" className="rounded-xl bg-rose-50 px-4 py-2.5 text-sm text-rose-600">
          {state.error}
        </p>
      )}

      <SubmitButton pendingLabel="Saving…">Save transaction</SubmitButton>
    </form>
  )
}
```

- [ ] **Step 4: Verify the balance updates**

Run `npm run dev`. Note the home total. Add an expense of ₹500 against an account, then confirm on return to home that the total dropped by exactly ₹500 and that the ⓘ sheet shows the drop on that one account. This is the end-to-end proof that the derived-balance view works.

- [ ] **Step 5: Commit**

```bash
git add "app/(app)/add"
git commit -m "feat: add transaction entry screen"
```

---

### Task 10: Transaction history

**Files:**
- Create: `app/(app)/transactions/page.tsx`

**Interfaces:**
- Consumes: `getAllTransactions` (Task 8), `formatDayLabel` (Task 2), `<Amount>` (Task 8)
- Produces: nothing consumed by later tasks

- [ ] **Step 1: Create `app/(app)/transactions/page.tsx`**

```tsx
import Link from 'next/link'
import { getAllTransactions } from '@/lib/queries/transactions'
import { formatDayLabel } from '@/lib/format'
import { Amount } from '@/components/amount'
import { EmptyState } from '@/components/empty-state'
import type { TransactionWithRefs } from '@/lib/types'

function groupByDay(rows: TransactionWithRefs[]) {
  const groups = new Map<string, TransactionWithRefs[]>()
  for (const t of rows) {
    const list = groups.get(t.occurred_at) ?? []
    list.push(t)
    groups.set(t.occurred_at, list)
  }
  return [...groups.entries()]
}

export default async function TransactionsPage() {
  const transactions = await getAllTransactions()
  const days = groupByDay(transactions)

  return (
    <div className="space-y-5">
      <header className="flex items-center gap-3">
        <Link href="/" aria-label="Back" className="text-slate-400">‹</Link>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">History</h1>
      </header>

      {days.length === 0 ? (
        <EmptyState icon="🧾" title="No transactions yet" body="Tap the + button to log your first one." />
      ) : (
        days.map(([day, rows]) => (
          <section key={day}>
            <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
              {formatDayLabel(day)}
            </h2>
            <ul className="glass divide-y divide-slate-100/80 rounded-3xl px-4">
              {rows.map((t) => (
                <li key={t.id} className="flex items-center gap-3 py-3.5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-lg">
                    {t.categories?.icon ?? '📦'}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-slate-900">
                      {t.note || t.categories?.name || 'Transaction'}
                    </span>
                    <span className="block truncate text-xs text-slate-400">{t.accounts?.name}</span>
                  </span>
                  <Amount value={t.amount} kind={t.kind} />
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify manually**

Add transactions on two different dates and confirm they appear under separate day headings, newest day first, with "Today" as the top heading.

- [ ] **Step 3: Commit**

```bash
git add "app/(app)/transactions"
git commit -m "feat: add transaction history grouped by day"
```

---

### Task 11: Stats — monthly spending by category

**Files:**
- Create: `lib/queries/stats.ts`, `app/(app)/stats/page.tsx`
- Test: `lib/queries/stats.test.ts`

**Interfaces:**
- Consumes: `createServerSupabase` (Task 4), `formatINR` (Task 2)
- Produces: `aggregateByCategory(rows): CategorySpend[]` where `CategorySpend = { name: string; icon: string; total: number; share: number }`; `getMonthlySpend(monthIso: string)`

- [ ] **Step 1: Write the failing aggregation test**

`lib/queries/stats.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { aggregateByCategory } from './stats'

const row = (name: string, icon: string, amount: number) => ({
  amount,
  categories: { name, icon },
})

describe('aggregateByCategory', () => {
  it('returns an empty list for no rows', () => {
    expect(aggregateByCategory([])).toEqual([])
  })

  it('sums amounts within a category', () => {
    const result = aggregateByCategory([
      row('Food', '🍔', 200),
      row('Food', '🍔', 300),
    ])
    expect(result).toEqual([{ name: 'Food', icon: '🍔', total: 500, share: 1 }])
  })

  it('sorts categories by total, largest first', () => {
    const result = aggregateByCategory([
      row('Food', '🍔', 100),
      row('Transport', '🚌', 400),
    ])
    expect(result.map((r) => r.name)).toEqual(['Transport', 'Food'])
  })

  it('computes each share of the total spend', () => {
    const result = aggregateByCategory([
      row('Food', '🍔', 250),
      row('Bills', '🧾', 750),
    ])
    expect(result[0].share).toBeCloseTo(0.75)
    expect(result[1].share).toBeCloseTo(0.25)
  })

  it('buckets uncategorised rows under Uncategorised', () => {
    const result = aggregateByCategory([{ amount: 100, categories: null }])
    expect(result[0].name).toBe('Uncategorised')
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run lib/queries/stats.test.ts`
Expected: FAIL — cannot resolve `./stats`.

- [ ] **Step 3: Implement `lib/queries/stats.ts`**

```typescript
import { createServerSupabase } from '@/lib/supabase/server'

export type CategorySpend = { name: string; icon: string; total: number; share: number }

type SpendRow = { amount: number; categories: { name: string; icon: string } | null }

/** Groups expense rows by category, sorted by total descending, with each row's share of the whole. */
export function aggregateByCategory(rows: SpendRow[]): CategorySpend[] {
  const buckets = new Map<string, { icon: string; paise: number }>()

  for (const row of rows) {
    const name = row.categories?.name ?? 'Uncategorised'
    const icon = row.categories?.icon ?? '📦'
    const current = buckets.get(name) ?? { icon, paise: 0 }
    current.paise += Math.round(Number(row.amount) * 100)
    buckets.set(name, current)
  }

  const totalPaise = [...buckets.values()].reduce((a, b) => a + b.paise, 0)
  if (totalPaise === 0) return []

  return [...buckets.entries()]
    .map(([name, { icon, paise }]) => ({
      name,
      icon,
      total: paise / 100,
      share: paise / totalPaise,
    }))
    .sort((a, b) => b.total - a.total)
}

/** Expense rows for the calendar month containing monthIso (YYYY-MM-01), aggregated by category. */
export async function getMonthlySpend(monthIso: string): Promise<CategorySpend[]> {
  const [year, month] = monthIso.split('-').map(Number)
  const nextMonth = month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, '0')}-01`

  const supabase = await createServerSupabase()
  const { data, error } = await supabase
    .from('transactions')
    .select('amount, categories(name, icon)')
    .eq('kind', 'expense')
    .gte('occurred_at', monthIso)
    .lt('occurred_at', nextMonth)

  if (error) throw new Error(`Failed to load spending: ${error.message}`)
  return aggregateByCategory((data ?? []) as unknown as SpendRow[])
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run lib/queries/stats.test.ts`
Expected: 5 passing.

- [ ] **Step 5: Create `app/(app)/stats/page.tsx`**

```tsx
import { getMonthlySpend } from '@/lib/queries/stats'
import { formatINR } from '@/lib/format'
import { sumAmounts } from '@/lib/money'
import { EmptyState } from '@/components/empty-state'

const BARS = ['#6366F1', '#8B5CF6', '#0EA5E9', '#10B981', '#F59E0B', '#EF4444']

export default async function StatsPage() {
  const now = new Date()
  const monthIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  const spend = await getMonthlySpend(monthIso)
  const total = sumAmounts(spend.map((s) => s.total))
  const monthName = new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' }).format(now)

  return (
    <div className="space-y-5">
      <header>
        <p className="text-sm text-slate-500">{monthName}</p>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Spending</h1>
      </header>

      {spend.length === 0 ? (
        <EmptyState icon="📊" title="No spending this month" body="Log an expense and your breakdown appears here." />
      ) : (
        <>
          <section className="glass rounded-[28px] px-6 py-6">
            <p className="text-sm font-medium text-slate-500">Total spent</p>
            <p className="mt-1 text-[clamp(1.7rem,8vw,2.3rem)] font-bold tabular-nums text-slate-900">
              {formatINR(total)}
            </p>

            <div className="mt-5 flex h-2.5 overflow-hidden rounded-full bg-slate-100">
              {spend.map((s, i) => (
                <div
                  key={s.name}
                  style={{ width: `${s.share * 100}%`, background: BARS[i % BARS.length] }}
                  title={`${s.name} ${Math.round(s.share * 100)}%`}
                />
              ))}
            </div>
          </section>

          <ul className="glass divide-y divide-slate-100/80 rounded-3xl px-4">
            {spend.map((s, i) => (
              <li key={s.name} className="flex items-center gap-3 py-3.5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-lg">
                  {s.icon}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-slate-900">{s.name}</span>
                  <span className="mt-1.5 block h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <span
                      className="block h-full rounded-full"
                      style={{ width: `${s.share * 100}%`, background: BARS[i % BARS.length] }}
                    />
                  </span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block font-semibold tabular-nums text-slate-900">{formatINR(s.total)}</span>
                  <span className="block text-xs text-slate-400">{Math.round(s.share * 100)}%</span>
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 6: Verify manually**

Log expenses in two categories and confirm the stats page totals them, orders them largest first, and shows percentages summing to roughly 100.

- [ ] **Step 7: Commit**

```bash
git add lib/queries/stats.ts lib/queries/stats.test.ts "app/(app)/stats"
git commit -m "feat: add monthly spending breakdown by category"
```

---

### Task 12: Profile and sign out

**Files:**
- Create: `app/(app)/profile/page.tsx`, `app/(app)/profile/actions.ts`, `app/(app)/profile/profile-form.tsx`

**Interfaces:**
- Consumes: `profileSchema` (Task 5), `signOut` (Task 5), `createServerSupabase` (Task 4)
- Produces: `updateProfile(prev, formData)`

- [ ] **Step 1: Create `app/(app)/profile/actions.ts`**

```typescript
'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabase } from '@/lib/supabase/server'
import { profileSchema } from '@/lib/schemas'

export type ProfileState = { error?: string; saved?: boolean }

export async function updateProfile(
  _prev: ProfileState,
  formData: FormData
): Promise<ProfileState> {
  const parsed = profileSchema.safeParse({ display_name: formData.get('display_name') })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Your session expired. Please sign in again.' }

  const { error } = await supabase.from('profiles').update(parsed.data).eq('id', user.id)
  if (error) return { error: 'Could not save your profile. Please try again.' }

  revalidatePath('/profile')
  return { saved: true }
}
```

- [ ] **Step 2: Create `app/(app)/profile/profile-form.tsx`**

```tsx
'use client'

import { useActionState } from 'react'
import { SubmitButton } from '@/components/submit-button'
import { updateProfile, type ProfileState } from './actions'

const field =
  'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100'

export function ProfileForm({ displayName }: { displayName: string }) {
  const [state, action] = useActionState<ProfileState, FormData>(updateProfile, {})

  return (
    <form action={action} className="space-y-3">
      <label htmlFor="display_name" className="block text-xs font-medium text-slate-500">
        Display name
      </label>
      <input id="display_name" name="display_name" className={field} defaultValue={displayName} required maxLength={50} />

      {state.saved && (
        <p role="status" className="rounded-xl bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">
          Saved.
        </p>
      )}
      {state.error && (
        <p role="alert" className="rounded-xl bg-rose-50 px-4 py-2.5 text-sm text-rose-600">
          {state.error}
        </p>
      )}

      <SubmitButton pendingLabel="Saving…">Save</SubmitButton>
    </form>
  )
}
```

- [ ] **Step 3: Create `app/(app)/profile/page.tsx`**

```tsx
import { createServerSupabase } from '@/lib/supabase/server'
import { signOut } from '@/app/(auth)/actions'
import { ProfileForm } from './profile-form'

export default async function ProfilePage() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, currency')
    .eq('id', user!.id)
    .single()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">Profile</h1>

      <section className="glass rounded-3xl px-5 py-5">
        <ProfileForm displayName={profile?.display_name ?? ''} />
      </section>

      <section className="glass rounded-3xl px-5 py-4">
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate-500">Email</dt>
            <dd className="font-medium text-slate-900">{user?.email}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Currency</dt>
            <dd className="font-medium text-slate-900">{profile?.currency ?? 'INR'}</dd>
          </div>
        </dl>
      </section>

      <form action={signOut}>
        <button type="submit" className="w-full rounded-2xl border border-rose-200 bg-rose-50 py-3.5 font-semibold text-rose-600 active:scale-[0.98]">
          Sign out
        </button>
      </form>
    </div>
  )
}
```

- [ ] **Step 4: Verify manually**

Change the display name and confirm "Saved." appears and the value persists after reload. Sign out and confirm you land on `/login` and that navigating to `/` redirects back to login.

- [ ] **Step 5: Commit**

```bash
git add "app/(app)/profile"
git commit -m "feat: add profile screen with display name and sign out"
```

---

### Task 13: Error boundaries and full-suite verification

**Files:**
- Create: `app/(app)/error.tsx`, `app/(app)/loading.tsx`, `README.md`
- Modify: none

**Interfaces:**
- Consumes: everything above
- Produces: a verified, documented build

- [ ] **Step 1: Create `app/(app)/error.tsx`**

```tsx
'use client'

export default function AppError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="glass mt-10 rounded-3xl px-6 py-10 text-center">
      <div className="mb-3 text-4xl">⚠️</div>
      <h2 className="font-semibold text-slate-900">Something went wrong</h2>
      <p className="mx-auto mt-1 max-w-[30ch] text-sm text-slate-500">
        We could not load this screen. Check your connection and try again.
      </p>
      <button onClick={reset} className="mt-5 rounded-2xl bg-slate-900 px-5 py-3 font-semibold text-white">
        Try again
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Create `app/(app)/loading.tsx`**

```tsx
export default function Loading() {
  return (
    <div className="space-y-4 pt-2">
      <div className="h-6 w-40 animate-pulse rounded-lg bg-slate-200/70" />
      <div className="h-40 animate-pulse rounded-[28px] bg-slate-200/60" />
      <div className="grid grid-cols-2 gap-3">
        <div className="h-20 animate-pulse rounded-3xl bg-slate-200/60" />
        <div className="h-20 animate-pulse rounded-3xl bg-slate-200/60" />
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Run the full test suite**

Run: `npm test`
Expected: all suites pass — `format` (10), `money` (5), `schemas` (3), `bottom-nav` (3), `account-breakdown-sheet` (4), `stats` (5). Total 30 passing.

- [ ] **Step 4: Run a production build**

Run: `npm run build`
Expected: build completes with no TypeScript or lint errors. Fix any that appear before continuing — do not proceed with a failing build.

- [ ] **Step 5: Verify responsiveness at three widths**

With `npm run dev` running, check `/`, `/accounts`, `/add`, `/stats`, `/profile` at 320px, 390px, and 1440px viewport widths. At every width: no horizontal scrollbar, the navbar stays fixed and fully tappable, and text never overflows its container.

- [ ] **Step 6: Verify RLS isolation**

Sign up a second user in a private window, add an account, and confirm the first user's accounts are not visible and the second user's total starts from their own accounts only. This is the check that proves the policies work in practice.

- [ ] **Step 7: Write `README.md`**

```markdown
# Razd

Mobile-first personal finance tracker. Next.js 15 + Supabase.

## Setup

1. `npm install`
2. Copy `.env.example` to `.env` and fill in your Supabase project values.
3. Apply `supabase/migrations/0001_init.sql` to your Supabase project.
4. `npm run dev`

## Scripts

- `npm run dev` — development server
- `npm test` — unit and component tests
- `npm run build` — production build

## Architecture

Server Components read from Supabase through a cookie-bound client; Server Actions
handle every write and revalidate affected routes. Account balances are derived in the
`account_balances` Postgres view from `opening_balance` plus signed transactions — no
balance is ever stored, so the home total and per-account breakdown cannot disagree.
Row Level Security isolates each user's rows in the database.
```

- [ ] **Step 8: Commit**

```bash
git add "app/(app)/error.tsx" "app/(app)/loading.tsx" README.md
git commit -m "feat: add error and loading states, document setup"
```

---

### Task 14: End-to-end test of the money flow

**Files:**
- Create: `playwright.config.ts`, `e2e/money-flow.spec.ts`
- Modify: `package.json` (add `test:e2e` script)

**Interfaces:**
- Consumes: the whole app
- Produces: an automated proof that adding a transaction moves the home total, at a mobile viewport

This is the one test that proves the derived-balance design works end to end: the total on
Home, the per-account breakdown, and the transaction that changed them are all covered in
a single pass.

- [ ] **Step 1: Install Playwright**

```bash
npm install -D @playwright/test
npx playwright install chromium
```

- [ ] **Step 2: Create `playwright.config.ts`**

```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  timeout: 45_000,
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'mobile', use: { ...devices['iPhone 13'] } },
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000/login',
    reuseExistingServer: true,
    timeout: 120_000,
  },
})
```

- [ ] **Step 3: Add the script to `package.json`**

```json
"test:e2e": "playwright test"
```

- [ ] **Step 4: Disable email confirmation in Supabase for the test to pass**

In the Supabase dashboard: Authentication → Providers → Email → turn off "Confirm email".
Without this, a freshly signed-up test user has no session and the test cannot proceed.
Note this in the README as a development-only setting.

- [ ] **Step 5: Write the end-to-end test**

`e2e/money-flow.spec.ts`:

```typescript
import { test, expect } from '@playwright/test'

// A distinct email per run so each test starts from a clean, empty account.
const stamp = process.env.E2E_STAMP ?? String(process.hrtime.bigint())
const email = `e2e+${stamp}@example.com`
const password = 'test-password-123'

test('signup, add accounts, log an expense, and see the total change', async ({ page }) => {
  // Sign up
  await page.goto('/signup')
  await page.getByPlaceholder('Email').fill(email)
  await page.getByPlaceholder(/Password/).fill(password)
  await page.getByRole('button', { name: 'Create account' }).click()
  await expect(page).toHaveURL('/')

  // Home starts empty
  await expect(page.getByText('No accounts yet')).toBeVisible()

  // Add two accounts
  for (const [name, balance] of [['HDFC', '50000'], ['Cash', '2000']] as const) {
    await page.goto('/accounts')
    await page.getByRole('button', { name: /New|Add your first account/ }).first().click()
    await page.getByPlaceholder('Account name').fill(name)
    await page.getByLabel(/Opening balance/).fill(balance)
    await page.getByRole('button', { name: 'Add account' }).click()
    await expect(page.getByText(name)).toBeVisible()
  }

  // Home shows the combined total
  await page.goto('/')
  await expect(page.getByText('₹52,000.00')).toBeVisible()

  // The info sheet lists both accounts and its total agrees with the headline
  await page.getByRole('button', { name: 'Show balance by account' }).click()
  await expect(page.getByRole('dialog', { name: 'Balance by account' })).toBeVisible()
  await expect(page.getByText('₹50,000.00')).toBeVisible()
  await expect(page.getByTestId('breakdown-total')).toHaveText('₹52,000.00')
  await page.keyboard.press('Escape')

  // Log a ₹500 expense
  await page.goto('/add')
  await page.getByLabel('Amount').fill('500')
  await page.getByRole('button', { name: 'Food' }).click()
  await page.getByRole('button', { name: 'Save transaction' }).click()

  // The derived total dropped by exactly ₹500
  await expect(page).toHaveURL('/')
  await expect(page.getByText('₹51,500.00')).toBeVisible()

  // And the transaction appears in Recent
  await expect(page.getByText('Food')).toBeVisible()
})

test('bottom navigation reaches every tab', async ({ page }) => {
  await page.goto('/login')
  await page.getByPlaceholder('Email').fill(email)
  await page.getByPlaceholder('Password').fill(password)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page).toHaveURL('/')

  for (const [name, heading] of [
    ['Accounts', 'Accounts'],
    ['Stats', 'Spending'],
    ['Profile', 'Profile'],
    ['Home', 'Your money'],
  ] as const) {
    await page.getByRole('link', { name, exact: true }).click()
    await expect(page.getByRole('heading', { name: heading })).toBeVisible()
  }
})

test('signed-out visitors are redirected to login', async ({ browser }) => {
  const context = await browser.newContext()
  const page = await context.newPage()
  await page.goto('/')
  await expect(page).toHaveURL('/login')
  await context.close()
})
```

The second test depends on the user created by the first, so `fullyParallel` is off and
`workers` is 1 in the config — do not change those.

- [ ] **Step 6: Run the end-to-end suite**

Run: `npx playwright test --project=mobile`
Expected: 3 passing.

If the signup step lands on `/signup` with "Check your inbox", email confirmation is still
on — revisit Step 4.

- [ ] **Step 7: Run it at desktop width too**

Run: `npx playwright test --project=desktop`
Expected: 3 passing — the same flows work in the centered desktop frame.

- [ ] **Step 8: Add the e2e artifacts to `.gitignore`**

Confirm `/playwright-report` and `/test-results` are listed (added in Task 1). Add them if missing.

- [ ] **Step 9: Commit**

```bash
git add playwright.config.ts e2e package.json package-lock.json .gitignore
git commit -m "test: add end-to-end coverage of the signup and money flow"
```
