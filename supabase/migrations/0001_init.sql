-- Razd initial schema: profiles, accounts, categories, transactions,
-- the derived account_balances view, and the signup bootstrap trigger.

-- Profiles ------------------------------------------------------------------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  currency text not null default 'INR',
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

drop policy if exists "profiles are self-readable" on profiles;
create policy "profiles are self-readable" on profiles
  for select using (id = auth.uid());

drop policy if exists "profiles are self-writable" on profiles;
create policy "profiles are self-writable" on profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- Accounts ------------------------------------------------------------------
create table if not exists accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null check (type in ('bank','cash','card','wallet','investment')),
  opening_balance numeric(14,2) not null default 0,
  color text not null default '#5B8DEF',
  is_archived boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists accounts_user_idx on accounts (user_id);
alter table accounts enable row level security;

drop policy if exists "accounts select own" on accounts;
create policy "accounts select own" on accounts
  for select using (user_id = auth.uid());

drop policy if exists "accounts insert own" on accounts;
create policy "accounts insert own" on accounts
  for insert with check (user_id = auth.uid());

drop policy if exists "accounts update own" on accounts;
create policy "accounts update own" on accounts
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "accounts delete own" on accounts;
create policy "accounts delete own" on accounts
  for delete using (user_id = auth.uid());

-- Categories ----------------------------------------------------------------
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  icon text not null default '📦',
  kind text not null check (kind in ('income','expense')),
  is_default boolean not null default false,
  unique (user_id, name, kind)
);

create index if not exists categories_user_idx on categories (user_id);
alter table categories enable row level security;

drop policy if exists "categories select own" on categories;
create policy "categories select own" on categories
  for select using (user_id = auth.uid());

drop policy if exists "categories insert own" on categories;
create policy "categories insert own" on categories
  for insert with check (user_id = auth.uid());

drop policy if exists "categories update own" on categories;
create policy "categories update own" on categories
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "categories delete own" on categories;
create policy "categories delete own" on categories
  for delete using (user_id = auth.uid());

-- Transactions --------------------------------------------------------------
create table if not exists transactions (
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

create index if not exists transactions_user_date_idx on transactions (user_id, occurred_at desc);
create index if not exists transactions_account_idx on transactions (account_id);
alter table transactions enable row level security;

drop policy if exists "transactions select own" on transactions;
create policy "transactions select own" on transactions
  for select using (user_id = auth.uid());

drop policy if exists "transactions insert own" on transactions;
create policy "transactions insert own" on transactions
  for insert with check (user_id = auth.uid());

drop policy if exists "transactions update own" on transactions;
create policy "transactions update own" on transactions
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "transactions delete own" on transactions;
create policy "transactions delete own" on transactions
  for delete using (user_id = auth.uid());

-- Derived balances ----------------------------------------------------------
-- No balance is ever stored. security_invoker keeps the caller's RLS policies
-- in force through the view, so a user only ever sees their own accounts.
create or replace view account_balances with (security_invoker = true) as
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
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, display_name)
  values (new.id, split_part(new.email, '@', 1))
  on conflict (id) do nothing;

  insert into categories (user_id, name, icon, kind, is_default) values
    (new.id, 'Food',          '🍔', 'expense', true),
    (new.id, 'Transport',     '🚌', 'expense', true),
    (new.id, 'Shopping',      '🛍️', 'expense', true),
    (new.id, 'Bills',         '🧾', 'expense', true),
    (new.id, 'Health',        '💊', 'expense', true),
    (new.id, 'Entertainment', '🎬', 'expense', true),
    (new.id, 'Salary',        '💰', 'income',  true),
    (new.id, 'Other',         '✨', 'income',  true)
  on conflict (user_id, name, kind) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
