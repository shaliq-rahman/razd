# Razd — Personal Finance Web App

Date: 2026-08-07
Status: Approved

## Purpose

A mobile-first, installable-feeling web app for tracking money across multiple accounts.
On a phone it should read as a native iOS app; on a laptop it stays usable rather than
stretching a phone layout across the screen.

## Decisions

| Question | Decision |
|---|---|
| Users | Public signup; every user's data isolated by Row Level Security |
| Balance model | Derived from transactions (approach A) — no stored balance column |
| Theme | Light glass (frosted white cards on soft light background) |
| Currency | INR, `en-IN` locale, Indian digit grouping |
| Nav | 5 tabs: Home / Accounts / Add (raised center) / Stats / Profile |
| v1 features | Accounts CRUD, transactions, categories + spending breakdown |
| Out of scope for v1 | Transfers between accounts, bank sync, budgets, recurring transactions, multi-currency, sharing |

## Stack

- Next.js 15, App Router, TypeScript
- Tailwind CSS v4
- Supabase Postgres + Auth via `@supabase/ssr` (cookie sessions)
- No client state library; Server Components read, Server Actions write

## Architecture

### Supabase clients

Three factories, all in `lib/supabase/`:

- `client.ts` — browser client, publishable key only. Used by Client Components
  (login form, logout button).
- `server.ts` — server client bound to the Next.js cookie store. Used by Server
  Components and Server Actions.
- `middleware.ts` — refreshes the auth cookie on every request, then redirects:
  unauthenticated requests to `/(app)/*` go to `/login`; authenticated requests to
  `/login` or `/signup` go to `/`.

The `SUPABASE_SECRET_KEY` is never referenced by application code. Only
`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` reach the browser.

### Routes

```
app/
  (auth)/
    login/page.tsx          centered glass card, no navbar
    signup/page.tsx
  (app)/
    layout.tsx              phone-frame container + bottom navbar
    page.tsx                Home — total balance, per-account breakdown, recent activity
    accounts/page.tsx       list + add/edit/delete
    transactions/page.tsx   full transaction history, grouped by day
    add/page.tsx            add-transaction screen (the center "+" tab)
    stats/page.tsx          monthly spending by category
    profile/page.tsx        display name, currency, sign out
  auth/callback/route.ts    email confirmation handler
  layout.tsx                root: fonts, theme colour, viewport-fit=cover
middleware.ts
```

### Data flow

1. Server Component calls `createServerClient()` and queries directly. First paint
   already contains data — no client fetch waterfall, no loading spinner on load.
2. Mutations are Server Actions in `app/(app)/*/actions.ts`. Each validates input with
   Zod, writes via the server client, then calls `revalidatePath` on the affected routes.
3. RLS enforces ownership in the database, so a missing `user_id` filter cannot leak
   another user's rows.

## Data model

All tables carry `user_id uuid not null references auth.users(id) on delete cascade`
and have RLS enabled with a single policy per operation: `user_id = auth.uid()`.

### `profiles`
| column | type | notes |
|---|---|---|
| id | uuid PK | references `auth.users(id)` |
| display_name | text | nullable |
| currency | text | default `'INR'` |
| created_at | timestamptz | default `now()` |

### `accounts`
| column | type | notes |
|---|---|---|
| id | uuid PK | default `gen_random_uuid()` |
| user_id | uuid | |
| name | text not null | e.g. "HDFC Savings" |
| type | text not null | check in `('bank','cash','card','wallet','investment')` |
| opening_balance | numeric(14,2) not null default 0 | balance before any logged transaction |
| color | text not null | accent for the account card |
| is_archived | boolean not null default false | |
| created_at | timestamptz default now() | |

### `categories`
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid | |
| name | text not null | |
| icon | text not null | emoji or icon key |
| kind | text not null | check in `('income','expense')` |
| is_default | boolean not null default false | seeded on signup |

Unique on `(user_id, name, kind)`.

### `transactions`
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid | |
| account_id | uuid not null | references `accounts(id)` on delete cascade |
| category_id | uuid | references `categories(id)` on delete set null |
| amount | numeric(14,2) not null | always positive; `check (amount > 0)` |
| kind | text not null | check in `('income','expense')` — carries the sign |
| note | text | nullable |
| occurred_at | date not null default current_date | |
| created_at | timestamptz default now() | |

Indexes: `(user_id, occurred_at desc)`, `(account_id)`.

### `account_balances` view

```sql
create view account_balances as
select
  a.*,
  a.opening_balance + coalesce(sum(
    case when t.kind = 'income' then t.amount else -t.amount end
  ), 0) as balance
from accounts a
left join transactions t on t.account_id = a.id
group by a.id;
```

The view runs with the invoker's permissions (`security_invoker = true`) so the
underlying RLS policies still apply.

Home issues one query against this view. The headline total is the sum of `balance`;
the info-tap sheet lists the same rows individually. Total and breakdown are therefore
guaranteed to agree.

### Signup trigger

An `after insert on auth.users` trigger inserts a `profiles` row and seeds default
categories (Food, Transport, Shopping, Bills, Health, Entertainment for expense;
Salary, Other for income).

## UI

### Responsive frame

The app layout is a single column with `max-width: 480px`, centered, full-height. On a
phone it fills the screen. On a laptop it renders as a phone-shaped column against a
soft gradient backdrop with a subtle border and shadow — deliberately app-like rather
than a stretched web page. Safe areas handled with `env(safe-area-inset-bottom)` and
`viewport-fit=cover` so the navbar clears the iOS home indicator.

Breakpoints: the layout is fluid from 320px up; nothing below 320px is supported.
Type scales with `clamp()`; no fixed pixel heights on content containers.

### Glass bottom navbar

Fixed to the bottom, inside the frame. `backdrop-filter: blur(24px) saturate(180%)`,
translucent white fill, hairline top border, soft upward shadow. The center "Add" tab
is a raised circular gradient button overlapping the bar. Active tab is indicated by
colour and a small dot, with a spring-feel transition. A `@supports not (backdrop-filter: blur())`
fallback swaps to an opaque background so the bar never becomes unreadable.

### Home screen

1. Greeting + date.
2. **Total balance card** — the hero. Large `₹` amount in `en-IN` grouping, gradient
   glass surface, and an ⓘ button in the corner.
3. Tapping ⓘ opens a **bottom sheet** listing every account with its name, type icon,
   colour dot, and individual balance, plus the total at the foot. Sheet slides up with
   a scrim, dismissed by swipe-down, scrim tap, or Escape.
4. **This month** — income in / expense out pair.
5. **Recent transactions** — last 5, each with category icon, note, account, signed amount.
   A "See all" link opens `/transactions`, the full history grouped by day. That screen
   has no tab of its own; it is reached from Home and from an account's detail sheet.

Amounts can be hidden with an eye toggle (persisted in `localStorage`) so the screen is
safe to show in public.

### Other screens

- **Accounts** — cards per account with balance; add/edit/delete via a sheet. Delete
  warns that its transactions go with it.
- **Add** (center tab) — a full-height sheet: amount keypad, income/expense toggle,
  account picker, category picker, date, optional note.
- **Stats** — month selector, total spend, donut of spending by category, ranked list
  with bars and percentages.
- **Profile** — display name, currency, sign out.

### Empty states

Every list has a designed empty state with a single call to action (e.g. Home with no
accounts shows "Add your first account" rather than ₹0.00 and blank space).

## Error handling

- **Auth** — Supabase error messages mapped to plain language ("That email is already
  registered", "Wrong email or password"). Never leak raw error strings.
- **Forms** — Zod validation on the server; field-level messages returned through
  `useActionState`. Client-side `required`/`inputmode` for immediate feedback only,
  never as the sole check.
- **Server Actions** — return `{ error: string }` rather than throwing; the UI renders
  it inline as a toast. Unexpected throws hit `error.tsx` per route group with a retry.
- **Not found / not owned** — no v1 route takes a record id in its path, so there is no
  not-found case to render. Mutations address records by id in form data, and RLS makes an
  id belonging to another user match zero rows: the write silently affects nothing rather
  than leaking that the record exists. Any future `/accounts/[id]` route must add a
  `not-found.tsx`.
- **Offline / network failure** — the submit button enters a pending state and, on
  failure, restores the entered values so nothing typed is lost.

## Testing

- **Unit (Vitest)** — currency formatting for INR grouping and negatives; balance
  arithmetic; Zod schemas at their boundaries (zero, negative, huge, non-numeric).
- **Database (SQL against a local Supabase)** — the `account_balances` view returns the
  expected number for a fixture set of income and expense rows; RLS proven by querying
  as user B and asserting zero rows of user A's data.
- **Component (Testing Library)** — the info sheet opens on ⓘ, lists one row per
  account, and its listed balances sum to the displayed total.
- **E2E (Playwright, mobile viewport)** — signup → add account → add transaction →
  home total reflects the transaction. Run at iPhone-sized and desktop viewports to
  confirm the layout holds and the navbar stays reachable.

## Security notes

`.env` currently holds a live database password and secret key and the project is not
yet a git repository. Before any commit: initialise git, add `.gitignore` covering
`.env*`, and commit an `.env.example` with placeholder values only.
