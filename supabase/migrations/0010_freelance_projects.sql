-- Freelance project tracking: quoted work per client, and the payments
-- received against it. Each payment also creates a linked income
-- transaction (category "Freelance") so account balances and stats stay in
-- sync automatically.

create table if not exists freelance_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  client_name text not null,
  quoted_amount numeric(14,2) not null check (quoted_amount > 0),
  start_date date not null default current_date,
  end_date date,
  description text,
  status text not null default 'active' check (status in ('active', 'on_hold', 'completed', 'cancelled')),
  created_at timestamptz not null default now()
);

create index if not exists freelance_projects_user_idx on freelance_projects (user_id);
alter table freelance_projects enable row level security;

drop policy if exists "freelance_projects select own" on freelance_projects;
create policy "freelance_projects select own" on freelance_projects
  for select using (user_id = auth.uid());

drop policy if exists "freelance_projects insert own" on freelance_projects;
create policy "freelance_projects insert own" on freelance_projects
  for insert with check (user_id = auth.uid());

drop policy if exists "freelance_projects update own" on freelance_projects;
create policy "freelance_projects update own" on freelance_projects
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "freelance_projects delete own" on freelance_projects;
create policy "freelance_projects delete own" on freelance_projects
  for delete using (user_id = auth.uid());

-- Freelance payments ---------------------------------------------------------
create table if not exists freelance_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null references freelance_projects(id) on delete cascade,
  -- The income transaction this payment created. Kept nullable with
  -- on-delete-set-null: deleting a project must never delete the money
  -- movement already recorded in transactions/account balances.
  transaction_id uuid references transactions(id) on delete set null,
  account_id uuid not null references accounts(id) on delete cascade,
  amount numeric(14,2) not null check (amount > 0),
  occurred_at date not null default current_date,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists freelance_payments_project_idx on freelance_payments (project_id);
create index if not exists freelance_payments_user_idx on freelance_payments (user_id);
alter table freelance_payments enable row level security;

drop policy if exists "freelance_payments select own" on freelance_payments;
create policy "freelance_payments select own" on freelance_payments
  for select using (user_id = auth.uid());

drop policy if exists "freelance_payments insert own" on freelance_payments;
create policy "freelance_payments insert own" on freelance_payments
  for insert with check (user_id = auth.uid());

drop policy if exists "freelance_payments update own" on freelance_payments;
create policy "freelance_payments update own" on freelance_payments
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "freelance_payments delete own" on freelance_payments;
create policy "freelance_payments delete own" on freelance_payments
  for delete using (user_id = auth.uid());
