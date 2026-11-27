-- Anonymous pharmacy reports (PLAN.md 7.10).
--
-- One row is one visit as its visitor chose to tell it: which pharmacy, in which country, on
-- which day, and up to five answers, each yes, no or not given. Nothing else is kept: no
-- account, no position, no address of the device, no time of day, no text, no medicine. There
-- is no key column either, because a running number would say in which order the rows came.
--
-- Only our own server reads and writes here, with the secret key. Row-level security is on
-- and has no policy, and the rights of the two public roles are taken away, so a publishable
-- key can do nothing with the table or with the two functions.
--
-- Applied with `npm run db:push` (the Supabase CLI and SUPABASE_DB_URL).

create table public.reports (
  -- The pharmacy's id as the tiles have it: OpenStreetMap's type and number, "n123".
  pharmacy text not null check (pharmacy ~ '^[nwr][0-9]{1,12}$'),
  -- The country the pharmacy is in, two letters.
  country text not null check (country ~ '^[A-Z]{2}$'),
  -- The day the report came, in UTC. The day only.
  day date not null default ((now() at time zone 'utc')::date),
  -- The prescription was accepted (true) or was not (false).
  prescription boolean,
  -- The staff spoke English, or did not.
  english boolean,
  -- The medicine was in stock, or was not.
  stock boolean,
  -- The wait was short (true) or long (false).
  short_wait boolean,
  -- The way in was step-free, or had steps.
  step_free boolean,
  constraint reports_say_something check (num_nonnulls(prescription, english, stock, short_wait, step_free) > 0)
);

comment on table public.reports is 'Anonymous pharmacy reports: the pharmacy, the country, the day and up to five answers. Nothing else.';

create index reports_by_pharmacy on public.reports (country, pharmacy);
create index reports_by_day on public.reports (day, pharmacy);

alter table public.reports enable row level security;
revoke all on table public.reports from public, anon, authenticated;

-- One report in. The day is set here, never taken from the caller.
-- Two limits that need no knowledge of who is calling: a pharmacy takes twenty reports a day,
-- and the whole table two thousand. Past either the answer is 'limit' and nothing is written.
create function public.add_report(
  p_pharmacy text,
  p_country text,
  p_prescription boolean default null,
  p_english boolean default null,
  p_stock boolean default null,
  p_short_wait boolean default null,
  p_step_free boolean default null
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
  insert into public.reports (pharmacy, country, day, prescription, english, stock, short_wait, step_free)
  values (p_pharmacy, p_country, today, p_prescription, p_english, p_stock, p_short_wait, p_step_free);
  return 'ok';
end;
$$;

-- What is shown: per pharmacy of one country, the count, the first and the last day, and how
-- many said yes and no to each question. Only pharmacies with at least three reports: below
-- that nothing leaves the database, so one visitor's answers are never shown as theirs.
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
  step_free_no integer
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
    (count(*) filter (where not r.step_free))::integer
  from public.reports r
  where r.country = p_country
  group by r.pharmacy
  having count(*) >= 3
  order by r.pharmacy;
$$;

revoke all on function public.add_report(text, text, boolean, boolean, boolean, boolean, boolean) from public, anon, authenticated;
revoke all on function public.report_summaries(text) from public, anon, authenticated;
grant execute on function public.add_report(text, text, boolean, boolean, boolean, boolean, boolean) to service_role;
grant execute on function public.report_summaries(text) to service_role;
grant select, insert on table public.reports to service_role;
