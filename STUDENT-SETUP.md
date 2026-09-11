# Student dashboard setup

## Current setup status — 10 September 2026

- SHIMORA Free organization and SHIMORA Student Dashboard project created in Singapore.
- Project reference: `yhrtxluyyfgaqjdcafqb`; public website connection configured in `student-config.js`.
- `database/students.sql` installed successfully. Automatic RLS enabled; automatic table grants disabled.
- `database/student-classes.sql` installed successfully. Timetable access is restricted to the signed-in student; anonymous access is denied.
- Live transactional checks passed for student profile/enrolment/query isolation, denial of student teacher-role escalation and forged answers, valid student question submission, teacher inbox access and teacher reply retrieval. All temporary test records rolled back.
- Anonymous REST access to student questions returns permission denied (401).
- Gmail custom SMTP is configured with `shimora32@gmail.com` as both the SHIMORA sender and SMTP username. A real sign-in code request completed successfully.
- Magic link/OTP template saved with subject `Your SHIMORA sign-in code` and `{{ .Token }}` in the body. Site URL saved as `https://shimora.online/student.html`.
- User explicitly approved teacher access for `shimora32@gmail.com` and SHIMORA-managed accounts only. Public registration remains disabled.
- The `shimora32@gmail.com` Authentication account is confirmed, has completed a real sign-in, and is assigned in `public.student_teachers`.
- Automated checks pass: 21 tests, with the public website build completing successfully.
- Published at `https://shimora.online/student.html` and verified on the live site.
- Existing website repository: `https://github.com/NakedArctic/shimora-public-speaking.git`.

The dashboard lives at `/student.html`. It uses Supabase email codes and Postgres storage, and can run on the site's existing static hosting. There is no automatic link between payments and enrolment. Accounts and class assignments are managed by SHIMORA.

## Activate

1. Create or select a Supabase project and run `database/students.sql` and `database/student-classes.sql` once in its SQL editor.
2. In Authentication, enable email sign-in, disable public account registration, and set the Site URL to `https://shimora.online`. Configure your SMTP provider to deliver sign-in emails to students. The default development mail service is insufficient for general student delivery.
3. Edit the **Magic Link** email template to display `{{ .Token }}` as the sign-in code. The page accepts 6–10 digit codes, not link callbacks. Give the template a clear SHIMORA subject and explain the expiry configured in Supabase.
4. Put the project's HTTPS URL and **publishable key** in `student-config.js`. This file is public. Never put a secret or service-role key here.
5. Create each student and teacher account through Supabase Authentication's Add user / Create user option. Verify the email belongs to the learner or guardian. Students cannot register themselves. They request a fresh code each time they sign in; the session lasts up to the provider's access-token expiry and is limited to the current browser tab.
6. Assign a teacher by running the following with their actual account UUID:

```sql
insert into public.student_teachers(user_id) values ('TEACHER-ACCOUNT-UUID');
```

7. Assign a student's programme and schedule in the `student_enrolments` table using their Authentication account UUID. For example:

```sql
insert into public.student_enrolments(student_id, programme, schedule)
values ('STUDENT-ACCOUNT-UUID', 'Public speaking', 'Your confirmed class schedule')
on conflict (student_id) do update set programme=excluded.programme, schedule=excluded.schedule;
```

8. Add each class to the student's calendar using their Authentication account UUID. Dates include the time-zone offset; this example uses India Standard Time:

```sql
insert into public.student_classes (student_id, title, starts_at, ends_at, location, notes)
values (
  'STUDENT-ACCOUNT-UUID',
  'Public speaking',
  '2026-09-14 16:00:00+05:30',
  '2026-09-14 17:00:00+05:30',
  'https://meet.google.com/your-class-link',
  'Bring your prepared speech.'
);
```

The location can be a room name or an HTTPS meeting link. The dashboard shows the current week and lets students move between weeks.

9. Build and publish through the site's existing deployment workflow. No changes to payment settings are required.

## Before opening to students

Use two student test accounts and one teacher. Confirm a student can save a profile, submit a question, reload, and read the teacher's reply. Confirm a second student cannot read the first student's profile, questions, or enrolment via direct REST requests. Confirm students cannot call either teacher function, insert teacher roles, alter enrolments, or insert/update answers. Test expired and incorrect codes, expired sessions, and sign-out. These checks need a real configured Supabase project; local unit checks do not prove deployed database permissions.

Question history and profile data live in the database, not browser storage. Only a short-lived sign-in credential is kept in sessionStorage. Every database table has row-level security; teacher actions separately verify teacher membership. Removing a row from student_teachers revokes teacher access on the next database request. There are no outbound reply notifications yet; students use Refresh or return to their dashboard to see replies.

Supabase references: https://supabase.com/docs/guides/auth/auth-email-passwordless and https://supabase.com/docs/guides/database/postgres/row-level-security.
