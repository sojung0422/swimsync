import { createContext, useContext, useState, ReactNode } from 'react';
import { startOfMonth, endOfMonth, addDays, addMonths, format, getDay, parseISO, differenceInCalendarDays } from 'date-fns';

const DAY_MAP: Record<string, number> = { '일': 0, '월': 1, '화': 2, '수': 3, '목': 4, '금': 5, '토': 6 };

// ── Core Types ────────────────────────────────────────────────
export type Instructor = {
  id: string; name: string; nickname: string;
  maxCapacity: number; type: '정규' | '파트'; color: string;
  jobType: '강사' | '데스크' | '원장' | '관리';
  phone: string; officePhone: string; extNumber: string;
  hireDate: string; position: string; department: string;
  workDays: string[]; workTimeStart: string; workTimeEnd: string;
  dutyNote: string; vehicleNumber: string; address: string; memo: string;
  status: 'active' | 'resigned';
  monthlySalary: number; // 정규직 급여 정산 기준 월급
  hourlyRate: number; // 파트타임 급여 정산 기준 시급
};
export type LessonClass = {
  id: string; name: string; description: string;
  defaultTime: string; // 반 개설 시 기본 시간 — 담당쌤 배정 시 변경 가능
  capacity: number; // 이 반명의 정원 (같은 반명이면 담당쌤이 달라도 공통 정원 기준을 공유)
  eligibilityCondition: string; // 수강 가능 조건 (예: "만 3~7세", "초급 레벨 이상")
};

// 보강은 같은 구분(division) 내에서만 가능 — 유치부/정규반/성인반은 서로 섞이지 않음
export type Division = '유치부' | '정규반' | '성인반';

// 한 학생이 여러 반에 동시 등록될 수 있음 — 학생의 "기본(대표) 수강정보"는 Student 최상위 필드가 그대로 하나의
// enrollment 역할을 하고(id: 'primary'), 그 외 추가로 듣는 반은 additionalEnrollments 배열에 들어감.
export type EnrollmentStatus = 'active' | 'paused' | 'ended';
export type Enrollment = {
  id: string;
  lessonClassId: string;
  instructorId: string;
  regularDays: string[];
  regularTime: string;
  startDate: string;
  endDate: string; // '' = 종료일 미정(진행중)
  status: EnrollmentStatus;
  passType: string;
  paymentPlanId: string;
  monthlyPrice: number; // 0이면 paymentPlanId의 금액을 사용
  // 장기 결석(차감 처리) 관련 — 2주 이상 여행/출장/수술 등으로 일시 중단할 때 기록
  pauseReason: string; // '' = 사유 없음(일반 휴학)
  expectedReturnDate: string; // '' = 미정
  withdrawalReason: string; // 퇴원 처리 시 사유
};

export type Student = {
  id: string; studentNumber: string; studentName: string; nickname: string;
  birthDate: string; registrationDate: string; gender: '남' | '여';
  lessonClassId: string; regularDays: string[]; regularTime: string;
  phone: string; motherPhone: string; fatherPhone: string;
  smsRecipients: ('self' | 'mother' | 'father')[];
  level: string; status: 'active' | 'deferred' | 'inactive';
  instructorId: string; paymentAmount: number; paymentDate: string;
  paymentRenewalDate: string; paymentCompleted: boolean; studentPhoto: string;
  parentName: string; age: number; region: string; passType: string;
  totalClasses: number; rescheduleLimit: number; usedReschedules: number;
  notes: string; progress: string;
  // Extended fields
  address: string;
  vehicleId: string;
  category: 'adult' | 'child';
  paymentPlanId: string;
  division: Division;
  additionalEnrollments: Enrollment[];
  pauseReason: string;
  expectedReturnDate: string;
  withdrawalReason: string;
};

export const getPrimaryEnrollment = (s: Student): Enrollment => ({
  id: 'primary',
  lessonClassId: s.lessonClassId, instructorId: s.instructorId,
  regularDays: s.regularDays, regularTime: s.regularTime,
  startDate: s.registrationDate, endDate: '', status: s.status === 'inactive' ? 'ended' : s.status === 'deferred' ? 'paused' : 'active',
  passType: s.passType, paymentPlanId: s.paymentPlanId, monthlyPrice: 0,
  pauseReason: s.pauseReason, expectedReturnDate: s.expectedReturnDate, withdrawalReason: s.withdrawalReason,
});

export const getAllEnrollments = (s: Student): Enrollment[] => [getPrimaryEnrollment(s), ...s.additionalEnrollments];

// 연락 시 우선적으로 사용할 번호 — 모(어머니) > 부(아버지) > 원생 본인 순
export const getPrimaryContactPhone = (s: Student): string => s.motherPhone || s.fatherPhone || s.phone;

// 기본반뿐 아니라 다중 반(추가 등록)에서 이 강사를 담당으로 두고 있는 경우도 포함 — 강사 앱/관리자 상담 페이지에서 공통으로 사용
export const teachesStudent = (instructorId: string, s: Student): boolean =>
  getAllEnrollments(s).some(e => e.status === 'active' && e.instructorId === instructorId);
export const studentsForInstructor = (instructorId: string, students: Student[]): Student[] =>
  students.filter(s => s.status === 'active' && teachesStudent(instructorId, s));

export type ClassSession = {
  id: string; date: string; time: string; instructorId: string;
  studentIds: string[]; makeupStudentIds: string[]; absentStudentIds: string[];
  status: string;
};

// 정규 수강생(studentIds) 중 첫 학생의 구분을 그 시간대(클래스)의 구분으로 간주 — 보강 자리 매칭에 사용
export const getClassDivision = (cls: ClassSession, students: Student[]): Division | null => {
  for (const id of cls.studentIds) {
    const s = students.find(st => st.id === id);
    if (s) return s.division;
  }
  return null;
};

export type AcademyEvent = { id: string; date: string; endDate: string; title: string; type: 'event' | 'notice' | 'memo' };

export type MakeupPolicyRule = { sessionsPerWeek: number; maxMakeups: number };

export type MakeupSettings = {
  childRequiresDocument: boolean;
  adultRequiresDocument: boolean;
  makeupPolicies: MakeupPolicyRule[];
};

export type AcademySettings = {
  academyName: string;
  branchName: string;
  designatedTimes: string[];
  makeupSettings: MakeupSettings;
  counselingIntervalMonths: number; // 정기 상담 주기 (몇 개월마다) — 관리자가 설정
  reRegistrationPeriod: { startDay: number; endDay: number }; // 매월 며칠~며칠이 재등록 기간인지 — 학원마다 다르게 설정
  swimLevels: string[]; // 급수/레벨 체계 (예: 초급, 중급, 고급) — 학원마다 다르게 설정
};

// "주 1회" 같은 수강권 문자열에서 주당 횟수를 추출
export const parseSessionsPerWeek = (passType: string): number => parseInt(passType.replace(/[^0-9]/g, ''), 10) || 0;

// 오늘이 학원이 정한 재등록 기간(매월 startDay~endDay) 안에 있는지
export const isWithinReRegistrationPeriod = (period: { startDay: number; endDay: number }, date: Date = new Date()): boolean => {
  const day = date.getDate();
  return day >= period.startDay && day <= period.endDay;
};

export type MakeupRequestStatus = 'pending' | 'approved_makeup' | 'approved_carryover' | 'rejected' | 'cancelled_by_academy';

// 진단서/장기 결석 등 서류 기반 보강 요청 — 강사/학원이 검토 후 보강 슬롯 배정 또는 다음 달 결제 차감(이월) 처리
export type MakeupRequest = {
  id: string; studentId: string; fromClassId: string;
  docPhoto: string; reason: string;
  preferredResolution: 'makeup' | 'carryover';
  status: MakeupRequestStatus;
  requestedAt: string; resolvedAt: string;
  toClassId: string; carryoverAmount: number;
};

// 이미 확정된 보강이 학원 사정(신규·체험 문의 등 자리 필요)으로 취소됐다는 알림 —
// 서류 기반(MakeupRequest 경유) 여부와 무관하게 항상 생성되어, 학부모 앱/강사 앱에서 벨소리로 안내함
export type MakeupCancellationNotice = {
  id: string; studentId: string; classId: string; createdAt: string;
};

// 학부모가 요청하는 정기 요일/시간/수강 횟수 변경 — 학원이 웹에서 확인 후 승인해야 실제 반영됨
export type ScheduleChangeRequest = {
  id: string; studentId: string; enrollmentId: string; // 'primary' 또는 additionalEnrollments의 id
  currentDays: string[]; currentTime: string; currentPassType: string;
  requestedDays: string[]; requestedTime: string; requestedPassType: string;
  isFrequencyChange: boolean; // 주당 횟수가 바뀌는 요청인지 — true면 이번 달이 아니라 effectiveDate(다음 달 1일)부터 적용됨
  effectiveDate: string; // 'yyyy-MM-dd' — 요일/시간만 바뀌는 요청은 승인 즉시(오늘), 횟수 변경은 다음 달 1일
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string; resolvedAt: string;
};

// 결석 취소 가능 기간 추적 — 결석을 누른 시점 기준 3일 이내에는 취소 가능하지만,
// 수업이 이미 3일 이내로 임박한 상태에서 결석을 누르면 취소 유예 없이 바로 자리가 확정 오픈된다.
export type AbsenceRecord = {
  id: string; studentId: string; classId: string;
  markedAt: string; // ISO
  cancelDeadline: string; // ISO — 이 시각이 지나면 취소 불가 + 자리가 보강용으로 완전히 열림
  status: 'active' | 'cancelled';
};

// 결석 취소 가능 여부(취소 버튼 활성화 여부)
export const isAbsenceCancellable = (record: AbsenceRecord, now: Date = new Date()): boolean =>
  record.status === 'active' && now < parseISO(record.cancelDeadline);

// 결석으로 비워진 자리가 "예비"(취소 유예 중이라 아직 보강 배정 불가)인지, 취소 유예가 끝나 "확정 오픈"됐는지
export const isAbsenceSeatFinalized = (record: AbsenceRecord | undefined, now: Date = new Date()): boolean => {
  if (!record) return true; // 기록이 없는 결석(레거시 데이터)은 즉시 오픈된 것으로 취급
  if (record.status === 'cancelled') return false; // 취소됐다면 원생이 복귀한 것이므로 자리는 열리지 않음
  return now >= parseISO(record.cancelDeadline);
};

// 보강 후보를 우선순위로 정렬 — 동일 강사 / 가까운 날짜 / 여유 자리를 가점 요소로 삼아 상단에 "추천" 후보를 골라준다
// (완전 자동 확정이 아니라 순서만 매겨주는 반자동 보조 — 최종 선택은 학부모가 직접 함)
export const rankMakeupCandidates = <T extends { c: ClassSession; instructor?: Instructor; remaining: number }>(
  candidates: T[], fromClass: ClassSession, now: Date = new Date()
): (T & { score: number; reasons: string[] })[] => {
  return candidates.map(cand => {
    const reasons: string[] = [];
    let score = 0;
    if (fromClass.instructorId === cand.c.instructorId) { score += 3; reasons.push('동일 강사'); }
    const daysAway = differenceInCalendarDays(parseISO(cand.c.date), now);
    if (daysAway <= 7) { score += 2; reasons.push('가까운 날짜'); }
    if (cand.remaining >= 2) { score += 1; reasons.push('여유 자리'); }
    return { ...cand, score, reasons };
  }).sort((a, b) => b.score - a.score || a.c.date.localeCompare(b.c.date) || a.c.time.localeCompare(b.c.time));
};

// 클래스의 실제 보강 배정 가능 정원(예비 중인 결석 자리는 아직 카운트에서 빼지 않음)
export const computeOpenMakeupSlots = (cls: ClassSession, capacity: number, absenceRecords: AbsenceRecord[], now: Date = new Date()): number => {
  const finalizedAbsentCount = cls.absentStudentIds.filter(sid => {
    const rec = absenceRecords.find(r => r.classId === cls.id && r.studentId === sid && r.status === 'active');
    return isAbsenceSeatFinalized(rec, now);
  }).length;
  const current = cls.studentIds.length + cls.makeupStudentIds.length - finalizedAbsentCount;
  return capacity - current;
};

// ── New Types ─────────────────────────────────────────────────
export type Driver = {
  id: string; name: string; phone: string; vehicleNumber: string;
};

export type Vehicle = {
  id: string; vehicleNumber: string; driverId: string;
  route: string; capacity: number; departureTime: string;
  studentIds: string[];
};

export type PaymentPlan = {
  id: string; name: string; category: 'adult' | 'child';
  hasFreeSwim: boolean; sessionsPerWeek: number;
  monthlyPrice: number; description: string;
  sessionRates: number[]; // 등록일 기준 그 달 남은 횟수(1회~14회)별 일할 청구 금액 — 인덱스 0 = 1회
};

// 원생이 2주 이상 결석(장기 결석) 후 다시 등록을 요청하는 경우 — 강사·데스크 확인 후에만 자리 재배정
export type ReturnRequest = {
  id: string; studentId: string; enrollmentId: string;
  requestedReturnDate: string;
  hasSeatAvailable: boolean; // 신청 시점 기준 정원 여유 여부(참고용, 최종 승인은 관리자 판단)
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string; resolvedAt: string;
};

// 퇴원 요청 — 학부모가 사유와 함께 요청하면 강사/데스크가 확인 후 최종 퇴원 처리
export type WithdrawalRequest = {
  id: string; studentId: string; enrollmentId: string;
  reason: string;
  requestedBy: 'parent' | 'admin';
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string; resolvedAt: string;
};

// 학생별 월별 수납 이력(원장) — 어떤 반(enrollment)에 대해, 언제, 얼마를, 어떻게 수납했는지 추적
export type PaymentRecord = {
  id: string; studentId: string; enrollmentId: string; // 'primary' 또는 additionalEnrollments의 id
  billingMonth: string; // 'yyyy-MM'
  targetAmount: number; paidAmount: number;
  paidAt: string; // '' = 미납
  method: 'card' | 'cash' | 'transfer' | '';
  status: 'paid' | 'unpaid' | 'partial';
  note: string;
};

// 정기 상담 기록 — 강사가 학생(학부모)과 진행한 상담 내용을 일자별로 남김
export type CounselingRecord = {
  id: string; studentId: string; instructorId: string;
  date: string; // 'yyyy-MM-dd' 상담 진행일
  content: string; // 상담 내용(일지)
  createdAt: string;
};

// 학부모↔강사 1:1 소통 — 학생(자녀) 단위로 스레드가 묶임
export type ChatMessage = {
  id: string; studentId: string;
  senderRole: 'parent' | 'instructor';
  kind: 'text' | 'call_note'; // call_note = 실제 전화 통화 후 남긴 메모
  text: string; createdAt: string; // ISO
};

export type NotificationRecord = {
  id: string; createdAt: string;
  type: 'event' | 'payment' | 'holiday' | 'custom';
  title: string; content: string;
  recipientIds: string[]; sentAt: string | null;
};

// 정원이 찬 반에 신규/체험 문의가 들어온 경우 등록해두는 대기자 명단 — 자리가 나면 관리자가 확인해 전환한다
export type WaitlistEntry = {
  id: string; studentName: string; parentPhone: string;
  lessonClassId: string; desiredDays: string[]; desiredTime: string;
  category: 'adult' | 'child'; note: string;
  status: 'waiting' | 'notified' | 'converted' | 'cancelled';
  requestedAt: string; notifiedAt: string;
};

// 형제/다자녀 할인, 이벤트 할인 — 등록된 할인은 조건에 맞는 학생에게 자동으로 계산되어 적용된다
export type Discount = {
  id: string; name: string; kind: 'sibling' | 'event';
  percent: number; // 0~100
  minSiblingCount: number; // kind='sibling'일 때: 가족(형제) 총원이 이 값 이상이어야 적용
  startDate: string; endDate: string; // kind='event'일 때: 적용 기간(빈 문자열이면 상시)
  active: boolean;
};

// 강사 급여 정산 — 정규직은 월급 고정, 파트타임은 시급×근무시간으로 계산해 명세서를 발행한다
export type PayrollRecord = {
  id: string; instructorId: string; month: string; // 'yyyy-MM'
  payType: '정규' | '파트';
  baseAmount: number; hourlyRate: number; hoursWorked: number;
  totalAmount: number; issuedAt: string; note: string;
};

// 급수/레벨 테스트 기록 — 강사가 응시 결과를 남기면 합격 시 학생의 현재 레벨이 자동으로 갱신된다
export type LevelTestRecord = {
  id: string; studentId: string; instructorId: string;
  testDate: string; previousLevel: string; resultLevel: string;
  passed: boolean; note: string; createdAt: string;
};

// ── Initial Data ──────────────────────────────────────────────
const INITIAL_INSTRUCTORS: Instructor[] = [
  { id: 'i1', name: '김수영', nickname: '', maxCapacity: 5, type: '정규', color: '#0891b2', jobType: '강사',
    phone: '010-2222-3333', officePhone: '02-555-1234', extNumber: '101', hireDate: '2023-03-01',
    position: '팀장', department: '강습팀', workDays: ['월', '화', '수', '목', '금'], workTimeStart: '13:00', workTimeEnd: '21:00',
    dutyNote: '초급반 총괄', vehicleNumber: '', address: '', memo: '', status: 'active',
    monthlySalary: 2800000, hourlyRate: 0 },
  { id: 'i2', name: '이바다', nickname: '', maxCapacity: 4, type: '파트', color: '#059669', jobType: '강사',
    phone: '010-3333-4444', officePhone: '', extNumber: '', hireDate: '2024-06-01',
    position: '강사', department: '강습팀', workDays: ['화', '목', '토'], workTimeStart: '14:00', workTimeEnd: '18:00',
    dutyNote: '', vehicleNumber: '', address: '', memo: '', status: 'active',
    monthlySalary: 0, hourlyRate: 25000 },
  { id: 'i3', name: '박돌고래', nickname: '', maxCapacity: 6, type: '정규', color: '#d97706', jobType: '강사',
    phone: '010-4444-5555', officePhone: '02-555-1234', extNumber: '102', hireDate: '2022-01-15',
    position: '수석강사', department: '강습팀', workDays: ['월', '수', '금', '토'], workTimeStart: '13:00', workTimeEnd: '20:00',
    dutyNote: '고급반/경기반 담당', vehicleNumber: '', address: '', memo: '', status: 'active',
    monthlySalary: 3200000, hourlyRate: 0 },
];

export const INITIAL_LESSON_CLASSES: LessonClass[] = [
  { id: 'lc1', name: '초급반 A', description: '수영 기초 과정 (오전)', defaultTime: '15:00', capacity: 5, eligibilityCondition: '만 5~9세, 수영 초경험자' },
  { id: 'lc2', name: '초급반 B', description: '수영 기초 과정 (오후)', defaultTime: '15:00', capacity: 5, eligibilityCondition: '만 5~9세, 수영 초경험자' },
  { id: 'lc3', name: '중급반', description: '기초 완성 및 영법 발전', defaultTime: '16:00', capacity: 6, eligibilityCondition: '자유형 25m 완주 가능자' },
  { id: 'lc4', name: '고급반', description: '경기 준비 및 고급 영법', defaultTime: '17:00', capacity: 6, eligibilityCondition: '4영법 모두 가능자' },
];

// "주 N회" 문자열과 월 기준 정가로부터 1회~14회 일할 청구 요금표를 선형 비례로 자동 계산 (관리자가 이후 개별 조정 가능)
export const computeLinearSessionRates = (monthlyPrice: number, sessionsPerWeek: number): number[] => {
  const fullMonthSessions = Math.max(1, sessionsPerWeek * 4);
  return Array.from({ length: 14 }, (_, i) => Math.round((monthlyPrice / fullMonthSessions) * (i + 1) / 100) * 100);
};

// 등록일부터 그 달 말일까지, 정해진 요일(regularDays)이 몇 번 돌아오는지 계산 — 원비표에서 해당 회차 요금을 자동으로 골라줄 때 사용
export const computeRemainingSessionsInMonth = (startDate: string, regularDays: string[]): number => {
  if (!startDate || regularDays.length === 0) return 0;
  const start = parseISO(startDate);
  const monthEnd = endOfMonth(start);
  let count = 0;
  for (let d = start; d <= monthEnd; d = addDays(d, 1)) {
    const dayLabel = Object.entries(DAY_MAP).find(([, v]) => v === getDay(d))?.[0];
    if (dayLabel && regularDays.includes(dayLabel)) count++;
  }
  return count;
};

// 같은 가족(모/부 연락처가 일치)으로 등록된 활성 학생 수 — 형제 할인 판단에 사용
export const computeSiblingCount = (student: Student, allStudents: Student[]): number => {
  const motherKey = student.motherPhone;
  const fatherKey = student.fatherPhone;
  if (!motherKey && !fatherKey) return 1;
  const familyIds = new Set(
    allStudents
      .filter(s => s.status === 'active' && ((motherKey && s.motherPhone === motherKey) || (fatherKey && s.fatherPhone === fatherKey)))
      .map(s => s.id)
  );
  return Math.max(1, familyIds.size);
};

// 학생에게 지금 적용 가능한 할인(형제+이벤트)을 계산 — 여러 개면 퍼센트를 합산(최대 100%)
export const computeApplicableDiscounts = (student: Student, allStudents: Student[], discounts: Discount[], today: Date = new Date()): { percent: number; matched: Discount[] } => {
  const todayStr = format(today, 'yyyy-MM-dd');
  const siblingCount = computeSiblingCount(student, allStudents);
  const matched = discounts.filter(d => {
    if (!d.active) return false;
    if (d.kind === 'sibling') return siblingCount >= d.minSiblingCount;
    if (d.startDate && todayStr < d.startDate) return false;
    if (d.endDate && todayStr > d.endDate) return false;
    return true;
  });
  const percent = Math.min(100, matched.reduce((sum, d) => sum + d.percent, 0));
  return { percent, matched };
};

// 강사의 근무 요일·시간을 기준으로 특정 월의 총 근무시간을 추정 (파트타임 급여 계산용 — 발행 전 관리자가 직접 조정 가능)
export const computeMonthlyHours = (instructor: Instructor, month: string): number => {
  const [y, m] = month.split('-').map(Number);
  if (!y || !m) return 0;
  const daysInMonth = new Date(y, m, 0).getDate();
  const [sh, sm] = instructor.workTimeStart.split(':').map(Number);
  const [eh, em] = instructor.workTimeEnd.split(':').map(Number);
  const dailyHours = Math.max(0, ((eh || 0) * 60 + (em || 0) - ((sh || 0) * 60 + (sm || 0))) / 60);
  const dayLabelByIndex = Object.fromEntries(Object.entries(DAY_MAP).map(([k, v]) => [v, k]));
  let workDayCount = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    const dow = new Date(y, m - 1, d).getDay();
    if (instructor.workDays.includes(dayLabelByIndex[dow])) workDayCount++;
  }
  return Math.round(workDayCount * dailyHours * 10) / 10;
};

const INITIAL_DRIVERS: Driver[] = [
  { id: 'd1', name: '최기사', phone: '010-7777-8888', vehicleNumber: '서울 12가 3456' },
  { id: 'd2', name: '한드라이버', phone: '010-9999-0000', vehicleNumber: '서울 98나 7654' },
];

const INITIAL_VEHICLES: Vehicle[] = [
  { id: 'v1', vehicleNumber: '서울 12가 3456', driverId: 'd1', route: 'A노선 (강남→서초)', capacity: 15, departureTime: '14:30', studentIds: ['s1', 's2'] },
  { id: 'v2', vehicleNumber: '서울 98나 7654', driverId: 'd2', route: 'B노선 (송파→강동)', capacity: 12, departureTime: '14:45', studentIds: ['s3'] },
];

const INITIAL_PAYMENT_PLANS: PaymentPlan[] = [
  { id: 'pp1', name: '정규 주1회 탑승', category: 'child', hasFreeSwim: false, sessionsPerWeek: 1, monthlyPrice: 160000, description: '아동 기본 수영 강습 (주 1회, 차량 탑승 포함)', sessionRates: computeLinearSessionRates(160000, 1) },
  { id: 'pp2', name: '정규 주2회 탑승', category: 'child', hasFreeSwim: false, sessionsPerWeek: 2, monthlyPrice: 285000, description: '아동 기본 수영 강습 (주 2회, 차량 탑승 포함)', sessionRates: computeLinearSessionRates(285000, 2) },
  { id: 'pp3', name: '정규 주2회 미탑승', category: 'child', hasFreeSwim: false, sessionsPerWeek: 2, monthlyPrice: 275000, description: '아동 기본 수영 강습 (주 2회, 차량 미탑승)', sessionRates: computeLinearSessionRates(275000, 2) },
  { id: 'pp4', name: '성인 주3회', category: 'adult', hasFreeSwim: false, sessionsPerWeek: 3, monthlyPrice: 130000, description: '성인 기초 수영 (주 3회)', sessionRates: computeLinearSessionRates(130000, 3) },
  { id: 'pp5', name: '성인 주5회+자유수영', category: 'adult', hasFreeSwim: true, sessionsPerWeek: 5, monthlyPrice: 180000, description: '성인 집중 + 자유수영 포함', sessionRates: computeLinearSessionRates(180000, 5) },
];

const INITIAL_SETTINGS: AcademySettings = {
  academyName: '푸른바다 수영장',
  branchName: '강남점',
  designatedTimes: ['14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'],
  makeupSettings: {
    childRequiresDocument: false,
    adultRequiresDocument: true,
    makeupPolicies: [
      { sessionsPerWeek: 2, maxMakeups: 2 },
      { sessionsPerWeek: 3, maxMakeups: 3 },
      { sessionsPerWeek: 5, maxMakeups: 4 },
    ],
  },
  counselingIntervalMonths: 2,
  reRegistrationPeriod: { startDay: 20, endDay: 25 },
  swimLevels: ['초급', '중급', '고급'],
};

const INITIAL_DISCOUNTS: Discount[] = [
  { id: 'disc1', name: '형제 2인 이상 할인', kind: 'sibling', percent: 5, minSiblingCount: 2, startDate: '', endDate: '', active: true },
  { id: 'disc2', name: '형제 3인 이상 할인', kind: 'sibling', percent: 10, minSiblingCount: 3, startDate: '', endDate: '', active: true },
];

const INITIAL_WAITLIST: WaitlistEntry[] = [];
const INITIAL_PAYROLL_RECORDS: PayrollRecord[] = [];
const INITIAL_LEVEL_TEST_RECORDS: LevelTestRecord[] = [];

export const getMakeupLimitForSessions = (policies: MakeupPolicyRule[], sessionsPerWeek: number): number =>
  policies.find(p => p.sessionsPerWeek === sessionsPerWeek)?.maxMakeups ?? 2;

const INITIAL_STUDENTS: Student[] = [
  {
    id: 's1', studentNumber: '2025-001', nickname: '',
    parentName: '김어머니', studentName: '김민준',
    age: 8, birthDate: '2016-03-15', registrationDate: '2025-01-10', gender: '남',
    lessonClassId: 'lc1', level: '초급', region: '서울시 강남구',
    phone: '', motherPhone: '010-1111-2222', fatherPhone: '', smsRecipients: ['mother'],
    passType: '주 2회', totalClasses: 8, rescheduleLimit: 2, usedReschedules: 0,
    instructorId: 'i1', regularDays: ['월', '수'], regularTime: '15:00',
    notes: '물을 조금 무서워함', progress: '자유형 발차기', status: 'active',
    paymentAmount: 120000, paymentDate: '2025-01-10', paymentRenewalDate: '2025-02-10',
    paymentCompleted: true, studentPhoto: '',
    address: '서울시 강남구 역삼동 123-45', vehicleId: 'v1',
    category: 'child', paymentPlanId: 'pp1', division: '정규반',
    additionalEnrollments: [], pauseReason: '', expectedReturnDate: '', withdrawalReason: '',
  },
  {
    id: 's2', studentNumber: '2025-002', nickname: '',
    parentName: '이아버지', studentName: '이서연',
    age: 10, birthDate: '2014-07-22', registrationDate: '2025-01-15', gender: '여',
    lessonClassId: 'lc3', level: '중급', region: '서울시 서초구',
    phone: '', motherPhone: '', fatherPhone: '010-3333-4444', smsRecipients: ['father'],
    passType: '주 3회', totalClasses: 12, rescheduleLimit: 2, usedReschedules: 1,
    instructorId: 'i1', regularDays: ['월', '수', '금'], regularTime: '16:00',
    notes: '자유형 호흡 교정 필요', progress: '배영 50m 완주', status: 'active',
    paymentAmount: 150000, paymentDate: '2025-01-15', paymentRenewalDate: '2025-02-15',
    paymentCompleted: true, studentPhoto: '',
    address: '서울시 서초구 방배동 67-89', vehicleId: 'v1',
    category: 'child', paymentPlanId: 'pp2', division: '정규반',
    additionalEnrollments: [
      {
        id: 'enr_s2_1', lessonClassId: 'lc4', instructorId: 'i3',
        regularDays: ['화'], regularTime: '17:00', startDate: '2025-06-01', endDate: '',
        status: 'active', passType: '주 1회', paymentPlanId: '', monthlyPrice: 60000,
        pauseReason: '', expectedReturnDate: '', withdrawalReason: '',
      },
    ],
    pauseReason: '', expectedReturnDate: '', withdrawalReason: '',
  },
  {
    id: 's3', studentNumber: '2025-003', nickname: '',
    parentName: '박어머니', studentName: '박지호',
    age: 7, birthDate: '2017-11-05', registrationDate: '2025-02-01', gender: '남',
    lessonClassId: 'lc2', level: '초급', region: '서울시 송파구',
    phone: '', motherPhone: '010-5555-6666', fatherPhone: '', smsRecipients: ['mother'],
    passType: '주 2회', totalClasses: 8, rescheduleLimit: 2, usedReschedules: 0,
    instructorId: 'i2', regularDays: ['화', '목'], regularTime: '15:00',
    notes: '활발함', progress: '음파 호흡법', status: 'active',
    paymentAmount: 120000, paymentDate: '2025-02-01', paymentRenewalDate: '2025-03-01',
    paymentCompleted: false, studentPhoto: '',
    address: '서울시 송파구 잠실동 456-78', vehicleId: 'v2',
    category: 'child', paymentPlanId: 'pp1', division: '유치부',
    additionalEnrollments: [], pauseReason: '', expectedReturnDate: '', withdrawalReason: '',
  },
];

// 학생의 모든 등록반(primary + 추가)에 대해 지정한 날짜 범위만큼 ClassSession을 생성/병합한다.
const buildClassesForStudent = (studentId: string, enrollments: Enrollment[], rangeStart: Date, rangeDays: number, existing: ClassSession[]): ClassSession[] => {
  const result = [...existing];
  let counter = 0;
  for (let i = 0; i < rangeDays; i++) {
    const currentDate = addDays(rangeStart, i);
    const dateStr = format(currentDate, 'yyyy-MM-dd');
    const dow = getDay(currentDate);
    enrollments.forEach(enr => {
      if (enr.status !== 'active') return;
      if (enr.startDate && dateStr < enr.startDate) return;
      if (enr.endDate && dateStr > enr.endDate) return;
      enr.regularDays.forEach(dayStr => {
        if (DAY_MAP[dayStr] !== dow) return;
        const existingClass = result.find(c => c.date === dateStr && c.time === enr.regularTime && c.instructorId === enr.instructorId);
        if (existingClass) {
          if (!existingClass.studentIds.includes(studentId)) existingClass.studentIds.push(studentId);
        } else {
          result.push({
            id: `c_${studentId}_${enr.id}_${dateStr}_${counter++}`,
            date: dateStr, time: enr.regularTime, instructorId: enr.instructorId,
            studentIds: [studentId], makeupStudentIds: [], absentStudentIds: [], status: 'scheduled',
          });
        }
      });
    });
  }
  return result;
};

// 특정 학생을, 특정 enrollment가 만들어낸 미래 수업에서만 제거 (휴학/종강/전반/등록취소 시 사용)
const removeStudentFromFutureEnrollmentClasses = (studentId: string, enr: Enrollment, classes: ClassSession[], fromDate: string): ClassSession[] =>
  classes.map(cls => {
    if (cls.date < fromDate) return cls;
    if (cls.instructorId !== enr.instructorId || cls.time !== enr.regularTime) return cls;
    if (!cls.studentIds.includes(studentId)) return cls;
    return { ...cls, studentIds: cls.studentIds.filter(id => id !== studentId) };
  });

const generateMockClasses = () => {
  const start = startOfMonth(addDays(new Date(), -15));
  let classes: ClassSession[] = [];
  INITIAL_STUDENTS.forEach(student => {
    classes = buildClassesForStudent(student.id, getAllEnrollments(student), start, 90, classes);
  });
  return classes;
};

const INITIAL_CLASSES = generateMockClasses();
const INITIAL_EVENTS: AcademyEvent[] = [
  { id: 'e1', date: format(new Date(), 'yyyy-MM-dd'), endDate: format(new Date(), 'yyyy-MM-dd'), title: '수영장 정기 소독', type: 'notice' },
  { id: 'e2', date: format(addDays(new Date(), 2), 'yyyy-MM-dd'), endDate: format(addDays(new Date(), 5), 'yyyy-MM-dd'), title: '여름방학 특강 접수', type: 'event' },
];
const INITIAL_NOTIFICATIONS: NotificationRecord[] = [
  { id: 'n1', createdAt: format(new Date(), 'yyyy-MM-dd HH:mm'), type: 'holiday', title: '수영장 정기 소독 안내', content: '이번 주 토요일 수영장 정기 소독이 있습니다. 해당 일자 강습은 휴무입니다.', recipientIds: ['s1', 's2', 's3'], sentAt: format(new Date(), 'yyyy-MM-dd HH:mm') },
];

const monthsAgo = (n: number) => format(addDays(startOfMonth(new Date()), -30 * n), 'yyyy-MM');
const INITIAL_PAYMENT_RECORDS: PaymentRecord[] = [
  { id: 'pr1', studentId: 's1', enrollmentId: 'primary', billingMonth: monthsAgo(1), targetAmount: 120000, paidAmount: 120000, paidAt: format(addDays(new Date(), -35), 'yyyy-MM-dd'), method: 'card', status: 'paid', note: '' },
  { id: 'pr2', studentId: 's1', enrollmentId: 'primary', billingMonth: format(new Date(), 'yyyy-MM'), targetAmount: 120000, paidAmount: 0, paidAt: '', method: '', status: 'unpaid', note: '' },
  { id: 'pr3', studentId: 's2', enrollmentId: 'primary', billingMonth: format(new Date(), 'yyyy-MM'), targetAmount: 150000, paidAmount: 150000, paidAt: format(addDays(new Date(), -10), 'yyyy-MM-dd'), method: 'transfer', status: 'paid', note: '' },
  { id: 'pr4', studentId: 's2', enrollmentId: 'enr_s2_1', billingMonth: format(new Date(), 'yyyy-MM'), targetAmount: 60000, paidAmount: 0, paidAt: '', method: '', status: 'unpaid', note: '고급반 추가 수강' },
  { id: 'pr5', studentId: 's3', enrollmentId: 'primary', billingMonth: format(new Date(), 'yyyy-MM'), targetAmount: 120000, paidAmount: 0, paidAt: '', method: '', status: 'unpaid', note: '' },
];

const INITIAL_COUNSELING_RECORDS: CounselingRecord[] = [
  { id: 'cs1', studentId: 's1', instructorId: 'i1', date: format(addDays(new Date(), -40), 'yyyy-MM-dd'),
    content: '물에 대한 두려움이 줄어들고 있음. 발차기 자세 교정 위주로 진행 중이며, 가정에서도 물놀이 노출을 늘려달라고 안내함.',
    createdAt: format(addDays(new Date(), -40), "yyyy-MM-dd'T'15:30:00") },
];

const INITIAL_MESSAGES: ChatMessage[] = [
  { id: 'msg1', studentId: 's1', senderRole: 'instructor', kind: 'text', text: '안녕하세요 어머니! 민준이가 오늘 발차기 연습을 정말 열심히 했어요 :)', createdAt: format(addDays(new Date(), -1), "yyyy-MM-dd'T'09:30:00") },
  { id: 'msg2', studentId: 's1', senderRole: 'parent', kind: 'text', text: '감사합니다 선생님! 집에서도 연습시킬게요.', createdAt: format(addDays(new Date(), -1), "yyyy-MM-dd'T'10:02:00") },
];

// ── Context Type ──────────────────────────────────────────────
type StoreContextType = {
  instructors: Instructor[];
  students: Student[];
  classes: ClassSession[];
  events: AcademyEvent[];
  settings: AcademySettings;
  lessonClasses: LessonClass[];
  drivers: Driver[];
  vehicles: Vehicle[];
  paymentPlans: PaymentPlan[];
  paymentRecords: PaymentRecord[];
  notifications: NotificationRecord[];
  makeupRequests: MakeupRequest[];
  messages: ChatMessage[];
  sendMessage: (studentId: string, senderRole: ChatMessage['senderRole'], text: string, kind?: ChatMessage['kind']) => void;
  counselingRecords: CounselingRecord[];
  addCounselingRecord: (c: Omit<CounselingRecord, 'id' | 'createdAt'>) => void;
  updateCounselingRecord: (id: string, updates: Partial<CounselingRecord>) => void;
  deleteCounselingRecord: (id: string) => void;
  scheduleChangeRequests: ScheduleChangeRequest[];
  submitScheduleChangeRequest: (r: Omit<ScheduleChangeRequest, 'id' | 'status' | 'requestedAt' | 'resolvedAt' | 'isFrequencyChange' | 'effectiveDate'>) => void;
  approveScheduleChangeRequest: (id: string) => void;
  rejectScheduleChangeRequest: (id: string) => void;
  // Student ops
  addStudent: (s: Omit<Student, 'id' | 'studentNumber' | 'usedReschedules' | 'additionalEnrollments'>) => void;
  updateStudent: (id: string, updates: Partial<Student>) => void;
  deleteStudent: (id: string) => void;
  extendStudentClasses: (id: string, months: number) => void;
  deferStudentClasses: (id: string, months: number) => void;
  // Enrollment ops (다중 반)
  addEnrollment: (studentId: string, enrollment: Omit<Enrollment, 'id'>) => void;
  updateEnrollment: (studentId: string, enrollmentId: string, updates: Partial<Enrollment>, resumeFromDate?: string) => void;
  cancelEnrollment: (studentId: string, enrollmentId: string) => void;
  // 장기 결석(차감) / 퇴원 / 복귀
  pauseEnrollmentLongTerm: (studentId: string, enrollmentId: string, reason: string, expectedReturnDate: string) => void;
  withdrawalRequests: WithdrawalRequest[];
  submitWithdrawalRequest: (studentId: string, enrollmentId: string, reason: string, requestedBy: WithdrawalRequest['requestedBy']) => void;
  approveWithdrawalRequest: (id: string) => void;
  rejectWithdrawalRequest: (id: string) => void;
  returnRequests: ReturnRequest[];
  submitReturnRequest: (studentId: string, enrollmentId: string, returnDate: string) => void;
  approveReturnRequest: (id: string) => void;
  rejectReturnRequest: (id: string) => void;
  // Class ops
  rescheduleClass: (studentId: string, fromClassId: string, toClassId: string) => boolean;
  markAbsent: (studentId: string, classId: string) => void;
  absenceRecords: AbsenceRecord[];
  cancelAbsence: (recordId: string) => void;
  // Event ops
  addEvent: (e: Omit<AcademyEvent, 'id'>) => void;
  // Instructor / Staff
  addInstructor: (i: Omit<Instructor, 'id'>) => void;
  updateInstructor: (id: string, updates: Partial<Instructor>) => void;
  deleteInstructor: (id: string) => void;
  updateInstructorColor: (id: string, color: string) => void;
  // Settings
  updateSettings: (s: Partial<AcademySettings>) => void;
  updateMakeupSettings: (s: Partial<MakeupSettings>) => void;
  // LessonClass
  addLessonClass: (lc: Omit<LessonClass, 'id'>) => void;
  deleteLessonClass: (id: string) => void;
  updateLessonClass: (id: string, updates: Partial<LessonClass>) => void;
  // Driver & Vehicle
  addDriver: (d: Omit<Driver, 'id'>) => void;
  updateDriver: (id: string, updates: Partial<Driver>) => void;
  deleteDriver: (id: string) => void;
  addVehicle: (v: Omit<Vehicle, 'id'>) => void;
  updateVehicle: (id: string, updates: Partial<Vehicle>) => void;
  deleteVehicle: (id: string) => void;
  assignStudentToVehicle: (studentId: string, vehicleId: string) => void;
  // PaymentPlan
  addPaymentPlan: (p: Omit<PaymentPlan, 'id'>) => void;
  updatePaymentPlan: (id: string, updates: Partial<PaymentPlan>) => void;
  deletePaymentPlan: (id: string) => void;
  // PaymentRecord (수납 이력)
  addPaymentRecord: (p: Omit<PaymentRecord, 'id'>) => void;
  markPaymentPaid: (recordId: string, method: PaymentRecord['method'], paidAmount?: number) => void;
  // Notification
  addNotification: (n: Omit<NotificationRecord, 'id' | 'createdAt' | 'sentAt'>) => string;
  sendNotification: (id: string) => void;
  deleteNotification: (id: string) => void;
  // Makeup request (서류 기반 보강/이월)
  submitMakeupRequest: (studentId: string, fromClassId: string, docPhoto: string, reason: string, preferredResolution: 'makeup' | 'carryover') => void;
  approveMakeupRequestAsSlot: (requestId: string, toClassId: string) => void;
  approveMakeupRequestAsCarryover: (requestId: string) => void;
  rejectMakeupRequest: (requestId: string) => void;
  cancelScheduledMakeup: (classId: string, studentId: string) => void;
  makeupCancellations: MakeupCancellationNotice[];
  // 대기자 명단
  waitlistEntries: WaitlistEntry[];
  addWaitlistEntry: (w: Omit<WaitlistEntry, 'id' | 'status' | 'requestedAt' | 'notifiedAt'>) => void;
  markWaitlistNotified: (id: string) => void;
  convertWaitlistEntry: (id: string) => void;
  cancelWaitlistEntry: (id: string) => void;
  deleteWaitlistEntry: (id: string) => void;
  // 형제/이벤트 할인
  discounts: Discount[];
  addDiscount: (d: Omit<Discount, 'id'>) => void;
  updateDiscount: (id: string, updates: Partial<Discount>) => void;
  deleteDiscount: (id: string) => void;
  // 강사 급여 정산
  payrollRecords: PayrollRecord[];
  issuePayroll: (instructorId: string, month: string, hoursOverride?: number) => void;
  // 레벨(급수) 테스트
  levelTestRecords: LevelTestRecord[];
  recordLevelTest: (studentId: string, instructorId: string, resultLevel: string, passed: boolean, note: string) => void;
};

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider = ({ children }: { children: ReactNode }) => {
  const [instructors, setInstructors] = useState<Instructor[]>(INITIAL_INSTRUCTORS);
  const [students, setStudents] = useState<Student[]>(INITIAL_STUDENTS);
  const [classes, setClasses] = useState<ClassSession[]>(INITIAL_CLASSES);
  const [events, setEvents] = useState<AcademyEvent[]>(INITIAL_EVENTS);
  const [settings, setSettings] = useState<AcademySettings>(INITIAL_SETTINGS);
  const [lessonClasses, setLessonClasses] = useState<LessonClass[]>(INITIAL_LESSON_CLASSES);
  const [drivers, setDrivers] = useState<Driver[]>(INITIAL_DRIVERS);
  const [vehicles, setVehicles] = useState<Vehicle[]>(INITIAL_VEHICLES);
  const [paymentPlans, setPaymentPlans] = useState<PaymentPlan[]>(INITIAL_PAYMENT_PLANS);
  const [paymentRecords, setPaymentRecords] = useState<PaymentRecord[]>(INITIAL_PAYMENT_RECORDS);
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [counselingRecords, setCounselingRecords] = useState<CounselingRecord[]>(INITIAL_COUNSELING_RECORDS);
  const [scheduleChangeRequests, setScheduleChangeRequests] = useState<ScheduleChangeRequest[]>([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
  const [returnRequests, setReturnRequests] = useState<ReturnRequest[]>([]);
  const [notifications, setNotifications] = useState<NotificationRecord[]>(INITIAL_NOTIFICATIONS);
  const [makeupRequests, setMakeupRequests] = useState<MakeupRequest[]>([]);
  const [makeupCancellations, setMakeupCancellations] = useState<MakeupCancellationNotice[]>([]);
  const [absenceRecords, setAbsenceRecords] = useState<AbsenceRecord[]>([]);
  const [waitlistEntries, setWaitlistEntries] = useState<WaitlistEntry[]>(INITIAL_WAITLIST);
  const [discounts, setDiscounts] = useState<Discount[]>(INITIAL_DISCOUNTS);
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>(INITIAL_PAYROLL_RECORDS);
  const [levelTestRecords, setLevelTestRecords] = useState<LevelTestRecord[]>(INITIAL_LEVEL_TEST_RECORDS);

  // 시스템이 자동 발생시키는 개인 알림(퇴원/복귀/일정변경 처리 결과 등) — 학부모 앱 알림센터(공지·알림)에 즉시 반영
  const pushSystemAlert = (studentId: string, title: string, content: string) => {
    const id = `n${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    setNotifications(prev => [...prev, { id, createdAt: format(new Date(), 'yyyy-MM-dd HH:mm'), type: 'custom', title, content, recipientIds: [studentId], sentAt: format(new Date(), 'yyyy-MM-dd HH:mm') }]);
  };

  // 학생의 vehicleId 변경을 vehicles.studentIds에도 함께 반영 (강습생 등록/수정 폼과 차량관리 배정 화면 간 데이터 동기화)
  const syncVehicleAssignment = (studentId: string, vehicleId: string) => {
    setVehicles(prev => prev.map(v => {
      if (v.id === vehicleId) return v.studentIds.includes(studentId) ? v : { ...v, studentIds: [...v.studentIds, studentId] };
      return v.studentIds.includes(studentId) ? { ...v, studentIds: v.studentIds.filter(id => id !== studentId) } : v;
    }));
  };

  // ── Student ──────────────────────────────────────────────────
  const addStudent = (studentData: Omit<Student, 'id' | 'studentNumber' | 'usedReschedules' | 'additionalEnrollments'>) => {
    const year = new Date().getFullYear();
    const nextNum = students.length + 1;
    const newStudent: Student = { ...studentData, id: `s${Date.now()}`, studentNumber: `${year}-${String(nextNum).padStart(3, '0')}`, usedReschedules: 0, additionalEnrollments: [] };
    setStudents(prev => [...prev, newStudent]);
    if (newStudent.vehicleId) syncVehicleAssignment(newStudent.id, newStudent.vehicleId);
    setClasses(prev => buildClassesForStudent(newStudent.id, getAllEnrollments(newStudent), startOfMonth(addDays(new Date(), -15)), 90, prev));
  };

  const updateStudent = (studentId: string, updates: Partial<Student>) => {
    setStudents(prev => prev.map(s => s.id === studentId ? { ...s, ...updates } : s));
    if (updates.vehicleId !== undefined) syncVehicleAssignment(studentId, updates.vehicleId);
    if (updates.instructorId || updates.regularDays || updates.regularTime) {
      const student = students.find(s => s.id === studentId);
      if (!student) return;
      const updatedStudent = { ...student, ...updates };
      const today = format(new Date(), 'yyyy-MM-dd');
      setClasses(prev => {
        const oldPrimary = getPrimaryEnrollment(student);
        const cleared = removeStudentFromFutureEnrollmentClasses(studentId, oldPrimary, prev, today);
        return buildClassesForStudent(studentId, [getPrimaryEnrollment(updatedStudent)], new Date(), 60, cleared);
      });
    }
  };

  const deleteStudent = (studentId: string) => {
    setStudents(prev => prev.filter(s => s.id !== studentId));
    setClasses(prev => prev.map(cls => ({ ...cls, studentIds: cls.studentIds.filter(id => id !== studentId), makeupStudentIds: cls.makeupStudentIds.filter(id => id !== studentId), absentStudentIds: cls.absentStudentIds.filter(id => id !== studentId) })));
    setVehicles(prev => prev.map(v => ({ ...v, studentIds: v.studentIds.filter(id => id !== studentId) })));
    setPaymentRecords(prev => prev.filter(p => p.studentId !== studentId));
  };

  const extendStudentClasses = (studentId: string, months: number) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;
    setClasses(prev => {
      const studentClasses = prev.filter(c => c.studentIds.includes(studentId)).sort((a, b) => b.date.localeCompare(a.date));
      const lastDate = studentClasses.length > 0 ? new Date(studentClasses[0].date) : new Date();
      return buildClassesForStudent(studentId, [getPrimaryEnrollment(student)], addDays(lastDate, 1), 30 * months, prev);
    });
  };

  const deferStudentClasses = (studentId: string, months: number) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;
    const today = format(new Date(), 'yyyy-MM-dd');
    setStudents(prev => prev.map(s => s.id === studentId ? { ...s, status: 'deferred' } : s));
    setClasses(prev => {
      const cleared = removeStudentFromFutureEnrollmentClasses(studentId, getPrimaryEnrollment(student), prev, today);
      const startDate = addDays(new Date(), 30 * months);
      return buildClassesForStudent(studentId, [{ ...getPrimaryEnrollment(student), status: 'active' }], startDate, 60, cleared);
    });
  };

  // ── Enrollment (다중 반 등록) ────────────────────────────────────
  const addEnrollment = (studentId: string, enrollment: Omit<Enrollment, 'id'>) => {
    const id = `enr_${Date.now()}`;
    const newEnrollment: Enrollment = { ...enrollment, id };
    setStudents(prev => prev.map(s => s.id === studentId ? { ...s, additionalEnrollments: [...s.additionalEnrollments, newEnrollment] } : s));
    setClasses(prev => buildClassesForStudent(studentId, [newEnrollment], new Date(), 90, prev));
  };

  const updateEnrollment = (studentId: string, enrollmentId: string, updates: Partial<Enrollment>, resumeFromDate?: string) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;
    const resumeStart = resumeFromDate ? new Date(resumeFromDate) : new Date();
    // 미래 날짜(예: 다음 달 1일)로 예약 적용하는 경우, 오늘부터 그 날짜 전까지의 수업은 기존 일정 그대로 유지되어야 하므로
    // "제거" 기준일도 오늘이 아니라 resumeStart로 맞춘다 (그래야 예약 적용일 이전 수업이 지워지지 않는다)
    const clearFrom = format(resumeStart, 'yyyy-MM-dd');

    if (enrollmentId === 'primary') {
      const oldPrimary = getPrimaryEnrollment(student);
      const primaryUpdates: Partial<Student> = {};
      if (updates.lessonClassId !== undefined) primaryUpdates.lessonClassId = updates.lessonClassId;
      if (updates.instructorId !== undefined) primaryUpdates.instructorId = updates.instructorId;
      if (updates.regularDays !== undefined) primaryUpdates.regularDays = updates.regularDays;
      if (updates.regularTime !== undefined) primaryUpdates.regularTime = updates.regularTime;
      if (updates.passType !== undefined) primaryUpdates.passType = updates.passType;
      if (updates.paymentPlanId !== undefined) primaryUpdates.paymentPlanId = updates.paymentPlanId;
      if (updates.pauseReason !== undefined) primaryUpdates.pauseReason = updates.pauseReason;
      if (updates.expectedReturnDate !== undefined) primaryUpdates.expectedReturnDate = updates.expectedReturnDate;
      if (updates.withdrawalReason !== undefined) primaryUpdates.withdrawalReason = updates.withdrawalReason;
      if (updates.status === 'paused') primaryUpdates.status = 'deferred';
      if (updates.status === 'ended') primaryUpdates.status = 'inactive';
      if (updates.status === 'active') primaryUpdates.status = 'active';
      const updatedStudent = { ...student, ...primaryUpdates };
      setStudents(prev => prev.map(s => s.id === studentId ? updatedStudent : s));
      setClasses(prev => {
        const cleared = removeStudentFromFutureEnrollmentClasses(studentId, oldPrimary, prev, clearFrom);
        const newPrimary = getPrimaryEnrollment(updatedStudent);
        return newPrimary.status === 'active' ? buildClassesForStudent(studentId, [newPrimary], resumeStart, 90, cleared) : cleared;
      });
      return;
    }

    const oldEnrollment = student.additionalEnrollments.find(e => e.id === enrollmentId);
    if (!oldEnrollment) return;
    const newEnrollment: Enrollment = { ...oldEnrollment, ...updates };
    setStudents(prev => prev.map(s => s.id === studentId
      ? { ...s, additionalEnrollments: s.additionalEnrollments.map(e => e.id === enrollmentId ? newEnrollment : e) }
      : s));
    setClasses(prev => {
      const cleared = removeStudentFromFutureEnrollmentClasses(studentId, oldEnrollment, prev, clearFrom);
      return newEnrollment.status === 'active' ? buildClassesForStudent(studentId, [newEnrollment], resumeStart, 90, cleared) : cleared;
    });
  };

  const cancelEnrollment = (studentId: string, enrollmentId: string) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;
    const today = format(new Date(), 'yyyy-MM-dd');
    if (enrollmentId === 'primary') return; // 기본 등록은 취소 대신 종강/휴학으로 처리
    const enrollment = student.additionalEnrollments.find(e => e.id === enrollmentId);
    if (!enrollment) return;
    setStudents(prev => prev.map(s => s.id === studentId ? { ...s, additionalEnrollments: s.additionalEnrollments.filter(e => e.id !== enrollmentId) } : s));
    setClasses(prev => removeStudentFromFutureEnrollmentClasses(studentId, enrollment, prev, today));
    setPaymentRecords(prev => prev.filter(p => !(p.studentId === studentId && p.enrollmentId === enrollmentId)));
  };

  // 2주 이상 여행/출장/수술 등 장기 결석 — 해당 월 수강료는 선납된 것으로 보고 자리를 비워둠 (자동 재개 없음)
  const pauseEnrollmentLongTerm = (studentId: string, enrollmentId: string, reason: string, expectedReturnDate: string) => {
    updateEnrollment(studentId, enrollmentId, { status: 'paused', pauseReason: reason, expectedReturnDate });
  };

  // ── WithdrawalRequest (퇴원 요청) ──────────────────────────────
  const submitWithdrawalRequest = (studentId: string, enrollmentId: string, reason: string, requestedBy: WithdrawalRequest['requestedBy']) => {
    setWithdrawalRequests(prev => [...prev, {
      id: `wr_${Date.now()}`, studentId, enrollmentId, reason, requestedBy,
      status: 'pending', requestedAt: format(new Date(), 'yyyy-MM-dd HH:mm'), resolvedAt: '',
    }]);
  };
  const approveWithdrawalRequest = (id: string) => {
    const req = withdrawalRequests.find(r => r.id === id);
    if (!req) return;
    updateEnrollment(req.studentId, req.enrollmentId, { status: 'ended', withdrawalReason: req.reason });
    setWithdrawalRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'approved', resolvedAt: format(new Date(), 'yyyy-MM-dd HH:mm') } : r));
    pushSystemAlert(req.studentId, '[퇴원 처리 완료]', '요청하신 퇴원이 확인되어 처리되었습니다. 그동안 함께해주셔서 감사합니다.');
  };
  const rejectWithdrawalRequest = (id: string) => {
    const req = withdrawalRequests.find(r => r.id === id);
    setWithdrawalRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'rejected', resolvedAt: format(new Date(), 'yyyy-MM-dd HH:mm') } : r));
    if (req) pushSystemAlert(req.studentId, '[퇴원 신청 반려]', '요청하신 퇴원 신청이 반려되었습니다. 자세한 사항은 학원으로 문의해주세요.');
  };

  // ── ReturnRequest (장기 결석 후 복귀 신청) — 강사·데스크 확인 후에만 자리 재배정 ──
  const submitReturnRequest = (studentId: string, enrollmentId: string, returnDate: string) => {
    const student = students.find(s => s.id === studentId);
    const enrollment = enrollmentId === 'primary' ? (student ? getPrimaryEnrollment(student) : undefined) : student?.additionalEnrollments.find(e => e.id === enrollmentId);
    let hasSeatAvailable = true;
    if (enrollment && student) {
      const lc = lessonClasses.find(l => l.id === enrollment.lessonClassId);
      const instructorCap = instructors.find(i => i.id === enrollment.instructorId)?.maxCapacity ?? 0;
      const cap = lc?.capacity || instructorCap;
      const matchingCount = students.flatMap(s => getAllEnrollments(s)).filter(e =>
        e.status === 'active' && e.lessonClassId === enrollment.lessonClassId && e.instructorId === enrollment.instructorId &&
        e.regularTime === enrollment.regularTime && e.regularDays.some(d => enrollment.regularDays.includes(d))
      ).length;
      hasSeatAvailable = cap === 0 || matchingCount < cap;
    }
    setReturnRequests(prev => [...prev, {
      id: `rr_${Date.now()}`, studentId, enrollmentId, requestedReturnDate: returnDate, hasSeatAvailable,
      status: 'pending', requestedAt: format(new Date(), 'yyyy-MM-dd HH:mm'), resolvedAt: '',
    }]);
  };
  const approveReturnRequest = (id: string) => {
    const req = returnRequests.find(r => r.id === id);
    if (!req) return;
    updateEnrollment(req.studentId, req.enrollmentId, { status: 'active', pauseReason: '', expectedReturnDate: '' }, req.requestedReturnDate);
    setReturnRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'approved', resolvedAt: format(new Date(), 'yyyy-MM-dd HH:mm') } : r));
    pushSystemAlert(req.studentId, '[복귀 승인]', `${req.requestedReturnDate}부터 복귀가 승인되었습니다. 반가운 마음으로 기다리고 있을게요!`);
  };
  const rejectReturnRequest = (id: string) => {
    const req = returnRequests.find(r => r.id === id);
    setReturnRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'rejected', resolvedAt: format(new Date(), 'yyyy-MM-dd HH:mm') } : r));
    if (req) pushSystemAlert(req.studentId, '[복귀 신청 반려]', '요청하신 복귀 신청이 반려되었습니다. 자세한 사항은 학원으로 문의해주세요.');
  };

  // ── ScheduleChangeRequest (학부모 요일·시간·수강횟수 변경 요청) ───────
  const submitScheduleChangeRequest = (r: Omit<ScheduleChangeRequest, 'id' | 'status' | 'requestedAt' | 'resolvedAt' | 'isFrequencyChange' | 'effectiveDate'>) => {
    const isFrequencyChange = parseSessionsPerWeek(r.currentPassType) !== parseSessionsPerWeek(r.requestedPassType);
    // 요일/시간만 바뀌는 요청은 당월(승인 즉시) 적용, 수강 횟수가 바뀌는 요청은 다음 달 1일부터 자동 적용되도록 예약
    const effectiveDate = isFrequencyChange
      ? format(startOfMonth(addMonths(new Date(), 1)), 'yyyy-MM-dd')
      : format(new Date(), 'yyyy-MM-dd');
    setScheduleChangeRequests(prev => [...prev, {
      ...r, id: `sc_${Date.now()}`, isFrequencyChange, effectiveDate, status: 'pending',
      requestedAt: format(new Date(), 'yyyy-MM-dd HH:mm'), resolvedAt: '',
    }]);
  };
  const approveScheduleChangeRequest = (id: string) => {
    const req = scheduleChangeRequests.find(r => r.id === id);
    if (!req) return;
    updateEnrollment(req.studentId, req.enrollmentId, {
      regularDays: req.requestedDays, regularTime: req.requestedTime, passType: req.requestedPassType,
    }, req.effectiveDate);
    setScheduleChangeRequests(prev => prev.map(r => r.id === id
      ? { ...r, status: 'approved', resolvedAt: format(new Date(), 'yyyy-MM-dd HH:mm') } : r));
    const whenLabel = req.isFrequencyChange ? `${req.effectiveDate}부터 ` : '';
    pushSystemAlert(req.studentId, '[일정 변경 승인]', `${whenLabel}${req.requestedDays.join('·')} ${req.requestedTime} · ${req.requestedPassType}(으)로 변경이 승인되었습니다.`);
  };
  const rejectScheduleChangeRequest = (id: string) => {
    const req = scheduleChangeRequests.find(r => r.id === id);
    setScheduleChangeRequests(prev => prev.map(r => r.id === id
      ? { ...r, status: 'rejected', resolvedAt: format(new Date(), 'yyyy-MM-dd HH:mm') } : r));
    if (req) pushSystemAlert(req.studentId, '[일정 변경 반려]', '요청하신 일정 변경 신청이 반려되었습니다. 자세한 사항은 학원으로 문의해주세요.');
  };

  // ── Class ────────────────────────────────────────────────────
  const rescheduleClass = (studentId: string, fromClassId: string, toClassId: string) => {
    const student = students.find(s => s.id === studentId);
    if (!student || student.usedReschedules >= student.rescheduleLimit) return false;
    const toClass = classes.find(c => c.id === toClassId);
    if (!toClass) return false;
    const toDivision = getClassDivision(toClass, students);
    if (toDivision !== null && toDivision !== student.division) return false;
    setClasses(prev => prev.map(cls => {
      if (cls.id === fromClassId) return { ...cls, absentStudentIds: [...cls.absentStudentIds, studentId] };
      if (cls.id === toClassId) return { ...cls, makeupStudentIds: [...cls.makeupStudentIds, studentId] };
      return cls;
    }));
    setStudents(prev => prev.map(s => s.id === studentId ? { ...s, usedReschedules: s.usedReschedules + 1 } : s));
    return true;
  };

  const markAbsent = (studentId: string, classId: string) => {
    const cls = classes.find(c => c.id === classId);
    if (!cls || cls.absentStudentIds.includes(studentId)) return;
    setClasses(prev => prev.map(c => c.id === classId ? { ...c, absentStudentIds: [...c.absentStudentIds, studentId] } : c));
    // 결석 취소 가능 기간(3일) 계산 — 수업이 이미 3일 이내로 임박했다면 취소 유예 없이 즉시 확정(자리 바로 오픈)
    const now = new Date();
    const daysUntilClass = differenceInCalendarDays(parseISO(cls.date), now);
    const cancelDeadline = daysUntilClass <= 3 ? now : addDays(now, 3);
    setAbsenceRecords(prev => [...prev, {
      id: `abs_${Date.now()}`, studentId, classId,
      markedAt: now.toISOString(), cancelDeadline: cancelDeadline.toISOString(), status: 'active',
    }]);
  };

  // 결석 취소 — 취소 유예 기간(3일) 내에만 가능. 취소되면 원생이 그 수업에 다시 정상 참석하는 것으로 되돌아감
  const cancelAbsence = (recordId: string) => {
    const rec = absenceRecords.find(r => r.id === recordId);
    if (!rec || !isAbsenceCancellable(rec)) return;
    setClasses(prev => prev.map(c => c.id === rec.classId ? { ...c, absentStudentIds: c.absentStudentIds.filter(id => id !== rec.studentId) } : c));
    setAbsenceRecords(prev => prev.map(r => r.id === recordId ? { ...r, status: 'cancelled' } : r));
  };

  // ── Event ─────────────────────────────────────────────────────
  const addEvent = (eventData: Omit<AcademyEvent, 'id'>) => {
    setEvents(prev => [...prev, { ...eventData, id: `e${prev.length + 1}` }]);
  };

  // ── Instructor / Staff ──────────────────────────────────────────
  const addInstructor = (i: Omit<Instructor, 'id'>) => setInstructors(prev => [...prev, { ...i, id: `i_${Date.now()}` }]);
  const updateInstructor = (id: string, updates: Partial<Instructor>) => setInstructors(prev => prev.map(inst => inst.id === id ? { ...inst, ...updates } : inst));
  const deleteInstructor = (id: string) => setInstructors(prev => prev.filter(inst => inst.id !== id));
  const updateInstructorColor = (id: string, color: string) => setInstructors(prev => prev.map(inst => inst.id === id ? { ...inst, color } : inst));

  // ── Settings ─────────────────────────────────────────────────
  const updateSettings = (newSettings: Partial<AcademySettings>) => setSettings(prev => ({ ...prev, ...newSettings }));
  const updateMakeupSettings = (ms: Partial<MakeupSettings>) => setSettings(prev => ({ ...prev, makeupSettings: { ...prev.makeupSettings, ...ms } }));

  // ── LessonClass ───────────────────────────────────────────────
  const addLessonClass = (lcData: Omit<LessonClass, 'id'>) => setLessonClasses(prev => [...prev, { ...lcData, id: `lc_${Date.now()}` }]);
  const deleteLessonClass = (id: string) => setLessonClasses(prev => prev.filter(lc => lc.id !== id));
  const updateLessonClass = (id: string, updates: Partial<LessonClass>) => setLessonClasses(prev => prev.map(lc => lc.id === id ? { ...lc, ...updates } : lc));

  // ── Driver & Vehicle ──────────────────────────────────────────
  const addDriver = (d: Omit<Driver, 'id'>) => setDrivers(prev => [...prev, { ...d, id: `d${Date.now()}` }]);
  const updateDriver = (id: string, updates: Partial<Driver>) => setDrivers(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
  const deleteDriver = (id: string) => setDrivers(prev => prev.filter(d => d.id !== id));
  const addVehicle = (v: Omit<Vehicle, 'id'>) => setVehicles(prev => [...prev, { ...v, id: `v${Date.now()}` }]);
  const updateVehicle = (id: string, updates: Partial<Vehicle>) => setVehicles(prev => prev.map(v => v.id === id ? { ...v, ...updates } : v));
  const deleteVehicle = (id: string) => setVehicles(prev => prev.filter(v => v.id !== id));
  const assignStudentToVehicle = (studentId: string, vehicleId: string) => {
    setVehicles(prev => prev.map(v => ({ ...v, studentIds: v.studentIds.filter(id => id !== studentId) })));
    if (vehicleId) setVehicles(prev => prev.map(v => v.id === vehicleId && !v.studentIds.includes(studentId) ? { ...v, studentIds: [...v.studentIds, studentId] } : v));
    setStudents(prev => prev.map(s => s.id === studentId ? { ...s, vehicleId } : s));
  };

  // ── PaymentPlan ───────────────────────────────────────────────
  const addPaymentPlan = (p: Omit<PaymentPlan, 'id'>) => setPaymentPlans(prev => [...prev, { ...p, id: `pp${Date.now()}` }]);
  const updatePaymentPlan = (id: string, updates: Partial<PaymentPlan>) => setPaymentPlans(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  const deletePaymentPlan = (id: string) => setPaymentPlans(prev => prev.filter(p => p.id !== id));

  // ── PaymentRecord (수납 이력) ────────────────────────────────────
  const addPaymentRecord = (p: Omit<PaymentRecord, 'id'>) => setPaymentRecords(prev => [...prev, { ...p, id: `pr_${Date.now()}` }]);
  const markPaymentPaid = (recordId: string, method: PaymentRecord['method'], paidAmount?: number) => {
    setPaymentRecords(prev => prev.map(p => p.id === recordId
      ? { ...p, status: 'paid', method, paidAt: format(new Date(), 'yyyy-MM-dd'), paidAmount: paidAmount ?? p.targetAmount }
      : p));
  };

  // ── ChatMessage (학부모↔강사 소통) ────────────────────────────────
  const sendMessage = (studentId: string, senderRole: ChatMessage['senderRole'], text: string, kind: ChatMessage['kind'] = 'text') => {
    if (!text.trim()) return;
    setMessages(prev => [...prev, { id: `msg_${Date.now()}`, studentId, senderRole, kind, text: text.trim(), createdAt: new Date().toISOString() }]);
  };

  // ── CounselingRecord (정기 상담 기록) ────────────────────────────
  const addCounselingRecord = (c: Omit<CounselingRecord, 'id' | 'createdAt'>) => {
    setCounselingRecords(prev => [...prev, { ...c, id: `cs_${Date.now()}`, createdAt: new Date().toISOString() }]);
  };
  const updateCounselingRecord = (id: string, updates: Partial<CounselingRecord>) => {
    setCounselingRecords(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };
  const deleteCounselingRecord = (id: string) => setCounselingRecords(prev => prev.filter(c => c.id !== id));

  // ── Notification ──────────────────────────────────────────────
  const addNotification = (n: Omit<NotificationRecord, 'id' | 'createdAt' | 'sentAt'>) => {
    const id = `n${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    setNotifications(prev => [...prev, { ...n, id, createdAt: format(new Date(), 'yyyy-MM-dd HH:mm'), sentAt: null }]);
    return id;
  };
  const sendNotification = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, sentAt: format(new Date(), 'yyyy-MM-dd HH:mm') } : n));
  };
  const deleteNotification = (id: string) => setNotifications(prev => prev.filter(n => n.id !== id));

  // ── Makeup Request (서류 기반 보강/이월) ─────────────────────────
  const submitMakeupRequest = (studentId: string, fromClassId: string, docPhoto: string, reason: string, preferredResolution: 'makeup' | 'carryover') => {
    setMakeupRequests(prev => [...prev, {
      id: `mr${Date.now()}`, studentId, fromClassId, docPhoto, reason, preferredResolution,
      status: 'pending', requestedAt: format(new Date(), 'yyyy-MM-dd HH:mm'), resolvedAt: '',
      toClassId: '', carryoverAmount: 0,
    }]);
    markAbsent(studentId, fromClassId);
  };

  const approveMakeupRequestAsSlot = (requestId: string, toClassId: string) => {
    const req = makeupRequests.find(r => r.id === requestId);
    if (!req || req.status !== 'pending') return;
    const student = students.find(s => s.id === req.studentId);
    const toClass = classes.find(c => c.id === toClassId);
    if (!student || !toClass) return;
    const toDivision = getClassDivision(toClass, students);
    if (toDivision !== null && toDivision !== student.division) return;
    setClasses(prev => prev.map(cls =>
      cls.id === toClassId && !cls.makeupStudentIds.includes(req.studentId)
        ? { ...cls, makeupStudentIds: [...cls.makeupStudentIds, req.studentId] } : cls
    ));
    setMakeupRequests(prev => prev.map(r => r.id === requestId
      ? { ...r, status: 'approved_makeup', toClassId, resolvedAt: format(new Date(), 'yyyy-MM-dd HH:mm') } : r));
  };

  const approveMakeupRequestAsCarryover = (requestId: string) => {
    const req = makeupRequests.find(r => r.id === requestId);
    if (!req || req.status !== 'pending') return;
    const student = students.find(s => s.id === req.studentId);
    const plan = student ? paymentPlans.find(p => p.id === student.paymentPlanId) : undefined;
    const perSession = plan && plan.sessionsPerWeek > 0 ? Math.round(plan.monthlyPrice / (plan.sessionsPerWeek * 4)) : 0;
    if (student) {
      setStudents(prev => prev.map(s => s.id === student.id ? { ...s, paymentAmount: Math.max(0, s.paymentAmount - perSession) } : s));
    }
    setMakeupRequests(prev => prev.map(r => r.id === requestId
      ? { ...r, status: 'approved_carryover', carryoverAmount: perSession, resolvedAt: format(new Date(), 'yyyy-MM-dd HH:mm') } : r));
  };

  const rejectMakeupRequest = (requestId: string) => {
    setMakeupRequests(prev => prev.map(r => r.id === requestId
      ? { ...r, status: 'rejected', resolvedAt: format(new Date(), 'yyyy-MM-dd HH:mm') } : r));
  };

  // 이미 시간표에 배정된 보강 자리를 학원이 취소함 (예: 신규/체험 문의로 그 자리가 필요한 경우) —
  // 자리를 비우고, 학부모는 다시 신청해야 하는 상태로 되돌림
  const cancelScheduledMakeup = (classId: string, studentId: string) => {
    setClasses(prev => prev.map(cls => cls.id === classId
      ? { ...cls, makeupStudentIds: cls.makeupStudentIds.filter(id => id !== studentId) } : cls));
    // 서류 기반(MakeupRequest) 경유로 잡힌 보강이면 이력도 남김 — 서류 없이 바로 잡힌 보강은 해당 없음
    setMakeupRequests(prev => prev.map(r => (r.status === 'approved_makeup' && r.toClassId === classId && r.studentId === studentId)
      ? { ...r, status: 'cancelled_by_academy', resolvedAt: format(new Date(), 'yyyy-MM-dd HH:mm') } : r));
    // 경유 방식과 무관하게 항상 알림 기록을 남겨 학부모 앱/강사 앱에서 벨소리로 안내
    setMakeupCancellations(prev => [...prev, { id: `mc_${Date.now()}`, studentId, classId, createdAt: new Date().toISOString() }]);
  };

  // ── 대기자 명단 ──────────────────────────────────────────────
  const addWaitlistEntry = (w: Omit<WaitlistEntry, 'id' | 'status' | 'requestedAt' | 'notifiedAt'>) => {
    setWaitlistEntries(prev => [...prev, { ...w, id: `wl_${Date.now()}`, status: 'waiting', requestedAt: format(new Date(), 'yyyy-MM-dd HH:mm'), notifiedAt: '' }]);
  };
  const markWaitlistNotified = (id: string) => setWaitlistEntries(prev => prev.map(w => w.id === id ? { ...w, status: 'notified', notifiedAt: format(new Date(), 'yyyy-MM-dd HH:mm') } : w));
  const convertWaitlistEntry = (id: string) => setWaitlistEntries(prev => prev.map(w => w.id === id ? { ...w, status: 'converted' } : w));
  const cancelWaitlistEntry = (id: string) => setWaitlistEntries(prev => prev.map(w => w.id === id ? { ...w, status: 'cancelled' } : w));
  const deleteWaitlistEntry = (id: string) => setWaitlistEntries(prev => prev.filter(w => w.id !== id));

  // ── 형제/이벤트 할인 ─────────────────────────────────────────
  const addDiscount = (d: Omit<Discount, 'id'>) => setDiscounts(prev => [...prev, { ...d, id: `disc_${Date.now()}` }]);
  const updateDiscount = (id: string, updates: Partial<Discount>) => setDiscounts(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
  const deleteDiscount = (id: string) => setDiscounts(prev => prev.filter(d => d.id !== id));

  // ── 강사 급여 정산 ────────────────────────────────────────────
  const issuePayroll = (instructorId: string, month: string, hoursOverride?: number) => {
    const inst = instructors.find(i => i.id === instructorId);
    if (!inst) return;
    const hoursWorked = hoursOverride ?? computeMonthlyHours(inst, month);
    const baseAmount = inst.type === '정규' ? inst.monthlySalary : 0;
    const totalAmount = inst.type === '정규' ? inst.monthlySalary : Math.round(inst.hourlyRate * hoursWorked);
    setPayrollRecords(prev => [
      ...prev.filter(p => !(p.instructorId === instructorId && p.month === month)),
      { id: `pay_${Date.now()}`, instructorId, month, payType: inst.type, baseAmount, hourlyRate: inst.hourlyRate, hoursWorked, totalAmount, issuedAt: format(new Date(), 'yyyy-MM-dd HH:mm'), note: '' },
    ]);
  };

  // ── 레벨(급수) 테스트 기록 ──────────────────────────────────────
  const recordLevelTest = (studentId: string, instructorId: string, resultLevel: string, passed: boolean, note: string) => {
    const student = students.find(s => s.id === studentId);
    const previousLevel = student?.level ?? '';
    setLevelTestRecords(prev => [...prev, {
      id: `lvl_${Date.now()}`, studentId, instructorId, testDate: format(new Date(), 'yyyy-MM-dd'),
      previousLevel, resultLevel, passed, note, createdAt: new Date().toISOString(),
    }]);
    if (passed) setStudents(prev => prev.map(s => s.id === studentId ? { ...s, level: resultLevel } : s));
  };

  return (
    <StoreContext.Provider value={{
      instructors, students, classes, events, settings, lessonClasses,
      drivers, vehicles, paymentPlans, paymentRecords, notifications, makeupRequests,
      messages, sendMessage,
      counselingRecords, addCounselingRecord, updateCounselingRecord, deleteCounselingRecord,
      scheduleChangeRequests, submitScheduleChangeRequest, approveScheduleChangeRequest, rejectScheduleChangeRequest,
      addStudent, updateStudent, deleteStudent, extendStudentClasses, deferStudentClasses,
      addEnrollment, updateEnrollment, cancelEnrollment, pauseEnrollmentLongTerm,
      withdrawalRequests, submitWithdrawalRequest, approveWithdrawalRequest, rejectWithdrawalRequest,
      returnRequests, submitReturnRequest, approveReturnRequest, rejectReturnRequest,
      rescheduleClass, markAbsent, absenceRecords, cancelAbsence,
      addEvent, addInstructor, updateInstructor, deleteInstructor, updateInstructorColor,
      updateSettings, updateMakeupSettings,
      addLessonClass, deleteLessonClass, updateLessonClass,
      addDriver, updateDriver, deleteDriver,
      addVehicle, updateVehicle, deleteVehicle, assignStudentToVehicle,
      addPaymentPlan, updatePaymentPlan, deletePaymentPlan,
      addPaymentRecord, markPaymentPaid,
      addNotification, sendNotification, deleteNotification,
      submitMakeupRequest, approveMakeupRequestAsSlot, approveMakeupRequestAsCarryover, rejectMakeupRequest, cancelScheduledMakeup,
      makeupCancellations,
      waitlistEntries, addWaitlistEntry, markWaitlistNotified, convertWaitlistEntry, cancelWaitlistEntry, deleteWaitlistEntry,
      discounts, addDiscount, updateDiscount, deleteDiscount,
      payrollRecords, issuePayroll,
      levelTestRecords, recordLevelTest,
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within StoreProvider');
  return context;
};
