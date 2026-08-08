alter table accounts
  add column if not exists minimum_due_paid_month date;

alter table accounts
  drop constraint if exists accounts_minimum_due_paid_month_check;
alter table accounts
  add constraint accounts_minimum_due_paid_month_check
  check (
    minimum_due_paid_month is null
    or date_trunc('month', minimum_due_paid_month)::date = minimum_due_paid_month
  );

-- Preserve the existing view column order and append the new status field.
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
  ) as balance,
  a.card_limit,
  a.due_day,
  a.minimum_due_paid_month
from accounts a
left join transactions t on t.account_id = a.id
group by a.id;
