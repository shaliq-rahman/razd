alter table recurring_payments
  add column if not exists end_date date;

-- Preserve existing rows before making the new field mandatory.
update recurring_payments
set end_date = due_date
where end_date is null;

alter table recurring_payments
  alter column end_date set not null;

alter table recurring_payments
  drop constraint if exists recurring_payments_end_after_due_check;

alter table recurring_payments
  add constraint recurring_payments_end_after_due_check
  check (end_date >= due_date);
