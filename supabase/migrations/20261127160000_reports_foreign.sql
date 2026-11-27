-- Anonymous pharmacy reports, one more answer (PLAN.md 7.10; Janne, 27 Nov 2026).
--
-- "Oliko resepti toisesta maasta?": with an answer about the prescription, whether that
-- prescription was from another country than the pharmacy's. One boolean and nothing else:
-- not which country, and never without the answer it belongs to.
--
-- What is shown of it: for a pharmacy with at least three reports that said "from another
-- country", how many of them said the prescription was accepted. Below three such reports
-- the two counts do not leave the database.
--
-- The server works before and after this migration: against a database without it, it stores
-- a report without the new answer (lib/server/reports.ts).
--
-- Applied with `npm run db:push` (the Supabase CLI and SUPABASE_DB_URL).

alter table public.reports
  add column foreign_prescription boolean,
  add constraint reports_foreign_with_prescription check (foreign_prescription is null or prescription is not null);

comment on column public.reports.foreign_prescription is 'With an answer about the prescription: it was from another country (true) or from this one (false). Not which country.';

-- One report in, with the new answer as an eighth argument. The old function is dropped, not
-- kept beside the new one: two functions of one name would leave a call without the new
-- argument with two candidates.
drop function public.add_report(text, text, boolean, boolean, boolean, boolean, boolean);

create function public.add_report(
  p_pharmacy text,
  p_country text,
  p_prescription boolean default null,
  p_english boolean default null,
  p_stock boolean default null,
  p_short_wait boolean default null,
  p_step_free boolean default null,
  p_foreign boolean default null
) returns text
language plpgsql
security invoker
set search_path = ''
as $$
declare
  today date := (now() at time zone 'utc')::date;
begin
  if (select count(*) from public.reports r where r.day = today and r.pharmacy = p_pharmacy) >= 20 then
    return 'limit';
  end if;
  if (select count(*) from public.reports r where r.day = today) >= 2000 then
    return 'limit';
  end if;
  insert into public.reports (pharmacy, country, day, prescription, english, stock, short_wait, step_free, foreign_prescription)
  values (p_pharmacy, p_country, today, p_prescription, p_english, p_stock, p_short_wait, p_step_free,
    -- Only with an answer about the prescription: without one the new answer is not kept.
    case when p_prescription is null then null else p_foreign end);
  return 'ok';
end;
$$;

-- What is shown, with two more counts: of the reports that said the prescription was from
-- another country, how many said it was accepted and how many that it was not. Both are null
-- until there are three such reports for the pharmacy.
drop function public.report_summaries(text);

create function public.report_summaries(p_country text)
returns table (
  pharmacy text,
  reports integer,
  first_day date,
  last_day date,
  prescription_yes integer,
  prescription_no integer,
  english_yes integer,
  english_no integer,
  stock_yes integer,
  stock_no integer,
  short_wait_yes integer,
  short_wait_no integer,
  step_free_yes integer,
  step_free_no integer,
  foreign_yes integer,
  foreign_no integer
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    r.pharmacy,
    count(*)::integer,
    min(r.day),
    max(r.day),
    (count(*) filter (where r.prescription))::integer,
    (count(*) filter (where not r.prescription))::integer,
    (count(*) filter (where r.english))::integer,
    (count(*) filter (where not r.english))::integer,
    (count(*) filter (where r.stock))::integer,
    (count(*) filter (where not r.stock))::integer,
    (count(*) filter (where r.short_wait))::integer,
    (count(*) filter (where not r.short_wait))::integer,
    (count(*) filter (where r.step_free))::integer,
    (count(*) filter (where not r.step_free))::integer,
    case when count(*) filter (where r.foreign_prescription) >= 3 then (count(*) filter (where r.foreign_prescription and r.prescription))::integer end,
    case when count(*) filter (where r.foreign_prescription) >= 3 then (count(*) filter (where r.foreign_prescription and not r.prescription))::integer end
  from public.reports r
  where r.country = p_country
  group by r.pharmacy
  having count(*) >= 3
  order by r.pharmacy;
$$;

revoke all on function public.add_report(text, text, boolean, boolean, boolean, boolean, boolean, boolean) from public, anon, authenticated;
revoke all on function public.report_summaries(text) from public, anon, authenticated;
grant execute on function public.add_report(text, text, boolean, boolean, boolean, boolean, boolean, boolean) to service_role;
grant execute on function public.report_summaries(text) to service_role;
