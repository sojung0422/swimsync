import { useState } from 'react';
import { useStore, getAllEnrollments } from '../store/StoreContext';
import type { MakeupRequest, ClassSession } from '../store/StoreContext';
import {
  Calendar, Clock, Users, BookOpen, CheckCircle2, AlertCircle, UserCircle, RefreshCw,
  Wallet, CalendarClock, Image as ImageIcon, ChevronLeft, ChevronDown, ChevronUp,
} from 'lucide-react';
import { format, addDays, startOfWeek, isSameDay, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';

const REQUEST_STATUS_META: Record<MakeupRequest['status'], { label: string; color: string }> = {
  pending:            { label: '승인 대기',   color: 'bg-amber-50 text-amber-700 border-amber-200' },
  approved_makeup:    { label: '보강 확정',   color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  approved_carryover: { label: '이월 처리',   color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  rejected:           { label: '거절됨',     color: 'bg-red-50 text-red-600 border-red-200' },
};

const SKILL_SUGGESTIONS = ['자유형 발차기', '자유형 완영', '배영 25m', '배영 50m 완주', '평영 발차기', '평영 완영', '접영 도입', '호흡법 연습'];

// ─── 진도 및 특이사항 기록 화면 ────────────────────────────────────────────────

function ProgressRecordScreen({ cls, onClose }: { cls: ClassSession; onClose: () => void }) {
  const { students, instructors, updateStudent } = useStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [progressDraft, setProgressDraft] = useState('');
  const [notesDraft, setNotesDraft] = useState('');
  const [savedId, setSavedId] = useState<string | null>(null);

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
  };

  const handleSave = (id: string) => {
    updateStudent(id, { progress: progressDraft, notes: notesDraft });
    setEditingId(null);
    setSavedId(id);
    setTimeout(() => setSavedId(null), 1500);
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
                <p className="text-slate-400 text-xs truncate">{s.progress || '진도 기록 없음'}</p>
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
    </div>
  );
}

export default function InstructorApp() {
  const { classes, students, instructors, makeupRequests } = useStore();
  const [activeTab, setActiveTab] = useState<'schedule' | 'students' | 'requests'>('schedule');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDoc, setShowDoc] = useState<string | null>(null);
  const [progressClassId, setProgressClassId] = useState<string | null>(null);

  const instructorId = 'i1';
  const instructor = instructors.find(i => i.id === instructorId);
  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
  const myClasses = classes.filter(c => c.instructorId === instructorId && c.date === selectedDateStr);

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 0 });
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));

  // 기본반뿐 아니라 추가로 등록한 반(다중 반)에서 이 강사를 담당으로 두고 있는 경우도 "내 강습생"에 포함
  const teachesStudent = (s: (typeof students)[number]) => getAllEnrollments(s).some(e => e.status === 'active' && e.instructorId === instructorId);
  const myStudents = students.filter(s => teachesStudent(s) && s.status === 'active');

  // 내 강습생들의 보강·이월 요청 (운영 웹 "보강 요청 관리"에서 승인/거절 처리, 여기서는 확인용)
  const myStudentIds = new Set(students.filter(teachesStudent).map(s => s.id));
  const myRequests = makeupRequests.filter(r => myStudentIds.has(r.studentId)).slice().reverse();
  const myPendingRequestCount = myRequests.filter(r => r.status === 'pending').length;

  // 내 수업에 새로 배정된 보강 학생 (학부모가 예약하거나 운영진이 승인하는 즉시 여기 반영됨) — 오늘 이후
  const todayStr = format(new Date(), 'yyyy-MM-dd');
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
                <h2 className="text-[15px] font-bold text-slate-800 px-1">내 강습생 ({myStudents.length}명)</h2>
                {myStudents.map(s => (
                  <div key={s.id} className="bg-white rounded-2xl p-4 border border-slate-100 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                      {s.studentName[0]}
                    </div>
                    <div className="flex-1">
                      <p className="text-slate-800 text-sm font-semibold">{s.studentName}</p>
                      <p className="text-slate-400 text-xs">{s.level} · {s.regularDays.join('·')} {s.regularTime}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${s.level === '초급' ? 'bg-blue-50 text-blue-700 border-blue-200' : s.level === '중급' ? 'bg-violet-50 text-violet-700 border-violet-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                      {s.level}
                    </span>
                  </div>
                ))}
                {myStudents.length === 0 && (
                  <div className="text-center py-12 text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200 text-sm">
                    배정된 강습생이 없습니다.
                  </div>
                )}
              </div>
            ) : (
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
          </div>
        </div>

        {/* Progress record screen */}
        {progressClassId && (() => {
          const cls = classes.find(c => c.id === progressClassId);
          return cls ? <ProgressRecordScreen cls={cls} onClose={() => setProgressClassId(null)} /> : null;
        })()}

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
            className={`flex flex-col items-center gap-1 ${activeTab === 'students' ? 'text-cyan-600' : 'text-slate-400'}`}>
            <Users className="w-6 h-6" />
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
        </div>
      </div>
    </div>
  );
}
