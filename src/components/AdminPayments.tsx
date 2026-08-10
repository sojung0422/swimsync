import { useState } from 'react';
import { useStore, computeLinearSessionRates } from '../store/StoreContext';
import type { PaymentPlan, MakeupPolicyRule } from '../store/StoreContext';
import {
  CreditCard, Plus, Edit2, Trash2, X, CheckCircle, XCircle,
  ChevronDown, ChevronUp, Waves, AlertCircle, TrendingUp, Users, RefreshCw, Sparkles, Table2
} from 'lucide-react';

// ─── 보강 정책 설정 ────────────────────────────────────────────────────────────

function MakeupPolicyCard() {
  const { settings, updateMakeupSettings } = useStore();
  const { makeupPolicies, childRequiresDocument, adultRequiresDocument } = settings.makeupSettings;
  const [showAdd, setShowAdd] = useState(false);
  const [newSessions, setNewSessions] = useState(2);
  const [newMax, setNewMax] = useState(2);

  const updateRule = (sessionsPerWeek: number, maxMakeups: number) => {
    updateMakeupSettings({
      makeupPolicies: makeupPolicies.map(r => r.sessionsPerWeek === sessionsPerWeek ? { ...r, maxMakeups } : r),
    });
  };

  const deleteRule = (sessionsPerWeek: number) => {
    updateMakeupSettings({ makeupPolicies: makeupPolicies.filter(r => r.sessionsPerWeek !== sessionsPerWeek) });
  };

  const addRule = () => {
    if (makeupPolicies.some(r => r.sessionsPerWeek === newSessions)) return;
    updateMakeupSettings({ makeupPolicies: [...makeupPolicies, { sessionsPerWeek: newSessions, maxMakeups: newMax }].sort((a, b) => a.sessionsPerWeek - b.sessionsPerWeek) });
    setShowAdd(false);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4 text-cyan-600" />
          <h2 className="text-[14px] font-semibold text-slate-700">보강 가능 횟수 정책</h2>
        </div>
        <button onClick={() => setShowAdd(p => !p)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-medium transition-colors">
          <Plus className="w-3.5 h-3.5" /> 규칙 추가
        </button>
      </div>

      <div className="p-6 space-y-3">
        {showAdd && (
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-3">
            <span className="text-xs text-slate-500">주</span>
            <input type="number" min={1} value={newSessions} onChange={e => setNewSessions(parseInt(e.target.value) || 1)}
              className="w-16 border border-slate-200 rounded-lg px-2 py-1.5 text-sm text-center" />
            <span className="text-xs text-slate-500">회 강습 →</span>
            <input type="number" min={0} value={newMax} onChange={e => setNewMax(parseInt(e.target.value) || 0)}
              className="w-16 border border-slate-200 rounded-lg px-2 py-1.5 text-sm text-center" />
            <span className="text-xs text-slate-500">회 보강 가능</span>
            <button onClick={addRule} className="ml-auto px-3 py-1.5 bg-cyan-600 text-white rounded-lg text-xs font-medium">저장</button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {makeupPolicies.map((rule: MakeupPolicyRule) => (
            <div key={rule.sessionsPerWeek} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-sm font-semibold text-slate-700">주 {rule.sessionsPerWeek}회 수강</span>
              <div className="flex items-center gap-2">
                <input type="number" min={0} value={rule.maxMakeups}
                  onChange={e => updateRule(rule.sessionsPerWeek, parseInt(e.target.value) || 0)}
                  className="w-14 border border-slate-200 rounded-lg px-2 py-1 text-sm text-center bg-white" />
                <span className="text-xs text-slate-400">회</span>
                <button onClick={() => deleteRule(rule.sessionsPerWeek)} className="text-slate-300 hover:text-red-500 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-4 pt-2 border-t border-slate-100 mt-2">
          <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
            <input type="checkbox" checked={childRequiresDocument} className="w-4 h-4 accent-cyan-600"
              onChange={e => updateMakeupSettings({ childRequiresDocument: e.target.checked })} />
            아동 보강 시 서류(진단서 등) 필요
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
            <input type="checkbox" checked={adultRequiresDocument} className="w-4 h-4 accent-cyan-600"
              onChange={e => updateMakeupSettings({ adultRequiresDocument: e.target.checked })} />
            성인 보강 시 서류(진단서 등) 필요
          </label>
        </div>
        <p className="text-slate-400 text-xs">서류가 필요한 경우, 학부모 앱에서 즉시 보강 예약 대신 사진 제출 후 강사·학원 승인을 거쳐 보강 또는 이월 처리됩니다.</p>
      </div>
    </div>
  );
}

// ─── Plan Form Modal ──────────────────────────────────────────────────────────

function PlanFormModal({ initial, onClose, onSave, title }: {
  initial?: PaymentPlan; onClose: () => void;
  onSave: (p: Omit<PaymentPlan, 'id'>) => void; title: string;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [category, setCategory] = useState<'adult' | 'child'>(initial?.category ?? 'child');
  const [hasFreeSwim, setHasFreeSwim] = useState(initial?.hasFreeSwim ?? false);
  const [sessionsPerWeek, setSessionsPerWeek] = useState(initial?.sessionsPerWeek ?? 2);
  const [monthlyPrice, setMonthlyPrice] = useState(initial?.monthlyPrice ?? 120000);
  const [description, setDescription] = useState(initial?.description ?? '');
  const [sessionRates, setSessionRates] = useState<number[]>(initial?.sessionRates ?? computeLinearSessionRates(initial?.monthlyPrice ?? 120000, initial?.sessionsPerWeek ?? 2));

  const recalcRates = () => setSessionRates(computeLinearSessionRates(monthlyPrice, sessionsPerWeek));
  const updateRate = (idx: number, val: number) => setSessionRates(rates => rates.map((r, i) => i === idx ? val : r));

  const inputCls = "w-full border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 placeholder:text-slate-400 text-sm focus:outline-none focus:border-cyan-500 transition-colors";
  const labelCls = "block text-xs font-medium text-slate-500 mb-1";

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 sticky top-0 bg-white">
          <h2 className="text-[15px] font-semibold text-slate-800">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className={labelCls}>플랜명 *</label>
            <input className={inputCls} placeholder="예: 아동 주2회" value={name} onChange={e => setName(e.target.value)} />
          </div>

          <div>
            <label className={labelCls}>구분</label>
            <div className="flex gap-2">
              {([['child', '아동'], ['adult', '성인']] as const).map(([val, label]) => (
                <button key={val} type="button" onClick={() => setCategory(val)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors ${category === val ? 'bg-cyan-600 border-cyan-600 text-white' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={labelCls}>자유수영 포함 여부</label>
            <button type="button" onClick={() => setHasFreeSwim(p => !p)}
              className={`flex items-center gap-2 w-full px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors ${hasFreeSwim ? 'bg-cyan-50 border-cyan-200 text-cyan-700' : 'bg-white border-slate-200 text-slate-500'}`}>
              <Waves className="w-4 h-4" />
              {hasFreeSwim ? '자유수영 포함' : '자유수영 미포함'}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>주 강습 횟수</label>
              <div className="flex gap-2">
                {[2, 3, 5].map(n => (
                  <button key={n} type="button" onClick={() => setSessionsPerWeek(n)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors ${sessionsPerWeek === n ? 'bg-cyan-600 border-cyan-600 text-white' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                    주 {n}회
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className={labelCls}>월 수강료 (원)</label>
              <input type="number" className={inputCls} value={monthlyPrice} onChange={e => setMonthlyPrice(parseInt(e.target.value) || 0)} min={0} step={1000} />
            </div>
          </div>

          <div>
            <label className={labelCls}>설명 (선택)</label>
            <input className={inputCls} placeholder="플랜 설명" value={description} onChange={e => setDescription(e.target.value)} />
          </div>

          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
            <p className="text-slate-400 text-xs mb-1">월 예상 수업 횟수</p>
            <p className="text-slate-800 font-bold text-lg">{sessionsPerWeek * 4}회</p>
            <p className="text-slate-500 text-sm mt-0.5">1회당 {sessionsPerWeek > 0 ? Math.round(monthlyPrice / (sessionsPerWeek * 4)).toLocaleString() : 0}원</p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className={labelCls + ' mb-0'}>횟수별 청구 요금 (등록일 기준 일할 계산용, 1회~14회)</label>
              <button type="button" onClick={recalcRates}
                className="flex items-center gap-1 text-cyan-600 hover:text-cyan-700 text-xs font-medium">
                <Sparkles className="w-3 h-3" /> 자동 계산
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {sessionRates.map((rate, i) => (
                <div key={i} className="flex flex-col items-center">
                  <span className="text-[10px] text-slate-400 mb-0.5">{i + 1}회</span>
                  <input type="number" value={rate} onChange={e => updateRate(i, parseInt(e.target.value) || 0)}
                    className="w-full border border-slate-200 rounded-lg px-1 py-1.5 text-slate-700 text-[11px] text-center focus:outline-none focus:border-cyan-500" />
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-slate-600 text-sm hover:bg-slate-50 transition-colors">취소</button>
            <button onClick={() => { if (!name.trim()) return; onSave({ name: name.trim(), category, hasFreeSwim, sessionsPerWeek, monthlyPrice, description, sessionRates }); onClose(); }}
              className="flex-1 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-sm font-medium transition-colors">
              저장
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function AdminPayments() {
  const { paymentPlans, students, addPaymentPlan, updatePaymentPlan, deletePaymentPlan, updateStudent } = useStore();

  const [planModal, setPlanModal] = useState<{ mode: 'add' | 'edit'; plan?: PaymentPlan } | null>(null);
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<'all' | 'adult' | 'child'>('all');
  const [deleteConfirm, setDeleteConfirm] = useState<PaymentPlan | null>(null);
  const [activeTab, setActiveTab] = useState<'plans' | 'status'>('plans');

  const filteredPlans = paymentPlans.filter(p => filterCategory === 'all' || p.category === filterCategory);

  const totalRevenue = students
    .filter(s => s.status === 'active' && s.paymentCompleted)
    .reduce((sum, s) => sum + s.paymentAmount, 0);
  const pendingRevenue = students
    .filter(s => s.status === 'active' && !s.paymentCompleted)
    .reduce((sum, s) => sum + s.paymentAmount, 0);
  const activeStudents = students.filter(s => s.status === 'active');

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="shrink-0 px-6 py-4 bg-white border-b border-slate-200">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-bold text-slate-800">결제 관리</h1>
        </div>
        <p className="text-slate-400 text-xs mt-0.5">수강 플랜 및 결제 현황을 관리합니다</p>
      </div>

      {/* Summary Cards */}
      <div className="shrink-0 px-6 py-4 grid grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <span className="text-slate-500 text-xs font-medium">이번 달 수납</span>
          </div>
          <p className="text-slate-800 text-xl font-bold">{totalRevenue.toLocaleString()}원</p>
          <p className="text-emerald-600 text-xs mt-1">{activeStudents.filter(s => s.paymentCompleted).length}명 완료</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="w-4 h-4 text-amber-500" />
            <span className="text-slate-500 text-xs font-medium">미수납</span>
          </div>
          <p className="text-slate-800 text-xl font-bold">{pendingRevenue.toLocaleString()}원</p>
          <p className="text-amber-600 text-xs mt-1">{activeStudents.filter(s => !s.paymentCompleted).length}명 대기</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-cyan-600" />
            <span className="text-slate-500 text-xs font-medium">수강 중 총원</span>
          </div>
          <p className="text-slate-800 text-xl font-bold">{activeStudents.length}명</p>
          <p className="text-cyan-600 text-xs mt-1">플랜 {paymentPlans.length}개 운영 중</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="shrink-0 flex border-b border-slate-200 bg-white px-6">
        <button onClick={() => setActiveTab('plans')}
          className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'plans' ? 'border-cyan-600 text-cyan-700' : 'border-transparent text-slate-400 hover:text-slate-700'}`}>
          <CreditCard className="w-4 h-4" /> 수강 플랜
        </button>
        <button onClick={() => setActiveTab('status')}
          className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'status' ? 'border-cyan-600 text-cyan-700' : 'border-transparent text-slate-400 hover:text-slate-700'}`}>
          <CheckCircle className="w-4 h-4" /> 결제 현황
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto p-6 space-y-5">

          {activeTab === 'plans' && (
            <>
              <MakeupPolicyCard />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {(['all', 'child', 'adult'] as const).map(f => (
                    <button key={f} onClick={() => setFilterCategory(f)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${filterCategory === f ? 'bg-cyan-50 border-cyan-200 text-cyan-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                      {f === 'all' ? '전체' : f === 'child' ? '아동' : '성인'}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setPlanModal({ mode: 'add' })}
                    className="flex items-center gap-1.5 px-3 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-medium transition-colors">
                    <Plus className="w-3.5 h-3.5" /> 플랜 추가
                  </button>
                </div>
              </div>

              {filteredPlans.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl py-16 text-center text-slate-400">
                  <CreditCard className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">등록된 플랜이 없습니다.</p>
                </div>
              ) : (
                <>
                  {/* ── 원비표 (횟수별 청구 요금 한눈에 보기) ── */}
                  <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                      <Table2 className="w-4 h-4 text-cyan-600" />
                      <h2 className="text-[14px] font-semibold text-slate-700">원비표</h2>
                      <span className="text-slate-400 text-xs">등록일 기준 그 달 남은 횟수만큼 일할 청구할 때 사용하는 요금표예요</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm whitespace-nowrap">
                        <thead>
                          <tr className="border-b border-slate-100 bg-slate-50">
                            <th className="px-3 py-2.5 text-left text-xs font-medium text-slate-500 sticky left-0 bg-slate-50">프로그램</th>
                            <th className="px-3 py-2.5 text-right text-xs font-medium text-slate-500">원비(월)</th>
                            {Array.from({ length: 14 }, (_, i) => (
                              <th key={i} className="px-2 py-2.5 text-right text-xs font-medium text-slate-500">{i + 1}회</th>
                            ))}
                            <th className="px-3 py-2.5 text-center text-xs font-medium text-slate-500">관리</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredPlans.map(plan => (
                            <tr key={plan.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                              <td className="px-3 py-2.5 text-slate-700 font-medium sticky left-0 bg-white">{plan.name}</td>
                              <td className="px-3 py-2.5 text-right text-slate-700 font-semibold">{plan.monthlyPrice.toLocaleString()}</td>
                              {plan.sessionRates.map((rate, i) => (
                                <td key={i} className="px-2 py-2.5 text-right text-slate-500 text-xs">{rate.toLocaleString()}</td>
                              ))}
                              <td className="px-3 py-2.5 text-center">
                                <button onClick={() => setPlanModal({ mode: 'edit', plan })}
                                  className="p-1.5 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors">
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                <div className="space-y-3">
                  {filteredPlans.map(plan => {
                    const planStudents = students.filter(s => s.paymentPlanId === plan.id);
                    const isExpanded = expandedPlan === plan.id;

                    return (
                      <div key={plan.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                        <div className="px-6 py-4 flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${plan.category === 'child' ? 'bg-sky-50 border border-sky-100' : 'bg-indigo-50 border border-indigo-100'}`}>
                            <CreditCard className={`w-5 h-5 ${plan.category === 'child' ? 'text-sky-600' : 'text-indigo-600'}`} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-slate-800 text-sm font-semibold">{plan.name}</p>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${plan.category === 'child' ? 'bg-sky-50 text-sky-700 border-sky-200' : 'bg-indigo-50 text-indigo-700 border-indigo-200'}`}>
                                {plan.category === 'child' ? '아동' : '성인'}
                              </span>
                              {plan.hasFreeSwim && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-cyan-50 text-cyan-700 border-cyan-200 flex items-center gap-1">
                                  <Waves className="w-3 h-3" /> 자유수영
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-slate-500 text-xs">주 {plan.sessionsPerWeek}회</span>
                              <span className="text-slate-500 text-xs">월 {plan.sessionsPerWeek * 4}회</span>
                              <span className="text-slate-700 text-xs font-semibold">{plan.monthlyPrice.toLocaleString()}원/월</span>
                              <span className="text-slate-400 text-xs">{planStudents.length}명 수강</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button onClick={() => setPlanModal({ mode: 'edit', plan })}
                              className="p-2 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => setDeleteConfirm(plan)}
                              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => setExpandedPlan(isExpanded ? null : plan.id)}
                              className="p-2 text-slate-400 hover:text-slate-700 rounded-lg transition-colors">
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="border-t border-slate-100 px-6 py-4 animate-fade-up">
                            {plan.description && <p className="text-slate-500 text-xs mb-3">{plan.description}</p>}
                            <p className="text-xs font-medium text-slate-500 mb-2">이 플랜 수강생 ({planStudents.length}명)</p>
                            {planStudents.length === 0 ? (
                              <p className="text-slate-400 text-xs py-2">아직 이 플랜의 수강생이 없습니다.</p>
                            ) : (
                              <div className="space-y-1.5">
                                {planStudents.map(s => (
                                  <div key={s.id} className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-2.5">
                                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                      {s.studentName[0]}
                                    </div>
                                    <p className="flex-1 text-slate-700 text-sm font-medium">{s.studentName}</p>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${s.paymentCompleted ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                                      {s.paymentCompleted ? '결제 완료' : '미결제'}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                </>
              )}
            </>
          )}

          {activeTab === 'status' && (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      {['이름', '구분', '수강 플랜', '월 수강료', '결제일', '갱신일', '결제 상태'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-medium text-slate-500">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {activeStudents.length === 0 && (
                      <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400 text-sm">수강 중인 강습생이 없습니다.</td></tr>
                    )}
                    {activeStudents.map(s => {
                      const plan = paymentPlans.find(p => p.id === s.paymentPlanId);
                      return (
                        <tr key={s.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                {s.studentName[0]}
                              </div>
                              <span className="text-slate-700 text-sm font-medium">{s.studentName}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs border ${s.category === 'child' ? 'bg-sky-50 text-sky-700 border-sky-200' : 'bg-indigo-50 text-indigo-700 border-indigo-200'}`}>
                              {s.category === 'child' ? '아동' : '성인'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-600 text-sm">{plan?.name ?? '미배정'}</td>
                          <td className="px-4 py-3 text-slate-700 text-sm font-medium">{s.paymentAmount ? s.paymentAmount.toLocaleString() + '원' : '-'}</td>
                          <td className="px-4 py-3 text-slate-500 text-xs">{s.paymentDate || '-'}</td>
                          <td className="px-4 py-3 text-slate-500 text-xs">{s.paymentRenewalDate || '-'}</td>
                          <td className="px-4 py-3">
                            <button onClick={() => updateStudent(s.id, { paymentCompleted: !s.paymentCompleted })}
                              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-colors ${s.paymentCompleted ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'}`}>
                              {s.paymentCompleted ? <><CheckCircle className="w-3 h-3" /> 완료</> : <><XCircle className="w-3 h-3" /> 미결제</>}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {planModal && (
        <PlanFormModal
          title={planModal.mode === 'add' ? '플랜 추가' : '플랜 수정'}
          initial={planModal.plan}
          onClose={() => setPlanModal(null)}
          onSave={data => planModal.mode === 'add' ? addPaymentPlan(data) : updatePaymentPlan(planModal.plan!.id, data)}
        />
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-sm shadow-xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-50 border border-red-100 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="text-slate-800 font-semibold">플랜 삭제</h3>
                <p className="text-slate-500 text-sm">"{deleteConfirm.name}" 플랜을 삭제합니다.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-slate-600 text-sm hover:bg-slate-50 transition-colors">취소</button>
              <button onClick={() => { deletePaymentPlan(deleteConfirm.id); setDeleteConfirm(null); }} className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-medium transition-colors">삭제</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
