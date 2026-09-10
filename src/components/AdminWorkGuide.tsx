import { useState } from 'react';
import { useStore } from '../store/StoreContext';
import type { IncentiveFormulaRule } from '../store/StoreContext';
import { BookOpen, Wallet, Users, ClipboardCheck, Waves, CalendarClock, Repeat, ArrowRight, Plus, X } from 'lucide-react';

const inputCls = 'w-full border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-400 transition-colors bg-white';

function SectionCard({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
      <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2">
        <Icon className="w-4 h-4 text-cyan-600" />
        <h3 className="text-sm font-bold text-slate-700">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

export default function AdminWorkGuide({ onNavigate }: { onNavigate?: (tab: string) => void }) {
  const { settings, updateSettings, instructors } = useStore();
  const [policyDraft, setPolicyDraft] = useState({
    reRegStart: settings.reRegistrationPeriod.startDay, reRegEnd: settings.reRegistrationPeriod.endDay,
    newRegStart: settings.newRegistrationPeriod.startDay, newRegEnd: settings.newRegistrationPeriod.endDay,
  });
  const [payrollDraft, setPayrollDraft] = useState({
    baseSalaryDefault: settings.payrollSettings.baseSalaryDefault,
    overtimeHourlyRate: settings.payrollSettings.overtimeHourlyRate,
  });
  const [newTaskText, setNewTaskText] = useState<Record<string, string>>({});

  const teachingCount = instructors.filter(i => i.status === 'active' && i.jobType === '강사').length;

  const updateIncentiveRule = (idx: number, patch: Partial<IncentiveFormulaRule>) => {
    const rules = [...settings.payrollSettings.incentiveFormulaRules];
    rules[idx] = { ...rules[idx], ...patch };
    updateSettings({ payrollSettings: { ...settings.payrollSettings, incentiveFormulaRules: rules } });
  };
  const addIncentiveRule = () => {
    updateSettings({ payrollSettings: { ...settings.payrollSettings, incentiveFormulaRules: [...settings.payrollSettings.incentiveFormulaRules, { id: `ifr_${Date.now()}`, label: '새 규칙', metric: 'reRegRate', comparator: 'gte', threshold: 0, amount: 0 }] } });
  };
  const deleteIncentiveRule = (idx: number) => {
    updateSettings({ payrollSettings: { ...settings.payrollSettings, incentiveFormulaRules: settings.payrollSettings.incentiveFormulaRules.filter((_, i) => i !== idx) } });
  };

  const addTask = (role: string) => {
    const text = (newTaskText[role] ?? '').trim();
    if (!text) return;
    const next = settings.roleGuides.map(rg => rg.role === role ? { ...rg, tasks: [...rg.tasks, { id: `rt_${Date.now()}`, text }] } : rg);
    updateSettings({ roleGuides: next });
    setNewTaskText(prev => ({ ...prev, [role]: '' }));
  };
  const deleteTask = (role: string, taskId: string) => {
    const next = settings.roleGuides.map(rg => rg.role === role ? { ...rg, tasks: rg.tasks.filter(t => t.id !== taskId) } : rg);
    updateSettings({ roleGuides: next });
  };
  const editTask = (role: string, taskId: string, text: string) => {
    const next = settings.roleGuides.map(rg => rg.role === role ? { ...rg, tasks: rg.tasks.map(t => t.id === taskId ? { ...t, text } : t) } : rg);
    updateSettings({ roleGuides: next });
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="shrink-0 px-6 py-4 bg-white border-b border-slate-200">
        <h1 className="text-lg font-bold text-slate-800 flex items-center gap-2"><BookOpen className="w-5 h-5 text-cyan-600" /> 업무 안내</h1>
        <p className="text-slate-400 text-xs mt-0.5">급여·업무·체크리스트·운영 방침을 한 곳에서 설정·확인하는 페이지예요.</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-6 space-y-5">

          <SectionCard icon={Repeat} title="운영 방침">
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-slate-500 mb-1.5 font-medium">청구·보강 운영 방식</label>
                <div className="flex gap-2">
                  <button onClick={() => updateSettings({ operatingMode: 'standard' })}
                    className={`flex-1 px-3 py-2.5 rounded-xl text-sm font-bold border transition-colors ${settings.operatingMode === 'standard' ? 'bg-cyan-600 border-cyan-600 text-white' : 'bg-white border-slate-200 text-slate-500 hover:border-cyan-300'}`}>
                    기존 방식 (달력 정확 계산)
                  </button>
                  <button onClick={() => updateSettings({ operatingMode: 'fiveWeek' })}
                    className={`flex-1 px-3 py-2.5 rounded-xl text-sm font-bold border transition-colors ${settings.operatingMode === 'fiveWeek' ? 'bg-cyan-600 border-cyan-600 text-white' : 'bg-white border-slate-200 text-slate-500 hover:border-cyan-300'}`}>
                    5주차 대체보강 방식
                  </button>
                </div>
                <p className="text-slate-400 text-xs mt-1.5">
                  {settings.operatingMode === 'standard'
                    ? '지금처럼 그 달 실제 수업일수(공휴일 제외)만큼만 청구해요.'
                    : '금액은 표준 회차(주1회=4일/주2회=8일)로 고정하고, 부족한 달은 대체보강일로 채워줘요. 연간 대체보강일 계획 생성은 스케줄 관리 > 시간표 및 강사 색상 설정에서 할 수 있어요.'}
                </p>
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                <input type="checkbox" checked={settings.annualLeaveEnabled} className="w-4 h-4 accent-cyan-600"
                  onChange={e => updateSettings({ annualLeaveEnabled: e.target.checked })} />
                강사에게 연차 지급 (끄면 직원 관리에서 연차 관련 화면이 숨겨져요)
              </label>
            </div>
          </SectionCard>

          <SectionCard icon={CalendarClock} title="재등록·신규 결제 기간 설정">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1 font-medium">재등록 결제 기간</label>
                <div className="flex items-center gap-1.5">
                  <input type="number" min={1} max={31} className={`${inputCls} w-16`} value={policyDraft.reRegStart}
                    onChange={e => setPolicyDraft({ ...policyDraft, reRegStart: parseInt(e.target.value) || 1 })}
                    onBlur={() => updateSettings({ reRegistrationPeriod: { startDay: policyDraft.reRegStart, endDay: policyDraft.reRegEnd } })} />
                  <span className="text-slate-400 text-xs">일 ~</span>
                  <input type="number" min={1} max={31} className={`${inputCls} w-16`} value={policyDraft.reRegEnd}
                    onChange={e => setPolicyDraft({ ...policyDraft, reRegEnd: parseInt(e.target.value) || 1 })}
                    onBlur={() => updateSettings({ reRegistrationPeriod: { startDay: policyDraft.reRegStart, endDay: policyDraft.reRegEnd } })} />
                  <span className="text-slate-400 text-xs">일</span>
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1 font-medium">신규 결제 기간</label>
                <div className="flex items-center gap-1.5">
                  <input type="number" min={1} max={31} className={`${inputCls} w-16`} value={policyDraft.newRegStart}
                    onChange={e => setPolicyDraft({ ...policyDraft, newRegStart: parseInt(e.target.value) || 1 })}
                    onBlur={() => updateSettings({ newRegistrationPeriod: { startDay: policyDraft.newRegStart, endDay: policyDraft.newRegEnd } })} />
                  <span className="text-slate-400 text-xs">일 ~</span>
                  <input type="number" min={1} max={31} className={`${inputCls} w-16`} value={policyDraft.newRegEnd}
                    onChange={e => setPolicyDraft({ ...policyDraft, newRegEnd: parseInt(e.target.value) || 1 })}
                    onBlur={() => updateSettings({ newRegistrationPeriod: { startDay: policyDraft.newRegStart, endDay: policyDraft.newRegEnd } })} />
                  <span className="text-slate-400 text-xs">일</span>
                </div>
              </div>
            </div>
            <p className="text-slate-400 text-xs mt-3">재등록 기간 시작일에 학부모 앱으로 안내 알림이 자동 발송돼요 (문구는 시스템 설정에서 편집).</p>
          </SectionCard>

          <SectionCard icon={Wallet} title="급여·인센티브 기준 (전체 기준 — 개별 직원 금액은 직원 관리에서 조정)">
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-xs text-slate-500 mb-1 font-medium">신규 정규직 기본급</label>
                <input type="number" min={0} step={10000} className={inputCls} value={payrollDraft.baseSalaryDefault}
                  onChange={e => setPayrollDraft({ ...payrollDraft, baseSalaryDefault: parseInt(e.target.value) || 0 })}
                  onBlur={() => updateSettings({ payrollSettings: { ...settings.payrollSettings, baseSalaryDefault: payrollDraft.baseSalaryDefault } })} />
                <p className="text-slate-400 text-[11px] mt-1">신규 직원 등록 시 월급 입력칸에 기본값으로 표시돼요.</p>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1 font-medium">추가 근무 시간당 단가</label>
                <input type="number" min={0} step={1000} className={inputCls} value={payrollDraft.overtimeHourlyRate}
                  onChange={e => setPayrollDraft({ ...payrollDraft, overtimeHourlyRate: parseInt(e.target.value) || 0 })}
                  onBlur={() => updateSettings({ payrollSettings: { ...settings.payrollSettings, overtimeHourlyRate: payrollDraft.overtimeHourlyRate } })} />
              </div>
            </div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs font-semibold text-slate-600">인센티브 자동 계산 규칙</p>
              <button onClick={addIncentiveRule} className="flex items-center gap-1 text-cyan-700 text-xs font-semibold hover:text-cyan-800">
                <Plus className="w-3.5 h-3.5" /> 규칙 추가
              </button>
            </div>
            <div className="space-y-2">
              {settings.payrollSettings.incentiveFormulaRules.map((rule, idx) => (
                <div key={rule.id} className="flex items-center gap-1.5 flex-wrap">
                  <input value={rule.label} onChange={e => updateIncentiveRule(idx, { label: e.target.value })}
                    className="w-28 border border-slate-200 rounded-lg px-2 py-1.5 text-xs" placeholder="규칙명" />
                  <select value={rule.metric} onChange={e => updateIncentiveRule(idx, { metric: e.target.value as IncentiveFormulaRule['metric'] })}
                    className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs">
                    <option value="reRegRate">재등록률</option>
                    <option value="withdrawalRate">퇴원률</option>
                    <option value="revenue">담당 매출</option>
                  </select>
                  <select value={rule.comparator} onChange={e => updateIncentiveRule(idx, { comparator: e.target.value as IncentiveFormulaRule['comparator'] })}
                    className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs">
                    <option value="gte">이상</option>
                    <option value="lte">이하</option>
                  </select>
                  <input type="number" value={rule.threshold} onChange={e => updateIncentiveRule(idx, { threshold: parseInt(e.target.value) || 0 })}
                    className="w-20 border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-right" placeholder="기준값" />
                  <span className="text-slate-400 text-xs shrink-0">{rule.metric === 'revenue' ? '원' : '%'} 이면</span>
                  <input type="number" value={rule.amount} onChange={e => updateIncentiveRule(idx, { amount: parseInt(e.target.value) || 0 })}
                    className="w-24 border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-right" placeholder="지급액" />
                  <span className="text-slate-400 text-xs shrink-0">원 지급</span>
                  <button onClick={() => deleteIncentiveRule(idx)} className="text-red-400 hover:text-red-600 shrink-0"><X className="w-3.5 h-3.5" /></button>
                </div>
              ))}
              {settings.payrollSettings.incentiveFormulaRules.length === 0 && <p className="text-xs text-slate-300">설정된 규칙이 없습니다.</p>}
            </div>
            <p className="text-slate-400 text-xs mt-3">개별 직원의 월급·인센티브는 직원 관리 &gt; 직원 정보에서 각자 다르게 조정할 수 있어요.</p>
          </SectionCard>

          <SectionCard icon={Users} title="역할별 업무 내용 (강사·차량·데스크)">
            <div className="space-y-5">
              {settings.roleGuides.map(rg => (
                <div key={rg.role}>
                  <p className="text-sm font-bold text-slate-700 mb-2">{rg.role}</p>
                  <div className="space-y-1.5 mb-2">
                    {rg.tasks.map(task => (
                      <div key={task.id} className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
                        <input value={task.text} onChange={e => editTask(rg.role, task.id, e.target.value)}
                          className="flex-1 bg-transparent text-sm text-slate-700 focus:outline-none" />
                        <button onClick={() => deleteTask(rg.role, task.id)} className="text-red-400 hover:text-red-600 shrink-0"><X className="w-3.5 h-3.5" /></button>
                      </div>
                    ))}
                    {rg.tasks.length === 0 && <p className="text-slate-300 text-xs">등록된 업무가 없습니다.</p>}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input value={newTaskText[rg.role] ?? ''} onChange={e => setNewTaskText(prev => ({ ...prev, [rg.role]: e.target.value }))}
                      onKeyDown={e => { if (e.key === 'Enter') addTask(rg.role); }}
                      placeholder="새 업무 입력 후 추가" className={`${inputCls} flex-1`} />
                    <button onClick={() => addTask(rg.role)} className="shrink-0 flex items-center gap-1 px-3 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-sm font-medium transition-colors">
                      <Plus className="w-3.5 h-3.5" /> 추가
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-slate-400 text-xs mt-4">등록한 업무는 각 역할로 로그인한 강사 앱(강사·데스크는 강사 앱, 차량은 기사 앱)의 "내 업무"에 바로 표시돼요.</p>
          </SectionCard>

          <SectionCard icon={ClipboardCheck} title="케어팀 체크리스트 · 비품 관리">
            <p className="text-slate-500 text-sm mb-3">일간·주간·월간·분기별 청소 체크리스트와 비품 입출고·잔여수량을 관리해요.</p>
            <button onClick={() => onNavigate?.('care-ops')}
              className="flex items-center gap-1.5 text-cyan-700 text-sm font-semibold hover:text-cyan-800">
              케어팀·비품 관리 화면으로 이동 <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </SectionCard>

          <SectionCard icon={Waves} title="자유수영 시간 안내">
            <div className="space-y-1.5">
              {settings.freeSwimSlots.map(slot => (
                <p key={slot.id} className="text-sm text-slate-600">{slot.days.join('·')} {slot.startTime}~{slot.endTime}</p>
              ))}
              {settings.freeSwimSlots.length === 0 && <p className="text-slate-300 text-sm">등록된 자유수영 시간이 없습니다.</p>}
            </div>
          </SectionCard>

          <SectionCard icon={CalendarClock} title="연차 기준">
            {settings.annualLeaveEnabled ? (
              <div className="space-y-1 text-sm text-slate-600">
                <p>연차(종일) 1일 차감, 반차 0.5일 차감, 반반차 0.25일 차감</p>
                <p className="text-slate-400 text-xs">연차·근무불가 승인은 원장·팀장만 할 수 있어요. 현재 강사 {teachingCount}명이 연차 대상입니다.</p>
              </div>
            ) : (
              <p className="text-slate-400 text-sm">이 학원은 연차를 지급하지 않아요 (근무 불가일만 등록).</p>
            )}
          </SectionCard>

        </div>
      </div>
    </div>
  );
}
