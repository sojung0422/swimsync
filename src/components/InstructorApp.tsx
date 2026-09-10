import { useState, useEffect, useRef } from 'react';
import { useStore, getPrimaryContactPhone, teachesStudent, studentsForInstructor, getFreeInstructorsAt, getRoleGuideKeyForInstructor } from '../store/StoreContext';
import type { MakeupRequest, ClassSession, LeaveType } from '../store/StoreContext';
import {
  Calendar, Clock, Users, BookOpen, CheckCircle2, AlertCircle, UserCircle, RefreshCw,
  Wallet, CalendarClock, Image as ImageIcon, ChevronLeft, ChevronDown, ChevronUp, MessageCircle,
  MessageSquareText, BellRing, CalendarCheck, Repeat, Hand, Waves, Phone, Contact, Camera,
} from 'lucide-react';
import ChatThread from './ChatThread';
import { playBellSound } from '../lib/playBellSound';
import { format, addDays, addMonths, startOfWeek, isSameDay, isAfter, parseISO, differenceInCalendarDays } from 'date-fns';
import { ko } from 'date-fns/locale';

const LEAVE_LABEL: Record<LeaveType, string> = { annual: '연차', half: '반차', quarter: '반반차', unavailable: '근무 불가' };

const REQUEST_STATUS_META: Record<MakeupRequest['status'], { label: string; color: string }> = {
  pending:            { label: '승인 대기',   color: 'bg-amber-50 text-amber-700 border-amber-200' },
  approved_makeup:    { label: '보강 확정',   color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  approved_carryover: { label: '이월 처리',   color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  rejected:           { label: '거절됨',     color: 'bg-red-50 text-red-600 border-red-200' },
  cancelled_by_academy: { label: '학원이 취소함', color: 'bg-slate-100 text-slate-500 border-slate-200' },
};

const SKILL_SUGGESTIONS = ['자유형 발차기', '자유형 완영', '배영 25m', '배영 50m 완주', '평영 발차기', '평영 완영', '접영 도입', '호흡법 연습'];

// ─── 진도 및 특이사항 기록 화면 ────────────────────────────────────────────────

function ProgressRecordScreen({ cls, onClose }: { cls: ClassSession; onClose: () => void }) {
  const { students, instructors, updateStudent } = useStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [progressDraft, setProgressDraft] = useState('');
  const [notesDraft, setNotesDraft] = useState('');
  const [mediaDraft, setMediaDraft] = useState<{ url: string; kind: 'image' | 'video' }[]>([]);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [zoomMedia, setZoomMedia] = useState<string | null>(null);

  const instructor = instructors.find(i => i.id === cls.instructorId);
  const presentStudents = [...cls.studentIds, ...cls.makeupStudentIds]
    .filter(id => !cls.absentStudentIds.includes(id))
    .map(id => students.find(s => s.id === id))
    .filter((s): s is NonNullable<typeof s> => Boolean(s));

  const toggleEdit = (s: (typeof presentStudents)[number]) => {
    if (editingId === s.id) { setEditingId(null); return; }
    setEditingId(s.id);
    setProgressDraft(s.progress);
    setNotesDraft(s.notes);
    setMediaDraft(s.progressMedia ?? []);
  };

  const handleSave = (id: string) => {
    updateStudent(id, { progress: progressDraft, notes: notesDraft, progressMedia: mediaDraft });
    setEditingId(null);
    setSavedId(id);
    setTimeout(() => setSavedId(null), 1500);
  };

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const kind = file.type.startsWith('video/') ? 'video' : 'image';
    const reader = new FileReader();
    reader.onload = ev => setMediaDraft(prev => [...prev, { url: ev.target?.result as string, kind }]);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div className="absolute inset-0 bg-slate-50 z-30 flex flex-col">
      <div className="h-12 bg-white flex items-center justify-between px-6 text-xs font-semibold text-slate-800 shrink-0">
        <span>{format(new Date(), 'HH:mm')}</span>
        <div className="w-3.5 h-3.5 rounded-full bg-slate-800" />
      </div>
      <div className="px-4 py-4 bg-white border-b border-slate-100 flex items-center gap-3 shrink-0">
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 shrink-0">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-slate-800 font-bold text-[15px]">진도 및 특이사항 기록</h2>
          <p className="text-slate-400 text-xs mt-0.5">{format(parseISO(cls.date), 'M월 d일 (E)', { locale: ko })} {cls.time} · {instructor?.name} 강사</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {presentStudents.map(s => (
          <div key={s.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <button onClick={() => toggleEdit(s)}
              className="w-full flex items-center gap-3 p-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                {s.studentName[0]}
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-slate-800 text-sm font-semibold">{s.studentName}</p>
                <p className="text-slate-400 text-xs truncate flex items-center gap-1">
                  {s.progress || '진도 기록 없음'}
                  {!!s.progressMedia?.length && <span className="inline-flex items-center gap-0.5 text-cyan-500 shrink-0"><Camera className="w-3 h-3" />{s.progressMedia.length}</span>}
                </p>
              </div>
              {savedId === s.id ? (
                <span className="text-emerald-600 text-xs font-bold flex items-center gap-1 shrink-0"><CheckCircle2 className="w-3.5 h-3.5" /> 저장됨</span>
              ) : editingId === s.id ? (
                <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
              )}
            </button>

            {editingId === s.id && (
              <div className="px-4 pb-4 space-y-3 animate-fade-up">
                <div>
                  <p className="text-slate-500 text-xs font-medium mb-1.5">진도 현황</p>
                  <input value={progressDraft} onChange={e => setProgressDraft(e.target.value)}
                    placeholder="예: 자유형 발차기 완료"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-cyan-500 transition-colors" />
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {SKILL_SUGGESTIONS.map(skill => (
                      <button key={skill} onClick={() => setProgressDraft(skill)}
                        className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-cyan-50 text-cyan-700 border border-cyan-100 hover:bg-cyan-100 transition-colors">
                        {skill}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-slate-500 text-xs font-medium mb-1.5">특이사항</p>
                  <textarea value={notesDraft} onChange={e => setNotesDraft(e.target.value)} rows={3}
                    placeholder="예: 물을 조금 무서워함, 호흡 교정 필요"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-cyan-500 transition-colors resize-none" />
                </div>
                <div>
                  <p className="text-slate-500 text-xs font-medium mb-1.5">사진/영상 첨부</p>
                  <div className="flex flex-wrap gap-2">
                    {mediaDraft.map((m, i) => (
                      <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-200 shrink-0">
                        {m.kind === 'image'
                          ? <button onClick={() => setZoomMedia(m.url)} className="w-full h-full"><img src={m.url} className="w-full h-full object-cover" alt="진도 첨부" /></button>
                          : <video src={m.url} className="w-full h-full object-cover" controls />}
                        <button onClick={() => setMediaDraft(prev => prev.filter((_, idx) => idx !== i))}
                          className="absolute top-0.5 right-0.5 w-4 h-4 bg-black/60 rounded-full text-white text-[9px] flex items-center justify-center">✕</button>
                      </div>
                    ))}
                    <label className="w-16 h-16 rounded-lg border-2 border-dashed border-slate-200 flex items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors shrink-0">
                      <Camera className="w-4 h-4 text-slate-400" />
                      <input type="file" accept="image/*,video/*" className="hidden" onChange={handleMediaUpload} />
                    </label>
                  </div>
                </div>
                <button onClick={() => handleSave(s.id)}
                  className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold text-sm transition-colors">
                  저장
                </button>
              </div>
            )}
          </div>
        ))}
        {presentStudents.length === 0 && (
          <div className="text-center py-12 text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200 text-sm">
            참석 예정 학생이 없습니다.
          </div>
        )}
      </div>

      {zoomMedia && (
        <div className="absolute inset-0 bg-black/70 z-40 flex items-center justify-center p-6" onClick={() => setZoomMedia(null)}>
          <img src={zoomMedia} className="max-w-full max-h-full rounded-xl shadow-2xl" alt="진도 첨부 확대" />
        </div>
      )}
    </div>
  );
}

// ─── 정기 상담 기록 화면 ────────────────────────────────────────────────────────

function CounselingScreen({ studentId, instructorId, onClose }: { studentId: string; instructorId: string; onClose: () => void }) {
  const { students, counselingRecords, addCounselingRecord, settings } = useStore();
  const student = students.find(s => s.id === studentId);
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [content, setContent] = useState('');
  const [media, setMedia] = useState<{ url: string; kind: 'image' | 'video' }[]>([]);
  const [saved, setSaved] = useState(false);
  const [zoomMedia, setZoomMedia] = useState<string | null>(null);

  const records = counselingRecords.filter(c => c.studentId === studentId).sort((a, b) => b.date.localeCompare(a.date));
  const lastRecord = records[0];
  const nextDue = lastRecord ? format(addMonths(parseISO(lastRecord.date), settings.counselingIntervalMonths), 'yyyy-MM-dd') : null;
  const isOverdue = !nextDue || isAfter(new Date(), parseISO(nextDue));

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const kind = file.type.startsWith('video/') ? 'video' : 'image';
    const reader = new FileReader();
    reader.onload = ev => setMedia(prev => [...prev, { url: ev.target?.result as string, kind }]);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSave = () => {
    if (!content.trim()) return;
    addCounselingRecord({ studentId, instructorId, date, content: content.trim(), media });
    setContent('');
    setMedia([]);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div className="absolute inset-0 bg-slate-50 z-30 flex flex-col">
      <div className="h-12 bg-white flex items-center justify-between px-6 text-xs font-semibold text-slate-800 shrink-0">
        <span>{format(new Date(), 'HH:mm')}</span>
        <div className="w-3.5 h-3.5 rounded-full bg-slate-800" />
      </div>
      <div className="px-4 py-4 bg-white border-b border-slate-100 flex items-center gap-3 shrink-0">
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 shrink-0">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-slate-800 font-bold text-[15px]">{student?.studentName} 상담 기록</h2>
          <p className="text-slate-400 text-xs mt-0.5">정기 상담 주기: {settings.counselingIntervalMonths}개월마다</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className={`rounded-2xl p-4 border ${isOverdue ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'}`}>
          <p className={`text-xs font-semibold ${isOverdue ? 'text-amber-700' : 'text-emerald-700'}`}>
            {lastRecord ? `최근 상담일: ${lastRecord.date}` : '아직 상담 기록이 없어요'}
          </p>
          <p className={`text-xs mt-1 ${isOverdue ? 'text-amber-600' : 'text-emerald-600'}`}>
            {nextDue ? `다음 상담 예정: ${nextDue}${isOverdue ? ' (기한 지남, 상담 필요)' : ''}` : '상담을 진행하면 다음 예정일이 자동으로 계산돼요.'}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-3">
          <p className="text-slate-700 text-sm font-semibold">새 상담 기록 작성</p>
          <div>
            <p className="text-slate-500 text-xs font-medium mb-1.5">상담일</p>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-cyan-500 transition-colors" />
          </div>
          <div>
            <p className="text-slate-500 text-xs font-medium mb-1.5">상담 내용(일지)</p>
            <textarea value={content} onChange={e => setContent(e.target.value)} rows={4}
              placeholder="예: 물에 대한 두려움 감소, 발차기 자세 교정 진행 중. 가정 내 연습 방법 안내함."
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-cyan-500 transition-colors resize-none" />
          </div>
          <div>
            <p className="text-slate-500 text-xs font-medium mb-1.5">사진/영상 첨부</p>
            <div className="flex flex-wrap gap-2">
              {media.map((m, i) => (
                <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-200 shrink-0">
                  {m.kind === 'image'
                    ? <button onClick={() => setZoomMedia(m.url)} className="w-full h-full"><img src={m.url} className="w-full h-full object-cover" alt="상담 첨부" /></button>
                    : <video src={m.url} className="w-full h-full object-cover" controls />}
                  <button onClick={() => setMedia(prev => prev.filter((_, idx) => idx !== i))}
                    className="absolute top-0.5 right-0.5 w-4 h-4 bg-black/60 rounded-full text-white text-[9px] flex items-center justify-center">✕</button>
                </div>
              ))}
              <label className="w-16 h-16 rounded-lg border-2 border-dashed border-slate-200 flex items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors shrink-0">
                <Camera className="w-4 h-4 text-slate-400" />
                <input type="file" accept="image/*,video/*" className="hidden" onChange={handleMediaUpload} />
              </label>
            </div>
          </div>
          <button onClick={handleSave} disabled={!content.trim()}
            className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2">
            {saved ? <><CheckCircle2 className="w-4 h-4" /> 저장됨</> : '상담 기록 저장'}
          </button>
        </div>

        <div className="space-y-2">
          <p className="text-slate-500 text-xs font-semibold px-1">지난 상담 기록 ({records.length}건)</p>
          {records.map(r => (
            <div key={r.id} className="bg-white rounded-2xl border border-slate-100 p-4">
              <p className="text-slate-800 text-xs font-bold">{r.date}</p>
              <p className="text-slate-600 text-sm mt-1.5 leading-relaxed whitespace-pre-wrap">{r.content}</p>
              {!!r.media?.length && (
                <div className="flex gap-1.5 mt-2 flex-wrap">
                  {r.media.map((m, i) => (
                    m.kind === 'image' ? (
                      <button key={i} onClick={() => setZoomMedia(m.url)} className="shrink-0">
                        <img src={m.url} className="w-14 h-14 rounded-lg object-cover border border-slate-200" alt="상담 첨부" />
                      </button>
                    ) : (
                      <video key={i} src={m.url} className="w-14 h-14 rounded-lg object-cover border border-slate-200 shrink-0" controls />
                    )
                  ))}
                </div>
              )}
            </div>
          ))}
          {records.length === 0 && (
            <div className="text-center py-8 text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200 text-sm">
              작성된 상담 기록이 없습니다.
            </div>
          )}
        </div>
      </div>

      {zoomMedia && (
        <div className="absolute inset-0 bg-black/70 z-40 flex items-center justify-center p-6" onClick={() => setZoomMedia(null)}>
          <img src={zoomMedia} className="max-w-full max-h-full rounded-xl shadow-2xl" alt="상담 첨부 확대" />
        </div>
      )}
    </div>
  );
}

export default function InstructorApp() {
  const {
    classes, students, instructors, makeupRequests, messages, settings, counselingRecords, makeupCancellations,
    withdrawalRequests, approveWithdrawalRequest, rejectWithdrawalRequest,
    returnRequests, approveReturnRequest, rejectReturnRequest,
    leaveRequests, submitLeaveRequest, subRequests, submitSubRequest, acceptSubRequest, freeSwimBookings, instructorNotices,
    substituteMakeupDays, notifications,
  } = useStore();
  const [activeTab, setActiveTab] = useState<'schedule' | 'students' | 'requests' | 'messages' | 'contacts'>('schedule');
  const [requestsSubTab, setRequestsSubTab] = useState<'makeup' | 'leave' | 'sub'>('makeup');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDoc, setShowDoc] = useState<string | null>(null);
  const [progressClassId, setProgressClassId] = useState<string | null>(null);
  const [activeThreadStudentId, setActiveThreadStudentId] = useState<string | null>(null);
  const [counselingStudentId, setCounselingStudentId] = useState<string | null>(null);
  const [leaveDate, setLeaveDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [leaveType, setLeaveType] = useState<LeaveType>('annual');
  const [leaveTimeRange, setLeaveTimeRange] = useState<'am' | 'pm'>('am');
  const [leaveReason, setLeaveReason] = useState('');
  const [leaveError, setLeaveError] = useState<string | null>(null);
  const [leaveSaved, setLeaveSaved] = useState(false);
  const [subReasonDraft, setSubReasonDraft] = useState<Record<string, string>>({});
  const [subActionError, setSubActionError] = useState<string | null>(null);

  const instructorId = 'i1';
  const instructor = instructors.find(i => i.id === instructorId);
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
  const myClasses = classes.filter(c => c.instructorId === instructorId && c.date === selectedDateStr);

  // 내가 담당하는 자유수영 시간대에, 선택한 날짜에 예약된 회원
  const myFreeSwimSlotIds = new Set(settings.freeSwimSlots.filter(s => s.instructorId === instructorId).map(s => s.id));
  const myFreeSwimBookingsToday = freeSwimBookings.filter(b => b.status === 'booked' && b.date === selectedDateStr && myFreeSwimSlotIds.has(b.slotId));

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 0 });
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));

  // 기본반뿐 아니라 추가로 등록한 반(다중 반)에서 이 강사를 담당으로 두고 있는 경우도 "내 강습생"에 포함
  const myStudents = studentsForInstructor(instructorId, students);

  // 내 강습생들의 보강·이월 요청 (운영 웹 "보강 요청 관리"에서 승인/거절 처리, 여기서는 확인용)
  const myStudentIds = new Set(students.filter(s => teachesStudent(instructorId, s)).map(s => s.id));
  const myRequests = makeupRequests.filter(r => myStudentIds.has(r.studentId)).slice().reverse();
  const myPendingRequestCount = myRequests.filter(r => r.status === 'pending').length;

  // 연차/근무불가 신청
  const myLeaveRequests = leaveRequests.filter(r => r.instructorId === instructorId).slice().reverse();
  const remainingLeave = instructor ? instructor.annualLeaveTotal - instructor.annualLeaveUsed : 0;

  // 대타 — 내가 요청한 것 / 내가 수락 가능한 다른 강사의 열린 요청
  const myUpcomingClasses = classes.filter(c => c.instructorId === instructorId && c.date >= todayStr).sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
  const mySubRequests = subRequests.filter(r => r.requestingInstructorId === instructorId).slice().reverse();
  const openSubRequestsForMe = subRequests.filter(r =>
    r.status === 'open' && r.requestingInstructorId !== instructorId &&
    getFreeInstructorsAt(r.date, r.time, instructors, classes, r.requestingInstructorId).some(i => i.id === instructorId)
  );
  const urgentSubCount = openSubRequestsForMe.filter(r => differenceInCalendarDays(parseISO(r.date), new Date()) <= 2).length;

  // 내 강습생의 퇴원/복귀 요청 — 확인해야 최종 처리(퇴원) 또는 신규로 받기(복귀)가 가능함
  const myPendingWithdrawals = withdrawalRequests.filter(r => myStudentIds.has(r.studentId) && r.status === 'pending');
  const myPendingReturns = returnRequests.filter(r => myStudentIds.has(r.studentId) && r.status === 'pending');
  const lifecycleBellRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    const unplayed = [...myPendingWithdrawals, ...myPendingReturns].filter(r => !lifecycleBellRef.current.has(r.id));
    if (unplayed.length > 0) {
      playBellSound();
      unplayed.forEach(r => lifecycleBellRef.current.add(r.id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myPendingWithdrawals.map(r => r.id).join(','), myPendingReturns.map(r => r.id).join(',')]);

  // 학원이 자리 사정(신규/체험 문의 등)으로 취소한, 내가 맡았던 보강 — 벨소리 알림
  const myCancelledMakeups = makeupCancellations.filter(n => classes.find(c => c.id === n.classId)?.instructorId === instructorId);
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

  // 반변경 신청/승인 안내 — 담당 학생이 내게서 나가거나(전) 내게로 새로 배정될 때(후) 표시됨
  const myInstructorNotices = instructorNotices.filter(n => n.instructorId === instructorId).slice().reverse();
  const noticeBellRef = useRef<Set<string>>(new Set());
  const [dismissedNoticeIds, setDismissedNoticeIds] = useState<Set<string>>(new Set());
  useEffect(() => {
    const unplayed = myInstructorNotices.filter(n => !noticeBellRef.current.has(n.id));
    if (unplayed.length > 0) {
      playBellSound();
      unplayed.forEach(n => noticeBellRef.current.add(n.id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myInstructorNotices.map(n => n.id).join(',')]);
  const visibleInstructorNotices = myInstructorNotices.filter(n => !dismissedNoticeIds.has(n.id));

  // 내 수업에 새로 배정된 보강 학생 (학부모가 예약하거나 운영진이 승인하는 즉시 여기 반영됨) — 오늘 이후
  const upcomingMakeupEntries = classes
    .filter(c => c.instructorId === instructorId && c.date >= todayStr && c.makeupStudentIds.length > 0)
    .flatMap(c => c.makeupStudentIds.map(studentId => ({ cls: c, student: students.find(s => s.id === studentId) })))
    .filter((x): x is { cls: typeof classes[number]; student: NonNullable<typeof x.student> } => Boolean(x.student))
    .sort((a, b) => a.cls.date.localeCompare(b.cls.date) || a.cls.time.localeCompare(b.cls.time));

  return (
    <div className="flex items-center justify-center h-full bg-slate-100 p-8">
      <div className="w-[390px] h-[844px] bg-white rounded-[3rem] shadow-2xl border-[8px] border-slate-800 overflow-hidden relative flex flex-col">

        {/* Status Bar */}
        <div className="h-12 bg-white flex items-center justify-between px-6 text-xs font-semibold text-slate-800 shrink-0">
          <span>{format(new Date(), 'HH:mm')}</span>
          <div className="w-3.5 h-3.5 rounded-full bg-slate-800" />
        </div>

        {/* App Content */}
        {activeTab === 'contacts' ? (
          <div className="flex-1 overflow-y-auto pb-20 bg-slate-50 px-4 py-5">
            <h2 className="text-[15px] font-bold text-slate-800 px-1 mb-3">비상 연락망</h2>
            <div className="space-y-2">
              {instructors.filter(i => i.status === 'active').map(i => (
                <div key={i.id} className="bg-white rounded-2xl p-4 border border-slate-100 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0" style={{ backgroundColor: i.color || '#0891b2' }}>
                    {i.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-slate-800 text-sm font-semibold">{i.name}</p>
                      <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">{i.role}</span>
                    </div>
                    <p className="text-slate-400 text-xs mt-0.5">
                      {i.phone || '휴대폰 미등록'}{i.officePhone && ` · 원내 ${i.officePhone}${i.extNumber ? `(${i.extNumber})` : ''}`}
                    </p>
                  </div>
                  {i.phone && (
                    <a href={`tel:${i.phone}`} className="w-9 h-9 rounded-full bg-cyan-50 text-cyan-600 flex items-center justify-center shrink-0">
                      <Phone className="w-4 h-4" />
                    </a>
                  )}
                </div>
              ))}
              {instructors.filter(i => i.status === 'active').length === 0 && (
                <div className="text-center py-12 text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200 text-sm">
                  등록된 직원이 없습니다.
                </div>
              )}
            </div>

            {(() => {
              const myStaffNotices = notifications
                .filter(n => n.recipientType === 'staff' && n.sentAt !== null && n.recipientIds.includes(instructorId))
                .slice().sort((a, b) => (b.sentAt ?? '').localeCompare(a.sentAt ?? ''));
              if (myStaffNotices.length === 0) return null;
              return (
                <div className="mt-5">
                  <h2 className="text-[15px] font-bold text-slate-800 px-1 mb-3">학원 공지</h2>
                  <div className="bg-white rounded-2xl p-4 border border-slate-100 divide-y divide-slate-50">
                    {myStaffNotices.map(n => (
                      <div key={n.id} className="py-2.5 first:pt-0 last:pb-0">
                        <p className="text-slate-800 text-sm font-semibold">{n.title}</p>
                        <p className="text-slate-500 text-xs mt-0.5 leading-relaxed">{n.content}</p>
                        <p className="text-slate-300 text-[10.5px] mt-1">{n.sentAt}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {(() => {
              const myGuideKey = instructor ? getRoleGuideKeyForInstructor(instructor) : null;
              const myRoleGuide = settings.roleGuides.find(rg => rg.role === myGuideKey);
              if (!myRoleGuide || myRoleGuide.tasks.length === 0) return null;
              return (
                <div className="mt-5">
                  <h2 className="text-[15px] font-bold text-slate-800 px-1 mb-3">내 업무 ({myRoleGuide.role})</h2>
                  <div className="bg-white rounded-2xl p-4 border border-slate-100 space-y-2">
                    {myRoleGuide.tasks.map(task => (
                      <div key={task.id} className="flex items-center gap-2 text-sm text-slate-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 shrink-0" />
                        {task.text}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {(settings.closedDates.length > 0 || substituteMakeupDays.some(d => d.status === 'confirmed')) && (
              <div className="mt-5">
                <h2 className="text-[15px] font-bold text-slate-800 px-1 mb-3">연간 휴관일·대체보강일</h2>
                <div className="bg-white rounded-2xl p-4 border border-slate-100 space-y-2">
                  {settings.closedDates.slice().sort().map(d => (
                    <div key={d} className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">{d}</span>
                      <span className="text-slate-400 font-medium">휴관일</span>
                    </div>
                  ))}
                  {substituteMakeupDays.filter(d => d.status === 'confirmed').slice().sort((a, b) => a.date.localeCompare(b.date)).map(d => (
                    <div key={d.id} className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">{d.date} ({d.weekday}요일)</span>
                      <span className="text-cyan-600 font-medium">{d.coversMonth} 대체보강일</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : activeTab === 'messages' ? (
          <div className="flex-1 overflow-hidden pb-20 flex flex-col bg-slate-50">
            {activeThreadStudentId ? (() => {
              const s = students.find(st => st.id === activeThreadStudentId);
              return (
                <>
                  <div className="shrink-0 bg-white border-b border-slate-100 px-3 py-2.5 flex items-center gap-2">
                    <button onClick={() => setActiveThreadStudentId(null)} className="p-1.5 text-slate-500 hover:text-slate-800 transition-colors">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-xs text-slate-400">메시지 목록으로</span>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <ChatThread
                      studentId={activeThreadStudentId}
                      viewerRole="instructor"
                      counterpartName={s?.parentName || `${s?.studentName ?? ''} 학부모`}
                      counterpartSubtitle={`${s?.studentName ?? ''} 학생 학부모`}
                      counterpartPhone={s ? getPrimaryContactPhone(s) : undefined}
                    />
                  </div>
                </>
              );
            })() : (
              <div className="flex-1 overflow-y-auto px-4 py-5">
                <h2 className="text-[15px] font-bold text-slate-800 px-1 mb-3">메시지 ({myStudents.length})</h2>
                <div className="space-y-2">
                  {myStudents.map(s => {
                    const thread = messages.filter(m => m.studentId === s.id);
                    const last = thread[thread.length - 1];
                    return (
                      <button key={s.id} onClick={() => setActiveThreadStudentId(s.id)}
                        className="w-full text-left bg-white rounded-2xl p-4 border border-slate-100 flex items-center gap-3 hover:border-cyan-200 transition-colors">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                          {s.studentName[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-slate-800 text-sm font-semibold">{s.parentName || `${s.studentName} 학부모`}</p>
                          <p className="text-slate-400 text-xs truncate">{last ? last.text : '아직 대화가 없어요 — 눌러서 시작해보세요'}</p>
                        </div>
                      </button>
                    );
                  })}
                  {myStudents.length === 0 && (
                    <div className="text-center py-12 text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200 text-sm">
                      배정된 강습생이 없습니다.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
        <div className="flex-1 overflow-y-auto pb-20 bg-slate-50">
          {/* Header with week strip */}
          <div className="text-white px-6 pt-4 pb-5 rounded-b-3xl shadow-md" style={{ background: 'linear-gradient(135deg,#0891b2,#3b82f6)' }}>
            <div className="flex justify-between items-center mb-4">
              <div>
                <p className="text-white/80 text-xs">강사 앱</p>
                <div className="flex items-center gap-2">
                  <h1 className="text-[18px] font-bold">{instructor?.name} 강사님</h1>
                </div>
              </div>
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <UserCircle className="w-6 h-6" />
              </div>
            </div>

            {/* Week strip */}
            <div className="flex justify-between items-center bg-white/15 rounded-xl p-2">
              {weekDays.map(day => {
                const isSelected = isSameDay(day, selectedDate);
                const dayClasses = classes.filter(c => c.instructorId === instructorId && c.date === format(day, 'yyyy-MM-dd'));
                return (
                  <button key={day.toISOString()} onClick={() => setSelectedDate(day)}
                    className={`flex flex-col items-center p-2 rounded-xl w-10 transition-colors ${isSelected ? 'bg-white shadow-sm' : 'hover:bg-white/10'}`}>
                    <span className={`text-[10px] mb-1 ${isSelected ? 'text-cyan-600' : 'text-blue-100'}`}>{format(day, 'E', { locale: ko })}</span>
                    <span className={`font-bold text-sm ${isSelected ? 'text-cyan-700' : 'text-white'}`}>{format(day, 'd')}</span>
                    {dayClasses.length > 0 && (
                      <div className={`w-1.5 h-1.5 rounded-full mt-1 ${isSelected ? 'bg-cyan-500' : 'bg-white/60'}`} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="px-4 py-5">
            {activeTab === 'schedule' ? (
              <div className="space-y-4">
                {visibleInstructorNotices.map(n => (
                  <div key={n.id} className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 flex items-start gap-3">
                    <Repeat className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-indigo-700 text-sm font-bold">{n.title}</p>
                      <p className="text-indigo-600 text-xs mt-1 leading-relaxed">{n.content}</p>
                      <button onClick={() => setDismissedNoticeIds(prev => new Set(prev).add(n.id))}
                        className="text-xs font-semibold text-indigo-500 hover:text-indigo-700 mt-2 transition-colors">
                        확인했어요
                      </button>
                    </div>
                  </div>
                ))}
                {visibleCancelledMakeups.map(r => {
                  const student = students.find(s => s.id === r.studentId);
                  const cls = classes.find(c => c.id === r.classId);
                  return (
                    <div key={r.id} className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
                      <BellRing className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-red-700 text-sm font-bold">보강 일정이 취소됐어요</p>
                        <p className="text-red-600 text-xs mt-1 leading-relaxed">
                          {student?.studentName ?? '학생'} — {cls ? `${format(parseISO(cls.date), 'M월 d일 (E)', { locale: ko })} ${cls.time}` : ''} 보강이 학원 사정(신규/체험 문의 등)으로 취소됐어요.
                        </p>
                        <button onClick={() => setDismissedCancelIds(prev => new Set(prev).add(r.id))}
                          className="text-xs font-semibold text-red-500 hover:text-red-700 mt-2 transition-colors">
                          확인했어요
                        </button>
                      </div>
                    </div>
                  );
                })}
                {upcomingMakeupEntries.length > 0 && (
                  <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-2.5">
                      <AlertCircle className="w-4 h-4 text-orange-500 shrink-0" />
                      <span className="text-orange-700 text-sm font-bold">새로 배정된 보강 학생 {upcomingMakeupEntries.length}건</span>
                    </div>
                    <div className="space-y-1.5">
                      {upcomingMakeupEntries.slice(0, 4).map(({ cls, student }) => (
                        <button key={`${cls.id}-${student.id}`} onClick={() => setSelectedDate(parseISO(cls.date))}
                          className="w-full flex items-center justify-between bg-white rounded-xl px-3 py-2 border border-orange-100 hover:bg-orange-50/60 transition-colors">
                          <span className="text-slate-800 text-xs font-semibold">{student.studentName}</span>
                          <span className="text-slate-400 text-[11px]">{format(parseISO(cls.date), 'M/d (E)', { locale: ko })} {cls.time}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {myFreeSwimBookingsToday.length > 0 && (
                  <div className="bg-cyan-50 border border-cyan-200 rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-2.5">
                      <Waves className="w-4 h-4 text-cyan-600 shrink-0" />
                      <span className="text-cyan-700 text-sm font-bold">오늘의 자유수영 예약 {myFreeSwimBookingsToday.length}건</span>
                    </div>
                    <div className="space-y-1.5">
                      {myFreeSwimBookingsToday.map(b => {
                        const student = students.find(s => s.id === b.studentId);
                        const slot = settings.freeSwimSlots.find(s => s.id === b.slotId);
                        return (
                          <div key={b.id} className="flex items-center justify-between bg-white rounded-xl px-3 py-2 border border-cyan-100">
                            <span className="text-slate-800 text-xs font-semibold">{student?.studentName ?? '알 수 없음'}</span>
                            <span className="text-slate-400 text-[11px]">{slot?.startTime}~{slot?.endTime}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center px-1">
                  <h2 className="text-[15px] font-bold text-slate-800">{format(selectedDate, 'M월 d일 (E)', { locale: ko })} 강습</h2>
                  <span className="text-cyan-600 text-xs font-semibold bg-cyan-50 px-2.5 py-1 rounded-full">총 {myClasses.length}건</span>
                </div>

                {myClasses.map(cls => {
                  const presentStudents = [...cls.studentIds, ...cls.makeupStudentIds]
                    .filter(id => !cls.absentStudentIds.includes(id))
                    .map(id => students.find(s => s.id === id))
                    .filter(Boolean) as typeof students;
                  const absentStudents = cls.absentStudentIds
                    .map(id => students.find(s => s.id === id))
                    .filter(Boolean) as typeof students;
                  const hasMakeup = cls.makeupStudentIds.length > 0;

                  return (
                    <div key={cls.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-cyan-600" />
                          <span className="font-bold text-slate-800 text-lg">{cls.time}</span>
                        </div>
                        <span className="bg-slate-100 text-slate-600 text-xs px-2.5 py-1 rounded-full font-medium">{presentStudents.length}명 참석</span>
                      </div>

                      {hasMakeup && (
                        <div className="mb-4 bg-orange-50 border border-orange-100 rounded-xl p-3 flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
                          <p className="text-xs text-orange-700"><strong>보강 학생</strong>이 있습니다.</p>
                        </div>
                      )}

                      <div className="space-y-2">
                        {presentStudents.map(student => (
                          <div key={student.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                                {student.studentName.charAt(0)}
                              </div>
                              <div>
                                <div className="font-medium text-slate-800 text-sm flex items-center gap-1.5">
                                  <span>{student.studentName}</span>
                                  {cls.makeupStudentIds.includes(student.id) && (
                                    <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-bold">보강</span>
                                  )}
                                </div>
                                <div className="text-xs text-slate-400">{student.level}</div>
                              </div>
                            </div>
                            <button onClick={() => setProgressClassId(cls.id)}
                              title="진도 및 특이사항 기록하기"
                              className="text-cyan-600 p-2 hover:bg-cyan-50 rounded-full transition-colors">
                              <BookOpen className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                        {absentStudents.map(student => (
                          <div key={student.id} className="flex items-center p-3 bg-red-50 rounded-xl opacity-60">
                            <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center text-red-700 text-sm font-bold shrink-0">
                              {student.studentName.charAt(0)}
                            </div>
                            <div className="ml-3 flex items-center gap-2">
                              <span className="line-through text-red-600 text-sm font-medium">{student.studentName}</span>
                              <span className="text-[10px] bg-red-200 text-red-700 px-1.5 py-0.5 rounded font-bold">결석</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 flex items-center gap-2">
                        <button onClick={() => setProgressClassId(cls.id)}
                          className="flex-1 py-2.5 bg-cyan-50 text-cyan-700 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 hover:bg-cyan-100 transition-colors">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>진도 및 특이사항 기록하기</span>
                        </button>
                      </div>
                    </div>
                  );
                })}

                {myClasses.length === 0 && (
                  <div className="text-center py-12 text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200 text-sm">
                    해당 일자에 예정된 강습이 없습니다.
                  </div>
                )}
              </div>
            ) : activeTab === 'students' ? (
              <div className="space-y-3">
                {myPendingReturns.map(r => {
                  const s = students.find(st => st.id === r.studentId);
                  return (
                    <div key={r.id} className="bg-cyan-50 border border-cyan-200 rounded-2xl p-4">
                      <p className="text-cyan-800 text-sm font-bold">복귀 신청 확인 필요</p>
                      <p className="text-cyan-600 text-xs mt-1">{s?.studentName} — 희망 복귀일 {r.requestedReturnDate} {r.hasSeatAvailable ? '(자리 있음)' : '(정원 초과 주의)'}</p>
                      <div className="flex gap-2 mt-2.5">
                        <button onClick={() => approveReturnRequest(r.id)} className="text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-700 px-3 py-1.5 rounded-lg transition-colors">확인 후 신규로 받기</button>
                        <button onClick={() => rejectReturnRequest(r.id)} className="text-xs font-semibold text-cyan-600 hover:text-cyan-800 px-2 py-1.5 transition-colors">거절</button>
                      </div>
                    </div>
                  );
                })}
                {myPendingWithdrawals.map(r => {
                  const s = students.find(st => st.id === r.studentId);
                  return (
                    <div key={r.id} className="bg-red-50 border border-red-200 rounded-2xl p-4">
                      <p className="text-red-700 text-sm font-bold">퇴원 요청 확인 필요</p>
                      <p className="text-red-600 text-xs mt-1">{s?.studentName} — 사유: {r.reason || '-'}</p>
                      <div className="flex gap-2 mt-2.5">
                        <button onClick={() => approveWithdrawalRequest(r.id)} className="text-xs font-semibold text-white bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded-lg transition-colors">확인 후 퇴원 처리</button>
                        <button onClick={() => rejectWithdrawalRequest(r.id)} className="text-xs font-semibold text-red-500 hover:text-red-700 px-2 py-1.5 transition-colors">거절</button>
                      </div>
                    </div>
                  );
                })}
                <h2 className="text-[15px] font-bold text-slate-800 px-1">내 강습생 ({myStudents.length}명)</h2>
                {myStudents.map(s => {
                  const myRecords = counselingRecords.filter(c => c.studentId === s.id && c.instructorId === instructorId);
                  const lastRecord = myRecords.slice().sort((a, b) => b.date.localeCompare(a.date))[0];
                  const nextDue = lastRecord ? format(addMonths(parseISO(lastRecord.date), settings.counselingIntervalMonths), 'yyyy-MM-dd') : null;
                  const isOverdue = !nextDue || isAfter(new Date(), parseISO(nextDue));
                  return (
                  <div key={s.id} className="bg-white rounded-2xl p-4 border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                        {s.studentName[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-800 text-sm font-semibold">{s.studentName}</p>
                        <p className="text-slate-400 text-xs">{s.level} · {s.regularDays.join('·')} {s.regularTime}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full border shrink-0 ${s.level === '초급' ? 'bg-blue-50 text-blue-700 border-blue-200' : s.level === '중급' ? 'bg-violet-50 text-violet-700 border-violet-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                        {s.level}
                      </span>
                    </div>
                    <button onClick={() => setCounselingStudentId(s.id)}
                      className={`w-full mt-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${isOverdue ? 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100' : 'bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100'}`}>
                      <MessageSquareText className="w-3.5 h-3.5" />
                      {lastRecord ? `최근 상담 ${lastRecord.date}${isOverdue ? ' · 상담 필요' : ''}` : '상담 기록 없음 · 상담 필요'}
                    </button>
                  </div>
                  );
                })}
                {myStudents.length === 0 && (
                  <div className="text-center py-12 text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200 text-sm">
                    배정된 강습생이 없습니다.
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
                  {([['makeup', '보강·이월'], ['leave', '연차·근무'], ['sub', '대타']] as const).map(([val, label]) => (
                    <button key={val} onClick={() => setRequestsSubTab(val)}
                      className={`relative flex-1 py-2 rounded-lg text-xs font-semibold transition-colors ${requestsSubTab === val ? 'bg-white text-cyan-700 shadow-sm' : 'text-slate-500'}`}>
                      {label}
                      {val === 'sub' && urgentSubCount > 0 && (
                        <span className="absolute -top-1.5 -right-1 w-4 h-4 rounded-full bg-orange-500 text-white text-[9px] font-bold flex items-center justify-center">{urgentSubCount}</span>
                      )}
                    </button>
                  ))}
                </div>

                {requestsSubTab === 'makeup' && (
                  <div className="space-y-3">
                    <h2 className="text-[15px] font-bold text-slate-800 px-1">내 강습생 보강·이월 요청 ({myRequests.length}건)</h2>
                    <p className="text-slate-400 text-xs px-1 -mt-2">최종 승인/거절은 운영 웹 "보강 요청 관리"에서 처리돼요. 여기서는 확인만 가능해요.</p>
                    {myRequests.map(r => {
                      const student = students.find(s => s.id === r.studentId);
                      const meta = REQUEST_STATUS_META[r.status];
                      return (
                        <div key={r.id} className="bg-white rounded-2xl p-4 border border-slate-100">
                          <div className="flex items-start gap-3">
                            <button onClick={() => setShowDoc(r.docPhoto)}
                              className="w-11 h-11 rounded-xl overflow-hidden border border-slate-200 shrink-0 bg-slate-50 flex items-center justify-center">
                              {r.docPhoto ? <img src={r.docPhoto} className="w-full h-full object-cover" alt="서류" /> : <ImageIcon className="w-4 h-4 text-slate-300" />}
                            </button>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <p className="text-slate-800 text-sm font-semibold">{student?.studentName ?? '알 수 없음'}</p>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${meta.color}`}>{meta.label}</span>
                              </div>
                              <p className="text-slate-400 text-[11px] mt-1 flex items-center gap-1">
                                {r.preferredResolution === 'carryover' ? <><Wallet className="w-3 h-3" /> 학부모 희망: 이월</> : <><CalendarClock className="w-3 h-3" /> 학부모 희망: 보강</>}
                              </p>
                              {r.reason && <p className="text-slate-500 text-xs mt-1">사유: {r.reason}</p>}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {myRequests.length === 0 && (
                      <div className="text-center py-12 text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200 text-sm">
                        접수된 보강·이월 요청이 없습니다.
                      </div>
                    )}
                  </div>
                )}

                {requestsSubTab === 'leave' && (
                  <div className="space-y-4">
                    <div className="bg-white rounded-2xl p-4 border border-slate-100 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-slate-800 text-sm font-semibold">{settings.annualLeaveEnabled ? '연차·근무불가 신청' : '근무 조정 신청'}</p>
                        {instructor?.type === '정규' && settings.annualLeaveEnabled && (
                          <span className="text-cyan-600 text-xs font-semibold bg-cyan-50 px-2.5 py-1 rounded-full">잔여 연차 {remainingLeave}일</span>
                        )}
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs font-medium mb-1.5">날짜</p>
                        <input type="date" value={leaveDate} onChange={e => setLeaveDate(e.target.value)}
                          className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-cyan-500 transition-colors" />
                      </div>
                      {instructor?.type === '정규' && settings.annualLeaveEnabled ? (
                        <div>
                          <p className="text-slate-500 text-xs font-medium mb-1.5">종류</p>
                          <div className="flex gap-2">
                            {(['annual', 'half', 'quarter'] as const).map(t => (
                              <button key={t} onClick={() => setLeaveType(t)}
                                className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-colors ${leaveType === t ? 'bg-cyan-600 border-cyan-600 text-white' : 'bg-white border-slate-200 text-slate-500'}`}>
                                {LEAVE_LABEL[t]}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="text-slate-400 text-xs">{settings.annualLeaveEnabled ? '프리랜서/비정규직은 연차 차감 없이 근무 불가일로만 등록돼요.' : '연차를 지급하지 않는 학원이라 근무 불가일로만 등록돼요.'}</p>
                      )}
                      {(leaveType === 'half' || leaveType === 'quarter') && instructor?.type === '정규' && settings.annualLeaveEnabled && (
                        <div>
                          <p className="text-slate-500 text-xs font-medium mb-1.5">휴강 시간대 (학부모에게 안내돼요)</p>
                          <div className="flex gap-2">
                            {(['am', 'pm'] as const).map(t => (
                              <button key={t} onClick={() => setLeaveTimeRange(t)}
                                className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-colors ${leaveTimeRange === t ? 'bg-cyan-600 border-cyan-600 text-white' : 'bg-white border-slate-200 text-slate-500'}`}>
                                {t === 'am' ? '오전' : '오후'}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      <div>
                        <p className="text-slate-500 text-xs font-medium mb-1.5">사유</p>
                        <input value={leaveReason} onChange={e => setLeaveReason(e.target.value)} placeholder="예: 개인 사정"
                          className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-cyan-500 transition-colors" />
                      </div>
                      {leaveError && <p className="text-red-500 text-xs">{leaveError}</p>}
                      <button onClick={() => {
                        const type: LeaveType = (instructor?.type === '정규' && settings.annualLeaveEnabled) ? leaveType : 'unavailable';
                        const timeRange = (type === 'half' || type === 'quarter') ? leaveTimeRange : undefined;
                        const res = submitLeaveRequest(instructorId, leaveDate, type, leaveReason, timeRange);
                        if (!res.ok) setLeaveError(res.error ?? '신청에 실패했습니다.');
                        else { setLeaveError(null); setLeaveReason(''); setLeaveSaved(true); setTimeout(() => setLeaveSaved(false), 1500); }
                      }} className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2">
                        {leaveSaved ? <><CheckCircle2 className="w-4 h-4" /> 신청 완료</> : '신청하기'}
                      </button>
                    </div>

                    <div className="space-y-2">
                      <p className="text-slate-500 text-xs font-semibold px-1">내 신청 내역 ({myLeaveRequests.length}건)</p>
                      {myLeaveRequests.map(r => (
                        <div key={r.id} className="bg-white rounded-2xl p-4 border border-slate-100 flex items-center justify-between">
                          <div>
                            <p className="text-slate-800 text-sm font-semibold flex items-center gap-1.5">
                              <CalendarCheck className="w-3.5 h-3.5 text-cyan-600" /> {r.date} · {LEAVE_LABEL[r.leaveType]}
                            </p>
                            {r.reason && <p className="text-slate-400 text-xs mt-1">{r.reason}</p>}
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border shrink-0 ${
                            r.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : r.status === 'rejected' ? 'bg-red-50 text-red-600 border-red-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {r.status === 'approved' ? '승인됨' : r.status === 'rejected' ? '반려됨' : '대기 중'}
                          </span>
                        </div>
                      ))}
                      {myLeaveRequests.length === 0 && (
                        <div className="text-center py-8 text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200 text-sm">
                          신청 내역이 없습니다.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {requestsSubTab === 'sub' && (
                  <div className="space-y-4">
                    <div>
                      <p className="text-slate-800 text-sm font-semibold px-1 mb-2">내가 수락할 수 있는 대타 요청</p>
                      <div className="space-y-2">
                        {openSubRequestsForMe.map(r => {
                          const requester = instructors.find(i => i.id === r.requestingInstructorId);
                          const isUrgent = differenceInCalendarDays(parseISO(r.date), new Date()) <= 2;
                          return (
                            <div key={r.id} className={`rounded-2xl p-4 border ${isUrgent ? 'bg-orange-50 border-orange-200' : 'bg-white border-slate-100'}`}>
                              <div className="flex items-center justify-between">
                                <p className="text-slate-800 text-sm font-semibold">{requester?.name} 강사님 대타</p>
                                {isUrgent && <span className="text-[10px] font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">마감 임박</span>}
                              </div>
                              <p className="text-slate-500 text-xs mt-1">{r.date} {r.time} · {r.reason || '사유 없음'}</p>
                              <button onClick={() => {
                                const res = acceptSubRequest(r.id, instructorId);
                                if (!res.ok) setSubActionError(res.error ?? '수락에 실패했습니다.');
                                else setSubActionError(null);
                              }} className="w-full mt-3 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors">
                                <Hand className="w-3.5 h-3.5" /> 대타 수락하기
                              </button>
                            </div>
                          );
                        })}
                        {openSubRequestsForMe.length === 0 && (
                          <div className="text-center py-8 text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200 text-sm">
                            지금 수락 가능한 대타 요청이 없어요.
                          </div>
                        )}
                        {subActionError && <p className="text-red-500 text-xs px-1">{subActionError}</p>}
                      </div>
                    </div>

                    <div>
                      <p className="text-slate-800 text-sm font-semibold px-1 mb-2">내 수업에 대타 요청하기</p>
                      <div className="space-y-2">
                        {myUpcomingClasses.slice(0, 8).map(cls => {
                          const existing = mySubRequests.find(r => r.classId === cls.id && r.status !== 'cancelled');
                          return (
                            <div key={cls.id} className="bg-white rounded-2xl p-4 border border-slate-100">
                              <p className="text-slate-800 text-sm font-semibold">{format(parseISO(cls.date), 'M월 d일 (E)', { locale: ko })} {cls.time}</p>
                              {existing ? (
                                <span className={`inline-block mt-2 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${existing.status === 'filled' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                                  {existing.status === 'filled' ? '대타 확정됨' : '대타 구하는 중'}
                                </span>
                              ) : (
                                <div className="mt-2 flex items-center gap-2">
                                  <input value={subReasonDraft[cls.id] ?? ''} onChange={e => setSubReasonDraft(prev => ({ ...prev, [cls.id]: e.target.value }))}
                                    placeholder="사유 (선택)" className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-cyan-500 transition-colors" />
                                  <button onClick={() => submitSubRequest(cls.id, subReasonDraft[cls.id] ?? '')}
                                    className="flex items-center gap-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition-colors shrink-0">
                                    <Repeat className="w-3.5 h-3.5" /> 대타 구하기
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                        {myUpcomingClasses.length === 0 && (
                          <div className="text-center py-8 text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200 text-sm">
                            예정된 수업이 없어요.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        )}

        {/* Progress record screen */}
        {progressClassId && (() => {
          const cls = classes.find(c => c.id === progressClassId);
          return cls ? <ProgressRecordScreen cls={cls} onClose={() => setProgressClassId(null)} /> : null;
        })()}

        {/* Counseling record screen */}
        {counselingStudentId && (
          <CounselingScreen studentId={counselingStudentId} instructorId={instructorId} onClose={() => setCounselingStudentId(null)} />
        )}

        {/* Document viewer overlay */}
        {showDoc && (
          <div className="absolute inset-0 bg-black/60 z-50 flex items-center justify-center p-6" onClick={() => setShowDoc(null)}>
            <img src={showDoc} className="max-w-full max-h-full rounded-xl shadow-2xl" alt="제출 서류" />
          </div>
        )}

        {/* Bottom Navigation */}
        <div className="absolute bottom-0 w-full h-20 bg-white border-t border-slate-100 flex justify-around items-center px-6 pb-4 rounded-b-[2.5rem] z-10">
          <button onClick={() => setActiveTab('schedule')}
            className={`relative flex flex-col items-center gap-1 ${activeTab === 'schedule' ? 'text-cyan-600' : 'text-slate-400'}`}>
            <Calendar className="w-6 h-6" />
            {upcomingMakeupEntries.length > 0 && (
              <span className="absolute -top-1 -right-1.5 w-4 h-4 rounded-full bg-orange-500 text-white text-[9px] font-bold flex items-center justify-center">{upcomingMakeupEntries.length}</span>
            )}
            <span className="text-[10px] font-medium">스케줄</span>
          </button>
          <button onClick={() => setActiveTab('students')}
            className={`relative flex flex-col items-center gap-1 ${activeTab === 'students' ? 'text-cyan-600' : 'text-slate-400'}`}>
            <Users className="w-6 h-6" />
            {(myPendingWithdrawals.length + myPendingReturns.length) > 0 && (
              <span className="absolute -top-1 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">{myPendingWithdrawals.length + myPendingReturns.length}</span>
            )}
            <span className="text-[10px] font-medium">내 강습생</span>
          </button>
          <button onClick={() => setActiveTab('requests')}
            className={`relative flex flex-col items-center gap-1 ${activeTab === 'requests' ? 'text-cyan-600' : 'text-slate-400'}`}>
            <RefreshCw className="w-6 h-6" />
            {myPendingRequestCount > 0 && (
              <span className="absolute -top-1 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">{myPendingRequestCount}</span>
            )}
            <span className="text-[10px] font-medium">보강·이월</span>
          </button>
          <button onClick={() => setActiveTab('messages')}
            className={`flex flex-col items-center gap-1 ${activeTab === 'messages' ? 'text-cyan-600' : 'text-slate-400'}`}>
            <MessageCircle className="w-6 h-6" />
            <span className="text-[10px] font-medium">메시지</span>
          </button>
          <button onClick={() => setActiveTab('contacts')}
            className={`flex flex-col items-center gap-1 ${activeTab === 'contacts' ? 'text-cyan-600' : 'text-slate-400'}`}>
            <Contact className="w-6 h-6" />
            <span className="text-[10px] font-medium">연락망</span>
          </button>
        </div>
      </div>
    </div>
  );
}
