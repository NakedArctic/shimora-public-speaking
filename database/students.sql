-- Apply once in the Supabase SQL editor. The browser uses only a publishable key.
begin;
create table public.student_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(trim(display_name)) between 1 and 80),
  goal text not null default '' check (char_length(goal) <= 500)
);
create table public.student_teachers (user_id uuid primary key references auth.users(id) on delete cascade);
create table public.student_enrolments (
  student_id uuid primary key references auth.users(id) on delete cascade,
  programme text not null check (char_length(programme) between 1 and 120),
  schedule text not null default '' check (char_length(schedule) <= 500)
);
create table public.student_queries (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references auth.users(id) on delete cascade,
  category text not null check (category in ('Speaking practice','Classes and schedule','Fees and enrolment','Other')),
  subject text not null check (char_length(trim(subject)) between 3 and 120),
  body text not null check (char_length(trim(body)) between 10 and 3000),
  created_at timestamptz not null default now(),
  answer text check (answer is null or char_length(trim(answer)) between 1 and 3000),
  answered_at timestamptz,
  answered_by uuid references auth.users(id) on delete set null
);
create index student_queries_owner_date on public.student_queries(student_id, created_at desc);
alter table public.student_profiles enable row level security;
alter table public.student_teachers enable row level security;
alter table public.student_enrolments enable row level security;
alter table public.student_queries enable row level security;
revoke all on public.student_profiles, public.student_teachers, public.student_enrolments, public.student_queries from anon, authenticated;
grant select, insert, update on public.student_profiles to authenticated;
grant select on public.student_teachers, public.student_enrolments, public.student_queries to authenticated;
grant insert (student_id, category, subject, body) on public.student_queries to authenticated;
create policy profile_read on public.student_profiles for select to authenticated using (id = (select auth.uid()));
create policy profile_create on public.student_profiles for insert to authenticated with check (id = (select auth.uid()));
create policy profile_edit on public.student_profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy teacher_self_read on public.student_teachers for select to authenticated using (user_id = (select auth.uid()));
create policy enrolment_self_read on public.student_enrolments for select to authenticated using (student_id = (select auth.uid()));
create policy query_self_read on public.student_queries for select to authenticated using (student_id = (select auth.uid()));
create policy query_self_create on public.student_queries for insert to authenticated with check (student_id = (select auth.uid()));
-- Teacher rights are assigned by the owner in SQL, never through editable metadata.
create function public.teacher_query_inbox()
returns table(id uuid, student_id uuid, category text, subject text, body text, created_at timestamptz, answer text, answered_at timestamptz, student_name text, student_email text)
language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.student_teachers t where t.user_id = auth.uid()) then
    raise exception 'Teacher access required' using errcode = '42501';
  end if;
  return query select q.id, q.student_id, q.category, q.subject, q.body, q.created_at, q.answer, q.answered_at, p.display_name, u.email::text
    from public.student_queries q left join public.student_profiles p on p.id=q.student_id
    join auth.users u on u.id=q.student_id order by (q.answer is null) desc, q.created_at desc;
end;
$$;
create function public.reply_to_student_query(query_id uuid, reply_text text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.student_teachers t where t.user_id = auth.uid()) then
    raise exception 'Teacher access required' using errcode = '42501';
  end if;
  if reply_text is null or char_length(trim(reply_text)) not between 1 and 3000 then
    raise exception 'Reply must contain 1 to 3000 characters';
  end if;
  update public.student_queries set answer=trim(reply_text), answered_at=now(), answered_by=auth.uid() where id=query_id;
  if not found then raise exception 'Question not found'; end if;
end;
$$;
revoke all on function public.teacher_query_inbox(), public.reply_to_student_query(uuid,text) from public, anon;
grant execute on function public.teacher_query_inbox(), public.reply_to_student_query(uuid,text) to authenticated;
commit;
