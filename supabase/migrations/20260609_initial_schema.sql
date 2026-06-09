-- ==========================================
-- 0. CLEANUP (Allows running the script multiple times safely)
-- ==========================================
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user() cascade;
drop function if exists public.is_list_owner(uuid, uuid) cascade;
drop function if exists public.has_list_access(uuid, uuid, text) cascade;
drop table if exists public.tasks cascade;
drop table if exists public.list_shares cascade;
drop table if exists public.lists cascade;
drop table if exists public.profiles cascade;

-- Enable UUID extension if not already enabled
create extension if not exists "uuid-ossp";

-- ==========================================
-- 1. TABLE DEFINITIONS
-- ==========================================

-- Create profiles table
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  full_name text,
  avatar_url text,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Create lists table
create table public.lists (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  owner_id uuid references public.profiles(id) on delete cascade not null default auth.uid(),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create list shares table
create table public.list_shares (
  id uuid default gen_random_uuid() primary key,
  list_id uuid references public.lists(id) on delete cascade not null,
  invited_email text not null,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (list_id, invited_email)
);

-- Create tasks table
create table public.tasks (
  id uuid default gen_random_uuid() primary key,
  list_id uuid references public.lists(id) on delete cascade not null,
  title text not null,
  is_completed boolean default false not null,
  due_date timestamp with time zone,
  reminder_at timestamp with time zone,
  notes text,
  created_by uuid references public.profiles(id) on delete set null default auth.uid(),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ==========================================
-- 2. HELPER FUNCTIONS & TRIGGERS
-- ==========================================

-- Create profile trigger on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'avatar_url', '')
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Security Definer: Checks if user owns a list (prefixed parameters to prevent column conflict)
create or replace function public.is_list_owner(_list_id uuid, _user_id uuid)
returns boolean as $$
begin
  return exists (
    select 1 from public.lists
    where id = _list_id and owner_id = _user_id
  );
end;
$$ language plpgsql security definer;

-- Security Definer: Checks if user has access to list (owner or collaborator)
create or replace function public.has_list_access(_list_id uuid, _user_id uuid, _user_email text)
returns boolean as $$
begin
  return exists (
    select 1 from public.lists
    where id = _list_id and owner_id = _user_id
  ) or exists (
    select 1 from public.list_shares
    where list_id = _list_id and invited_email = _user_email and status = 'accepted'
  );
end;
$$ language plpgsql security definer;

-- ==========================================
-- 3. ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.lists enable row level security;
alter table public.list_shares enable row level security;
alter table public.tasks enable row level security;

-- Profiles Policies
create policy "Users can view all profiles"
  on public.profiles for select
  using (auth.uid() is not null);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Lists Policies (utilizes has_list_access helper)
create policy "Users can view lists they own or are shared with"
  on public.lists for select
  using (public.has_list_access(id, auth.uid(), auth.jwt()->>'email'));

create policy "Users can create lists"
  on public.lists for insert
  with check (auth.uid() is not null);

create policy "Users can update lists they own or are shared with"
  on public.lists for update
  using (public.has_list_access(id, auth.uid(), auth.jwt()->>'email'));

create policy "Only owners can delete lists"
  on public.lists for delete
  using (public.is_list_owner(id, auth.uid()));

-- List Shares Policies (utilizes is_list_owner helper)
create policy "Users can view shares for lists they own or are invited to"
  on public.list_shares for select
  using (
    invited_email = auth.jwt()->>'email' or
    public.is_list_owner(list_id, auth.uid())
  );

create policy "Only list owners can insert shares"
  on public.list_shares for insert
  with check (public.is_list_owner(list_id, auth.uid()));

create policy "Users can update shares (accept invite or owner updates)"
  on public.list_shares for update
  using (
    invited_email = auth.jwt()->>'email' or
    public.is_list_owner(list_id, auth.uid())
  );

create policy "Users can delete shares (owner cancels or invitee rejects)"
  on public.list_shares for delete
  using (
    invited_email = auth.jwt()->>'email' or
    public.is_list_owner(list_id, auth.uid())
  );

-- Tasks Policies (utilizes has_list_access helper)
create policy "Users can perform actions on tasks if they have access to the parent list"
  on public.tasks for all
  using (public.has_list_access(list_id, auth.uid(), auth.jwt()->>'email'));

-- ==========================================
-- 4. REALTIME ENABLEMENT
-- ==========================================

-- Add tables to the realtime publication
alter publication supabase_realtime add table public.lists;
alter publication supabase_realtime add table public.tasks;
alter publication supabase_realtime add table public.list_shares;

-- ==========================================
-- 5. BACKFILL EXISTING USERS
-- ==========================================
insert into public.profiles (id, email, full_name, avatar_url)
select id, email, coalesce(raw_user_meta_data->>'full_name', ''), coalesce(raw_user_meta_data->>'avatar_url', '')
from auth.users
on conflict (id) do nothing;
