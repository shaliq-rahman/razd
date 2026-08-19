-- Add new default categories: Freelance (income); Lend, Fruits & Veggies,
-- Sweets, Bakery, Evening Tea, Miscellaneous (expense).
with defaults(name, icon, kind) as (
  values
    ('Freelance',        'freelance',        'income'),
    ('Lend',              'lend',              'expense'),
    ('Fruits & Veggies',  'fruits-veggies',    'expense'),
    ('Sweets',            'sweets',            'expense'),
    ('Bakery',            'bakery',            'expense'),
    ('Evening Tea',       'evening-tea',       'expense'),
    ('Miscellaneous',     'miscellaneous',     'expense')
)
insert into categories (user_id, name, icon, kind, is_default)
select users.id, defaults.name, defaults.icon, defaults.kind, true
from auth.users as users
cross join defaults
on conflict (user_id, name, kind) do update
set icon = excluded.icon,
    is_default = true;

create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, display_name)
  values (new.id, split_part(new.email, '@', 1))
  on conflict (id) do nothing;

  insert into categories (user_id, name, icon, kind, is_default) values
    (new.id, 'Food',              'food',              'expense', true),
    (new.id, 'Transport',         'transport',         'expense', true),
    (new.id, 'Shopping',          'shopping',          'expense', true),
    (new.id, 'Bills',             'bills',             'expense', true),
    (new.id, 'Health',            'health',            'expense', true),
    (new.id, 'Entertainment',     'entertainment',     'expense', true),
    (new.id, 'Diapers',           'diapers',           'expense', true),
    (new.id, 'Fruits & Vegetables', 'fruits-vegetables', 'expense', true),
    (new.id, 'Fruits & Veggies',  'fruits-veggies',    'expense', true),
    (new.id, 'Lend',              'lend',              'expense', true),
    (new.id, 'Sweets',            'sweets',            'expense', true),
    (new.id, 'Bakery',            'bakery',            'expense', true),
    (new.id, 'Evening Tea',       'evening-tea',       'expense', true),
    (new.id, 'Miscellaneous',     'miscellaneous',     'expense', true),
    (new.id, 'Salary',            'salary',            'income',  true),
    (new.id, 'Freelance',         'freelance',         'income',  true),
    (new.id, 'Other',             'other',             'income',  true)
  on conflict (user_id, name, kind) do nothing;

  return new;
end;
$$;
