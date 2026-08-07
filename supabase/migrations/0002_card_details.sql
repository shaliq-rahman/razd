-- Real card metadata used by the accounts wallet UI.
alter table accounts
  add column if not exists card_limit numeric(14,2),
  add column if not exists due_day smallint;

alter table accounts drop constraint if exists accounts_card_limit_check;
alter table accounts add constraint accounts_card_limit_check
  check (card_limit is null or card_limit > 0);

alter table accounts drop constraint if exists accounts_due_day_check;
alter table accounts add constraint accounts_due_day_check
  check (due_day is null or due_day between 1 and 31);

-- Give existing cards a sensible migration value; users can edit it later.
update accounts
set card_limit = greatest(opening_balance, 1)
where type = 'card' and card_limit is null;

-- Preserve the existing view column order and append the new metadata.
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
  a.due_day
from accounts a
left join transactions t on t.account_id = a.id
group by a.id;
