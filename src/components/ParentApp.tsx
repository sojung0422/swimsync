import { useState, useEffect, useRef } from 'react';
import {
  useStore, getClassDivision, getAllEnrollments, parseSessionsPerWeek,
  computeOpenMakeupSlots, isAbsenceCancellable, rankMakeupCandidates, computeNextMonthBilling,
} from '../store/StoreContext';
import type { Enrollment } from '../store/StoreContext';
import {
  Calendar as CalendarIcon, RefreshCw, Bell, Info, MapPin, Upload, CheckCircle, XCircle,
  Wallet, CalendarClock, Car, ChevronLeft, ChevronRight, TrendingUp, X as XIcon, CreditCard, ShieldAlert,
  MessageCircle, Clock3, AlertTriangle, BellRing, Sparkles, Phone,
} from 'lucide-react';
import ChatThread from './ChatThread';
import AddContactButton from './AddContactButton';
import { playBellSound } from '../lib/playBellSound';
import { format, addDays, addMonths, startOfMonth, startOfWeek, isAfter, isSameMonth, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';

// ─── 달력 선택 컴포넌트 ────────────────────────────────────────────────────────

function MiniCalendar({ month, onMonthChange, markedDates, selectedDate, selectedDates, onSelectDate }: {
  month: Date; onMonthChange: (m: Date) => void;
  markedDates: Set<string>; selectedDate?: string | null; selectedDates?: Set<string>; onSelectDate: (dateStr: string) => void;
}) {
  const gridStart = startOfWeek(startOfMonth(month), { weekStartsOn: 0 });
  const days = Array.from({ length: 42 }).map((_, i) => addDays(gridStart, i));

  return (
    <div>
      <div className="flex items-center justify-between mb-3 px-1">
        <button onClick={() => onMonthChange(addMonths(month, -1))} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-bold text-slate-800">{format(month, 'yyyy년 M월', { locale: ko })}</span>
        <button onClick={() => onMonthChange(addMonths(month, 1))} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      <div className="grid grid-cols-7 text-center mb-1">
        {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => (
          <div key={d} className={`text-[10px] font-bold ${i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-slate-400'}`}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map(day => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const inMonth = isSameMonth(day, month);
          const marked = markedDates.has(dateStr);
          const isSelected = selectedDates ? selectedDates.has(dateStr) : selectedDate === dateStr;
          return (
            <button key={dateStr} disabled={!marked} onClick={() => onSelectDate(dateStr)}
              className={`aspect-square rounded-lg text-[11px] flex items-center justify-center font-semibold transition-colors
                ${!inMonth ? 'opacity-25' : ''}
                ${isSelected ? 'bg-cyan-600 text-white' : marked ? 'bg-cyan-50 text-cyan-700 hover:bg-cyan-100' : 'text-slate-300 cursor-not-allowed'}`}>
              {format(day, 'd')}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── 요일·시간·수강 횟수 변경 신청 모달 ────────────────────────────────────────

const DAYS = ['월', '화', '수', '목', '금', '토', '일'];
const PASS_TYPES = ['주 1회', '주 2회', '주 3회', '주 5회'];

function ScheduleChangeModal({ studentId, enrollment, lessonClassName, onClose }: {
  studentId: string; enrollment: Enrollment; lessonClassName: string; onClose: () => void;
}) {
  const { settings, submitScheduleChangeRequest } = useStore();
  const [days, setDays] = useState<string[]>(enrollment.regularDays);
  const [time, setTime] = useState(enrollment.regularTime);
  const [passType, setPassType] = useState(enrollment.passType);
  const [submitted, setSubmitted] = useState(false);

  const toggleDay = (d: string) => setDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);

  const isFrequencyChange = parseSessionsPerWeek(enrollment.passType) !== parseSessionsPerWeek(passType);
  // 요일/시간 변경은 언제든 신청 가능(당월 즉시 적용). 수강 횟수 변경은 신청 시점 제약 없이 접수하되, 승인되면 다음 달 1일부터 자동 적용된다.
  const nextMonthLabel = format(addMonths(startOfMonth(new Date()), 1), 'M월 d일', { locale: ko });
  const noChange = days.length === enrollment.regularDays.length
    && days.every(d => enrollment.regularDays.includes(d))
    && time === enrollment.regularTime && passType === enrollment.passType;

  const handleSubmit = () => {
    if (noChange || days.length === 0) return;
    submitScheduleChangeRequest({
      studentId, enrollmentId: enrollment.id,
      currentDays: enrollment.regularDays, currentTime: enrollment.regularTime, currentPassType: enrollment.passType,
      requestedDays: days, requestedTime: time, requestedPassType: passType,
    });
    setSubmitted(true);
    setTimeout(onClose, 1400);
  };

  return (
    <div className="absolute inset-0 bg-black/50 z-50 flex flex-col justify-end">
      <div className="bg-white rounded-t-3xl p-6 max-h-[88%] flex flex-col animate-slide-up-modal overflow-y-auto">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-lg font-bold text-slate-800">요일·시간 변경 신청</h3>
          <button onClick={onClose} className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 text-sm font-bold">✕</button>
        </div>

        {submitted ? (
          <div className="py-10 text-center">
            <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
            <p className="text-slate-700 font-semibold">변경 요청을 보냈어요</p>
            <p className="text-slate-400 text-sm mt-1">학원에서 확인 후 반영해드려요.</p>
          </div>
        ) : (
          <>
            <p className="text-slate-400 text-xs mb-4">{lessonClassName} · 현재 {enrollment.regularDays.join('·')} {enrollment.regularTime} · {enrollment.passType}</p>

            <div className="mb-4">
              <p className="text-slate-500 text-xs font-semibold mb-2">요일 선택</p>
              <div className="flex gap-1.5 flex-wrap">
                {DAYS.map(d => (
                  <button key={d} onClick={() => toggleDay(d)}
                    className={`flex-1 min-w-[38px] py-2.5 rounded-xl text-sm font-medium border transition-colors ${days.includes(d) ? 'bg-cyan-600 border-cyan-600 text-white' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <p className="text-slate-500 text-xs font-semibold mb-2">시간</p>
              <select value={time} onChange={e => setTime(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-cyan-500 transition-colors bg-white">
                {settings.designatedTimes.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>

            <div className="mb-4">
              <p className="text-slate-500 text-xs font-semibold mb-2">수강권 (주당 횟수)</p>
              <select value={passType} onChange={e => setPassType(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-cyan-500 transition-colors bg-white">
                {PASS_TYPES.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>

            {isFrequencyChange && (
              <div className="rounded-xl px-3.5 py-3 mb-4 flex items-start gap-2 text-xs bg-cyan-50 text-cyan-700 border border-cyan-200">
                <Clock3 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <p>수강 횟수를 바꾸는 요청은 신청은 언제든 할 수 있지만, 승인되면 <strong>{nextMonthLabel}부터</strong> 자동으로 적용돼요. 그 전까지는 지금 수강권 그대로 유지돼요.</p>
              </div>
            )}

            <button onClick={handleSubmit} disabled={noChange || days.length === 0}
              className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-bold text-sm transition-colors">
              변경 신청하기
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function ParentApp() {
  const {
    classes, instructors, students, events, settings, paymentPlans, paymentRecords, lessonClasses, notifications,
    rescheduleClass, markAbsent, makeupRequests, submitMakeupRequest, markPaymentPaid, scheduleChangeRequests,
    makeupCancellations, withdrawalRequests, submitWithdrawalRequest, returnRequests, submitReturnRequest,
    absenceRecords, cancelAbsence,
  } = useStore();
  const [activeTab, setActiveTab] = useState<'home' | 'reschedule' | 'absence' | 'messages'>('home');
  const [scheduleChangeTarget, setScheduleChangeTarget] = useState<Enrollment | null>(null);
  const [withdrawEnrollmentTarget, setWithdrawEnrollmentTarget] = useState<Enrollment | null>(null);
  const [withdrawReasonDraft, setWithdrawReasonDraft] = useState('');
  const [returnEnrollmentTarget, setReturnEnrollmentTarget] = useState<Enrollment | null>(null);
  const [returnDateDraft, setReturnDateDraft] = useState(new Date().toISOString().slice(0, 10));
  const [showNotifications, setShowNotifications] = useState(false);
  const [readNotificationIds, setReadNotificationIds] = useState<Set<string>>(new Set());
  const [showCheckout, setShowCheckout] = useState(false);
  const [payMethod, setPayMethod] = useState<'card' | 'kakaopay' | 'naverpay'>('card');
  const [paySuccessId, setPaySuccessId] = useState<string | null>(null);

  // 결석 신청 (달력에서 날짜 선택)
  const [activeModal, setActiveModal] = useState<'none' | 'absence' | 'reschedule'>('none');
  const [calMonth, setCalMonth] = useState(new Date());
  const [absenceDates, setAbsenceDates] = useState<Set<string>>(new Set());
  const toggleAbsenceDate = (dateStr: string) => setAbsenceDates(prev => {
    const next = new Set(prev);
    if (next.has(dateStr)) next.delete(dateStr); else next.add(dateStr);
    return next;
  });

  // 보강 신청 (달력에서 결석 대상 날짜 → 보강 대상 날짜 → 시간 순으로 선택)
  const [rescheduleStep, setRescheduleStep] = useState<'source' | 'target-date' | 'target-time' | 'doc-form'>('source');
  const [sourceClassId, setSourceClassId] = useState<string | null>(null);
  const [targetCalMonth, setTargetCalMonth] = useState(new Date());
  const [targetDate, setTargetDate] = useState<string | null>(null);

  const [docPhoto, setDocPhoto] = useState<string | null>(null);
  const [docReason, setDocReason] = useState('');
  const [preferredResolution, setPreferredResolution] = useState<'makeup' | 'carryover'>('makeup');
  const [absenceSubmitted, setAbsenceSubmitted] = useState(false);
  const [requestSubmitted, setRequestSubmitted] = useState(false);

  const studentId = 's1';
  const student = students.find(s => s.id === studentId);
  const myInstructor = student ? instructors.find(i => i.id === student.instructorId) : undefined;
  const today = new Date();
  const makeupSettings = settings.makeupSettings;

  // 학원이 자리 사정(신규/체험 문의 등)으로 취소한 보강 — 벨소리 알림 + 재신청 안내
  const myCancelledMakeups = makeupCancellations.filter(n => n.studentId === studentId);
  const bellPlayedRef = useRef<Set<string>>(new Set());
  const [dismissedCancelIds, setDismissedCancelIds] = useState<Set<string>>(new Set());
  useEffect(() => {
    const unplayed = myCancelledMakeups.filter(r => !bellPlayedRef.current.has(r.id));
    if (unplayed.length > 0) {
      playBellSound();
      unplayed.forEach(r => bellPlayedRef.current.add(r.id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myCancelledMakeups.map(r => r.id).join(',')]);
  const visibleCancelledMakeups = myCancelledMakeups.filter(r => !dismissedCancelIds.has(r.id));

  const requiresDoc = student?.category === 'adult'
    ? makeupSettings.adultRequiresDocument
    : makeupSettings.childRequiresDocument;

  const paymentPlan = student ? paymentPlans.find(p => p.id === student.paymentPlanId) : undefined;
  const nextMonthBilling = student && paymentPlan
    ? computeNextMonthBilling(student.regularDays, paymentPlan.sessionRates, settings.closedDates, settings.skipFifthWeekOccurrence)
    : null;

  const myUnpaidRecords = paymentRecords.filter(p => p.studentId === studentId && p.status !== 'paid');
  const myUnpaidTotal = myUnpaidRecords.reduce((sum, p) => sum + (p.targetAmount - p.paidAmount), 0);
  const enrollmentLabel = (enrollmentId: string) => {
    if (!student) return '-';
    const enr = getAllEnrollments(student).find(e => e.id === enrollmentId);
    const lc = enr ? lessonClasses.find(l => l.id === enr.lessonClassId) : null;
    return lc?.name ?? (enrollmentId === 'primary' ? '기본반' : '추가반');
  };

  const handleConfirmPayment = () => {
    // 데모 시뮬레이션: 실제 PG(토스페이먼츠 등) 연동 전까지는 결제 성공을 가정하고 수납 내역만 갱신함
    myUnpaidRecords.forEach(r => markPaymentPaid(r.id, 'card'));
    setShowCheckout(false);
    setPaySuccessId('done');
    setTimeout(() => setPaySuccessId(null), 2000);
  };

  const myNotifications = notifications
    .filter(n => n.sentAt !== null && n.recipientIds.includes(studentId))
    .sort((a, b) => (b.sentAt ?? '').localeCompare(a.sentAt ?? ''));
  const unreadNotificationCount = myNotifications.filter(n => !readNotificationIds.has(n.id)).length;

  // 퇴원/복귀/일정변경 처리 결과 등 시스템 알림 — 처음 등장할 때만 벨소리 (앱 로드 시점에 이미 있던 알림은 조용히 배지만 표시)
  const notifBellRef = useRef<Set<string>>(new Set(myNotifications.map(n => n.id)));
  useEffect(() => {
    const unplayed = myNotifications.filter(n => !notifBellRef.current.has(n.id));
    if (unplayed.length > 0) {
      playBellSound();
      unplayed.forEach(n => notifBellRef.current.add(n.id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myNotifications.map(n => n.id).join(',')]);

  const handleOpenNotifications = () => {
    setShowNotifications(true);
    setReadNotificationIds(new Set(myNotifications.map(n => n.id)));
  };

  const myClasses = classes
    .filter(c => (c.studentIds.includes(studentId) || c.makeupStudentIds.includes(studentId)) && !c.absentStudentIds.includes(studentId))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const nextClass = myClasses.find(c => isAfter(parseISO(c.date), today) || c.date === format(today, 'yyyy-MM-dd'));
  const nextClassInstructor = nextClass ? instructors.find(i => i.id === nextClass.instructorId) : null;

  // 결석/보강 대상으로 고를 수 있는 내 수업 날짜 (오늘 이후, 아직 결석 처리 안 된 것)
  const myUpcomingClasses = myClasses.filter(c => isAfter(parseISO(c.date), today) || c.date === format(today, 'yyyy-MM-dd'));
  const myScheduledDates = new Set(myUpcomingClasses.map(c => c.date));

  const sourceClass = sourceClassId ? classes.find(c => c.id === sourceClassId) ?? null : null;

  // 보강 대상 후보: 같은 구분(유치부/정규반/성인반)이면서 정원이 남은, 담당 강사 무관 전체 수업
  const targetCandidates = student ? classes
    .filter(c => c.id !== sourceClassId && isAfter(parseISO(c.date), today))
    .map(c => {
      const instructor = instructors.find(i => i.id === c.instructorId);
      const remaining = computeOpenMakeupSlots(c, instructor?.maxCapacity ?? 5, absenceRecords);
      const division = getClassDivision(c, students);
      return { c, instructor, remaining, division };
    })
    .filter(x => x.remaining > 0 && x.division === student.division)
    : [];
  const targetDatesSet = new Set(targetCandidates.map(x => x.c.date));
  const targetTimeCandidates = targetCandidates
    .filter(x => x.c.date === targetDate)
    .sort((a, b) => a.c.time.localeCompare(b.c.time));

  const myPendingRequests = makeupRequests.filter(r => r.studentId === studentId && r.status === 'pending');
  const myResolvedRequests = makeupRequests.filter(r => r.studentId === studentId && r.status !== 'pending').slice(-2);

  // ── 모달 열기/닫기 ──────────────────────────────────────────────
  const openAbsence = () => {
    setActiveModal('absence');
    setCalMonth(new Date());
    setAbsenceDates(new Set());
  };

  const openReschedule = () => {
    setActiveModal('reschedule');
    setRescheduleStep('source');
    setCalMonth(new Date());
    setSourceClassId(null);
    setTargetCalMonth(new Date());
    setTargetDate(null);
    setDocPhoto(null);
    setDocReason('');
    setPreferredResolution('makeup');
  };

  const closeModal = () => {
    setActiveModal('none');
    setDocPhoto(null);
    setDocReason('');
    setAbsenceDates(new Set());
  };

  // ── 결석 (여러 날짜 동시 신청 가능) ────────────────────────────────
  const handleConfirmAbsence = () => {
    if (absenceDates.size === 0) return;
    absenceDates.forEach(dateStr => {
      const cls = myUpcomingClasses.find(c => c.date === dateStr);
      if (cls) markAbsent(studentId, cls.id);
    });
    setAbsenceDates(new Set());
    closeModal();
    setAbsenceSubmitted(true);
  };

  // ── 보강: 1단계, 결석(보강 대상) 날짜 선택 ───────────────────────
  const handlePickSourceDate = (dateStr: string) => {
    const cls = myUpcomingClasses.find(c => c.date === dateStr);
    if (!cls) return;
    setSourceClassId(cls.id);
    setTargetCalMonth(new Date());
    setTargetDate(null);
    setRescheduleStep(requiresDoc ? 'doc-form' : 'target-date');
  };

  // ── 보강: 2단계, 보강 받을 날짜 선택 ──────────────────────────────
  const handlePickTargetDate = (dateStr: string) => {
    setTargetDate(dateStr);
    setRescheduleStep('target-time');
  };

  // ── 보강: 3단계, 시간 선택 후 확정 ────────────────────────────────
  const handleConfirmReschedule = (toClassId: string) => {
    if (sourceClassId && rescheduleClass(studentId, sourceClassId, toClassId)) {
      closeModal();
    }
  };

  const handleSubmitDocRequest = () => {
    if (!sourceClassId || !docPhoto) return;
    submitMakeupRequest(studentId, sourceClassId, docPhoto, docReason.trim(), preferredResolution);
    closeModal();
    setDocReason('');
    setPreferredResolution('makeup');
    setRequestSubmitted(true);
  };

  const handleDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setDocPhoto(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex items-center justify-center h-full bg-slate-100 p-8">
      <div className="w-[390px] h-[844px] bg-white rounded-[3rem] shadow-2xl border-[8px] border-slate-800 overflow-hidden relative flex flex-col">

        {/* Status Bar */}
        <div className="h-12 bg-white flex items-center justify-between px-6 text-xs font-semibold text-slate-800 shrink-0">
          <span>{format(new Date(), 'HH:mm')}</span>
          <div className="w-3.5 h-3.5 rounded-full bg-slate-800" />
        </div>

        {/* App Content */}
        {activeTab === 'messages' ? (
          <div className="flex-1 overflow-hidden pb-20">
            <ChatThread
              studentId={studentId}
              viewerRole="parent"
              counterpartName={myInstructor?.name ?? '담당 강사'}
              counterpartSubtitle={`${student?.studentName ?? ''} 학생 담당 강사`}
              counterpartPhone={myInstructor?.phone}
            />
          </div>
        ) : (
        <div className="flex-1 overflow-y-auto pb-20 bg-slate-50">
          {/* Header */}
          <div className="bg-white px-6 pt-4 pb-4 flex justify-between items-center sticky top-0 z-20 shadow-sm">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-[18px] font-bold text-slate-800">{settings.academyName}</h1>
              </div>
              <div className="flex items-center text-xs text-slate-400 mt-0.5">
                <MapPin className="w-3 h-3 mr-1" /><span>{settings.branchName}</span>
              </div>
              {settings.academyPhone && (
                <div className="flex items-center gap-2 mt-1">
                  <a href={`tel:${settings.academyPhone}`} className="text-xs text-cyan-600 font-medium flex items-center gap-1">
                    <Phone className="w-3 h-3" /> {settings.academyPhone}
                  </a>
                  <AddContactButton name={`${settings.academyName} 대표번호`} phone={settings.academyPhone} />
                </div>
              )}
            </div>
            <button onClick={handleOpenNotifications} className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 relative">
              <Bell className="w-4 h-4" />
              {unreadNotificationCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white" />
              )}
            </button>
          </div>

          <div className="px-5 py-5 space-y-5">
            {/* 보강 취소 알림 (학원이 자리 사정으로 취소) */}
            {visibleCancelledMakeups.map(r => {
              const cls = classes.find(c => c.id === r.classId);
              return (
                <div key={r.id} className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
                  <BellRing className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-red-700 text-sm font-bold">보강 일정이 취소됐어요</p>
                    <p className="text-red-600 text-xs mt-1 leading-relaxed">
                      {cls ? `${format(parseISO(cls.date), 'M월 d일 (E)', { locale: ko })} ${cls.time}` : '예정됐던'} 보강이 학원 사정으로 취소됐어요. 보강 일정을 다시 잡아주세요.
                    </p>
                    <div className="flex gap-2 mt-2.5">
                      <button onClick={() => { setDismissedCancelIds(prev => new Set(prev).add(r.id)); openReschedule(); }}
                        className="text-xs font-semibold text-white bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-lg transition-colors">
                        보강 다시 신청하기
                      </button>
                      <button onClick={() => setDismissedCancelIds(prev => new Set(prev).add(r.id))}
                        className="text-xs font-semibold text-red-500 hover:text-red-700 px-2 py-1.5 transition-colors">
                        확인했어요
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* 공지사항 / 이벤트 — 메모(memo)는 학원 내부용이라 학부모 앱에는 노출되지 않음 */}
            {events
              .filter(e => e.type === 'notice' || e.type === 'event')
              .slice()
              .sort((a, b) => b.date.localeCompare(a.date))
              .slice(0, 3)
              .map(notice => (
                <div key={notice.id} className="rounded-2xl p-5 text-white shadow-md relative overflow-hidden" style={{ background: notice.type === 'notice' ? 'linear-gradient(135deg,#0891b2,#3b82f6)' : 'linear-gradient(135deg,#059669,#0d9488)' }}>
                  <div className="absolute top-0 right-0 w-28 h-28 bg-white/10 rounded-full -mr-8 -mt-8" />
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-white/20 px-2 py-0.5 rounded text-xs font-bold">{notice.type === 'notice' ? '공지' : '이벤트'}</span>
                  </div>
                  <h3 className="font-bold text-base mb-1">{notice.title}</h3>
                  <p className="text-blue-100 text-sm">
                    {notice.endDate && notice.endDate !== notice.date
                      ? `${format(parseISO(notice.date), 'M월 d일', { locale: ko })} ~ ${format(parseISO(notice.endDate), 'M월 d일', { locale: ko })}`
                      : `${format(parseISO(notice.date), 'M월 d일', { locale: ko })} 진행 예정`}
                  </p>
                </div>
              ))}

            {/* Next class */}
            <div>
              <div className="flex justify-between items-end mb-3">
                <h2 className="text-[15px] font-bold text-slate-800">다음 강습 일정</h2>
                <span className="text-sm text-cyan-600 font-medium">{student?.studentName} {student?.category === 'child' ? '어린이' : '님'}</span>
              </div>
              {nextClass ? (
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <div className="text-2xl font-bold text-slate-800">{format(parseISO(nextClass.date), 'M월 d일', { locale: ko })}</div>
                      <div className="text-slate-400 font-medium text-sm">{format(parseISO(nextClass.date), 'EEEE', { locale: ko })} {nextClass.time}</div>
                    </div>
                    <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#0891b2,#3b82f6)' }}>
                      <CalendarIcon className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <div className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center text-xs font-bold text-slate-600">
                        {nextClassInstructor?.name.charAt(0)}
                      </div>
                      <span>{nextClassInstructor?.name} 강사님</span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={openAbsence}
                        className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1.5 rounded-lg hover:bg-slate-200 transition-colors">
                        결석
                      </button>
                      <button onClick={openReschedule}
                        className="text-xs font-semibold text-orange-600 bg-orange-50 px-2.5 py-1.5 rounded-lg hover:bg-orange-100 transition-colors">
                        보강 신청
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 text-center text-slate-400 text-sm">
                  예정된 강습이 없습니다.
                </div>
              )}
            </div>

            {/* 결석 처리된 수업 — 빨간색으로 표시, 3일 이내면 취소 가능 */}
            {classes.filter(c => c.absentStudentIds.includes(studentId) && (isAfter(parseISO(c.date), addDays(today, -14)))).length > 0 && (
              <div>
                <h2 className="text-[15px] font-bold text-slate-800 mb-3">결석 처리된 수업</h2>
                <div className="space-y-1.5">
                  {classes
                    .filter(c => c.absentStudentIds.includes(studentId) && isAfter(parseISO(c.date), addDays(today, -14)))
                    .sort((a, b) => b.date.localeCompare(a.date))
                    .map(c => {
                      const record = absenceRecords.find(r => r.studentId === studentId && r.classId === c.id && r.status === 'active');
                      const cancellable = record ? isAbsenceCancellable(record) : false;
                      return (
                        <div key={c.id} className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 flex items-center justify-between gap-2">
                          <div>
                            <span className="text-red-600 text-sm font-semibold line-through decoration-red-300">
                              {format(parseISO(c.date), 'M월 d일 (E)', { locale: ko })} {c.time}
                            </span>
                            {record && (
                              <p className="text-red-400 text-[11px] mt-0.5">
                                {cancellable ? `${format(parseISO(record.cancelDeadline), 'M/d HH:mm')}까지 취소 가능` : '취소 가능 기간이 지났어요'}
                              </p>
                            )}
                          </div>
                          {record ? (
                            <button onClick={() => cancelAbsence(record.id)} disabled={!cancellable}
                              className={`shrink-0 text-[11px] font-bold px-2.5 py-1.5 rounded-full transition-colors ${cancellable ? 'text-white bg-red-500 hover:bg-red-600' : 'text-slate-400 bg-slate-100 cursor-not-allowed'}`}>
                              결석 취소
                            </button>
                          ) : (
                            <span className="text-[10px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full shrink-0">결석</span>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* 내 수업 정보 — 요일/시간/수강권 변경, 장기 결석 복귀, 퇴원 신청 */}
            {student && (
              <div>
                <h2 className="text-[15px] font-bold text-slate-800 mb-3">내 수업 정보</h2>
                <div className="space-y-2">
                  {getAllEnrollments(student).filter(e => e.status === 'active' || e.status === 'paused').map(enr => {
                    const lc = lessonClasses.find(l => l.id === enr.lessonClassId);
                    const pendingChangeReq = scheduleChangeRequests.find(r => r.studentId === studentId && r.enrollmentId === enr.id && r.status === 'pending');
                    const pendingWithdrawal = withdrawalRequests.find(r => r.studentId === studentId && r.enrollmentId === enr.id && r.status === 'pending');
                    const pendingReturn = returnRequests.find(r => r.studentId === studentId && r.enrollmentId === enr.id && r.status === 'pending');
                    if (enr.status === 'paused') {
                      return (
                        <div key={enr.id} className="bg-amber-50 rounded-2xl p-4 border border-amber-200">
                          <p className="text-slate-800 text-sm font-semibold">{lc?.name ?? '반 정보 없음'} — 장기 결석 중</p>
                          <p className="text-amber-600 text-xs mt-0.5">{enr.pauseReason && `사유: ${enr.pauseReason}`} {enr.expectedReturnDate && `· 예상 복귀일: ${enr.expectedReturnDate}`}</p>
                          {pendingReturn ? (
                            <span className="inline-block mt-2 text-[11px] font-bold text-cyan-700 bg-cyan-50 border border-cyan-200 px-2.5 py-1.5 rounded-lg">복귀 신청 승인 대기중 (희망일 {pendingReturn.requestedReturnDate})</span>
                          ) : (
                            <button onClick={() => { setReturnEnrollmentTarget(enr); setReturnDateDraft(new Date().toISOString().slice(0, 10)); }}
                              className="mt-2 text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-700 px-3 py-1.5 rounded-lg transition-colors">
                              복귀 신청하기
                            </button>
                          )}
                        </div>
                      );
                    }
                    return (
                      <div key={enr.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-slate-800 text-sm font-semibold">{lc?.name ?? '반 정보 없음'}</p>
                            <p className="text-slate-400 text-xs mt-0.5">{enr.regularDays.join('·')} {enr.regularTime} · {enr.passType}</p>
                          </div>
                          {pendingChangeReq ? (
                            <span className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1.5 rounded-lg">승인 대기중</span>
                          ) : (
                            <button onClick={() => setScheduleChangeTarget(enr)}
                              className="text-xs font-semibold text-cyan-700 bg-cyan-50 px-2.5 py-1.5 rounded-lg hover:bg-cyan-100 transition-colors">
                              변경 신청
                            </button>
                          )}
                        </div>
                        <div className="mt-2 pt-2 border-t border-slate-50">
                          {pendingWithdrawal ? (
                            <span className="text-[11px] font-medium text-red-500">퇴원 신청 확인 대기중</span>
                          ) : (
                            <button onClick={() => { setWithdrawEnrollmentTarget(enr); setWithdrawReasonDraft(''); }}
                              className="text-[11px] font-medium text-slate-400 hover:text-red-500 transition-colors">
                              퇴원 신청
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Attendance Summary */}
            <div>
              <h2 className="text-[15px] font-bold text-slate-800 mb-3">이번 달 출석 현황</h2>
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex justify-between items-center">
                {[
                  { label: '총 수업', value: student?.totalClasses || 8, color: 'text-cyan-600' },
                  { label: '변경 가능', value: student?.rescheduleLimit || 2, color: 'text-slate-800' },
                  { label: '변경 잔여', value: (student?.rescheduleLimit || 2) - (student?.usedReschedules || 0), color: 'text-orange-500' },
                ].map((item, i) => (
                  <div key={i} className="text-center flex-1">
                    <div className={`text-2xl font-bold ${item.color}`}>{item.value}</div>
                    <div className="text-xs text-slate-400 mt-1">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 진도 현황 (강사 기록) */}
            <div>
              <h2 className="text-[15px] font-bold text-slate-800 mb-3">나의 진도</h2>
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-cyan-50 border border-cyan-100 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-5 h-5 text-cyan-600" />
                </div>
                <p className="text-slate-700 text-sm font-medium">{student?.progress || '아직 강사님이 기록한 진도가 없어요.'}</p>
              </div>
            </div>

            {/* 결제 현황 */}
            <div>
              <h2 className="text-[15px] font-bold text-slate-800 mb-3">결제 현황</h2>
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <p className="text-slate-800 font-bold text-lg">{(student?.paymentAmount ?? 0).toLocaleString()}원</p>
                    <p className="text-slate-400 text-xs mt-0.5">{paymentPlan?.name ?? '결제 플랜 미지정'}{student?.paymentRenewalDate ? ` · 다음 갱신 ${student.paymentRenewalDate}` : ''}</p>
                  </div>
                  <span className={`px-3 py-1.5 rounded-full text-xs font-bold border ${myUnpaidRecords.length === 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                    {myUnpaidRecords.length === 0 ? '결제 완료' : '결제 대기'}
                  </span>
                </div>

                {myUnpaidRecords.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                    {myUnpaidRecords.map(r => (
                      <div key={r.id} className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">{r.billingMonth} · {enrollmentLabel(r.enrollmentId)}</span>
                        <span className="font-semibold text-slate-700">{(r.targetAmount - r.paidAmount).toLocaleString()}원</span>
                      </div>
                    ))}
                    <button onClick={() => setShowCheckout(true)}
                      className="w-full mt-2 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2">
                      <CreditCard className="w-4 h-4" /> {myUnpaidTotal.toLocaleString()}원 결제하기
                    </button>
                  </div>
                )}

                {nextMonthBilling && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-slate-500 text-xs font-medium">{nextMonthBilling.month} 예상 청구액</p>
                        <p className="text-cyan-700 text-sm mt-0.5">
                          {student?.regularDays.join('·')} 수업 <strong>{nextMonthBilling.occurrences}회</strong>
                        </p>
                      </div>
                      <p className="text-slate-800 font-bold text-base">{nextMonthBilling.amount.toLocaleString()}원</p>
                    </div>
                    <p className="text-slate-300 text-[10.5px] mt-1">실제 달력의 수업 요일 수를 기준으로 자동 계산돼요. 휴무일은 제외돼요.</p>
                  </div>
                )}
              </div>
            </div>

            {/* My makeup/carryover requests (서류 기반 보강·이월 요청 현황) */}
            {(myPendingRequests.length > 0 || myResolvedRequests.length > 0) && (
              <div>
                <h2 className="text-[15px] font-bold text-slate-800 mb-3">보강·이월 요청 현황</h2>
                <div className="space-y-2">
                  {myPendingRequests.map(r => (
                    <div key={r.id} className="bg-white rounded-2xl p-4 shadow-sm border border-amber-200">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-700 text-sm font-medium">{r.reason || (r.preferredResolution === 'carryover' ? '이월 요청' : '보강 요청')}</span>
                        <span className="text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-1 rounded-full">승인 대기중</span>
                      </div>
                      <span className="inline-flex items-center gap-1 mt-2 text-[10px] font-semibold text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full">
                        {r.preferredResolution === 'carryover' ? <><Wallet className="w-3 h-3" /> 이월 희망</> : <><CalendarClock className="w-3 h-3" /> 보강 희망</>}
                      </span>
                    </div>
                  ))}
                  {myResolvedRequests.map(r => (
                    <div key={r.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center justify-between">
                      <span className="text-slate-700 text-sm font-medium">{r.reason || '보강·이월 요청'}</span>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${r.status === 'approved_makeup' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : r.status === 'approved_carryover' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                        {r.status === 'approved_makeup' ? '보강 확정' : r.status === 'approved_carryover' ? `다음달 ${r.carryoverAmount.toLocaleString()}원 차감` : '거절됨'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Makeup settings info */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
              <p className="text-slate-500 text-xs font-semibold mb-2">보강 규정</p>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  {makeupSettings.childRequiresDocument
                    ? <CheckCircle className="w-3.5 h-3.5 text-amber-500" />
                    : <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />}
                  <span className="text-slate-600 text-xs">
                    아동: {makeupSettings.childRequiresDocument ? '진단서 필요' : '서류 없이 보강 가능'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {makeupSettings.adultRequiresDocument
                    ? <CheckCircle className="w-3.5 h-3.5 text-amber-500" />
                    : <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />}
                  <span className="text-slate-600 text-xs">
                    성인: {makeupSettings.adultRequiresDocument ? '진단서/의료확인 필요' : '서류 없이 보강 가능'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-cyan-500" />
                  <span className="text-slate-600 text-xs">보강은 같은 구분({student?.division ?? '유치부/정규반/성인반'}) 내에서만 가능</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        )}

        {/* ── 공지/알림 패널 ── */}
        {showNotifications && (
          <div className="absolute inset-0 bg-black/50 z-50 flex flex-col justify-end">
            <div className="bg-white rounded-t-3xl p-6 max-h-[75%] flex flex-col animate-slide-up-modal">
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-lg font-bold text-slate-800">공지·알림</h3>
                <button onClick={() => setShowNotifications(false)} className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500"><XIcon className="w-4 h-4" /></button>
              </div>
              <div className="flex-1 overflow-y-auto space-y-2">
                {myNotifications.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 text-sm">받은 공지·알림이 없습니다.</div>
                ) : (
                  myNotifications.map(n => (
                    <div key={n.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                      <p className="text-slate-800 text-sm font-semibold">{n.title}</p>
                      <p className="text-slate-500 text-xs mt-1 leading-relaxed">{n.content}</p>
                      <p className="text-slate-300 text-[11px] mt-2">{n.sentAt}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── 요일·시간·수강 횟수 변경 신청 모달 ── */}
        {scheduleChangeTarget && (
          <ScheduleChangeModal
            studentId={studentId}
            enrollment={scheduleChangeTarget}
            lessonClassName={lessonClasses.find(l => l.id === scheduleChangeTarget.lessonClassId)?.name ?? ''}
            onClose={() => setScheduleChangeTarget(null)}
          />
        )}

        {/* ── 퇴원 신청 모달 ── */}
        {withdrawEnrollmentTarget && (
          <div className="absolute inset-0 bg-black/50 z-50 flex flex-col justify-end">
            <div className="bg-white rounded-t-3xl p-6 animate-slide-up-modal">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-slate-800">퇴원 신청</h3>
                <button onClick={() => setWithdrawEnrollmentTarget(null)} className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 text-sm font-bold">✕</button>
              </div>
              <p className="text-slate-500 text-xs mb-3">신청하면 학원에서 확인 후 퇴원 처리를 진행해요.</p>
              <textarea value={withdrawReasonDraft} onChange={e => setWithdrawReasonDraft(e.target.value)} rows={3}
                placeholder="퇴원 사유 (선택)"
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-red-400 transition-colors resize-none mb-3" />
              <button onClick={() => { submitWithdrawalRequest(studentId, withdrawEnrollmentTarget.id, withdrawReasonDraft.trim(), 'parent'); setWithdrawEnrollmentTarget(null); }}
                className="w-full py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold text-sm transition-colors">
                퇴원 신청하기
              </button>
            </div>
          </div>
        )}

        {/* ── 복귀 신청 모달 ── */}
        {returnEnrollmentTarget && (
          <div className="absolute inset-0 bg-black/50 z-50 flex flex-col justify-end">
            <div className="bg-white rounded-t-3xl p-6 animate-slide-up-modal">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-slate-800">복귀 신청</h3>
                <button onClick={() => setReturnEnrollmentTarget(null)} className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 text-sm font-bold">✕</button>
              </div>
              <p className="text-slate-500 text-xs mb-3">복귀 희망일을 선택하면 신청이 접수돼요. 담당쌤·데스크가 자리를 확인하고 승인해야 다시 수강할 수 있어요.</p>
              <input type="date" value={returnDateDraft} onChange={e => setReturnDateDraft(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-cyan-400 transition-colors mb-3" />
              <button onClick={() => { submitReturnRequest(studentId, returnEnrollmentTarget.id, returnDateDraft); setReturnEnrollmentTarget(null); }}
                className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold text-sm transition-colors">
                복귀 신청하기
              </button>
            </div>
          </div>
        )}

        {/* ── 결석 신청 모달 (달력) ── */}
        {activeModal === 'absence' && (
          <div className="absolute inset-0 bg-black/50 z-50 flex flex-col justify-end">
            <div className="bg-white rounded-t-3xl p-6 max-h-[88%] flex flex-col animate-slide-up-modal">
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-lg font-bold text-slate-800">결석 신청</h3>
                <button onClick={closeModal} className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 text-sm font-bold">✕</button>
              </div>

              <div className="bg-amber-50 text-amber-700 p-3 rounded-xl text-xs mb-4 flex items-start gap-2">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <p>결석할 날짜를 달력에서 선택하세요 (여러 날짜 동시 선택 가능). 파란 표시가 있는 날짜만 예정된 강습이 있어요.</p>
              </div>

              <MiniCalendar month={calMonth} onMonthChange={setCalMonth}
                markedDates={myScheduledDates} selectedDates={absenceDates} onSelectDate={toggleAbsenceDate} />

              {absenceDates.size > 0 && (
                <div className="mt-5 animate-fade-up">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-3 space-y-2 max-h-40 overflow-y-auto">
                    <p className="text-slate-500 text-xs mb-1">결석 처리할 수업 ({absenceDates.size}건)</p>
                    {Array.from(absenceDates).sort().map(dateStr => {
                      const cls = myUpcomingClasses.find(c => c.date === dateStr);
                      if (!cls) return null;
                      return (
                        <div key={dateStr} className="flex items-center justify-between">
                          <div>
                            <p className="text-slate-800 font-bold text-sm">{format(parseISO(cls.date), 'M월 d일 (E)', { locale: ko })} {cls.time}</p>
                            <p className="text-slate-400 text-xs">{instructors.find(i => i.id === cls.instructorId)?.name} 강사님</p>
                          </div>
                          <button onClick={() => toggleAbsenceDate(dateStr)} className="text-slate-300 hover:text-red-500 text-xs font-bold px-2">✕</button>
                        </div>
                      );
                    })}
                  </div>
                  <button onClick={handleConfirmAbsence}
                    className="w-full py-3.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold text-sm transition-colors">
                    {absenceDates.size}건 결석 처리하기
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── 보강 신청 모달 (달력 2단계) ── */}
        {activeModal === 'reschedule' && (
          <div className="absolute inset-0 bg-black/50 z-50 flex flex-col justify-end">
            <div className="bg-white rounded-t-3xl p-6 max-h-[88%] flex flex-col animate-slide-up-modal overflow-y-auto">
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-lg font-bold text-slate-800">보강 신청</h3>
                <button onClick={closeModal} className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 text-sm font-bold">✕</button>
              </div>

              <div className="bg-orange-50 text-orange-800 p-4 rounded-xl text-xs mb-3 flex items-start gap-2">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <p>보강 횟수: <strong>{(student?.rescheduleLimit || 2) - (student?.usedReschedules || 0)}회</strong> 남음. 당일 취소는 2시간 전까지 가능.</p>
              </div>
              <div className="bg-slate-100 text-slate-600 p-3 rounded-xl text-xs mb-4 flex items-start gap-2">
                <Car className="w-4 h-4 shrink-0 mt-0.5 text-slate-400" />
                <p><strong className="text-slate-700">보강 수업에는 차량(등하원 셔틀)이 운행되지 않아요.</strong> 보강 시간에는 보호자님께서 직접 등하원해주세요.</p>
              </div>

              {/* STEP 1: 결석(보강 대상) 날짜 선택 */}
              {rescheduleStep === 'source' && (
                <>
                  <p className="text-slate-700 text-sm font-semibold mb-2">① 보강받을 결석 날짜를 선택하세요</p>
                  <MiniCalendar month={calMonth} onMonthChange={setCalMonth}
                    markedDates={myScheduledDates} selectedDate={sourceClassId ? sourceClass?.date ?? null : null}
                    onSelectDate={handlePickSourceDate} />
                </>
              )}

              {/* STEP 2 (서류 불필요): 보강 받을 날짜 선택 */}
              {rescheduleStep === 'target-date' && sourceClass && (
                <>
                  <button onClick={() => setRescheduleStep('source')} className="flex items-center gap-1 text-slate-400 text-xs mb-3 hover:text-slate-600">
                    <ChevronLeft className="w-3.5 h-3.5" /> 결석 날짜 다시 선택
                  </button>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-4 text-xs text-slate-600">
                    결석: <strong className="text-slate-800">{format(parseISO(sourceClass.date), 'M월 d일 (E)', { locale: ko })} {sourceClass.time}</strong>
                  </div>
                  {targetCandidates.length > 0 && (
                    <div className="mb-4 space-y-2">
                      <p className="text-slate-500 text-xs font-semibold flex items-center gap-1"><Sparkles className="w-3.5 h-3.5 text-amber-500" /> 추천 보강 자리</p>
                      {rankMakeupCandidates(targetCandidates, sourceClass).slice(0, 2).map((cand, i) => (
                        <button key={cand.c.id} onClick={() => handleConfirmReschedule(cand.c.id)}
                          className="w-full text-left border border-amber-200 bg-amber-50/60 rounded-xl p-3.5 transition-colors hover:border-amber-400 hover:bg-amber-50">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="shrink-0 text-[10px] font-bold text-white bg-amber-500 px-1.5 py-0.5 rounded-full">{i === 0 ? '1순위' : '2순위'}</span>
                              <span className="font-bold text-slate-800 text-sm truncate">{format(parseISO(cand.c.date), 'M월 d일 (E)', { locale: ko })} {cand.c.time}</span>
                            </div>
                            <span className="shrink-0 text-xs font-medium text-cyan-600 bg-white px-2.5 py-1 rounded-full border border-cyan-100">잔여 {cand.remaining}자리</span>
                          </div>
                          {cand.reasons.length > 0 && <p className="text-amber-600 text-[11px] mt-1">{cand.reasons.join(' · ')}</p>}
                        </button>
                      ))}
                      <p className="text-slate-400 text-[11px]">추천 자리가 마음에 안 들면 아래 달력에서 직접 골라도 돼요.</p>
                    </div>
                  )}

                  <p className="text-slate-700 text-sm font-semibold mb-2">② 보강받을 날짜를 선택하세요 ({student?.division} 자리만 표시)</p>
                  {targetDatesSet.size > 0 ? (
                    <MiniCalendar month={targetCalMonth} onMonthChange={setTargetCalMonth}
                      markedDates={targetDatesSet} selectedDate={targetDate} onSelectDate={handlePickTargetDate} />
                  ) : (
                    <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-xl text-sm">현재 보강 가능한 자리가 없습니다.</div>
                  )}
                </>
              )}

              {/* STEP 3: 시간 선택 */}
              {rescheduleStep === 'target-time' && sourceClass && (
                <>
                  <button onClick={() => setRescheduleStep('target-date')} className="flex items-center gap-1 text-slate-400 text-xs mb-3 hover:text-slate-600">
                    <ChevronLeft className="w-3.5 h-3.5" /> 날짜 다시 선택
                  </button>
                  <p className="text-slate-700 text-sm font-semibold mb-2">③ {targetDate && format(parseISO(targetDate), 'M월 d일 (E)', { locale: ko })} 보강 가능 시간</p>
                  <div className="space-y-2">
                    {targetTimeCandidates.map(({ c, instructor, remaining }) => (
                      <button key={c.id} onClick={() => handleConfirmReschedule(c.id)}
                        className="w-full text-left border border-slate-200 rounded-xl p-4 flex justify-between items-center transition-colors hover:border-cyan-500 hover:bg-cyan-50">
                        <div>
                          <div className="font-bold text-slate-800 text-sm">{c.time}</div>
                          <div className="text-slate-400 text-xs mt-0.5">{instructor?.name} 강사</div>
                        </div>
                        <span className="text-xs font-medium text-cyan-600 bg-cyan-50 px-2.5 py-1 rounded-full border border-cyan-100">잔여 {remaining}자리</span>
                      </button>
                    ))}
                    {targetTimeCandidates.length === 0 && (
                      <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-xl text-sm">해당 날짜에 가능한 시간이 없습니다.</div>
                    )}
                  </div>
                </>
              )}

              {/* STEP (서류 필요): 서류 제출 폼 */}
              {rescheduleStep === 'doc-form' && sourceClass && (
                <div className="space-y-4">
                  <button onClick={() => setRescheduleStep('source')} className="flex items-center gap-1 text-slate-400 text-xs -mt-1 hover:text-slate-600">
                    <ChevronLeft className="w-3.5 h-3.5" /> 결석 날짜 다시 선택
                  </button>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-500">
                    결석: <strong className="text-slate-800">{format(parseISO(sourceClass.date), 'M월 d일 (E)', { locale: ko })} {sourceClass.time}</strong> — 진단서·장기 출장 등의 사유는 서류 제출 후 <strong className="text-slate-700">강사·학원 측 검토</strong>를 거쳐 보강 자리 배정 또는 다음 달 결제 이월로 처리돼요.
                  </div>

                  <div>
                    <p className="text-slate-700 text-sm font-semibold mb-2 flex items-center gap-1.5">
                      <Upload className="w-4 h-4 text-amber-500" />
                      {student?.category === 'adult' ? '의료 확인서 업로드' : '서류 업로드'}
                    </p>
                    {docPhoto ? (
                      <div className="relative">
                        <img src={docPhoto} className="w-full h-32 object-cover rounded-xl border border-slate-200" alt="document" />
                        <button onClick={() => setDocPhoto(null)} className="absolute top-2 right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center text-slate-500 shadow-sm">✕</button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                        <Upload className="w-5 h-5 text-slate-400 mb-1" />
                        <span className="text-slate-400 text-xs">파일 선택</span>
                        <input type="file" accept="image/*" className="hidden" onChange={handleDocUpload} />
                      </label>
                    )}
                  </div>

                  <div>
                    <p className="text-slate-700 text-sm font-semibold mb-2">사유 (선택)</p>
                    <textarea value={docReason} onChange={e => setDocReason(e.target.value)} rows={2}
                      placeholder="예: 2주간 해외 출장으로 결석"
                      className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm placeholder:text-slate-400 focus:outline-none focus:border-cyan-500 transition-colors resize-none" />
                  </div>

                  <div>
                    <p className="text-slate-700 text-sm font-semibold mb-2">원하시는 처리 방식</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => setPreferredResolution('makeup')}
                        className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border text-xs font-semibold transition-colors ${preferredResolution === 'makeup' ? 'bg-cyan-50 border-cyan-400 text-cyan-700' : 'bg-white border-slate-200 text-slate-500'}`}>
                        <CalendarClock className="w-4 h-4" /> 보강 신청
                      </button>
                      <button onClick={() => setPreferredResolution('carryover')}
                        className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border text-xs font-semibold transition-colors ${preferredResolution === 'carryover' ? 'bg-indigo-50 border-indigo-400 text-indigo-700' : 'bg-white border-slate-200 text-slate-500'}`}>
                        <Wallet className="w-4 h-4" /> 이월 신청
                      </button>
                    </div>
                    <p className="text-slate-400 text-[11px] mt-1.5">이월 신청 선택 시, 승인되면 다음 달 결제 금액에서 해당 회차만큼 차감돼요. 최종 처리 방식은 강사·학원 검토 후 확정돼요.</p>
                  </div>

                  <button onClick={handleSubmitDocRequest} disabled={!docPhoto}
                    className="w-full py-3.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-bold text-sm transition-colors">
                    승인 요청 제출하기
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── 결제하기 모달 ── */}
        {showCheckout && (
          <div className="absolute inset-0 bg-black/50 z-50 flex flex-col justify-end">
            <div className="bg-white rounded-t-3xl p-6 max-h-[85%] overflow-y-auto animate-slide-up-modal">
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-lg font-bold text-slate-800">결제하기</h3>
                <button onClick={() => setShowCheckout(false)} className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 text-sm font-bold">✕</button>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-500 mb-4 flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-slate-400" />
                <p>데모 화면이에요 — 실제 카드 결제(PG) 연동 전까지는 결제가 시뮬레이션으로만 처리돼요.</p>
              </div>

              <p className="text-slate-700 text-sm font-semibold mb-2">결제할 항목</p>
              <div className="space-y-2 mb-5">
                {myUnpaidRecords.map(r => (
                  <div key={r.id} className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
                    <div>
                      <p className="text-slate-800 text-sm font-medium">{enrollmentLabel(r.enrollmentId)}</p>
                      <p className="text-slate-400 text-xs mt-0.5">{r.billingMonth} 수강료</p>
                    </div>
                    <span className="text-slate-800 font-semibold text-sm">{(r.targetAmount - r.paidAmount).toLocaleString()}원</span>
                  </div>
                ))}
              </div>

              <p className="text-slate-700 text-sm font-semibold mb-2">결제 수단</p>
              <div className="grid grid-cols-3 gap-2 mb-6">
                {([['card', '카드'], ['kakaopay', '카카오페이'], ['naverpay', '네이버페이']] as const).map(([val, label]) => (
                  <button key={val} onClick={() => setPayMethod(val)}
                    className={`py-3 rounded-xl text-xs font-semibold border transition-colors ${payMethod === val ? 'bg-cyan-50 border-cyan-400 text-cyan-700' : 'bg-white border-slate-200 text-slate-500'}`}>
                    {label}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between mb-4 pt-4 border-t border-slate-100">
                <span className="text-slate-500 text-sm font-medium">총 결제금액</span>
                <span className="text-slate-900 text-xl font-bold">{myUnpaidTotal.toLocaleString()}원</span>
              </div>

              <button onClick={handleConfirmPayment}
                className="w-full py-3.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold text-sm transition-colors">
                {myUnpaidTotal.toLocaleString()}원 결제 확정하기
              </button>
            </div>
          </div>
        )}

        {/* Payment success toast */}
        {paySuccessId && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2 z-50 animate-zoom-in">
            <CheckCircle className="w-4 h-4 text-emerald-400" /> 결제가 완료되었어요.
          </div>
        )}

        {/* Doc request submitted toast */}
        {requestSubmitted && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2 z-50 animate-zoom-in">
            <CheckCircle className="w-4 h-4 text-emerald-400" /> 승인 요청을 제출했어요. 결과를 기다려주세요.
          </div>
        )}

        {/* Absence submitted toast */}
        {absenceSubmitted && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2 z-50 animate-zoom-in">
            <CheckCircle className="w-4 h-4 text-emerald-400" /> 결석 처리되었습니다.
          </div>
        )}

        {/* Bottom Navigation */}
        <div className="absolute bottom-0 w-full h-20 bg-white border-t border-slate-100 flex justify-around items-center px-6 pb-4 rounded-b-[2.5rem] z-10">
          <button onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center gap-1 ${activeTab === 'home' ? 'text-cyan-600' : 'text-slate-400'}`}>
            <CalendarIcon className="w-6 h-6" />
            <span className="text-[10px] font-medium">홈</span>
          </button>
          <button onClick={() => { setActiveTab('reschedule'); openReschedule(); }}
            className={`flex flex-col items-center gap-1 ${activeTab === 'reschedule' ? 'text-cyan-600' : 'text-slate-400'}`}>
            <RefreshCw className="w-6 h-6" />
            <span className="text-[10px] font-medium">보강 신청</span>
          </button>
          <button onClick={() => { setActiveTab('absence'); openAbsence(); }}
            className={`flex flex-col items-center gap-1 ${activeTab === 'absence' ? 'text-cyan-600' : 'text-slate-400'}`}>
            <XCircle className="w-6 h-6" />
            <span className="text-[10px] font-medium">결석</span>
          </button>
          <button onClick={() => setActiveTab('messages')}
            className={`flex flex-col items-center gap-1 ${activeTab === 'messages' ? 'text-cyan-600' : 'text-slate-400'}`}>
            <MessageCircle className="w-6 h-6" />
            <span className="text-[10px] font-medium">메시지</span>
          </button>
        </div>
      </div>
    </div>
  );
}
