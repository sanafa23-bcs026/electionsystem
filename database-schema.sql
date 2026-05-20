-- =============================================================
--  VoteSecure — Complete Supabase Database Schema
--  Paste this ENTIRE file into Supabase SQL Editor and Run
-- =============================================================

-- 1. PROFILES TABLE (extends auth.users)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text not null,
  email text not null,
  phone text,
  role text not null default 'voter' check (role in ('super_admin', 'election_creator', 'voter')),
  avatar_url text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. ELECTION CREATOR REQUESTS TABLE
create table public.creator_requests (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  organization text not null,
  purpose text not null,
  phone text not null,
  email text not null,
  status text default 'pending' check (status in ('pending', 'approved', 'rejected')),
  rejection_reason text,
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz default now(),
  unique(user_id)
);

-- 3. ELECTIONS TABLE
create table public.elections (
  id uuid default gen_random_uuid() primary key,
  creator_id uuid references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  category text default 'general',
  status text default 'draft' check (status in ('draft', 'published', 'active', 'completed', 'cancelled')),
  start_date timestamptz not null,
  end_date timestamptz not null,
  registration_deadline timestamptz not null,
  max_voters integer not null default 1000,
  is_voter_list_locked boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 4. CANDIDATES TABLE
create table public.candidates (
  id uuid default gen_random_uuid() primary key,
  election_id uuid references public.elections(id) on delete cascade,
  name text not null,
  designation text,
  manifesto text,
  photo_url text,
  vote_count integer default 0,
  display_order integer default 0,
  created_at timestamptz default now()
);

-- 5. VOTER REGISTRATIONS TABLE
create table public.voter_registrations (
  id uuid default gen_random_uuid() primary key,
  election_id uuid references public.elections(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  secret_voter_id text unique not null,
  status text default 'registered' check (status in ('registered', 'voted', 'disqualified')),
  has_voted boolean default false,
  registered_at timestamptz default now(),
  voted_at timestamptz,
  unique(election_id, user_id)
);

-- 6. VOTES TABLE (anonymous - no direct user link)
create table public.votes (
  id uuid default gen_random_uuid() primary key,
  election_id uuid references public.elections(id) on delete cascade,
  candidate_id uuid references public.candidates(id) on delete cascade,
  voter_token text not null unique,
  cast_at timestamptz default now()
);

-- 7. AUDIT LOGS TABLE
create table public.audit_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id),
  action text not null,
  entity_type text,
  entity_id uuid,
  details jsonb,
  ip_address text,
  created_at timestamptz default now()
);

-- 8. NOTIFICATIONS TABLE
create table public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  title text not null,
  message text not null,
  type text default 'info' check (type in ('info', 'success', 'warning', 'error')),
  is_read boolean default false,
  created_at timestamptz default now()
);

-- ==========================================
--   ROW LEVEL SECURITY POLICIES
-- ==========================================

alter table public.profiles enable row level security;
alter table public.creator_requests enable row level security;
alter table public.elections enable row level security;
alter table public.candidates enable row level security;
alter table public.voter_registrations enable row level security;
alter table public.votes enable row level security;
alter table public.audit_logs enable row level security;
alter table public.notifications enable row level security;

-- PROFILES
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Admins can view all profiles" on public.profiles for select using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'super_admin')
);
create policy "Allow insert for new users" on public.profiles for insert with check (auth.uid() = id);

-- ELECTIONS
create policy "Anyone can view published elections" on public.elections for select using (
  status in ('published', 'active', 'completed')
);
create policy "Creators can manage own elections" on public.elections for all using (
  creator_id = auth.uid()
);
create policy "Admins full access elections" on public.elections for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'super_admin')
);
create policy "Creators can insert elections" on public.elections for insert with check (
  creator_id = auth.uid()
);

-- CANDIDATES
create policy "Anyone can view candidates" on public.candidates for select using (true);
create policy "Creators manage their candidates" on public.candidates for all using (
  exists (select 1 from public.elections where id = election_id and creator_id = auth.uid())
);
create policy "Admins manage all candidates" on public.candidates for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'super_admin')
);

-- VOTER REGISTRATIONS
create policy "Users see own registrations" on public.voter_registrations for select using (user_id = auth.uid());
create policy "Users can register" on public.voter_registrations for insert with check (user_id = auth.uid());
create policy "Users update own registration" on public.voter_registrations for update using (user_id = auth.uid());
create policy "Creators see their election voters" on public.voter_registrations for select using (
  exists (select 1 from public.elections where id = election_id and creator_id = auth.uid())
);
create policy "Admins see all registrations" on public.voter_registrations for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'super_admin')
);

-- VOTES (anonymous)
create policy "Anyone can insert vote" on public.votes for insert with check (true);
create policy "Votes are publicly countable" on public.votes for select using (true);

-- CREATOR REQUESTS
create policy "Users see own requests" on public.creator_requests for select using (user_id = auth.uid());
create policy "Users can create requests" on public.creator_requests for insert with check (user_id = auth.uid());
create policy "Admins manage all requests" on public.creator_requests for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'super_admin')
);

-- AUDIT LOGS
create policy "Users see own logs" on public.audit_logs for select using (user_id = auth.uid());
create policy "Anyone can insert logs" on public.audit_logs for insert with check (true);
create policy "Admins see all logs" on public.audit_logs for select using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'super_admin')
);

-- NOTIFICATIONS
create policy "Users see own notifications" on public.notifications for select using (user_id = auth.uid());
create policy "Users update own notifications" on public.notifications for update using (user_id = auth.uid());
create policy "System can insert notifications" on public.notifications for insert with check (true);

-- ==========================================
--   FUNCTIONS & TRIGGERS
-- ==========================================

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'voter')
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Auto-update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger handle_profiles_updated_at before update on public.profiles
  for each row execute function public.handle_updated_at();

create trigger handle_elections_updated_at before update on public.elections
  for each row execute function public.handle_updated_at();

-- Auto-lock voter list when max voters reached
create or replace function public.check_voter_limit()
returns trigger as $$
declare
  v_max_voters integer;
  v_current_count integer;
begin
  select max_voters into v_max_voters from public.elections where id = new.election_id;
  select count(*) into v_current_count from public.voter_registrations where election_id = new.election_id;

  if v_current_count >= v_max_voters then
    update public.elections set is_voter_list_locked = true where id = new.election_id;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_voter_registered on public.voter_registrations;
create trigger on_voter_registered
  after insert on public.voter_registrations
  for each row execute function public.check_voter_limit();

-- Increment vote count function (called from frontend)
create or replace function public.increment_vote(candidate_id_param uuid)
returns void as $$
begin
  update public.candidates
  set vote_count = vote_count + 1
  where id = candidate_id_param;
end;
$$ language plpgsql security definer;
