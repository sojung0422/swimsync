import { useState } from 'react';
import { useStore, computeMonthlyHours, computeFreelancerPay } from '../store/StoreContext';
import type { Instructor, RateSlot, StaffRole } from '../store/StoreContext';
import { Search, UserPlus, Save, Trash2, Users, Printer, Wallet, FileText, ChevronDown, ChevronUp, X, Plus, Settings2 } from 'lucide-react';
import { format } from 'date-fns';

const DAYS = ['월', '화', '수', '목', '금', '토', '일'];
const STAFF_ROLES: StaffRole[] = ['원장', '팀장', '주임', '사원', '데스크', '차량', '프리랜서'];

type StaffForm = Omit<Instructor, 'id'>;

const blankForm = (): StaffForm => ({
  name: '', nickname: '', maxCapacity: 5, type: '정규', color: '#0891b2',
  jobType: '강사', role: '사원', phone: '', officePhone: '', extNumber: '',
  hireDate: new Date().toISOString().slice(0, 10), position: '', department: '',
  workDays: [], workTimeStart: '13:00', workTimeEnd: '21:00',
  dutyNote: '', vehicleNumber: '', address: '', memo: '', status: 'active',
  monthlySalary: 0, hourlyRate: 0, rateSlots: [], annualLeaveTotal: 15, annualLeaveUsed: 0,
});

// ─── 급여 정산 ──────────────────────────────────────────────────────────────

function PayslipModal({ instructor, record, onClose }: { instructor: Instructor; record: { month: string; payType: '정규' | '파트'; baseAmount: number; hourlyRate: number; hoursWorked: number; incentiveAmount: number; overtimeHours: number; overtimeAmount: number; campIncentive: number; survivalSwimIncentive: number; privateLessonFee: number; totalAmount: number; issuedAt: string }; onClose: () => void }) {
  const { settings } = useStore();
  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:bg-white print:static">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-xl print:shadow-none print:border-0">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 print:hidden">
          <h2 className="text-[15px] font-semibold text-slate-800">급여 명세서</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-8 space-y-5">
          <div className="text-center pb-4 border-b-2 border-slate-800">
            <p className="text-slate-400 text-xs">{settings.academyName} · {settings.branchName}</p>
            <h3 className="text-xl font-bold text-slate-900 mt-1">{record.month} 급여 명세서</h3>
          </div>
          <div className="grid grid-cols-2 gap-y-2 text-sm">
            <span className="text-slate-400">성명</span><span className="text-slate-800 font-medium text-right">{instructor.name}</span>
            <span className="text-slate-400">직책</span><span className="text-slate-800 font-medium text-right">{instructor.position || '-'}</span>
            <span className="text-slate-400">고용 형태</span><span className="text-slate-800 font-medium text-right">{record.payType}</span>
          </div>
          <div className="border-t border-dashed border-slate-200 pt-4 space-y-2 text-sm">
            {record.payType === '정규' ? (
              <div className="flex justify-between"><span className="text-slate-500">기본급(월급)</span><span className="text-slate-800 font-medium">{record.baseAmount.toLocaleString()}원</span></div>
            ) : (
              <>
                <div className="flex justify-between"><span className="text-slate-500">시급 기준 지급액</span><span className="text-slate-800 font-medium">{record.baseAmount.toLocaleString()}원</span></div>
                <div className="flex justify-between"><span className="text-slate-500">근무 시간</span><span className="text-slate-800 font-medium">{record.hoursWorked}시간</span></div>
              </>
            )}
            {record.incentiveAmount > 0 && (
              <div className="flex justify-between"><span className="text-slate-500">인센티브</span><span className="text-slate-800 font-medium">+{record.incentiveAmount.toLocaleString()}원</span></div>
            )}
            {record.overtimeHours > 0 && (
              <div className="flex justify-between"><span className="text-slate-500">추가 근무 ({record.overtimeHours}시간)</span><span className="text-slate-800 font-medium">+{record.overtimeAmount.toLocaleString()}원</span></div>
            )}
            {record.campIncentive > 0 && (
              <div className="flex justify-between"><span className="text-slate-500">방학특강 수당</span><span className="text-slate-800 font-medium">+{record.campIncentive.toLocaleString()}원</span></div>
            )}
            {record.survivalSwimIncentive > 0 && (
              <div className="flex justify-between"><span className="text-slate-500">생존수영 수당</span><span className="text-slate-800 font-medium">+{record.survivalSwimIncentive.toLocaleString()}원</span></div>
            )}
            {record.privateLessonFee > 0 && (
              <div className="flex justify-between"><span className="text-slate-500">개인 수업 지도료</span><span className="text-slate-800 font-medium">+{record.privateLessonFee.toLocaleString()}원</span></div>
            )}
          </div>
          <div className="border-t-2 border-slate-800 pt-4 flex justify-between items-center">
            <span className="text-slate-700 font-bold">지급 총액</span>
            <span className="text-slate-900 font-bold text-xl">{record.totalAmount.toLocaleString()}원</span>
          </div>
          <p className="text-slate-300 text-[11px] text-center pt-2">발행일: {record.issuedAt}</p>
        </div>
        <div className="p-6 pt-0 print:hidden">
          <button onClick={() => window.print()} className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-medium transition-colors">
            <Printer className="w-4 h-4" /> 명세서 인쇄 / PDF 저장
          </button>
        </div>
      </div>
    </div>
  );
}

function PayrollSettingsCard() {
  const { settings, updatePayrollSettings } = useStore();
  const [open, setOpen] = useState(false);
  const ps = settings.payrollSettings;
  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between px-5 py-3.5 text-left">
        <span className="flex items-center gap-2 text-slate-700 text-sm font-semibold"><Settings2 className="w-4 h-4 text-cyan-600" /> 급여 계산 기준 설정</span>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>
      {open && (
        <div className="px-5 pb-5 border-t border-slate-100 pt-4 space-y-4">
          <div>
            <label className="block text-xs text-slate-500 mb-1 font-medium">신규 정규직 기본급 제안값</label>
            <input type="number" min={0} step={10000} value={ps.baseSalaryDefault}
              onChange={e => updatePayrollSettings({ baseSalaryDefault: parseInt(e.target.value) || 0 })}
              className="w-48 border border-slate-200 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1 font-medium">추가 근무 시간당 단가</label>
            <input type="number" min={0} step={1000} value={ps.overtimeHourlyRate}
              onChange={e => updatePayrollSettings({ overtimeHourlyRate: parseInt(e.target.value) || 0 })}
              className="w-48 border border-slate-200 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs text-slate-500 font-medium">인센티브 항목</label>
              <button onClick={() => updatePayrollSettings({ incentiveRules: [...ps.incentiveRules, { id: `inc_${Date.now()}`, label: '새 항목', amount: 0 }] })}
                className="flex items-center gap-1 text-cyan-700 text-xs font-semibold hover:text-cyan-800">
                <Plus className="w-3.5 h-3.5" /> 항목 추가
              </button>
            </div>
            <div className="space-y-2">
              {ps.incentiveRules.map((rule, idx) => (
                <div key={rule.id} className="flex items-center gap-2">
                  <input value={rule.label} onChange={e => { const rules = [...ps.incentiveRules]; rules[idx] = { ...rule, label: e.target.value }; updatePayrollSettings({ incentiveRules: rules }); }}
                    className="flex-1 border border-slate-200 rounded-lg px-2 py-1.5 text-xs" placeholder="항목명" />
                  <input type="number" value={rule.amount} onChange={e => { const rules = [...ps.incentiveRules]; rules[idx] = { ...rule, amount: parseInt(e.target.value) || 0 }; updatePayrollSettings({ incentiveRules: rules }); }}
                    className="w-28 border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-right" placeholder="금액" />
                  <span className="text-slate-400 text-xs shrink-0">원</span>
                  <button onClick={() => updatePayrollSettings({ incentiveRules: ps.incentiveRules.filter((_, i) => i !== idx) })} className="text-red-400 hover:text-red-600 shrink-0">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PayrollView() {
  const { instructors, classes, payrollRecords, issuePayroll, settings } = useStore();
  const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [payslipTarget, setPayslipTarget] = useState<{ instructor: Instructor; record: typeof payrollRecords[number] } | null>(null);
  const [hoursDraft, setHoursDraft] = useState<Record<string, number>>({});
  const [incentiveDraft, setIncentiveDraft] = useState<Record<string, number>>({});
  const [overtimeDraft, setOvertimeDraft] = useState<Record<string, number>>({});
  const [campDraft, setCampDraft] = useState<Record<string, number>>({});
  const [survivalDraft, setSurvivalDraft] = useState<Record<string, number>>({});
  const [privateLessonDraft, setPrivateLessonDraft] = useState<Record<string, number>>({});

  const activeInstructors = instructors.filter(i => i.status === 'active');

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-4xl mx-auto p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-slate-800 font-bold text-lg">급여 정산 — {month}</h2>
          <input type="month" value={month} onChange={e => setMonth(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500 transition-colors" />
        </div>
        <p className="text-slate-400 text-xs -mt-2">정규직은 기본급+인센티브+추가근무로, 파트(프리랜서)는 요일·시간대별 단가를 실제 배정된 수업에 매칭해 자동 계산해요. 발행 전 값을 직접 조정할 수 있어요.</p>

        <PayrollSettingsCard />

        <div className="space-y-2.5">
          {activeInstructors.length === 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl py-16 text-center text-slate-400 text-sm">재직 중인 직원이 없습니다.</div>
          )}
          {activeInstructors.map(inst => {
            const estimatedHours = computeMonthlyHours(inst, month);
            const hours = hoursDraft[inst.id] ?? estimatedHours;
            const freelancerCalc = computeFreelancerPay(inst, classes, month);
            const baseAmount = inst.type === '정규' ? inst.monthlySalary : (hoursDraft[inst.id] !== undefined ? Math.round(inst.hourlyRate * hours) : freelancerCalc.amount);
            const incentiveAmount = incentiveDraft[inst.id] ?? 0;
            const overtimeHours = overtimeDraft[inst.id] ?? 0;
            const overtimeAmount = Math.round(overtimeHours * settings.payrollSettings.overtimeHourlyRate);
            const campIncentive = campDraft[inst.id] ?? 0;
            const survivalSwimIncentive = survivalDraft[inst.id] ?? 0;
            const privateLessonFee = privateLessonDraft[inst.id] ?? 0;
            const totalAmount = baseAmount + incentiveAmount + overtimeAmount + campIncentive + survivalSwimIncentive + privateLessonFee;
            const issued = payrollRecords.find(p => p.instructorId === inst.id && p.month === month);
            const isExpanded = expandedId === inst.id;
            return (
              <div key={inst.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                <div className="px-5 py-4 flex items-center gap-4">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ backgroundColor: `${inst.color}20`, color: inst.color }}>{inst.name[0]}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-slate-800 text-sm font-semibold">{inst.name}</p>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-slate-50 text-slate-500 border-slate-200">{inst.type}</span>
                      {issued && <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-emerald-50 text-emerald-700 border-emerald-200">이번 달 발행됨</span>}
                    </div>
                    <p className="text-slate-400 text-xs mt-0.5">
                      {inst.type === '정규' ? `월급 ${inst.monthlySalary.toLocaleString()}원` : `이번 달 배정 수업 ${freelancerCalc.hours}시간 기준 자동 계산`}
                    </p>
                  </div>
                  <p className="text-slate-800 text-base font-bold shrink-0">{totalAmount.toLocaleString()}원</p>
                  <button onClick={() => setExpandedId(isExpanded ? null : inst.id)} className="text-slate-400 hover:text-slate-700 transition-colors p-1 shrink-0">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
                {isExpanded && (
                  <div className="px-5 pb-4 border-t border-slate-100 pt-4 animate-fade-up space-y-3">
                    {inst.type === '파트' && (
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-slate-500 font-medium">근무 시간 수동 조정 (비워두면 자동 계산 사용)</label>
                        <input type="number" min={0} step={0.5} value={hours}
                          onChange={e => setHoursDraft(prev => ({ ...prev, [inst.id]: parseFloat(e.target.value) || 0 }))}
                          className="w-24 border border-slate-200 rounded-lg px-2 py-1.5 text-sm text-center" />
                        <span className="text-slate-400 text-xs">시간</span>
                      </div>
                    )}
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-slate-500 font-medium">인센티브</label>
                        <input type="number" min={0} step={1000} value={incentiveAmount}
                          onChange={e => setIncentiveDraft(prev => ({ ...prev, [inst.id]: parseInt(e.target.value) || 0 }))}
                          className="w-28 border border-slate-200 rounded-lg px-2 py-1.5 text-sm text-right" />
                        <span className="text-slate-400 text-xs">원</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-slate-500 font-medium">추가 근무</label>
                        <input type="number" min={0} step={0.5} value={overtimeHours}
                          onChange={e => setOvertimeDraft(prev => ({ ...prev, [inst.id]: parseFloat(e.target.value) || 0 }))}
                          className="w-20 border border-slate-200 rounded-lg px-2 py-1.5 text-sm text-center" />
                        <span className="text-slate-400 text-xs">시간</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-slate-500 font-medium">방학특강 수당</label>
                        <input type="number" min={0} step={1000} value={campIncentive}
                          onChange={e => setCampDraft(prev => ({ ...prev, [inst.id]: parseInt(e.target.value) || 0 }))}
                          className="w-28 border border-slate-200 rounded-lg px-2 py-1.5 text-sm text-right" />
                        <span className="text-slate-400 text-xs">원</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-slate-500 font-medium">생존수영 수당</label>
                        <input type="number" min={0} step={1000} value={survivalSwimIncentive}
                          onChange={e => setSurvivalDraft(prev => ({ ...prev, [inst.id]: parseInt(e.target.value) || 0 }))}
                          className="w-28 border border-slate-200 rounded-lg px-2 py-1.5 text-sm text-right" />
                        <span className="text-slate-400 text-xs">원</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-slate-500 font-medium">개인 수업 지도료</label>
                        <input type="number" min={0} step={1000} value={privateLessonFee}
                          onChange={e => setPrivateLessonDraft(prev => ({ ...prev, [inst.id]: parseInt(e.target.value) || 0 }))}
                          className="w-28 border border-slate-200 rounded-lg px-2 py-1.5 text-sm text-right" />
                        <span className="text-slate-400 text-xs">원</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => issuePayroll(inst.id, month, { hoursOverride: inst.type === '파트' ? hoursDraft[inst.id] : undefined, incentiveAmount, overtimeHours, campIncentive, survivalSwimIncentive, privateLessonFee })}
                        className="flex items-center gap-1.5 px-3 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-medium transition-colors">
                        <Wallet className="w-3.5 h-3.5" /> {issued ? '재발행' : '명세서 발행'}
                      </button>
                      {issued && (
                        <button onClick={() => setPayslipTarget({ instructor: inst, record: issued })}
                          className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-xl text-xs font-medium transition-colors">
                          <FileText className="w-3.5 h-3.5" /> 명세서 보기
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {payslipTarget && <PayslipModal instructor={payslipTarget.instructor} record={payslipTarget.record} onClose={() => setPayslipTarget(null)} />}
    </div>
  );
}

export default function AdminStaff() {
  const { instructors, addInstructor, updateInstructor, deleteInstructor, payrollRecords } = useStore();
  const [mode, setMode] = useState<'info' | 'payroll'>('info');
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
    <div className="flex flex-col h-full bg-slate-50">
      <div className="shrink-0 flex border-b border-slate-200 bg-white px-6">
        <button onClick={() => setMode('info')}
          className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${mode === 'info' ? 'border-cyan-600 text-cyan-700' : 'border-transparent text-slate-400 hover:text-slate-700'}`}>
          <Users className="w-4 h-4" /> 직원 정보
        </button>
        <button onClick={() => setMode('payroll')}
          className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${mode === 'payroll' ? 'border-cyan-600 text-cyan-700' : 'border-transparent text-slate-400 hover:text-slate-700'}`}>
          <Wallet className="w-4 h-4" /> 급여 정산
        </button>
      </div>

      {mode === 'payroll' ? <PayrollView /> : (
    <div className="flex flex-1 min-h-0 bg-slate-50">
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
          {/* 상단 직원별 빠른 선택 스트립 */}
          <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-4 -mt-1">
            {instructors.filter(i => i.status === 'active').map(inst => (
              <button key={inst.id} onClick={() => selectStaff(inst.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border shrink-0 transition-colors ${selectedId === inst.id ? 'bg-cyan-50 border-cyan-300' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ backgroundColor: `${inst.color}20`, color: inst.color }}>{inst.name[0]}</div>
                <span className={`text-sm font-medium whitespace-nowrap ${selectedId === inst.id ? 'text-cyan-700' : 'text-slate-600'}`}>{inst.name}</span>
              </button>
            ))}
          </div>

          {selectedId && (() => {
            const totalPaid = payrollRecords.filter(p => p.instructorId === selectedId).reduce((sum, p) => sum + p.totalAmount, 0);
            const issuedMonths = payrollRecords.filter(p => p.instructorId === selectedId).length;
            return (
              <div className="bg-gradient-to-br from-cyan-600 to-blue-700 rounded-2xl p-5 mb-5 text-white flex items-center justify-between">
                <div>
                  <p className="text-cyan-100 text-xs font-medium">이 직원에게 지급된 누적 금액</p>
                  <p className="text-2xl font-bold mt-1">{totalPaid.toLocaleString()}원</p>
                  <p className="text-cyan-100 text-xs mt-1">{issuedMonths}개월분 명세서 발행</p>
                </div>
                <Wallet className="w-9 h-9 text-cyan-200/60" />
              </div>
            );
          })()}

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
              <div className="col-span-2">
                <label className={labelCls}>권한(역할) — 연차·대타 승인은 원장·팀장만 가능</label>
                <div className="flex flex-wrap gap-2">
                  {STAFF_ROLES.map(r => (
                    <button key={r} type="button" onClick={() => set('role', r)}
                      className={`px-3 py-2 rounded-xl text-sm font-medium border transition-colors ${form.role === r ? 'bg-cyan-600 border-cyan-600 text-white' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                      {r}
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

            <div className="grid grid-cols-2 gap-3 bg-emerald-50/40 border border-emerald-100 rounded-xl p-4">
              {form.type === '정규' ? (
                <>
                  <div>
                    <label className={labelCls}>월급 (기본급)</label>
                    <input type="number" min={0} step={10000} className={inputCls} value={form.monthlySalary} onChange={e => set('monthlySalary', parseInt(e.target.value) || 0)} />
                  </div>
                  <div>
                    <label className={labelCls}>연간 연차 일수</label>
                    <input type="number" min={0} step={1} className={inputCls} value={form.annualLeaveTotal} onChange={e => set('annualLeaveTotal', parseInt(e.target.value) || 0)} />
                    <p className="text-slate-400 text-[11px] mt-1">사용: {form.annualLeaveUsed}일 · 잔여: {form.annualLeaveTotal - form.annualLeaveUsed}일</p>
                  </div>
                </>
              ) : (
                <div className="col-span-2 space-y-3">
                  <div>
                    <label className={labelCls}>기본 시급 (요일·시간대 단가에 매칭 안 될 때 사용)</label>
                    <input type="number" min={0} step={500} className={inputCls} value={form.hourlyRate} onChange={e => set('hourlyRate', parseInt(e.target.value) || 0)} />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className={labelCls + ' mb-0'}>요일·시간대별 단가 (프리랜서)</label>
                      <button type="button"
                        onClick={() => set('rateSlots', [...form.rateSlots, { id: `rs_${Date.now()}`, days: [], startTime: '14:00', endTime: '18:00', hourlyRate: form.hourlyRate || 25000 }])}
                        className="flex items-center gap-1 text-cyan-700 text-xs font-semibold hover:text-cyan-800">
                        <Plus className="w-3.5 h-3.5" /> 단가 구간 추가
                      </button>
                    </div>
                    <div className="space-y-2">
                      {form.rateSlots.map((slot, idx) => (
                        <div key={slot.id} className="bg-white border border-slate-200 rounded-xl p-3 space-y-2">
                          <div className="flex flex-wrap gap-1.5">
                            {DAYS.map(d => (
                              <button key={d} type="button"
                                onClick={() => {
                                  const updated = [...form.rateSlots];
                                  const days = slot.days.includes(d) ? slot.days.filter(x => x !== d) : [...slot.days, d];
                                  updated[idx] = { ...slot, days };
                                  set('rateSlots', updated);
                                }}
                                className={`px-2 py-1 rounded-lg text-xs font-medium border transition-colors ${slot.days.includes(d) ? 'bg-cyan-600 border-cyan-600 text-white' : 'bg-white border-slate-200 text-slate-500'}`}>
                                {d}
                              </button>
                            ))}
                          </div>
                          <div className="flex items-center gap-2">
                            <input type="time" value={slot.startTime} onChange={e => { const updated = [...form.rateSlots]; updated[idx] = { ...slot, startTime: e.target.value }; set('rateSlots', updated); }}
                              className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs" />
                            <span className="text-slate-400 text-xs">~</span>
                            <input type="time" value={slot.endTime} onChange={e => { const updated = [...form.rateSlots]; updated[idx] = { ...slot, endTime: e.target.value }; set('rateSlots', updated); }}
                              className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs" />
                            <input type="number" min={0} step={500} value={slot.hourlyRate} onChange={e => { const updated = [...form.rateSlots]; updated[idx] = { ...slot, hourlyRate: parseInt(e.target.value) || 0 }; set('rateSlots', updated); }}
                              className="flex-1 border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-right" placeholder="시급" />
                            <span className="text-slate-400 text-xs shrink-0">원/시간</span>
                            <button type="button" onClick={() => set('rateSlots', form.rateSlots.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-600 shrink-0">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                      {form.rateSlots.length === 0 && <p className="text-slate-400 text-xs py-2">등록된 단가 구간이 없으면 기본 시급이 모든 수업에 적용돼요.</p>}
                    </div>
                  </div>
                </div>
              )}
              <p className="col-span-2 text-emerald-600 text-xs -mt-1">"급여 정산" 탭에서 이 기준으로 월별 급여를 자동 계산해 명세서를 발행할 수 있어요.</p>
            </div>

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
      )}
    </div>
  );
}
