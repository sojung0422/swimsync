import { useState } from 'react';
import { format, subMonths } from 'date-fns';
import { useStore, computeLinearSessionRates, computeApplicableDiscounts, getAllEnrollments } from '../store/StoreContext';
import type { PaymentPlan, MakeupPolicyRule, Discount } from '../store/StoreContext';
import {
  CreditCard, Plus, Edit2, Trash2, X, CheckCircle, XCircle,
  ChevronDown, ChevronUp, Waves, AlertCircle, TrendingUp, Users, RefreshCw, Sparkles, Table2,
  Gift, Percent, BarChart3, UserMinus, UserPlus2
} from 'lucide-react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// ─── 보강 정책 설정 ────────────────────────────────────────────────────────────

function MakeupPolicyCard() {
  const { settings, updateMakeupSettings } = useStore();
  const { makeupPolicies, childRequiresDocument, adultRequiresDocument } = settings.makeupSettings;
  const [showAdd, setShowAdd] = useState(false);
  const [collapsed, setCollapsed] = useState(true);
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
      <button onClick={() => setCollapsed(p => !p)} className="w-full px-6 py-4 border-b border-slate-100 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4 text-cyan-600" />
          <h2 className="text-[14px] font-semibold text-slate-700">보강 가능 횟수 정책</h2>
          {collapsed && <span className="text-slate-400 text-xs">{makeupPolicies.length}개 규칙 · 펼쳐서 보기</span>}
        </div>
        {collapsed ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
      </button>

      {!collapsed && (
      <div className="p-6 space-y-3">
        <div className="flex justify-end">
          <button onClick={() => setShowAdd(p => !p)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-medium transition-colors">
            <Plus className="w-3.5 h-3.5" /> 규칙 추가
          </button>
        </div>
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
      )}
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
  const [timeOverrides, setTimeOverrides] = useState<{ time: string; monthlyPrice: number; sessionRates: number[] }[]>(initial?.timePriceOverrides ?? []);
  const [newOverrideTime, setNewOverrideTime] = useState('20:00');
  const [newOverridePrice, setNewOverridePrice] = useState(monthlyPrice + 20000);

  const recalcRates = () => setSessionRates(computeLinearSessionRates(monthlyPrice, sessionsPerWeek));
  const updateRate = (idx: number, val: number) => setSessionRates(rates => rates.map((r, i) => i === idx ? val : r));
  const addTimeOverride = () => {
    if (timeOverrides.some(o => o.time === newOverrideTime)) return;
    setTimeOverrides(prev => [...prev, { time: newOverrideTime, monthlyPrice: newOverridePrice, sessionRates: computeLinearSessionRates(newOverridePrice, sessionsPerWeek) }].sort((a, b) => a.time.localeCompare(b.time)));
  };
  const removeTimeOverride = (time: string) => setTimeOverrides(prev => prev.filter(o => o.time !== time));

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

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className={labelCls + ' mb-0'}>시간대별 추가 요금 (예: 야간 시간 할증)</label>
            </div>
            <p className="text-slate-400 text-xs mb-2">여기에 등록한 시간대는 같은 주당 횟수라도 다른 월 금액이 적용돼요. 반 변경 시 이 금액 차이 때문에 이동이 제한될 수 있어요.</p>
            <div className="space-y-1.5 mb-2">
              {timeOverrides.map(o => (
                <div key={o.time} className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                  <span className="text-slate-700 text-xs font-semibold">{o.time}</span>
                  <span className="text-slate-600 text-xs">{o.monthlyPrice.toLocaleString()}원/월</span>
                  <button type="button" onClick={() => removeTimeOverride(o.time)} className="text-slate-300 hover:text-red-500 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {timeOverrides.length === 0 && <p className="text-slate-300 text-xs py-1">등록된 시간대별 추가 요금이 없습니다.</p>}
            </div>
            <div className="flex items-center gap-2">
              <input type="time" value={newOverrideTime} onChange={e => setNewOverrideTime(e.target.value)}
                className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs" />
              <input type="number" min={0} step={1000} value={newOverridePrice} onChange={e => setNewOverridePrice(parseInt(e.target.value) || 0)}
                className="flex-1 border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-right" placeholder="월 금액" />
              <button type="button" onClick={addTimeOverride} className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-xs font-medium transition-colors shrink-0">추가</button>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-slate-600 text-sm hover:bg-slate-50 transition-colors">취소</button>
            <button onClick={() => { if (!name.trim()) return; onSave({ name: name.trim(), category, hasFreeSwim, sessionsPerWeek, monthlyPrice, description, sessionRates, timePriceOverrides: timeOverrides }); onClose(); }}
              className="flex-1 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-sm font-medium transition-colors">
              저장
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── 형제/이벤트 할인 관리 ─────────────────────────────────────────────────────

function DiscountFormModal({ initial, onClose, onSave, title }: {
  initial?: Discount; onClose: () => void;
  onSave: (d: Omit<Discount, 'id'>) => void; title: string;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [kind, setKind] = useState<'sibling' | 'event'>(initial?.kind ?? 'sibling');
  const [percent, setPercent] = useState(initial?.percent ?? 5);
  const [minSiblingCount, setMinSiblingCount] = useState(initial?.minSiblingCount ?? 2);
  const [startDate, setStartDate] = useState(initial?.startDate ?? format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(initial?.endDate ?? format(new Date(), 'yyyy-MM-dd'));
  const [active, setActive] = useState(initial?.active ?? true);

  const inputCls = "w-full border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 placeholder:text-slate-400 text-sm focus:outline-none focus:border-cyan-500 transition-colors";
  const labelCls = "block text-xs font-medium text-slate-500 mb-1";

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-[15px] font-semibold text-slate-800">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className={labelCls}>이름 *</label>
            <input className={inputCls} placeholder="예: 형제 2인 이상 할인, 여름방학 이벤트" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>종류</label>
            <div className="flex gap-2">
              {([['sibling', '형제·다자녀'], ['event', '이벤트 기간']] as const).map(([val, label]) => (
                <button key={val} type="button" onClick={() => setKind(val)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors ${kind === val ? 'bg-cyan-600 border-cyan-600 text-white' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className={labelCls}>할인율 (%)</label>
            <input type="number" min={0} max={100} className={inputCls} value={percent} onChange={e => setPercent(parseInt(e.target.value) || 0)} />
          </div>
          {kind === 'sibling' ? (
            <div>
              <label className={labelCls}>적용 조건 — 형제(가족) 총원이 몇 명 이상일 때</label>
              <input type="number" min={2} className={inputCls} value={minSiblingCount} onChange={e => setMinSiblingCount(parseInt(e.target.value) || 2)} />
              <p className="text-slate-400 text-xs mt-1">같은 어머니/아버지 연락처로 등록된 수강 중인 형제 수를 자동으로 세어 적용해요.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>시작일</label>
                <input type="date" className={inputCls} value={startDate} onChange={e => setStartDate(e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>종료일</label>
                <input type="date" className={inputCls} value={endDate} onChange={e => setEndDate(e.target.value)} min={startDate} />
              </div>
            </div>
          )}
          <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
            <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} className="w-4 h-4 accent-cyan-600" />
            지금 바로 적용 (사용함)
          </label>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-slate-600 text-sm hover:bg-slate-50 transition-colors">취소</button>
            <button onClick={() => {
              if (!name.trim()) return;
              onSave({ name: name.trim(), kind, percent, minSiblingCount, startDate: kind === 'event' ? startDate : '', endDate: kind === 'event' ? endDate : '', active });
              onClose();
            }} className="flex-1 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-sm font-medium transition-colors">
              저장
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DiscountsPanel() {
  const { discounts, students, addDiscount, updateDiscount, deleteDiscount, eventParticipations, approveEventParticipation, rejectEventParticipation } = useStore();
  const [modal, setModal] = useState<{ mode: 'add' | 'edit'; discount?: Discount } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Discount | null>(null);
  const [zoomPhoto, setZoomPhoto] = useState<string | null>(null);
  const [selectedPendingIds, setSelectedPendingIds] = useState<string[]>([]);

  const matchingCount = (d: Discount) => students.filter(s => s.status === 'active' && computeApplicableDiscounts(s, students, [d], new Date(), eventParticipations).matched.length > 0).length;
  const pendingParticipations = eventParticipations.filter(p => p.status === 'pending');
  const togglePending = (id: string) => setSelectedPendingIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const approveSelected = () => { selectedPendingIds.forEach(approveEventParticipation); setSelectedPendingIds([]); };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-slate-400 text-xs">여기서 만든 할인은 조건에 맞는 학생에게 자동으로 계산되어, 학생 상세의 결제 정보에서 확인·적용할 수 있어요.</p>
        <button onClick={() => setModal({ mode: 'add' })}
          className="flex items-center gap-1.5 px-3 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-medium transition-colors shrink-0 ml-3">
          <Plus className="w-3.5 h-3.5" /> 할인·이벤트 추가
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            <h2 className="text-[14px] font-semibold text-slate-700">이벤트 참여 인증 대기</h2>
            <span className="text-slate-400 text-xs">{pendingParticipations.length}건</span>
          </div>
          {selectedPendingIds.length > 0 && (
            <button onClick={approveSelected} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium transition-colors">
              <CheckCircle className="w-3.5 h-3.5" /> {selectedPendingIds.length}건 일괄 승인
            </button>
          )}
        </div>
        {pendingParticipations.length === 0 ? (
          <p className="px-6 py-6 text-slate-400 text-sm text-center">대기 중인 참여 인증이 없습니다.</p>
        ) : (
          <div className="divide-y divide-slate-50">
            {pendingParticipations.map(p => {
              const student = students.find(s => s.id === p.studentId);
              const discount = discounts.find(d => d.id === p.discountId);
              return (
                <div key={p.id} className="px-6 py-3.5 flex items-center gap-3">
                  <input type="checkbox" checked={selectedPendingIds.includes(p.id)} onChange={() => togglePending(p.id)} className="w-4 h-4 accent-cyan-600 shrink-0" />
                  <button onClick={() => setZoomPhoto(p.evidencePhoto)} className="shrink-0">
                    <img src={p.evidencePhoto} className="w-12 h-12 rounded-lg object-cover border border-slate-200" alt="증빙" />
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-800 text-sm font-semibold">{student?.studentName ?? '알 수 없음'} <span className="text-slate-400 font-normal">· {discount?.name ?? '삭제된 이벤트'}</span></p>
                    <p className="text-slate-400 text-xs mt-0.5">{p.submittedAt} 제출 · 승인 시 다음 달부터 할인 적용</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button onClick={() => approveEventParticipation(p.id)} className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-lg text-xs font-medium transition-colors">승인</button>
                    <button onClick={() => rejectEventParticipation(p.id)} className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded-lg text-xs font-medium transition-colors">거절</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {discounts.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl py-16 text-center text-slate-400">
          <Gift className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">등록된 할인·이벤트가 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {discounts.map(d => (
            <div key={d.id} className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${d.kind === 'sibling' ? 'bg-violet-50 border-violet-100' : 'bg-amber-50 border-amber-100'}`}>
                {d.kind === 'sibling' ? <Users className={`w-5 h-5 text-violet-600`} /> : <Gift className="w-5 h-5 text-amber-600" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-slate-800 text-sm font-semibold">{d.name}</p>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border bg-cyan-50 text-cyan-700 border-cyan-200 flex items-center gap-0.5">
                    <Percent className="w-2.5 h-2.5" /> {d.percent}%
                  </span>
                  {!d.active && <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-slate-100 text-slate-500 border-slate-200">사용 안 함</span>}
                </div>
                <p className="text-slate-400 text-xs mt-1">
                  {d.kind === 'sibling' ? `형제(가족) ${d.minSiblingCount}명 이상` : `이벤트 기간: ${d.startDate} ~ ${d.endDate}`}
                  {' · '}현재 적용 대상 {matchingCount(d)}명
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button onClick={() => updateDiscount(d.id, { active: !d.active })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${d.active ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'}`}>
                  {d.active ? '사용 중' : '중지됨'}
                </button>
                <button onClick={() => setModal({ mode: 'edit', discount: d })}
                  className="p-2 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => setDeleteConfirm(d)}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <DiscountFormModal
          title={modal.mode === 'add' ? '할인·이벤트 추가' : '할인·이벤트 수정'}
          initial={modal.discount}
          onClose={() => setModal(null)}
          onSave={data => modal.mode === 'add' ? addDiscount(data) : updateDiscount(modal.discount!.id, data)}
        />
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-sm shadow-xl p-6 space-y-4">
            <div>
              <h3 className="text-slate-800 font-semibold">할인·이벤트 삭제</h3>
              <p className="text-slate-500 text-sm mt-1">"{deleteConfirm.name}"을(를) 삭제합니다.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-slate-600 text-sm hover:bg-slate-50 transition-colors">취소</button>
              <button onClick={() => { deleteDiscount(deleteConfirm.id); setDeleteConfirm(null); }} className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-medium transition-colors">삭제</button>
            </div>
          </div>
        </div>
      )}

      {zoomPhoto && (
        <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-6" onClick={() => setZoomPhoto(null)}>
          <img src={zoomPhoto} className="max-w-full max-h-full rounded-xl shadow-2xl" alt="증빙 확대" />
        </div>
      )}
    </div>
  );
}

// ─── 매출/이탈 통계 대시보드 ───────────────────────────────────────────────────

function BarRow({ label, value, max, colorClass, valueLabel }: { label: string; value: number; max: number; colorClass: string; valueLabel: string }) {
  const pct = max > 0 ? Math.max(2, Math.round((value / max) * 100)) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-slate-400 text-xs w-14 shrink-0">{label}</span>
      <div className="flex-1 h-5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${colorClass}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-slate-600 text-xs font-semibold w-20 text-right shrink-0">{valueLabel}</span>
    </div>
  );
}

const REVENUE_LINE_COLORS = ['#0891b2', '#8b5cf6', '#f59e0b', '#10b981', '#ec4899', '#6366f1', '#f97316'];

function RevenueTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const sorted = [...payload].sort((a, b) => b.value - a.value);
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-3.5 py-2.5 text-xs max-w-[220px]">
      <p className="font-bold text-slate-700 mb-1.5">{label}</p>
      {sorted.map((p: any) => (
        <div key={p.dataKey} className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-1.5 text-slate-500 truncate">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} />{p.name}
          </span>
          <span className="font-semibold text-slate-700 shrink-0">{p.value.toLocaleString()}원</span>
        </div>
      ))}
    </div>
  );
}

function StatsDashboard() {
  const { paymentRecords, students, withdrawalRequests, lessonClasses, paymentPlans } = useStore();

  const months = Array.from({ length: 6 }, (_, i) => format(subMonths(new Date(), 5 - i), 'yyyy-MM'));

  const planNameOf = (p: { studentId: string }) => {
    const student = students.find(s => s.id === p.studentId);
    const plan = student ? paymentPlans.find(pp => pp.id === student.paymentPlanId) : undefined;
    return plan?.name ?? '기타';
  };
  const activePlanNames = Array.from(new Set(paymentRecords.filter(p => p.status === 'paid').map(planNameOf)));

  const revenueByMonth = months.map(m => {
    const paidThisMonth = paymentRecords.filter(p => p.billingMonth === m && p.status === 'paid');
    const byPlan: Record<string, number> = {};
    activePlanNames.forEach(name => { byPlan[name] = 0; });
    paidThisMonth.forEach(p => { byPlan[planNameOf(p)] = (byPlan[planNameOf(p)] ?? 0) + p.paidAmount; });
    const total = paidThisMonth.reduce((sum, p) => sum + p.paidAmount, 0);
    return { month: m.slice(2), total, ...byPlan };
  });
  const maxRevenue = Math.max(1, ...revenueByMonth.map(r => r.total));

  const newByMonth = months.map(m => ({ month: m, count: students.filter(s => s.registrationDate.startsWith(m)).length }));
  const withdrawnByMonth = months.map(m => ({
    month: m,
    count: withdrawalRequests.filter(r => r.status === 'approved' && r.resolvedAt.startsWith(m)).length,
  }));
  const maxFlow = Math.max(1, ...newByMonth.map(r => r.count), ...withdrawnByMonth.map(r => r.count));

  const classFillRates = lessonClasses.map(lc => {
    const enrolled = students.flatMap(getAllEnrollments).filter(e => e.status === 'active' && e.lessonClassId === lc.id).length;
    return { name: lc.name, enrolled, capacity: lc.capacity, rate: lc.capacity > 0 ? Math.round((enrolled / lc.capacity) * 100) : 0 };
  });

  const totalActiveRevenuePotential = students.filter(s => s.status === 'active').reduce((sum, s) => sum + s.paymentAmount, 0);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <span className="text-slate-500 text-xs font-medium">이번 달 확정 매출</span>
          </div>
          <p className="text-slate-800 text-xl font-bold">{(revenueByMonth[revenueByMonth.length - 1]?.total ?? 0).toLocaleString()}원</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <UserPlus2 className="w-4 h-4 text-cyan-600" />
            <span className="text-slate-500 text-xs font-medium">이번 달 신규 등록</span>
          </div>
          <p className="text-slate-800 text-xl font-bold">{newByMonth[newByMonth.length - 1]?.count ?? 0}명</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <UserMinus className="w-4 h-4 text-red-500" />
            <span className="text-slate-500 text-xs font-medium">이번 달 퇴원</span>
          </div>
          <p className="text-slate-800 text-xl font-bold">{withdrawnByMonth[withdrawnByMonth.length - 1]?.count ?? 0}명</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-cyan-600" />
          <h2 className="text-[14px] font-semibold text-slate-700">월별 수납 실적현황 (최근 6개월, 완납 기준)</h2>
        </div>
        <div className="p-6">
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={revenueByMonth} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={v => `${Math.round(v / 10000)}만`} />
              <Tooltip content={<RevenueTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="total" name="전체 총계" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
              {activePlanNames.map((name, i) => (
                <Line key={name} type="monotone" dataKey={name} name={name} stroke={REVENUE_LINE_COLORS[i % REVENUE_LINE_COLORS.length]} strokeWidth={2} dot={{ r: 2.5 }} />
              ))}
            </ComposedChart>
          </ResponsiveContainer>
          <p className="text-slate-400 text-xs pt-1">수강 중인 전체 학생의 월 결제 금액 합계(잠재 매출) 참고치: {totalActiveRevenuePotential.toLocaleString()}원</p>
        </div>
        <div className="overflow-x-auto border-t border-slate-100">
          <table className="w-full text-sm whitespace-nowrap">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 sticky left-0 bg-slate-50">수강 플랜</th>
                {revenueByMonth.map(r => <th key={r.month} className="px-4 py-2.5 text-right text-xs font-medium text-slate-500">{r.month}</th>)}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-50 bg-slate-50/50">
                <td className="px-4 py-2.5 font-bold text-slate-700 sticky left-0 bg-slate-50/50">전체 총계</td>
                {revenueByMonth.map(r => <td key={r.month} className="px-4 py-2.5 text-right font-bold text-slate-700">{r.total.toLocaleString()}</td>)}
              </tr>
              {activePlanNames.map((name, i) => (
                <tr key={name} className="border-b border-slate-50 last:border-0">
                  <td className="px-4 py-2.5 font-medium sticky left-0 bg-white" style={{ color: REVENUE_LINE_COLORS[i % REVENUE_LINE_COLORS.length] }}>{name}</td>
                  {revenueByMonth.map(r => <td key={r.month} className="px-4 py-2.5 text-right text-slate-600">{((r as any)[name] ?? 0).toLocaleString()}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-cyan-600" />
          <h2 className="text-[14px] font-semibold text-slate-700">신규 등록 vs 퇴원 추이 (최근 6개월)</h2>
        </div>
        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <p className="text-slate-500 text-xs font-medium">신규 등록</p>
            {newByMonth.map(r => (
              <BarRow key={r.month} label={r.month.slice(5)} value={r.count} max={maxFlow} colorClass="bg-cyan-500" valueLabel={`${r.count}명`} />
            ))}
          </div>
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <p className="text-slate-500 text-xs font-medium">퇴원</p>
            {withdrawnByMonth.map(r => (
              <BarRow key={r.month} label={r.month.slice(5)} value={r.count} max={maxFlow} colorClass="bg-red-400" valueLabel={`${r.count}명`} />
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
          <Users className="w-4 h-4 text-cyan-600" />
          <h2 className="text-[14px] font-semibold text-slate-700">강습반별 정원 충족률</h2>
        </div>
        <div className="p-6 space-y-3">
          {classFillRates.length === 0 ? (
            <p className="text-slate-400 text-sm">등록된 강습반이 없습니다.</p>
          ) : classFillRates.map(c => (
            <BarRow key={c.name} label={c.name} value={c.enrolled} max={Math.max(1, ...classFillRates.map(x => x.capacity))} colorClass={c.rate >= 100 ? 'bg-red-500' : c.rate >= 70 ? 'bg-amber-500' : 'bg-cyan-500'} valueLabel={`${c.enrolled}/${c.capacity}명 (${c.rate}%)`} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── 결제 현황 (강사별 통합 조회) ───────────────────────────────────────────────

type PaymentStatusCategory = '미등록' | '신규' | '결제완료' | '미결제' | '연기';

const paymentStatusCategoryMeta: Record<PaymentStatusCategory, { color: string }> = {
  '미등록': { color: 'bg-slate-100 text-slate-500 border-slate-200' },
  '신규': { color: 'bg-lime-50 text-lime-700 border-lime-200' },
  '결제완료': { color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  '미결제': { color: 'bg-amber-50 text-amber-700 border-amber-200' },
  '연기': { color: 'bg-slate-100 text-slate-500 border-slate-300' },
};

// 분류 우선순위: 연기 > 미등록(플랜 없음) > 신규(이번 달 등록) > 결제완료 > 미결제
function paymentStatusCategory(s: import('../store/StoreContext').Student): PaymentStatusCategory {
  if (s.status === 'deferred') return '연기';
  if (!s.paymentPlanId) return '미등록';
  if (s.registrationDate.startsWith(format(new Date(), 'yyyy-MM'))) return '신규';
  if (s.paymentCompleted) return '결제완료';
  return '미결제';
}

function PaymentStatusView() {
  const { students, instructors, paymentPlans, updateStudent } = useStore();
  const [instructorFilter, setInstructorFilter] = useState<'all' | string>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | PaymentStatusCategory>('all');

  const scoped = students.filter(s => s.status !== 'inactive' && (instructorFilter === 'all' || s.instructorId === instructorFilter));
  const categorized = scoped.map(s => ({ student: s, category: paymentStatusCategory(s) }));
  const filtered = categorized.filter(c => categoryFilter === 'all' || c.category === categoryFilter);

  const counts = (['미등록', '신규', '결제완료', '미결제', '연기'] as const).map(cat => ({
    cat, count: categorized.filter(c => c.category === cat).length,
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-slate-400 text-xs shrink-0">담당 강사</span>
        <select value={instructorFilter} onChange={e => setInstructorFilter(e.target.value)}
          className="border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-600 focus:outline-none focus:border-cyan-500">
          <option value="all">전체 강사</option>
          {instructors.filter(i => i.status === 'active').map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
        </select>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <button onClick={() => setCategoryFilter('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${categoryFilter === 'all' ? 'bg-cyan-50 border-cyan-200 text-cyan-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
          전체 {categorized.length}
        </button>
        {counts.map(({ cat, count }) => (
          <button key={cat} onClick={() => setCategoryFilter(cat)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${categoryFilter === cat ? paymentStatusCategoryMeta[cat].color : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
            {cat} {count}
          </button>
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {['이름', '담당 강사', '구분', '수강 플랜', '월 수강료', '결제일', '갱신일', '분류'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-400 text-sm">해당하는 강습생이 없습니다.</td></tr>
              )}
              {filtered.map(({ student: s, category }) => {
                const plan = paymentPlans.find(p => p.id === s.paymentPlanId);
                const instructor = instructors.find(i => i.id === s.instructorId);
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
                    <td className="px-4 py-3 text-slate-500 text-xs">{instructor?.name ?? '-'}</td>
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
                        className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-colors ${paymentStatusCategoryMeta[category].color}`}>
                        {category}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function AdminPayments() {
  const { paymentPlans, students, addPaymentPlan, updatePaymentPlan, deletePaymentPlan, eventParticipations } = useStore();
  const pendingEventCount = eventParticipations.filter(p => p.status === 'pending').length;

  const [planModal, setPlanModal] = useState<{ mode: 'add' | 'edit'; plan?: PaymentPlan } | null>(null);
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<'all' | 'adult' | 'child'>('all');
  const [deleteConfirm, setDeleteConfirm] = useState<PaymentPlan | null>(null);
  const [activeTab, setActiveTab] = useState<'plans' | 'status' | 'discounts' | 'stats'>('plans');

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
        <button onClick={() => setActiveTab('discounts')}
          className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'discounts' ? 'border-cyan-600 text-cyan-700' : 'border-transparent text-slate-400 hover:text-slate-700'}`}>
          <Gift className="w-4 h-4" /> 할인·이벤트
          {pendingEventCount > 0 && (
            <span className="bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">{pendingEventCount}</span>
          )}
        </button>
        <button onClick={() => setActiveTab('stats')}
          className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'stats' ? 'border-cyan-600 text-cyan-700' : 'border-transparent text-slate-400 hover:text-slate-700'}`}>
          <BarChart3 className="w-4 h-4" /> 통계 대시보드
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

          {activeTab === 'status' && <PaymentStatusView />}

          {activeTab === 'discounts' && <DiscountsPanel />}
          {activeTab === 'stats' && <StatsDashboard />}
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
