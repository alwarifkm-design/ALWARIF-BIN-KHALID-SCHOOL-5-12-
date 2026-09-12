-- =========================================================
-- Supabase SQL schema for the school management system
-- Run this in Supabase SQL Editor
-- =========================================================

create extension if not exists pgcrypto;

-- 1) accounts
create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'User',
  email text not null unique,
  password text not null default '',
  plain_password text default null,
  role text not null default 'supervisor' check (role in ('admin', 'supervisor')),
  phone text default '',
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  last_login timestamptz default null
);

-- 2) school settings
create table if not exists public.school_settings (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

-- 3) registration codes
create table if not exists public.registration_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

-- 4) sections
create table if not exists public.sections (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  grade text not null,
  supervisor_id uuid default null,
  notes text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 5) students
create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  gender text default 'male',
  age int default null,
  grade text default '',
  section_id uuid default null,
  student_number text default '',
  phone text default '',
  email text default '',
  address text default '',
  status text default 'active' check (status in ('active', 'inactive')),
  notes text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 6) teachers
create table if not exists public.teachers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text default '',
  email text default '',
  subject_ids text[] default '{}',
  notes text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 7) subjects
create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  grade text not null,
  type text default 'main',
  teacher_id uuid default null,
  color text default '#3b82f6',
  notes text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 8) subject forms
create table if not exists public.subject_forms (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null,
  subject_id uuid not null,
  term text default 'term_1',
  score numeric(5,2) default 0,
  grade text default '',
  notes text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 9) timetable slots
create table if not exists public.timetable_slots (
  id uuid primary key default gen_random_uuid(),
  day text not null,
  slot text not null,
  section_id uuid not null,
  subject_id uuid not null,
  teacher_id uuid default null,
  room text default '',
  notes text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 10) violations
create table if not exists public.violations (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null,
  type text default 'general',
  details text not null,
  violation_date timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- indexes
create index if not exists idx_accounts_email on public.accounts(email);
create index if not exists idx_students_section on public.students(section_id);
create index if not exists idx_subject_forms_student on public.subject_forms(student_id);
create index if not exists idx_timetable_section on public.timetable_slots(section_id);
create index if not exists idx_violations_student on public.violations(student_id);

-- default manager account
insert into public.accounts (name, email, password, plain_password, role, phone, status)
values (
  'Manager',
  'admin@school.edu.om',
  'Admin@123',
  'Admin@123',
  'admin',
  '+966500000000',
  'active'
)
on conflict (email) do nothing;

-- default school settings
insert into public.school_settings (key, value)
values
  ('school_name', '{"ar":"الوارف بن خالد 5-12","en":"Alwarif Bin Khalid School"}'::jsonb),
  ('school_subtitle', '{"ar":"نظام إدارة المدرسة","en":"School Management System"}'::jsonb),
  ('phone', '"+966500000000"'::jsonb),
  ('email', '"info@school.edu.om"'::jsonb),
  ('website', '"https://school.edu.om"'::jsonb),
  ('address', '"المدينة"'::jsonb),
  ('manager_secret_code', '"123456"'::jsonb)
on conflict (key) do nothing;

-- RLS setup
alter table public.accounts enable row level security;
alter table public.school_settings enable row level security;
alter table public.registration_codes enable row level security;
alter table public.sections enable row level security;
alter table public.students enable row level security;
alter table public.teachers enable row level security;
alter table public.subjects enable row level security;
alter table public.subject_forms enable row level security;
alter table public.timetable_slots enable row level security;
alter table public.violations enable row level security;

-- permissive temporary policies for local setup and testing
DROP POLICY IF EXISTS "allow_all_for_accounts" ON public.accounts;
CREATE POLICY "allow_all_for_accounts" ON public.accounts
FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_for_school_settings" ON public.school_settings;
CREATE POLICY "allow_all_for_school_settings" ON public.school_settings
FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_for_registration_codes" ON public.registration_codes;
CREATE POLICY "allow_all_for_registration_codes" ON public.registration_codes
FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_for_sections" ON public.sections;
CREATE POLICY "allow_all_for_sections" ON public.sections
FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_for_students" ON public.students;
CREATE POLICY "allow_all_for_students" ON public.students
FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_for_teachers" ON public.teachers;
CREATE POLICY "allow_all_for_teachers" ON public.teachers
FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_for_subjects" ON public.subjects;
CREATE POLICY "allow_all_for_subjects" ON public.subjects
FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_for_subject_forms" ON public.subject_forms;
CREATE POLICY "allow_all_for_subject_forms" ON public.subject_forms
FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_for_timetable_slots" ON public.timetable_slots;
CREATE POLICY "allow_all_for_timetable_slots" ON public.timetable_slots
FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_for_violations" ON public.violations;
CREATE POLICY "allow_all_for_violations" ON public.violations
FOR ALL USING (true) WITH CHECK (true);

-- optional helper triggers
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

DROP TRIGGER IF EXISTS trg_sections_updated_at ON public.sections;
CREATE TRIGGER trg_sections_updated_at
BEFORE UPDATE ON public.sections
FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

DROP TRIGGER IF EXISTS trg_students_updated_at ON public.students;
CREATE TRIGGER trg_students_updated_at
BEFORE UPDATE ON public.students
FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

DROP TRIGGER IF EXISTS trg_teachers_updated_at ON public.teachers;
CREATE TRIGGER trg_teachers_updated_at
BEFORE UPDATE ON public.teachers
FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

DROP TRIGGER IF EXISTS trg_subjects_updated_at ON public.subjects;
CREATE TRIGGER trg_subjects_updated_at
BEFORE UPDATE ON public.subjects
FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

DROP TRIGGER IF EXISTS trg_subject_forms_updated_at ON public.subject_forms;
CREATE TRIGGER trg_subject_forms_updated_at
BEFORE UPDATE ON public.subject_forms
FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

DROP TRIGGER IF EXISTS trg_timetable_slots_updated_at ON public.timetable_slots;
CREATE TRIGGER trg_timetable_slots_updated_at
BEFORE UPDATE ON public.timetable_slots
FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

DROP TRIGGER IF EXISTS trg_violations_updated_at ON public.violations;
CREATE TRIGGER trg_violations_updated_at
BEFORE UPDATE ON public.violations
FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- example queries
-- select * from public.accounts;
-- select * from public.students;
-- select * from public.sections;
-- select * from public.timetable_slots;

-- end of file
