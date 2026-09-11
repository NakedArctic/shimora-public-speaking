-- Run once in the Supabase SQL editor after database/students.sql.
begin;

create table public.student_classes (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 120),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  location text not null default '' check (char_length(location) <= 500),
  notes text not null default '' check (char_length(notes) <= 1000),
  created_at timestamptz not null default now(),
  constraint student_class_time_order check (ends_at > starts_at)
);

create index student_classes_owner_start on public.student_classes(student_id, starts_at);
alter table public.student_classes enable row level security;
revoke all on public.student_classes from anon, authenticated;
grant select on public.student_classes to authenticated;
create policy class_self_read on public.student_classes for select to authenticated
  using (student_id = (select auth.uid()));

commit;
