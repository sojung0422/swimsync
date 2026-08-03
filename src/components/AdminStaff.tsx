import { useState } from 'react';
import { useStore } from '../store/StoreContext';
import type { Instructor } from '../store/StoreContext';
import { Search, UserPlus, Save, Trash2, Users, Printer } from 'lucide-react';

const DAYS = ['월', '화', '수', '목', '금', '토', '일'];

type StaffForm = Omit<Instructor, 'id'>;

const blankForm = (): StaffForm => ({
  name: '', nickname: '', maxCapacity: 5, type: '정규', color: '#0891b2',
  jobType: '강사', phone: '', officePhone: '', extNumber: '',
  hireDate: new Date().toISOString().slice(0, 10), position: '', department: '',
  workDays: [], workTimeStart: '13:00', workTimeEnd: '21:00',
  dutyNote: '', vehicleNumber: '', address: '', memo: '', status: 'active',
});

export default function AdminStaff() {
  const { instructors, addInstructor, updateInstructor, deleteInstructor } = useStore();
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'resigned'>('active');
  const [nameFilter, setNameFilter] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(instructors[0]?.id ?? null);
  const [form, setForm] = useState<StaffForm>(() => {
    const first = instructors[0];
    return first ? { ...first } : blankForm();
  });
  const [deleteConfirm, setDeleteConfirm] = useState<Instructor | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);

  const filtered = instructors.filter(i => {
    if (statusFilter !== 'all' && i.status !== statusFilter) return false;
    if (nameFilter.trim() && !i.name.includes(nameFilter.trim())) return false;
    return true;
  });

  const set = <K extends keyof StaffForm>(key: K, val: StaffForm[K]) => setForm(prev => ({ ...prev, [key]: val }));
  const toggleWorkDay = (d: string) => set('workDays', form.workDays.includes(d) ? form.workDays.filter(x => x !== d) : [...form.workDays, d]);

  const selectStaff = (id: string) => {
    const inst = instructors.find(i => i.id === id);
    if (!inst) return;
    setSelectedId(id);
    setForm({ ...inst });
  };

  const startNew = () => {
    setSelectedId(null);
    setForm(blankForm());
  };

  const handleSave = () => {
    if (!form.name.trim()) return;
    if (selectedId) {
      updateInstructor(selectedId, form);
    } else {
      addInstructor(form);
    }
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1500);
  };

  const inputCls = "w-full border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 placeholder:text-slate-400 text-sm focus:outline-none focus:border-cyan-500 transition-colors bg-white";
  const labelCls = "block text-xs text-slate-500 mb-1 font-medium";

  return (
    <div className="flex h-full bg-slate-50">
      {/* ── 좌측: 직원 목록 ── */}
      <div className="w-72 shrink-0 border-r border-slate-200 bg-white flex flex-col">
        <div className="p-4 border-b border-slate-100 space-y-3">
          <div className="flex items-center gap-2">
            <h1 className="text-slate-800 font-bold text-base flex items-center gap-2"><Users className="w-4 h-4 text-cyan-600" /> 직원 관리</h1>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input className="w-full border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-sm focus:outline-none focus:border-cyan-500 transition-colors"
              placeholder="직원명 검색" value={nameFilter} onChange={e => setNameFilter(e.target.value)} />
          </div>
          <div className="flex bg-slate-50 border border-slate-200 rounded-xl p-1 gap-0.5">
            {([['all', '전체'], ['active', '재직'], ['resigned', '퇴직']] as const).map(([val, label]) => (
              <button key={val} onClick={() => setStatusFilter(val)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${statusFilter === val ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400'}`}>
                {label}
              </button>
            ))}
          </div>
          <button onClick={startNew}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-sm font-semibold transition-colors">
            <UserPlus className="w-4 h-4" /> 신규 직원 입력
          </button>
          <p className="text-slate-400 text-xs">인원: {filtered.length}명</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filtered.map(inst => (
            <button key={inst.id} onClick={() => selectStaff(inst.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left border-b border-slate-50 hover:bg-slate-50 transition-colors ${selectedId === inst.id ? 'bg-cyan-50/60' : ''}`}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ backgroundColor: `${inst.color}20`, color: inst.color }}>{inst.name[0]}</div>
              <div className="flex-1 min-w-0">
                <p className="text-slate-800 text-sm font-medium truncate">{inst.name}</p>
                <p className="text-slate-400 text-[11px]">{inst.jobType} · {inst.position || '-'}</p>
              </div>
              {inst.status === 'resigned' && <span className="text-[10px] text-red-500 border border-red-200 bg-red-50 px-1.5 py-0.5 rounded-full shrink-0">퇴직</span>}
            </button>
          ))}
          {filtered.length === 0 && <p className="text-center text-slate-400 text-sm py-10">해당하는 직원이 없습니다.</p>}
        </div>
      </div>

      {/* ── 우측: 상세 폼 ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-slate-800 font-bold text-lg">{selectedId ? '직원 정보 수정' : '신규 직원 등록'}</h2>
            <div className="flex items-center gap-2">
              {savedFlash && <span className="text-emerald-600 text-xs font-semibold">저장되었어요</span>}
              {selectedId && (
                <button onClick={() => setDeleteConfirm(instructors.find(i => i.id === selectedId) ?? null)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded-xl text-sm font-medium transition-colors">
                  <Trash2 className="w-4 h-4" /> 삭제
                </button>
              )}
              <button onClick={handleSave} disabled={!form.name.trim()}
                className="flex items-center gap-1.5 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-40 text-white rounded-xl text-sm font-semibold transition-colors">
                <Save className="w-4 h-4" /> 저장
              </button>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>이름 *</label>
                <input className={inputCls} value={form.name} onChange={e => set('name', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>닉네임</label>
                <input className={inputCls} value={form.nickname} onChange={e => set('nickname', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>휴대폰</label>
                <input className={inputCls} placeholder="010-0000-0000" value={form.phone} onChange={e => set('phone', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>학원전화 / 내선번호</label>
                <div className="flex gap-2">
                  <input className={inputCls} placeholder="02-000-0000" value={form.officePhone} onChange={e => set('officePhone', e.target.value)} />
                  <input className={`${inputCls} w-24`} placeholder="내선" value={form.extNumber} onChange={e => set('extNumber', e.target.value)} />
                </div>
              </div>
              <div>
                <label className={labelCls}>입사일자</label>
                <input type="date" className={inputCls} value={form.hireDate} onChange={e => set('hireDate', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>재직 상태</label>
                <div className="flex gap-2">
                  {(['active', 'resigned'] as const).map(s => (
                    <button key={s} type="button" onClick={() => set('status', s)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors ${form.status === s ? 'bg-cyan-600 border-cyan-600 text-white' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                      {s === 'active' ? '재직' : '퇴직'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>직책</label>
                <input className={inputCls} placeholder="예: 팀장, 수석강사" value={form.position} onChange={e => set('position', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>업무부서</label>
                <input className={inputCls} placeholder="예: 강습팀" value={form.department} onChange={e => set('department', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>업무구분</label>
                <select className={`${inputCls} cursor-pointer`} value={form.jobType} onChange={e => set('jobType', e.target.value as Instructor['jobType'])}>
                  {(['강사', '데스크', '원장', '관리'] as const).map(j => <option key={j}>{j}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>고용 형태</label>
                <div className="flex gap-2">
                  {(['정규', '파트'] as const).map(t => (
                    <button key={t} type="button" onClick={() => set('type', t)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors ${form.type === t ? 'bg-cyan-600 border-cyan-600 text-white' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {form.jobType === '강사' && (
              <div className="grid grid-cols-2 gap-3 bg-cyan-50/40 border border-cyan-100 rounded-xl p-4">
                <div>
                  <label className={labelCls}>스케줄 색상</label>
                  <input type="color" value={form.color} onChange={e => set('color', e.target.value)} className="w-full h-10 rounded-lg cursor-pointer border-none bg-transparent" />
                </div>
                <div>
                  <label className={labelCls}>1타임 정원 (수업당 최대 인원)</label>
                  <input type="number" min={1} className={inputCls} value={form.maxCapacity} onChange={e => set('maxCapacity', parseInt(e.target.value) || 1)} />
                </div>
              </div>
            )}

            <div>
              <label className={labelCls}>근무 요일</label>
              <div className="flex gap-2">
                {DAYS.map(d => (
                  <button key={d} type="button" onClick={() => toggleWorkDay(d)}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors ${form.workDays.includes(d) ? 'bg-cyan-600 border-cyan-600 text-white' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>근무 시작시간</label>
                <input type="time" className={inputCls} value={form.workTimeStart} onChange={e => set('workTimeStart', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>근무 종료시간</label>
                <input type="time" className={inputCls} value={form.workTimeEnd} onChange={e => set('workTimeEnd', e.target.value)} />
              </div>
            </div>

            <div>
              <label className={labelCls}>담당업무</label>
              <input className={inputCls} placeholder="예: 초급반 총괄, 신입 강사 교육" value={form.dutyNote} onChange={e => set('dutyNote', e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>차량번호</label>
                <input className={inputCls} value={form.vehicleNumber} onChange={e => set('vehicleNumber', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>주소</label>
                <input className={inputCls} value={form.address} onChange={e => set('address', e.target.value)} />
              </div>
            </div>

            <div>
              <label className={labelCls}>메모 (취미/특기 등)</label>
              <textarea className={`${inputCls} resize-none`} rows={2} value={form.memo} onChange={e => set('memo', e.target.value)} />
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button onClick={() => window.print()} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors">
              <Printer className="w-3.5 h-3.5" /> 직원 정보 인쇄
            </button>
          </div>
        </div>
      </div>

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-sm shadow-xl p-6 space-y-4">
            <div>
              <h3 className="text-slate-800 font-semibold">직원 삭제</h3>
              <p className="text-slate-500 text-sm mt-1">{deleteConfirm.name} 님을 삭제합니다. 이미 배정된 강습생·수업 데이터는 그대로 남아있으니, 담당 강사를 먼저 변경해주세요.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-slate-600 text-sm hover:bg-slate-50 transition-colors">취소</button>
              <button onClick={() => { deleteInstructor(deleteConfirm.id); setDeleteConfirm(null); startNew(); }} className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-medium transition-colors">삭제</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
