-- ============================================================================
-- SwimSync 백엔드 스키마 (Supabase / PostgreSQL)
-- ============================================================================
-- 설계 원칙
--   1. "기관(academy)"과 "프리랜서 강사"는 같은 구조를 공유한다.
--      → 모든 사용자는 가입 시 자기 소유의 organization(개인 스튜디오)을 하나 자동으로 갖는다.
--      → 기관은 그 organization에 다른 강사(user)를 구성원으로 초대한다.
--      → 프리랜서 강사는 자기 organization(자기 학생 관리용)을 유지하면서,
--        동시에 여러 기관의 organization_members로도 소속될 수 있다 (다대다).
--   2. 모든 데이터 테이블은 organization_id를 갖고, RLS로 "그 조직의 활성 구성원만" 접근 가능하다.
--   3. 원장(owner)과 강사(instructor)는 같은 조직 안에서 역할(role)로 구분된다.
-- ============================================================================

-- ── 확장 ────────────────────────────────────────────────────────────────────
create extension if not exists "pgcrypto";

-- ── organizations: 기관 또는 프리랜서 개인 스튜디오 ──────────────────────────
create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null default '내 스튜디오',
  branch_name text not null default '',
  plan text not null default 'freelance' check (plan in ('freelance', 'academy')),
  designated_times text[] not null default array['14:00','15:00','16:00','17:00','18:00','19:00','20:00'],
  makeup_settings jsonb not null default '{
    "childRequiresDocument": false,
    "adultRequiresDocument": true,
    "makeupPolicies": [
      {"sessionsPerWeek": 2, "maxMakeups": 2},
      {"sessionsPerWeek": 3, "maxMakeups": 3},
      {"sessionsPerWeek": 5, "maxMakeups": 4}
    ]
  }'::jsonb,
  created_at timestamptz not null default now()
);

-- ── profiles: auth.users를 확장하는 공개 프로필 (모든 사용자 공통) ───────────
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  phone text not null default '',
  avatar_url text not null default '',
  created_at timestamptz not null default now()
);

-- ── organization_members: 조직 ↔ 사용자 다대다 (원장/강사 소속·초대) ────────
create table organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  invited_email text,
  role text not null default 'instructor' check (role in ('owner', 'instructor')),
  display_name text not null default '',
  member_type text not null default '정규' check (member_type in ('정규', '파트')),
  color text not null default '#0891b2',
  max_capacity int not null default 5,
  status text not null default 'active' check (status in ('invited', 'active', 'removed')),
  created_at timestamptz not null default now(),
  unique (organization_id, user_id)
);
create index on organization_members (organization_id);
create index on organization_members (user_id);

-- ── lesson_classes: 강습반 ────────────────────────────────────────────────
create table lesson_classes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  description text not null default '',
  created_at timestamptz not null default now()
);

-- ── drivers / vehicles ───────────────────────────────────────────────────
create table drivers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  phone text not null default '',
  vehicle_number text not null default '',
  created_at timestamptz not null default now()
);

create table vehicles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  vehicle_number text not null,
  driver_id uuid references drivers(id) on delete set null,
  route text not null default '',
  capacity int not null default 15,
  departure_time text not null default '14:30',
  created_at timestamptz not null default now()
);

-- ── payment_plans ────────────────────────────────────────────────────────
create table payment_plans (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  category text not null check (category in ('adult', 'child')),
  has_free_swim boolean not null default false,
  sessions_per_week int not null default 2,
  monthly_price int not null default 0,
  description text not null default '',
  created_at timestamptz not null default now()
);

-- ── students: 강습생 ─────────────────────────────────────────────────────
create table students (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  student_number text not null default '',
  student_name text not null,
  parent_name text not null default '',
  birth_date date,
  registration_date date not null default current_date,
  gender text not null default '남' check (gender in ('남', '여')),
  lesson_class_id uuid references lesson_classes(id) on delete set null,
  regular_days text[] not null default '{}',
  regular_time text not null default '15:00',
  phone text not null default '',
  level text not null default '초급',
  status text not null default 'active' check (status in ('active', 'deferred', 'inactive')),
  instructor_member_id uuid references organization_members(id) on delete set null,
  payment_amount int not null default 0,
  payment_date date,
  payment_renewal_date date,
  payment_completed boolean not null default false,
  student_photo text not null default '',
  age int not null default 0,
  region text not null default '',
  pass_type text not null default '주 2회',
  total_classes int not null default 8,
  reschedule_limit int not null default 2,
  used_reschedules int not null default 0,
  notes text not null default '',
  progress text not null default '',
  address text not null default '',
  vehicle_id uuid references vehicles(id) on delete set null,
  category text not null default 'child' check (category in ('adult', 'child')),
  payment_plan_id uuid references payment_plans(id) on delete set null,
  division text not null default '정규반' check (division in ('유치부', '정규반', '성인반')),
  created_at timestamptz not null default now()
);
create index on students (organization_id);

-- ── class_sessions: 특정 날짜·시간의 수업 한 타임 ────────────────────────
create table class_sessions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  date date not null,
  time text not null,
  instructor_member_id uuid references organization_members(id) on delete set null,
  status text not null default 'scheduled',
  created_at timestamptz not null default now()
);
create index on class_sessions (organization_id, date);

-- ── class_session_students: 그 수업에 참여하는 학생 (정규/보강/결석) ──────
create table class_session_students (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references class_sessions(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  role text not null default 'regular' check (role in ('regular', 'makeup')),
  absent boolean not null default false,
  unique (session_id, student_id)
);
create index on class_session_students (session_id);
create index on class_session_students (student_id);

-- ── academy_events: 공지/이벤트/메모 캘린더 ──────────────────────────────
create table academy_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  date date not null,
  title text not null,
  type text not null default 'notice' check (type in ('notice', 'event', 'memo')),
  created_at timestamptz not null default now()
);

-- ── notifications / notification_recipients ──────────────────────────────
create table notifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  type text not null default 'custom' check (type in ('event', 'payment', 'holiday', 'custom')),
  title text not null,
  content text not null,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

create table notification_recipients (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid not null references notifications(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  unique (notification_id, student_id)
);

-- ── makeup_requests: 서류 기반 보강/이월 요청 ────────────────────────────
create table makeup_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  from_session_id uuid not null references class_sessions(id) on delete cascade,
  to_session_id uuid references class_sessions(id) on delete set null,
  doc_photo_url text not null default '',
  reason text not null default '',
  preferred_resolution text not null default 'makeup' check (preferred_resolution in ('makeup', 'carryover')),
  status text not null default 'pending' check (status in ('pending', 'approved_makeup', 'approved_carryover', 'rejected')),
  carryover_amount int not null default 0,
  requested_at timestamptz not null default now(),
  resolved_at timestamptz
);

-- ============================================================================
-- 헬퍼 함수: 로그인한 사용자가 이 조직의 "활성 구성원"인지 / "원장(owner)"인지
-- ============================================================================
create or replace function is_org_member(org_id uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from organization_members
    where organization_id = org_id and user_id = auth.uid() and status = 'active'
  );
$$;

create or replace function is_org_owner(org_id uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from organization_members
    where organization_id = org_id and user_id = auth.uid() and status = 'active' and role = 'owner'
  );
$$;

-- ============================================================================
-- 신규 가입 시 자동으로: profiles 생성 + 개인(프리랜서) organization 생성 + owner로 가입
-- ============================================================================
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
declare
  new_org_id uuid;
  display_name text := coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1));
begin
  insert into profiles (id, full_name) values (new.id, display_name);

  insert into organizations (name, plan) values (display_name || '의 스튜디오', 'freelance')
    returning id into new_org_id;

  insert into organization_members (organization_id, user_id, role, display_name, status)
  values (new_org_id, new.id, 'owner', display_name, 'active');

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ============================================================================
-- Row Level Security
-- ============================================================================
alter table organizations enable row level security;
alter table profiles enable row level security;
alter table organization_members enable row level security;
alter table lesson_classes enable row level security;
alter table drivers enable row level security;
alter table vehicles enable row level security;
alter table payment_plans enable row level security;
alter table students enable row level security;
alter table class_sessions enable row level security;
alter table class_session_students enable row level security;
alter table academy_events enable row level security;
alter table notifications enable row level security;
alter table notification_recipients enable row level security;
alter table makeup_requests enable row level security;

-- profiles: 본인 것만 수정, 같은 조직 구성원끼리는 서로 조회 가능
create policy "profiles: self read/write" on profiles
  for all using (id = auth.uid()) with check (id = auth.uid());
create policy "profiles: org members can view each other" on profiles
  for select using (
    exists (
      select 1 from organization_members m1
      join organization_members m2 on m1.organization_id = m2.organization_id
      where m1.user_id = profiles.id and m2.user_id = auth.uid() and m2.status = 'active'
    )
  );

-- organizations: 활성 구성원만 조회, 원장만 수정
create policy "organizations: members can view" on organizations
  for select using (is_org_member(id));
create policy "organizations: owner can update" on organizations
  for update using (is_org_owner(id));
create policy "organizations: authenticated users can create" on organizations
  for insert with check (auth.uid() is not null);

-- organization_members: 같은 조직 구성원은 서로 조회 가능, 원장만 초대/수정/삭제
create policy "members: view own org" on organization_members
  for select using (is_org_member(organization_id) or user_id = auth.uid());
create policy "members: owner manages" on organization_members
  for insert with check (is_org_owner(organization_id));
create policy "members: owner updates" on organization_members
  for update using (is_org_owner(organization_id) or user_id = auth.uid());
create policy "members: owner deletes" on organization_members
  for delete using (is_org_owner(organization_id));
-- 초대받은 사용자가 본인 초대를 수락(status → active, user_id 연결)할 수 있도록 별도 허용은 애플리케이션에서 Edge Function으로 처리 권장

-- 나머지 테이블 공통 패턴: 조직 구성원이면 읽기/쓰기 가능 (세부 권한은 필요 시 강화)
do $$
declare
  t text;
begin
  foreach t in array array[
    'lesson_classes', 'drivers', 'vehicles', 'payment_plans', 'students',
    'class_sessions', 'academy_events', 'notifications', 'makeup_requests'
  ] loop
    execute format('create policy "%1$s: org members full access" on %1$s for all using (is_org_member(organization_id)) with check (is_org_member(organization_id));', t);
  end loop;
end $$;

-- 자식 테이블(조직 소속이 없고, 부모를 통해 조직에 연결됨)은 부모 테이블을 통해 검사
create policy "class_session_students: org members" on class_session_students
  for all using (
    exists (select 1 from class_sessions cs where cs.id = session_id and is_org_member(cs.organization_id))
  ) with check (
    exists (select 1 from class_sessions cs where cs.id = session_id and is_org_member(cs.organization_id))
  );

create policy "notification_recipients: org members" on notification_recipients
  for all using (
    exists (select 1 from notifications n where n.id = notification_id and is_org_member(n.organization_id))
  ) with check (
    exists (select 1 from notifications n where n.id = notification_id and is_org_member(n.organization_id))
  );

-- ============================================================================
-- Realtime: 프런트가 실시간으로 변경사항을 구독할 테이블 등록
-- ============================================================================
alter publication supabase_realtime add table
  students, class_sessions, class_session_students, vehicles, drivers,
  makeup_requests, notifications, organization_members, academy_events, payment_plans, lesson_classes;
