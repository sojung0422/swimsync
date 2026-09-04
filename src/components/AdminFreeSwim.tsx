import { useState } from 'react';
import { useStore } from '../store/StoreContext';
import { Waves, Plus, Trash2, Users, Clock } from 'lucide-react';

const DAYS = ['월', '화', '수', '목', '금', '토', '일'];

export default function AdminFreeSwim() {
  const { settings, updateSettings, instructors, students, freeSwimBookings, paymentPlans } = useStore();
  const [days, setDays] = useState<string[]>(['월', '수', '금']);
  const [startTime, setStartTime] = useState('20:00');
  const [endTime, setEndTime] = useState('21:00');
  const [instructorId, setInstructorId] = useState(instructors.find(i => i.status === 'active')?.id ?? '');

  const toggleDay = (d: string) => setDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);

  const addSlot = () => {
    if (days.length === 0 || !instructorId) return;
    updateSettings({
      freeSwimSlots: [...settings.freeSwimSlots, { id: `fs_${Date.now()}`, days, startTime, endTime, instructorId }],
    });
  };
  const deleteSlot = (id: string) => updateSettings({ freeSwimSlots: settings.freeSwimSlots.filter(s => s.id !== id) });

  const eligibleStudents = students.filter(s => {
    const plan = paymentPlans.find(p => p.id === s.paymentPlanId);
    return s.status === 'active' && plan?.hasFreeSwim;
  });

  const activeBookings = freeSwimBookings.filter(b => b.status === 'booked').sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="shrink-0 px-6 py-4 bg-white border-b border-slate-200">
        <h1 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Waves className="w-5 h-5 text-cyan-600" /> 자유수영 관리</h1>
        <p className="text-slate-400 text-xs mt-0.5">성인 자유수영 가능 시간대를 등록하면, 자유수영 포함 플랜 회원이 학부모 앱에서 예약할 수 있어요.</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto p-6 space-y-5">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2"><Clock className="w-4 h-4 text-cyan-600" /><span className="text-slate-500 text-xs font-medium">등록된 시간대</span></div>
              <p className="text-slate-800 text-xl font-bold">{settings.freeSwimSlots.length}개</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2"><Users className="w-4 h-4 text-indigo-600" /><span className="text-slate-500 text-xs font-medium">자유수영 대상 회원</span></div>
              <p className="text-slate-800 text-xl font-bold">{eligibleStudents.length}명</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2"><Waves className="w-4 h-4 text-emerald-600" /><span className="text-slate-500 text-xs font-medium">예약 건수</span></div>
              <p className="text-slate-800 text-xl font-bold">{activeBookings.length}건</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h2 className="text-[14px] font-semibold text-slate-700">자유수영 가능 시간대</h2>
            </div>
            <div className="p-6 space-y-3">
              {settings.freeSwimSlots.length === 0 && (
                <p className="text-slate-400 text-sm py-4 text-center">등록된 시간대가 없습니다.</p>
              )}
              {settings.freeSwimSlots.map(slot => {
                const inst = instructors.find(i => i.id === slot.instructorId);
                return (
                  <div key={slot.id} className="flex items-center gap-4 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex-1">
                      <p className="text-slate-700 text-sm font-semibold">{slot.days.join('·')} {slot.startTime}~{slot.endTime}</p>
                      <p className="text-slate-400 text-xs mt-0.5">담당 강사: {inst?.name ?? '미지정'}</p>
                    </div>
                    <button onClick={() => deleteSlot(slot.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}

              <div className="border-t border-slate-100 pt-4 space-y-3">
                <div className="flex flex-wrap gap-1.5">
                  {DAYS.map(d => (
                    <button key={d} type="button" onClick={() => toggleDay(d)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${days.includes(d) ? 'bg-cyan-600 border-cyan-600 text-white' : 'bg-white border-slate-200 text-slate-500'}`}>
                      {d}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs" />
                  <span className="text-slate-400 text-xs">~</span>
                  <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs" />
                  <select value={instructorId} onChange={e => setInstructorId(e.target.value)} className="flex-1 border border-slate-200 rounded-lg px-2 py-1.5 text-xs">
                    {instructors.filter(i => i.status === 'active').map(i => <option key={i.id} value={i.id}>{i.name} 강사</option>)}
                  </select>
                  <button onClick={addSlot} className="flex items-center gap-1 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-xs font-medium transition-colors shrink-0">
                    <Plus className="w-3.5 h-3.5" /> 추가
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h2 className="text-[14px] font-semibold text-slate-700">예약 현황</h2>
            </div>
            <div className="p-6">
              {activeBookings.length === 0 ? (
                <p className="text-slate-400 text-sm py-4 text-center">예약된 자유수영이 없습니다.</p>
              ) : (
                <div className="space-y-2">
                  {activeBookings.map(b => {
                    const student = students.find(s => s.id === b.studentId);
                    const slot = settings.freeSwimSlots.find(s => s.id === b.slotId);
                    const inst = instructors.find(i => i.id === slot?.instructorId);
                    return (
                      <div key={b.id} className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-2.5">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {student?.studentName[0] ?? '?'}
                        </div>
                        <p className="flex-1 text-slate-700 text-sm font-medium">{student?.studentName ?? '알 수 없음'}</p>
                        <span className="text-slate-500 text-xs">{b.date} {slot?.startTime}~{slot?.endTime}</span>
                        <span className="text-slate-400 text-xs">{inst?.name} 강사</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
