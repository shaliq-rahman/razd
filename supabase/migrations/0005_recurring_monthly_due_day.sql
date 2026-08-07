-- Recurring payments repeat monthly on a day of the month ("the 5th of every
-- month") rather than falling due on one fixed calendar date.
--
-- Three consequences of that change are handled here:
--   1. due_date (a single date) becomes due_day (1-31).
--   2. is_paid (a permanent boolean) becomes paid_month, so a payment settled
--      in August is owed again in September instead of reading "Paid" forever.
--   3. Settling a payment can move real money, so the row remembers which
--      account it settles against and which transaction it produced.

alter table recurring_payments
  add column if not exists due_day smallint,
  add column if not exists paid_month date,
  add column if not exists account_id uuid references accounts(id) on delete set null,
  add column if not exists paid_transaction_id uuid references transactions(id) on delete set null;

-- Carry existing rows over: the day of the old due_date becomes the monthly day.
update recurring_payments
set due_day = extract(day from due_date)::smallint
where due_day is null;

-- A row already marked paid counts as settled for the month it was due in.
update recurring_payments
set paid_month = date_trunc('month', due_date)::date
where is_paid and paid_month is null;

alter table recurring_payments
  alter column due_day set not null;

alter table recurring_payments
  drop constraint if exists recurring_payments_due_day_check;
alter table recurring_payments
  add constraint recurring_payments_due_day_check
  check (due_day between 1 and 31);

-- paid_month always points at the first of a month.
alter table recurring_payments
  drop constraint if exists recurring_payments_paid_month_check;
alter table recurring_payments
  add constraint recurring_payments_paid_month_check
  check (paid_month is null or date_trunc('month', paid_month)::date = paid_month);

-- end_date was constrained against the old due_date, which no longer exists.
alter table recurring_payments
  drop constraint if exists recurring_payments_end_after_due_check;

alter table recurring_payments
  drop column if exists due_date,
  drop column if exists is_paid;

drop index if exists recurring_payments_user_due_idx;
create index if not exists recurring_payments_user_due_idx
  on recurring_payments (user_id, due_day);
create index if not exists recurring_payments_account_idx
  on recurring_payments (account_id);
