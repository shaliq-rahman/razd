-- Use stable icon keys in data; the UI renders them as platform-consistent SVGs.
with defaults(name, icon, kind) as (
  values
    ('Food',          'food',          'expense'),
    ('Transport',     'transport',     'expense'),
    ('Shopping',      'shopping',      'expense'),
    ('Bills',         'bills',         'expense'),
    ('Health',        'health',        'expense'),
    ('Entertainment', 'entertainment', 'expense'),
    ('Diapers',       'diapers',       'expense'),
    ('Fruits & Vegetables', 'fruits-vegetables', 'expense'),
    ('Salary',        'salary',        'income'),
    ('Other',         'other',         'income')
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
    (new.id, 'Food',          'food',          'expense', true),
    (new.id, 'Transport',     'transport',     'expense', true),
    (new.id, 'Shopping',      'shopping',      'expense', true),
    (new.id, 'Bills',         'bills',         'expense', true),
    (new.id, 'Health',        'health',        'expense', true),
    (new.id, 'Entertainment', 'entertainment', 'expense', true),
    (new.id, 'Diapers',       'diapers',       'expense', true),
    (new.id, 'Fruits & Vegetables', 'fruits-vegetables', 'expense', true),
    (new.id, 'Salary',        'salary',        'income',  true),
    (new.id, 'Other',         'other',         'income',  true)
  on conflict (user_id, name, kind) do nothing;

  return new;
end;
$$;
