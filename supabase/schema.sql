create extension if not exists "uuid-ossp";

-- Access control tables
create table if not exists public.access_codes (
  id uuid primary key default uuid_generate_v4(),
  code_name text not null unique,
  code_hash text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.access_code_sessions (
  id uuid primary key default uuid_generate_v4(),
  code_id uuid not null references public.access_codes(id) on delete cascade,
  token text not null unique,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  issued_at timestamptz not null default now()
);
create index if not exists access_code_sessions_token_idx on public.access_code_sessions (token);

insert into public.access_codes (code_name, code_hash, is_active, updated_at)
values ('default', '$2b$10$q5EHQCtQZPxGcSpL1wjKWeRUdzejiElec92Nls10Yz9OGsb8uYUmu', true, now())
on conflict (code_name) do update set code_hash = excluded.code_hash, is_active = excluded.is_active, updated_at = now();

-- Behavior events (raw log)
create table if not exists public.behavior_events (
  id uuid primary key default uuid_generate_v4(),
  event_type text not null,
  user_id uuid not null,
  session_id uuid,
  occurred_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  inserted_at timestamptz not null default now()
);
create index if not exists behavior_events_event_type_occurred_at_idx on public.behavior_events (event_type, occurred_at);
create index if not exists behavior_events_user_id_occurred_at_idx on public.behavior_events (user_id, occurred_at);

-- User profile / cohort metadata
create table if not exists public.user_profiles (
  user_id uuid primary key,
  student_code text unique,
  grade int not null,
  school_type text,
  plan_type text,
  acquisition_channel text,
  joined_at timestamptz not null,
  cohort_week int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Session level summaries
create table if not exists public.student_sessions (
  session_id uuid primary key,
  user_id uuid not null references public.user_profiles(user_id),
  started_at timestamptz not null,
  completed_at timestamptz,
  device text,
  entry_point text check (entry_point in ('notification','teacher','self')),
  easy_problem_count int default 0,
  hard_problem_count int default 0,
  easy_to_hard bool default false,
  dau_bucket date
);
create index if not exists student_sessions_user_id_started_at_idx on public.student_sessions (user_id, started_at);
create index if not exists student_sessions_easy_to_hard_idx on public.student_sessions (easy_to_hard);

-- Problem level attempts
create table if not exists public.session_problem_attempts (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid not null references public.student_sessions(session_id),
  user_id uuid not null references public.user_profiles(user_id),
  problem_id text not null,
  skill_id text,
  difficulty text,
  first_answer text,
  final_answer text,
  changed_before_submit bool default false,
  first_wrong_at timestamptz,
  corrected_at timestamptz,
  correction_latency_seconds int generated always as (
    extract(epoch from (coalesce(corrected_at, first_wrong_at) - first_wrong_at))
  ) stored
);
create index if not exists session_problem_attempts_skill_id_difficulty_idx on public.session_problem_attempts (skill_id, difficulty);
create index if not exists session_problem_attempts_changed_before_submit_idx on public.session_problem_attempts (changed_before_submit);

-- Feature usage
create table if not exists public.feature_usage_daily (
  usage_date date not null,
  user_id uuid not null,
  feature_key text not null,
  session_id uuid,
  skill_id text,
  used_at timestamptz not null default now(),
  primary key (usage_date, user_id, feature_key)
);
create index if not exists feature_usage_daily_feature_key_usage_date_idx on public.feature_usage_daily (feature_key, usage_date);

-- Share events (teacher/parent)
create table if not exists public.share_events (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null,
  session_id uuid,
  channel text,
  recipient_type text check (recipient_type in ('parent','teacher','friend')),
  triggered_by text default 'self',
  shared_at timestamptz not null default now()
);
create index if not exists share_events_channel_shared_at_idx on public.share_events (channel, shared_at);

-- Retention cohorts
create table if not exists public.retention_cohort_snapshots (
  cohort_week int not null,
  grade int not null,
  week_offset int not null check (week_offset in (0,1,2,3,4,5,6,7,8)),
  active_users int not null,
  retained_users int not null,
  snapshot_date date not null default current_date,
  primary key (cohort_week, grade, week_offset)
);

-- Daily KPI cache
create table if not exists public.daily_kpi_snapshots (
  snapshot_date date primary key,
  dau int,
  wau int,
  mau int,
  dau_wau_ratio numeric,
  wau_mau_ratio numeric,
  stickiness_threshold numeric,
  created_at timestamptz default now()
);

-- Views for Admin dashboard
create or replace view public.admin_session_persistence_view as
with weekly_sessions as (
  select
    user_id,
    date_trunc('week', started_at)::date as week_start,
    count(*) as session_count
  from public.student_sessions
  group by 1,2
),
weekly_summary as (
  select
    week_start,
    count(*) filter (where session_count >= 4) as streak_users,
    count(*) as total_active
  from weekly_sessions
  group by 1
)
select
  week_start,
  streak_users,
  total_active,
  case when total_active = 0 then 0 else streak_users::numeric / total_active end as streak_ratio
from weekly_summary
order by week_start desc;

create or replace view public.admin_voluntary_reuse_view as
select
  date_trunc('week', started_at)::date as week_start,
  count(*) filter (where entry_point = 'self') as voluntary_sessions,
  count(*) as total_sessions,
  case when count(*) = 0 then 0 else (count(*) filter (where entry_point = 'self'))::numeric / count(*) end as voluntary_ratio
from public.student_sessions
group by 1
order by week_start desc;

create or replace view public.admin_effort_uplift_view as
with weekly_users as (
  select
    date_trunc('week', started_at)::date as week_start,
    user_id,
    bool_or(coalesce(easy_to_hard, false)) as has_uplift
  from public.student_sessions
  group by 1,2
)
select
  week_start,
  count(*) filter (where has_uplift) as uplift_users,
  count(*) as total_users,
  case when count(*) = 0 then 0 else (count(*) filter (where has_uplift))::numeric / count(*) end as uplift_ratio
from weekly_users
group by 1
order by week_start desc;

create or replace view public.admin_feature_stickiness_view as
with dau as (
  select
    dau_bucket as usage_date,
    count(distinct user_id) as dau
  from public.student_sessions
  group by 1
)
select
  fud.usage_date,
  fud.feature_key,
  count(distinct fud.user_id) as feature_dau,
  dau.dau,
  case when dau.dau = 0 then 0 else count(distinct fud.user_id)::numeric / dau.dau end as feature_ratio
from public.feature_usage_daily fud
join dau on dau.usage_date = fud.usage_date
group by 1,2,4
order by usage_date desc, feature_ratio desc;

create or replace view public.admin_share_rate_view as
with weekly_active as (
  select
    date_trunc('week', started_at)::date as week_start,
    count(distinct user_id) as active_users
  from public.student_sessions
  group by 1
),
weekly_share as (
  select
    date_trunc('week', shared_at)::date as week_start,
    count(distinct user_id) as organic_shares
  from public.share_events
  where coalesce(triggered_by, 'self') = 'self'
  group by 1
)
select
  a.week_start,
  coalesce(s.organic_shares, 0) as organic_shares,
  a.active_users,
  case when a.active_users = 0 then 0 else coalesce(s.organic_shares, 0)::numeric / a.active_users end as share_ratio
from weekly_active a
left join weekly_share s on s.week_start = a.week_start
order by a.week_start desc;

create or replace view public.admin_self_correction_view as
select
  coalesce(skill_id, 'unknown') as skill_id,
  count(*) as attempts,
  case when count(*) = 0 then 0 else sum(case when changed_before_submit then 1 else 0 end)::numeric / count(*) end as self_correction_rate,
  percentile_disc(0.5) within group (order by correction_latency_seconds) as median_latency_seconds
from public.session_problem_attempts
group by 1
order by attempts desc;
