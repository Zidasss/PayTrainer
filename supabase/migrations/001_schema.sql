-- ============================================================
-- FitAgenda MVP - Database Schema
-- ============================================================

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ============================================================
-- PROFILES: extends Supabase auth.users
-- ============================================================
create type user_role as enum ('student', 'trainer');

create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  role user_role not null,
  full_name text not null,
  phone text,
  avatar_url text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

-- ============================================================
-- TRAINERS: extra info for trainer profiles
-- ============================================================
create table public.trainers (
  id uuid references public.profiles on delete cascade primary key,
  bio text,
  stripe_account_id text,         -- Stripe Connect account
  stripe_onboarding_complete boolean default false,
  extra_class_price integer default 15000, -- in cents (R$150,00)
  created_at timestamptz default now() not null
);

alter table public.trainers enable row level security;

create policy "Trainers can view own data"
  on public.trainers for select using (auth.uid() = id);

create policy "Trainers can update own data"
  on public.trainers for update using (auth.uid() = id);

create policy "Students can view their trainer"
  on public.trainers for select using (
    exists (
      select 1 from public.subscriptions s
      where s.trainer_id = trainers.id and s.student_id = auth.uid() and s.status = 'active'
    )
  );

-- ============================================================
-- PLANS: pricing plans per trainer
-- ============================================================
create table public.plans (
  id uuid default uuid_generate_v4() primary key,
  trainer_id uuid references public.trainers on delete cascade not null,
  name text not null,                    -- e.g. "2x na semana"
  sessions_per_week integer not null,    -- 2, 3, 4
  price_cents integer not null,          -- price in cents
  description text,
  active boolean default true,
  stripe_price_id text,                  -- Stripe recurring price
  created_at timestamptz default now() not null
);

alter table public.plans enable row level security;

create policy "Anyone authenticated can view active plans"
  on public.plans for select using (active = true);

create policy "Trainer can manage own plans"
  on public.plans for all using (auth.uid() = trainer_id);

-- ============================================================
-- SUBSCRIPTIONS: student <-> trainer + plan
-- ============================================================
create type subscription_status as enum ('active', 'past_due', 'canceled', 'trialing');

create table public.subscriptions (
  id uuid default uuid_generate_v4() primary key,
  student_id uuid references public.profiles on delete cascade not null,
  trainer_id uuid references public.trainers on delete cascade not null,
  plan_id uuid references public.plans on delete set null,
  status subscription_status default 'active' not null,
  stripe_subscription_id text,
  stripe_customer_id text,
  preferred_location text,               -- student's preferred gym/location
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique(student_id, trainer_id)
);

alter table public.subscriptions enable row level security;

create policy "Students see own subscriptions"
  on public.subscriptions for select using (auth.uid() = student_id);

create policy "Trainers see their subscriptions"
  on public.subscriptions for select using (auth.uid() = trainer_id);

create policy "Students can insert own subscriptions"
  on public.subscriptions for insert with check (auth.uid() = student_id);

create policy "Students can update own subscriptions"
  on public.subscriptions for update using (auth.uid() = student_id);

-- ============================================================
-- AVAILABILITY: trainer's weekly schedule template
-- ============================================================
create table public.availability (
  id uuid default uuid_generate_v4() primary key,
  trainer_id uuid references public.trainers on delete cascade not null,
  day_of_week integer not null check (day_of_week between 0 and 6), -- 0=Sun
  start_time time not null,
  end_time time not null,
  active boolean default true,
  created_at timestamptz default now() not null,
  unique(trainer_id, day_of_week, start_time)
);

alter table public.availability enable row level security;

create policy "Anyone authenticated can view availability"
  on public.availability for select using (true);

create policy "Trainers manage own availability"
  on public.availability for all using (auth.uid() = trainer_id);

-- ============================================================
-- BOOKINGS: individual class sessions
-- ============================================================
create type booking_status as enum ('confirmed', 'canceled', 'completed', 'pending');
create type booking_type as enum ('plan', 'extra');

create table public.bookings (
  id uuid default uuid_generate_v4() primary key,
  student_id uuid references public.profiles on delete cascade not null,
  trainer_id uuid references public.trainers on delete cascade not null,
  subscription_id uuid references public.subscriptions on delete set null,
  booking_date date not null,
  start_time time not null,
  end_time time not null,
  status booking_status default 'confirmed' not null,
  type booking_type default 'plan' not null,
  location text,
  location_status text default 'pending' check (location_status in ('pending','approved','rejected')),
  notes text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique(trainer_id, booking_date, start_time)
);

alter table public.bookings enable row level security;

create policy "Students see own bookings"
  on public.bookings for select using (auth.uid() = student_id);

create policy "Trainers see their bookings"
  on public.bookings for select using (auth.uid() = trainer_id);

create policy "Students can create bookings"
  on public.bookings for insert with check (auth.uid() = student_id);

create policy "Students can update own bookings"
  on public.bookings for update using (auth.uid() = student_id);

create policy "Trainers can update their bookings"
  on public.bookings for update using (auth.uid() = trainer_id);

-- ============================================================
-- PAYMENTS: payment history
-- ============================================================
create type payment_status as enum ('succeeded', 'pending', 'failed', 'refunded');

create table public.payments (
  id uuid default uuid_generate_v4() primary key,
  subscription_id uuid references public.subscriptions on delete set null,
  student_id uuid references public.profiles on delete cascade not null,
  trainer_id uuid references public.trainers on delete cascade not null,
  amount_cents integer not null,
  platform_fee_cents integer not null,   -- 5% fee
  trainer_amount_cents integer not null,  -- 95%
  status payment_status default 'pending' not null,
  stripe_payment_intent_id text,
  description text,
  paid_at timestamptz,
  created_at timestamptz default now() not null
);

alter table public.payments enable row level security;

create policy "Students see own payments"
  on public.payments for select using (auth.uid() = student_id);

create policy "Trainers see their payments"
  on public.payments for select using (auth.uid() = trainer_id);

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-update updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger on_profiles_updated
  before update on public.profiles
  for each row execute function public.handle_updated_at();

create trigger on_subscriptions_updated
  before update on public.subscriptions
  for each row execute function public.handle_updated_at();

create trigger on_bookings_updated
  before update on public.bookings
  for each row execute function public.handle_updated_at();

-- Count bookings in current week for a student+trainer
create or replace function public.get_weekly_booking_count(
  p_student_id uuid,
  p_trainer_id uuid,
  p_week_start date
)
returns integer as $$
  select count(*)::integer
  from public.bookings
  where student_id = p_student_id
    and trainer_id = p_trainer_id
    and booking_date >= p_week_start
    and booking_date < p_week_start + interval '7 days'
    and status in ('confirmed', 'completed')
    and type = 'plan';
$$ language sql security definer;

-- View: trainer dashboard stats
create or replace view public.trainer_stats as
select
  t.id as trainer_id,
  count(distinct s.id) filter (where s.status = 'active') as active_students,
  coalesce(sum(p.price_cents) filter (where s.status = 'active'), 0) as monthly_revenue_cents,
  count(b.id) filter (where b.booking_date = current_date and b.status = 'confirmed') as today_sessions
from public.trainers t
left join public.subscriptions s on s.trainer_id = t.id
left join public.plans p on p.id = s.plan_id
left join public.bookings b on b.trainer_id = t.id
group by t.id;
