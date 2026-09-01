import { useState } from 'react';
import { useStore, studentsForInstructor } from '../store/StoreContext';
import { format, addMonths, subMonths, isAfter, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  MessageSquareText, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Plus, X, AlertCircle, CheckCircle2, Settings2, CalendarDays, Users,
} from 'lucide-react';

function AddRecordModal({ studentId, instructorId, studentName, onClose }: {
  studentId: string; instructorId: string; studentName: string; onClose: () => void;
}) {
  const { addCounselingRecord } = useStore();
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [content, setContent] = useState('');

  const handleSave = () => {
    if (!content.trim()) return;
    addCounselingRecord({ studentId, instructorId, date, content: content.trim() });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-[15px] font-semibold text-slate-800">{studentName} 상담 기록 추가</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs text-slate-500 mb-1 font-medium">상담일</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-cyan-500 transition-colors" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1 font-medium">상담 내용(일지)</label>
            <textarea value={content} onChange={e => setContent(e.target.value)} rows={5}
              placeholder="상담에서 나눈 이야기와 다음 계획을 기록하세요"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-cyan-500 transition-colors resize-none" />
          </div>
          <button onClick={handleSave} disabled={!content.trim()}
            className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-sm font-medium transition-colors">
            저장
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminCounseling() {
  const { instructors, students, counselingRecords, settings, updateSettings } = useStore();
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [instructorFilter, setInstructorFilter] = useState<string>('all');
  const [addRecordFor, setAddRecordFor] = useState<{ studentId: string; instructorId: string; studentName: string } | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  const teacherInstructors = instructors.filter(i => i.jobType === '강사' && i.status === 'active');
  const monthKey = format(selectedMonth, 'yyyy-MM');
  const isCurrentMonth = monthKey === format(new Date(), 'yyyy-MM');

  const rowsFor = (instructorId: string) => studentsForInstructor(instructorId, students).map(s => {
    const records = counselingRecords
      .filter(c => c.studentId === s.id && c.instructorId === instructorId)
      .sort((a, b) => b.date.localeCompare(a.date));
    const last = records[0];
    const nextDue = last ? format(addMonths(parseISO(last.date), settings.counselingIntervalMonths), 'yyyy-MM-dd') : null;
    const overdue = !nextDue || isAfter(new Date(), parseISO(nextDue));
    const monthRecords = records.filter(r => r.date.startsWith(monthKey));
    return { student: s, records, monthRecords, last, nextDue, overdue };
  });

  const visibleInstructors = teacherInstructors.filter(i => instructorFilter === 'all' || i.id === instructorFilter);
  const totalOverdue = teacherInstructors.reduce((sum, i) => sum + rowsFor(i.id).filter(r => r.overdue).length, 0);
  const totalMonthRecords = visibleInstructors.reduce((sum, i) => sum + rowsFor(i.id).reduce((s2, r) => s2 + r.monthRecords.length, 0), 0);

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="shrink-0 px-6 py-4 bg-white border-b border-slate-200 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-800">상담 관리</h1>
          <p className="text-slate-400 text-xs mt-0.5">선생님별 강습생 상담 현황과 기록을 확인·관리합니다</p>
        </div>
        {totalOverdue > 0 && (
          <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full">
            <AlertCircle className="w-3.5 h-3.5" /> {totalOverdue}명 상담 필요
          </span>
        )}
      </div>

      <div className="shrink-0 px-6 py-3 bg-white border-b border-slate-100 flex items-center gap-2.5 flex-wrap">
        <Users className="w-4 h-4 text-slate-400" />
        <span className="text-xs font-medium text-slate-500">선생님</span>
        <div className="flex items-center gap-1.5 flex-wrap">
          <button onClick={() => setInstructorFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${instructorFilter === 'all' ? 'bg-cyan-600 border-cyan-600 text-white' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
            전체
          </button>
          {teacherInstructors.map(inst => (
            <button key={inst.id} onClick={() => setInstructorFilter(inst.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${instructorFilter === inst.id ? 'bg-cyan-600 border-cyan-600 text-white' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: instructorFilter === inst.id ? '#fff' : inst.color }} />
              {inst.name}
            </button>
          ))}
        </div>
      </div>

      <div className="shrink-0 px-6 py-3 bg-white border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2.5">
          <Settings2 className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-medium text-slate-500">정기 상담 주기</span>
          <div className="flex items-center gap-1.5">
            {[1, 2, 3].map(n => (
              <button key={n} onClick={() => updateSettings({ counselingIntervalMonths: n })}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${settings.counselingIntervalMonths === n ? 'bg-cyan-600 border-cyan-600 text-white' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                {n}개월마다
              </button>
            ))}
          </div>
        </div>
        <button onClick={() => setOverdueOnly(p => !p)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${overdueOnly ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
          상담 필요만 보기
        </button>
      </div>

      <div className="shrink-0 px-6 py-3 bg-white border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-1.5">
          <button onClick={() => setSelectedMonth(m => subMonths(m, 1))} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-500">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h3 className="text-sm font-bold text-slate-800 min-w-[110px] text-center flex items-center justify-center gap-1.5">
            <CalendarDays className="w-3.5 h-3.5 text-cyan-600" /> {format(selectedMonth, 'yyyy년 M월', { locale: ko })}
          </h3>
          <button onClick={() => setSelectedMonth(m => addMonths(m, 1))} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-500">
            <ChevronRight className="w-4 h-4" />
          </button>
          {!isCurrentMonth && (
            <button onClick={() => setSelectedMonth(new Date())}
              className="ml-1 text-xs text-cyan-600 hover:text-cyan-700 font-medium px-2 py-1 rounded-lg hover:bg-cyan-50 transition-colors">
              이번 달로
            </button>
          )}
        </div>
        <span className="text-xs text-slate-400">이 달에 진행된 상담 {totalMonthRecords}건 · 상담 필요 여부는 오늘 날짜 기준으로 항상 최신 상태예요</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-6 space-y-5">
          {visibleInstructors.map(instructor => {
            const rows = rowsFor(instructor.id).filter(r => !overdueOnly || r.overdue);
            if (overdueOnly && rows.length === 0) return null;
            const instructorMonthTotal = rows.reduce((sum, r) => sum + r.monthRecords.length, 0);
            return (
              <div key={instructor.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: instructor.color }} />
                  <h2 className="text-slate-800 font-semibold text-sm">{instructor.name} 강사</h2>
                  <span className="text-xs text-slate-400">{rows.length}명</span>
                  <span className="text-xs text-cyan-600 ml-auto">{format(selectedMonth, 'M월', { locale: ko })} 상담 {instructorMonthTotal}건</span>
                </div>
                {rows.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-sm">
                    {overdueOnly ? '상담이 필요한 강습생이 없습니다.' : '담당 강습생이 없습니다.'}
                  </div>
                ) : (
                  <div className="divide-y divide-slate-50">
                    {rows.map(({ student, monthRecords, last, nextDue, overdue }) => {
                      const isExpanded = expandedStudentId === student.id;
                      return (
                        <div key={student.id}>
                          <button onClick={() => setExpandedStudentId(isExpanded ? null : student.id)}
                            className="w-full flex items-center gap-3 px-6 py-3.5 hover:bg-slate-50 transition-colors text-left">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                              {student.studentName[0]}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-slate-800 text-sm font-semibold">{student.studentName}</p>
                              <p className="text-slate-400 text-xs">
                                {last ? `최근 상담 ${last.date} · 다음 예정 ${nextDue}` : '상담 기록 없음'}
                                {monthRecords.length > 0 && ` · ${format(selectedMonth, 'M월', { locale: ko })} ${monthRecords.length}건`}
                              </p>
                            </div>
                            <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border shrink-0 ${overdue ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                              {overdue ? '상담 필요' : '상담 완료'}
                            </span>
                            {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
                          </button>
                          {isExpanded && (
                            <div className="px-6 pb-4 space-y-2.5 animate-fade-up">
                              <div className="flex items-center justify-between">
                                <p className="text-slate-500 text-xs font-semibold">{format(selectedMonth, 'yyyy년 M월', { locale: ko })} 상담 기록</p>
                                <button onClick={() => setAddRecordFor({ studentId: student.id, instructorId: instructor.id, studentName: student.studentName })}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 text-cyan-700 rounded-lg text-xs font-medium transition-colors">
                                  <Plus className="w-3.5 h-3.5" /> 상담 기록 추가
                                </button>
                              </div>
                              {monthRecords.length === 0 ? (
                                <p className="text-slate-400 text-xs py-2">{format(selectedMonth, 'M월', { locale: ko })}에는 상담 기록이 없습니다.</p>
                              ) : (
                                monthRecords.map(r => (
                                  <div key={r.id} className="bg-slate-50 border border-slate-100 rounded-xl p-3.5">
                                    <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold mb-1">
                                      <MessageSquareText className="w-3.5 h-3.5" /> {r.date}
                                    </div>
                                    <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">{r.content}</p>
                                  </div>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
          {teacherInstructors.length === 0 && (
            <div className="bg-white border border-dashed border-slate-200 rounded-2xl py-16 text-center text-slate-400">
              <CheckCircle2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">등록된 강사가 없습니다. "직원 관리"에서 먼저 강사를 등록해주세요.</p>
            </div>
          )}
        </div>
      </div>

      {addRecordFor && (
        <AddRecordModal
          studentId={addRecordFor.studentId}
          instructorId={addRecordFor.instructorId}
          studentName={addRecordFor.studentName}
          onClose={() => setAddRecordFor(null)}
        />
      )}
    </div>
  );
}
