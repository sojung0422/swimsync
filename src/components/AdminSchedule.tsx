import React, { useState } from 'react';
import { format, addDays, startOfWeek, isSameDay, startOfMonth, endOfMonth } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useStore, ClassSession } from '../store/StoreContext';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Users, Plus, X, Settings2, Building2, LogIn, LogOut } from 'lucide-react';

// ── Shared styles ─────────────────────────────────────────────
const inputCls = 'w-full border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-400 transition-colors bg-white';
const modalOverlay = 'fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50';

export default function AdminSchedule() {
  const {
    classes, instructors, students, events, settings, vehicles,
    addEvent, updateInstructorColor, updateSettings, cancelScheduledMakeup,
  } = useStore();
  const [view, setView] = useState<'month' | 'week' | 'day'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());

  const [selectedMonthDay, setSelectedMonthDay] = useState<Date | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [newEvent, setNewEvent] = useState({ date: format(new Date(), 'yyyy-MM-dd'), title: '', type: 'notice' as 'notice' | 'event' | 'memo' });

  const [newTimeSlot, setNewTimeSlot] = useState('');
  const [academyDraft, setAcademyDraft] = useState({ academyName: settings.academyName, branchName: settings.branchName });
  const [selectedClass, setSelectedClass] = useState<ClassSession | null>(null);
  const [weekFilterMode, setWeekFilterMode] = useState<'all' | 'individual'>('all');
  const [selectedInstructorId, setSelectedInstructorId] = useState<string>(instructors[0]?.id || '');
  const [cancelMakeupTarget, setCancelMakeupTarget] = useState<{ classId: string; studentId: string; studentName: string } | null>(null);

  const getClassesForDate = (date: Date) => classes.filter(c => c.date === format(date, 'yyyy-MM-dd'));
  const getEventsForDate  = (date: Date) => events.filter(e => e.date === format(date, 'yyyy-MM-dd'));

  const monthStart = startOfMonth(currentDate);
  const monthEnd   = endOfMonth(monthStart);
  const monthDays  = Array.from({ length: 35 }).map((_, i) => addDays(startOfWeek(monthStart, { weekStartsOn: 0 }), i));
  const weekStart  = startOfWeek(currentDate, { weekStartsOn: 0 });
  const weekDays   = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));

  const navigate = (delta: number) => setCurrentDate(addDays(currentDate, delta * (view === 'month' ? 30 : view === 'week' ? 7 : 1)));

  const handleAddEvent = () => {
    if (newEvent.title && newEvent.date) {
      addEvent({ date: newEvent.date, title: newEvent.title, type: newEvent.type });
      setShowEventModal(false);
      setNewEvent({ ...newEvent, title: '' });
    }
  };

  const eventChip: Record<string, string> = {
    notice: 'bg-violet-100 text-violet-700',
    event:  'bg-emerald-100 text-emerald-700',
    memo:   'bg-amber-100 text-amber-700',
  };

  // Individual view: count classes for selected instructor this week
  const individualWeekClassCount = weekDays.reduce((acc, day) => {
    const count = classes.filter(c => c.date === format(day, 'yyyy-MM-dd') && c.instructorId === selectedInstructorId).length;
    return acc + count;
  }, 0);

  return (
    <div className="p-6 min-h-screen bg-slate-50">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900">스케줄 관리</h2>
          </div>
          <p className="text-slate-500 text-sm mt-0.5">전체 강습 스케줄 및 수영장 일정을 관리합니다.</p>
        </div>
        <div className="flex bg-white rounded-xl border border-slate-200 p-1 gap-0.5 shadow-sm">
          {(['month', 'week', 'day'] as const).map(v => (
            <button key={v} onClick={() => setView(v)}
              className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-all duration-150 ${view === v ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
              {v === 'month' ? '월간' : v === 'week' ? '주간' : '일간'}
            </button>
          ))}
        </div>
      </div>

      {/* Calendar Card */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        {/* Toolbar */}
        <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-white">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500">
              <ChevronLeft size={17} />
            </button>
            <h3 className="text-[15px] font-bold text-slate-800 min-w-[150px] text-center">
              {view === 'day' ? format(currentDate, 'yyyy년 MM월 dd일 (E)', { locale: ko }) : format(currentDate, 'yyyy년 MM월', { locale: ko })}
            </h3>
            <button onClick={() => navigate(1)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500">
              <ChevronRight size={17} />
            </button>
          </div>
          <div className="flex items-center gap-2">
            {view === 'month' && (
              <div className="flex items-center gap-2">
                <button onClick={() => { setNewEvent({ ...newEvent, date: format(new Date(), 'yyyy-MM-dd') }); setShowEventModal(true); }}
                  className="flex items-center gap-1.5 text-sm text-white bg-cyan-600 hover:bg-cyan-500 px-3 py-1.5 rounded-lg font-semibold transition-colors">
                  <Plus size={14} /> 일정 추가
                </button>
              </div>
            )}
            <button onClick={() => setCurrentDate(new Date())}
              className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-lg font-medium transition-colors border border-slate-200">
              <CalendarIcon size={13} /> 오늘
            </button>
          </div>
        </div>

        {/* Month View */}
        {view === 'month' && (
          <div>
            <div className="grid grid-cols-7 border-b border-slate-100">
              {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => (
                <div key={d} className={`py-3 text-center text-xs font-bold ${i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-slate-400'}`}>{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {monthDays.map((day, i) => {
                const dayEvents  = getEventsForDate(day);
                const dayClasses = getClassesForDate(day);
                const inMonth = day >= monthStart && day <= monthEnd;
                const isToday = isSameDay(day, new Date());
                const isSun = i % 7 === 0, isSat = i % 7 === 6;
                return (
                  <div key={i} onClick={() => setSelectedMonthDay(day)}
                    className={`min-h-[105px] p-2 cursor-pointer transition-colors border-b border-r border-slate-100 hover:bg-slate-50 ${!inMonth ? 'opacity-30' : ''} ${isToday ? 'bg-cyan-50/60' : ''}`}>
                    <div className={`w-6 h-6 flex items-center justify-center text-xs font-bold rounded-full mb-1.5 ${isToday ? 'bg-cyan-600 text-white' : isSun ? 'text-red-500' : isSat ? 'text-blue-500' : 'text-slate-700'}`}>
                      {format(day, 'd')}
                    </div>
                    <div className="space-y-0.5">
                      {dayEvents.slice(0, 2).map(e => (
                        <div key={e.id} className={`text-[10px] px-1.5 py-0.5 rounded-md truncate font-semibold ${eventChip[e.type]}`}>{e.title}</div>
                      ))}
                      {dayClasses.length > 0 && (
                        <div className="text-[10px] px-1.5 py-0.5 rounded-md bg-cyan-100 text-cyan-700 truncate font-semibold">강습 {dayClasses.length}건</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Week View */}
        {view === 'week' && (
          <div className="flex flex-col">
            {/* Filter bar */}
            <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-4 flex-wrap bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Users size={14} className="text-slate-400" />
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">강사 필터</span>
              </div>
              <div className="flex bg-white border border-slate-200 rounded-xl p-0.5 gap-0.5">
                {(['all', 'individual'] as const).map(mode => (
                  <button key={mode} onClick={() => setWeekFilterMode(mode)}
                    className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all duration-150 ${weekFilterMode === mode ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
                    {mode === 'all' ? '전체' : '개인'}
                  </button>
                ))}
              </div>
              {weekFilterMode === 'individual' && (
                <div className="flex items-center gap-3 animate-fade-up">
                  <select value={selectedInstructorId} onChange={e => setSelectedInstructorId(e.target.value)}
                    className="border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-cyan-400/30 outline-none bg-white cursor-pointer">
                    {instructors.map(inst => <option key={inst.id} value={inst.id}>{inst.name} 강사</option>)}
                  </select>
                  {/* Weekly summary for individual */}
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-cyan-50 border border-cyan-200 rounded-xl">
                    <span className="text-xs text-cyan-600 font-semibold">이번 주</span>
                    <span className="text-sm font-bold text-cyan-700">{individualWeekClassCount}건</span>
                  </div>
                </div>
              )}
            </div>

            <div className="overflow-x-auto">
              <div className="min-w-[900px]">
                {/* Day headers */}
                <div className="grid grid-cols-[88px_repeat(7,1fr)] border-b border-slate-100 bg-slate-50/50">
                  <div className="p-3 border-r border-slate-100" />
                  {weekDays.map((day, i) => {
                    const isToday = isSameDay(day, new Date());
                    const isSun = i === 0, isSat = i === 6;
                    // Individual view: show per-day class count for selected instructor
                    const instDayCount = weekFilterMode === 'individual'
                      ? classes.filter(c => c.date === format(day, 'yyyy-MM-dd') && c.instructorId === selectedInstructorId).length
                      : 0;
                    return (
                      <div key={i} className={`p-3 text-center border-r border-slate-100 last:border-r-0 ${isToday ? 'bg-cyan-50/60' : ''}`}>
                        <div className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${isSun ? 'text-red-400' : isSat ? 'text-blue-400' : 'text-slate-400'}`}>
                          {format(day, 'E', { locale: ko })}
                        </div>
                        <div className={`text-sm font-black ${isToday ? 'text-cyan-600' : 'text-slate-700'}`}>{format(day, 'MM/dd')}</div>
                        {weekFilterMode === 'individual' && instDayCount > 0 && (
                          <div className="mt-1 text-[10px] font-bold text-cyan-600 bg-cyan-100 rounded-full px-1.5 py-0.5 inline-block">{instDayCount}건</div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Time rows */}
                <div className="divide-y divide-slate-100">
                  {settings.designatedTimes.map(time => (
                    <div key={time} className="grid grid-cols-[88px_repeat(7,1fr)] min-h-[110px]">
                      <div className="p-3 border-r border-slate-100 flex items-center justify-center bg-slate-50/30">
                        <span className="text-[11px] font-black text-slate-400">{time}</span>
                      </div>
                      {weekDays.map((day, i) => {
                        const dateStr = format(day, 'yyyy-MM-dd');
                        const isToday = isSameDay(day, new Date());
                        const dayClasses = classes.filter(c =>
                          c.date === dateStr && c.time === time &&
                          (weekFilterMode === 'all' || c.instructorId === selectedInstructorId)
                        );
                        return (
                          <div key={i} className={`border-r border-slate-100 last:border-r-0 flex flex-col p-1.5 gap-1.5 ${isToday ? 'bg-cyan-50/30' : ''}`}>
                            {dayClasses.map(cls => {
                              const instructor = instructors.find(inst => inst.id === cls.instructorId);
                              const presentStudents = [...cls.studentIds, ...cls.makeupStudentIds].filter(id => !cls.absentStudentIds.includes(id));
                              const color = instructor?.color || '#0891b2';
                              if (weekFilterMode === 'all') {
                                return (
                                  <div key={cls.id} onClick={() => setSelectedClass(cls)}
                                    className="rounded-lg p-2.5 cursor-pointer hover:shadow-md transition-all duration-150 flex justify-between items-center border-l-[3px]"
                                    style={{ backgroundColor: `${color}12`, borderLeftColor: color, borderTopColor: `${color}20`, borderRightColor: `${color}20`, borderBottomColor: `${color}20`, borderWidth: '1px', borderLeftWidth: '3px' }}>
                                    <span className="font-bold text-[11px] truncate mr-1" style={{ color }}>{instructor?.name}</span>
                                    <span className="text-[10px] font-bold opacity-70 whitespace-nowrap" style={{ color }}>{presentStudents.length}명</span>
                                  </div>
                                );
                              } else {
                                return (
                                  <div key={cls.id} className="flex flex-col gap-1">
                                    {presentStudents.map(id => {
                                      const s = students.find(st => st.id === id);
                                      const isMakeup = cls.makeupStudentIds.includes(id);
                                      return (
                                        <div key={id} onClick={() => setSelectedClass(cls)}
                                          className="rounded-lg px-2 py-1.5 cursor-pointer hover:shadow-sm transition-all duration-150 border-l-[3px] text-[11px] font-bold"
                                          style={{ backgroundColor: `${color}12`, borderLeftColor: color, borderTopColor: `${color}20`, borderRightColor: `${color}20`, borderBottomColor: `${color}20`, borderWidth: '1px', borderLeftWidth: '3px', color }}>
                                          {s?.studentName}
                                          {isMakeup && <span className="ml-1 text-[9px] bg-orange-100 text-orange-600 px-1 rounded">보강</span>}
                                        </div>
                                      );
                                    })}
                                    {presentStudents.length === 0 && <span className="text-[10px] text-slate-300 italic text-center mt-2">비어있음</span>}
                                  </div>
                                );
                              }
                            })}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Day View */}
        {view === 'day' && (
          <div className="overflow-x-auto">
            <div className="min-w-[700px]">
              <div className="grid border-b border-slate-100 bg-slate-50/50" style={{ gridTemplateColumns: `110px repeat(${instructors.length},1fr)` }}>
                <div className="p-3 border-r border-slate-100 text-slate-400 text-xs font-bold text-center">시간</div>
                {instructors.map(inst => (
                  <div key={inst.id} className="p-3 text-center border-r border-slate-100 last:border-r-0">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mx-auto mb-1" style={{ backgroundColor: `${inst.color}20`, color: inst.color }}>{inst.name[0]}</div>
                    <span className="text-slate-700 text-xs font-bold">{inst.name} 강사</span>
                  </div>
                ))}
              </div>
              <div className="divide-y divide-slate-100">
                {settings.designatedTimes.map(time => (
                  <div key={time} className="grid min-h-[90px]" style={{ gridTemplateColumns: `110px repeat(${instructors.length},1fr)` }}>
                    <div className="p-3 border-r border-slate-100 flex items-center justify-center bg-slate-50/30">
                      <span className="text-[11px] font-black text-slate-400">{time}</span>
                    </div>
                    {instructors.map(inst => {
                      const cls = classes.find(c => c.date === format(currentDate, 'yyyy-MM-dd') && c.time === time && c.instructorId === inst.id);
                      const presentStudents = cls ? [...cls.studentIds, ...cls.makeupStudentIds].filter(id => !cls.absentStudentIds.includes(id)) : [];
                      const color = inst.color || '#0891b2';
                      return (
                        <div key={inst.id} className="p-2 border-r border-slate-100 last:border-r-0">
                          {cls ? (
                            <div className="flex flex-col gap-1.5">
                              {presentStudents.map(id => {
                                const s = students.find(st => st.id === id);
                                const isMakeup = cls.makeupStudentIds.includes(id);
                                return (
                                  <div key={id} onClick={() => setSelectedClass(cls)}
                                    className="px-2.5 py-2 rounded-lg text-[11px] font-bold border-l-[3px] cursor-pointer hover:shadow-sm transition-all"
                                    style={{ backgroundColor: `${color}12`, borderLeftColor: color, borderTopColor: `${color}20`, borderRightColor: `${color}20`, borderBottomColor: `${color}20`, borderWidth: '1px', borderLeftWidth: '3px', color }}>
                                    {s?.studentName}
                                    {isMakeup && <span className="ml-1 text-[9px] bg-orange-100 text-orange-600 px-1 rounded">보강</span>}
                                  </div>
                                );
                              })}
                              {presentStudents.length === 0 && <span className="text-[10px] text-slate-300 italic text-center mt-2">비어있음</span>}
                            </div>
                          ) : <div className="h-full flex items-center justify-center text-slate-200 text-sm">—</div>}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Settings button */}
      <div className="mt-4 flex justify-end">
        <button onClick={() => setShowSettingsModal(true)}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl font-medium transition-all shadow-sm">
          <Settings2 size={15} /> 시간표 및 강사 색상 설정
        </button>
      </div>

      {/* Month Day Detail Modal */}
      {selectedMonthDay && (
        <div className={modalOverlay}>
          <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-md shadow-xl animate-zoom-in">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-[15px] font-bold text-slate-900">{format(selectedMonthDay, 'yyyy년 MM월 dd일')} 일정</h3>
              <button onClick={() => setSelectedMonthDay(null)} className="text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 p-1.5 rounded-lg transition-colors"><X size={15} /></button>
            </div>
            <div className="space-y-2 mb-5 max-h-[50vh] overflow-y-auto">
              {getEventsForDate(selectedMonthDay).map(e => (
                <div key={e.id} className={`p-3 rounded-xl text-sm border ${e.type === 'notice' ? 'bg-violet-50 border-violet-100 text-violet-800' : e.type === 'event' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-amber-50 border-amber-100 text-amber-800'}`}>
                  <div className="text-[10px] font-bold mb-1 opacity-60">{e.type === 'notice' ? '공지사항' : e.type === 'event' ? '이벤트/특강' : '메모/기록'}</div>
                  <div className="font-medium">{e.title}</div>
                </div>
              ))}
              {getEventsForDate(selectedMonthDay).length === 0 && (
                <div className="text-slate-400 text-sm text-center py-8 bg-slate-50 rounded-xl border border-slate-100">등록된 일정이 없습니다.</div>
              )}
            </div>
            <button onClick={() => { setNewEvent({ ...newEvent, date: format(selectedMonthDay, 'yyyy-MM-dd') }); setShowEventModal(true); }}
              className="w-full flex items-center justify-center gap-2 bg-cyan-50 hover:bg-cyan-100 text-cyan-700 border border-cyan-200 py-2.5 rounded-xl font-bold text-sm transition-colors">
              <Plus size={15} /> 새 일정/메모 추가
            </button>
          </div>
        </div>
      )}

      {/* Add Event Modal */}
      {showEventModal && (
        <div className={modalOverlay} style={{ zIndex: 60 }}>
          <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-md shadow-xl animate-zoom-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-[15px] font-bold text-slate-900">일정 추가</h3>
              <button onClick={() => setShowEventModal(false)} className="text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 p-1.5 rounded-lg transition-colors"><X size={15} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">날짜</label>
                <input type="date" value={newEvent.date} onChange={e => setNewEvent({ ...newEvent, date: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">구분</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['notice', 'event', 'memo'] as const).map(type => (
                    <button key={type} onClick={() => setNewEvent({ ...newEvent, type })}
                      className={`py-2 rounded-xl text-sm font-semibold border transition-all ${newEvent.type === type ? 'bg-cyan-600 border-cyan-600 text-white' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                      {type === 'notice' ? '공지사항' : type === 'event' ? '이벤트' : '메모'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">내용</label>
                <textarea value={newEvent.title} onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
                  className={`${inputCls} h-24 resize-none`} placeholder="일정이나 메모 내용을 입력하세요" />
              </div>
              <button onClick={handleAddEvent} disabled={!newEvent.title}
                className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded-xl transition-colors text-sm">
                저장하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className={modalOverlay} style={{ zIndex: 70 }}>
          <div className="bg-white border border-slate-200 rounded-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl animate-zoom-in">
            <div className="flex justify-between items-center mb-7 pb-5 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-900">시스템 설정</h3>
              <button onClick={() => setShowSettingsModal(false)} className="text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 p-2 rounded-xl transition-colors"><X size={18} /></button>
            </div>
            <div className="space-y-8">
              <div>
                <h4 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2"><Building2 size={15} className="text-cyan-600" /> 학원 정보</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1 font-medium">학원명</label>
                    <input className={inputCls} value={academyDraft.academyName}
                      onChange={e => setAcademyDraft({ ...academyDraft, academyName: e.target.value })}
                      onBlur={() => updateSettings({ academyName: academyDraft.academyName || settings.academyName })} />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1 font-medium">지점명</label>
                    <input className={inputCls} value={academyDraft.branchName}
                      onChange={e => setAcademyDraft({ ...academyDraft, branchName: e.target.value })}
                      onBlur={() => updateSettings({ branchName: academyDraft.branchName || settings.branchName })} />
                  </div>
                </div>
                <p className="text-slate-400 text-xs mt-2">여기서 바꾸면 학부모 앱, 관리자 화면 등 학원명이 표시되는 모든 곳에 바로 반영돼요.</p>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2"><Users size={15} className="text-cyan-600" /> 강사별 색상</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {instructors.map(inst => (
                    <div key={inst.id} className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ backgroundColor: `${inst.color}20`, color: inst.color }}>{inst.name[0]}</div>
                        <span className="font-semibold text-slate-700 text-sm">{inst.name} 강사</span>
                      </div>
                      <input type="color" value={inst.color} onChange={e => updateInstructorColor(inst.id, e.target.value)} className="w-7 h-7 rounded-lg cursor-pointer border-none bg-transparent" />
                    </div>
                  ))}
                </div>
                <p className="text-slate-400 text-xs mt-2">강사 등록·수정·인사정보 관리는 왼쪽 메뉴의 "직원 관리"에서 할 수 있어요.</p>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2"><Clock size={15} className="text-cyan-600" /> 강습 시간대 설정</h4>
                <div className="flex flex-wrap gap-2 mb-3">
                  {settings.designatedTimes.map(time => (
                    <button key={time}
                      onClick={() => updateSettings({ designatedTimes: settings.designatedTimes.filter(t => t !== time) })}
                      title="클릭하면 이 시간대를 삭제해요"
                      className="px-3 py-1.5 rounded-lg text-sm font-bold border bg-cyan-600 border-cyan-600 text-white hover:bg-red-500 hover:border-red-500 transition-colors">
                      {time} ✕
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input type="time" value={newTimeSlot} onChange={e => setNewTimeSlot(e.target.value)} className={`${inputCls} w-40`} />
                  <button onClick={() => {
                    if (!newTimeSlot || settings.designatedTimes.includes(newTimeSlot)) return;
                    updateSettings({ designatedTimes: [...settings.designatedTimes, newTimeSlot].sort() });
                    setNewTimeSlot('');
                  }} className="px-3 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-sm font-medium transition-colors">추가</button>
                </div>
              </div>
            </div>
            <div className="mt-8 pt-5 border-t border-slate-100">
              <button onClick={() => setShowSettingsModal(false)}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl transition-colors text-sm">
                설정 완료
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Class Detail Modal */}
      {selectedClass && (() => {
        // classes 배열에서 최신 상태를 다시 찾아옴 — 보강 취소 등으로 classes가 바뀌어도 모달이 바로 반영되도록
        const liveClass = classes.find(c => c.id === selectedClass.id) ?? selectedClass;
        return (
        <div className={modalOverlay} style={{ zIndex: 100 }}>
          <div className="bg-white border border-slate-200 rounded-3xl p-8 w-full max-w-6xl shadow-2xl relative animate-zoom-in">
            <button onClick={() => setSelectedClass(null)}
              className="absolute top-7 right-7 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 p-2 rounded-xl transition-colors">
              <X size={18} />
            </button>
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-1.5">
                <h3 className="text-2xl font-bold text-slate-900">{instructors.find(i => i.id === liveClass.instructorId)?.name} 강사</h3>
                <span className="bg-cyan-100 text-cyan-700 px-3 py-1 rounded-full text-sm font-bold border border-cyan-200">{liveClass.time} 수업</span>
                {(() => {
                  const cap = instructors.find(i => i.id === liveClass.instructorId)?.maxCapacity ?? 0;
                  const seated = new Set([...liveClass.studentIds, ...liveClass.makeupStudentIds].filter(id => !liveClass.absentStudentIds.includes(id))).size;
                  const isFull = cap > 0 && seated >= cap;
                  return (
                    <span className={`px-3 py-1 rounded-full text-sm font-bold border ${isFull ? 'bg-red-50 text-red-600 border-red-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                      {seated}/{cap}명 {isFull && '(정원 마감)'}
                    </span>
                  );
                })()}
              </div>
              <p className="text-slate-500 font-medium">{format(new Date(liveClass.date), 'yyyy년 MM월 dd일 (E)', { locale: ko })}</p>
            </div>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="min-w-[1360px] w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    {['학생명', '나이/수준', '주소', '수강권', '진도 현황', '구분', '차량', '호차', '타는 곳', '내리는 곳', '특이사항', '작업'].map(h => (
                      <th key={h} className="px-5 py-3.5 font-bold text-left text-[11px] text-slate-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {Array.from(new Set([...liveClass.studentIds, ...liveClass.makeupStudentIds])).map(id => {
                    const student = students.find(s => s.id === id);
                    if (!student) return null;
                    const isMakeup = liveClass.makeupStudentIds.includes(id);
                    const isAbsent = liveClass.absentStudentIds.includes(id);
                    const vehicle = vehicles.find(v => v.id === student.vehicleId);
                    return (
                      <tr key={id} className={`hover:bg-slate-50 transition-colors ${isAbsent ? 'opacity-40' : ''}`}>
                        <td className="px-5 py-4 font-bold text-slate-900 whitespace-nowrap">{student.studentName}</td>
                        <td className="px-5 py-4 text-slate-500 whitespace-nowrap">{student.age}세 / {student.level}</td>
                        <td className="px-5 py-4 text-slate-500 max-w-[150px] truncate">{student.address || student.region}</td>
                        <td className="px-5 py-4 text-slate-500 whitespace-nowrap">{student.passType}</td>
                        <td className="px-5 py-4 text-cyan-600 font-semibold whitespace-nowrap">{student.progress}</td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          {isAbsent ? <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-100 text-red-600 border border-red-200">결석</span>
                            : isMakeup ? <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-orange-100 text-orange-600 border border-orange-200">보강</span>
                            : <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-600 border border-emerald-200">정규</span>}
                        </td>
                        <td className="px-5 py-4 text-slate-500 whitespace-nowrap">{vehicle?.route ?? '—'}</td>
                        <td className="px-5 py-4 text-slate-500 whitespace-nowrap">{vehicle?.vehicleNumber ?? '—'}</td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          {vehicle ? (
                            <div className="flex items-center gap-1.5 text-emerald-700">
                              <LogIn className="w-3.5 h-3.5 shrink-0" />
                              <span className="text-xs truncate max-w-[130px]">{student.address || '주소 없음'}</span>
                            </div>
                          ) : <span className="text-slate-300 text-xs">직접 등원</span>}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          {vehicle ? (
                            <div className="flex items-center gap-1.5 text-orange-700">
                              <LogOut className="w-3.5 h-3.5 shrink-0" />
                              <span className="text-xs truncate max-w-[130px]">{settings.academyName}</span>
                            </div>
                          ) : <span className="text-slate-300 text-xs">직접 하원</span>}
                        </td>
                        <td className="px-5 py-4 text-slate-500 max-w-[180px] truncate">{student.notes || '—'}</td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          {isMakeup ? (
                            <button onClick={() => setCancelMakeupTarget({ classId: liveClass.id, studentId: id, studentName: student.studentName })}
                              className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded-lg text-xs font-medium transition-colors">
                              보강 취소
                            </button>
                          ) : <span className="text-slate-300 text-xs">-</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {Array.from(new Set([...liveClass.studentIds, ...liveClass.makeupStudentIds])).length === 0 && (
                <div className="text-center py-16 text-slate-400 italic">해당 수업에 배정된 학생이 없습니다.</div>
              )}
            </div>
          </div>
        </div>
        );
      })()}

      {/* Cancel scheduled makeup confirm */}
      {cancelMakeupTarget && (
        <div className={modalOverlay} style={{ zIndex: 110 }}>
          <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="text-slate-800 font-bold text-base mb-2">보강 취소</h3>
            <p className="text-slate-500 text-sm leading-relaxed mb-5">
              <strong className="text-slate-700">{cancelMakeupTarget.studentName}</strong> 학생의 이 시간대 보강을 취소할까요?
              신규/체험 문의 등으로 자리가 필요할 때 사용해요. 취소하면 학부모 앱·강사 앱에 알림(벨소리)이 가고, 학부모는 보강을 다시 신청해야 해요.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setCancelMakeupTarget(null)}
                className="flex-1 py-2.5 border border-slate-200 rounded-xl text-slate-600 text-sm hover:bg-slate-50 transition-colors">
                닫기
              </button>
              <button onClick={() => { cancelScheduledMakeup(cancelMakeupTarget.classId, cancelMakeupTarget.studentId); setCancelMakeupTarget(null); }}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium transition-colors">
                보강 취소하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
