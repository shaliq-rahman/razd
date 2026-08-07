-- Monthly commitments such as EMIs, rent, and subscriptions.
create table if not exists recurring_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  amount numeric(14,2) not null check (amount > 0),
  due_date date not null,
  is_paid boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists recurring_payments_user_due_idx
  on recurring_payments (user_id, due_date);

alter table recurring_payments enable row level security;

drop policy if exists "recurring payments select own" on recurring_payments;
create policy "recurring payments select own" on recurring_payments
  for select using (user_id = auth.uid());

drop policy if exists "recurring payments insert own" on recurring_payments;
create policy "recurring payments insert own" on recurring_payments
  for insert with check (user_id = auth.uid());

drop policy if exists "recurring payments update own" on recurring_payments;
create policy "recurring payments update own" on recurring_payments
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "recurring payments delete own" on recurring_payments;
create policy "recurring payments delete own" on recurring_payments
  for delete using (user_id = auth.uid());
