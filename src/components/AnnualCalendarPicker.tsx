import { useStore } from '../store/StoreContext';

const CATEGORY_ORDER = ['none', 'closed', 'substitute', 'mandatory'] as const;
type Category = typeof CATEGORY_ORDER[number];

const CATEGORY_STYLE: Record<Category, string> = {
  none: 'hover:bg-slate-100 text-slate-500 bg-white',
  closed: 'bg-violet-500 text-white hover:bg-violet-600',
  substitute: 'bg-blue-500 text-white hover:bg-blue-600',
  mandatory: 'bg-red-500 text-white hover:bg-red-600',
};

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

// 5주차 운영 방침에서 쓰는 연간 계획 달력 — 날짜를 클릭하면 휴관일 → 대체수업 진행일 → 의무보강일 → 해제 순으로 지정됨
export default function AnnualCalendarPicker({ year }: { year: number }) {
  const {
    settings, updateSettings,
    substituteMakeupDays, addManualSubstituteMakeupDay, removeSubstituteMakeupDay,
    mandatoryMakeupDays, addMandatoryMakeupDay, removeMandatoryMakeupDay,
  } = useStore();

  const getCategory = (dateStr: string): Category => {
    if (settings.closedDates.includes(dateStr)) return 'closed';
    if (substituteMakeupDays.some(d => d.date === dateStr && d.status === 'confirmed')) return 'substitute';
    if (mandatoryMakeupDays.some(d => d.date === dateStr)) return 'mandatory';
    return 'none';
  };

  const cycle = (dateStr: string) => {
    const current = getCategory(dateStr);
    if (current === 'closed') updateSettings({ closedDates: settings.closedDates.filter(d => d !== dateStr) });
    if (current === 'substitute') {
      const found = substituteMakeupDays.find(d => d.date === dateStr && d.status === 'confirmed');
      if (found) removeSubstituteMakeupDay(found.id);
    }
    if (current === 'mandatory') {
      const found = mandatoryMakeupDays.find(d => d.date === dateStr);
      if (found) removeMandatoryMakeupDay(found.id);
    }
    const next = CATEGORY_ORDER[(CATEGORY_ORDER.indexOf(current) + 1) % CATEGORY_ORDER.length];
    if (next === 'closed') updateSettings({ closedDates: [...settings.closedDates, dateStr].sort() });
    if (next === 'substitute') addManualSubstituteMakeupDay(dateStr);
    if (next === 'mandatory') addMandatoryMakeupDay(dateStr);
  };

  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-3 text-xs text-slate-500">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-violet-500 inline-block" /> 휴관일</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-blue-500 inline-block" /> 대체수업 진행일</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-500 inline-block" /> 의무보강일</span>
        <span className="text-slate-400">날짜 클릭 시 휴관일 → 대체수업일 → 의무보강일 → 해제 순으로 바뀌어요.</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {months.map(m => {
          const first = new Date(year, m - 1, 1);
          const daysInMonth = new Date(year, m, 0).getDate();
          const firstDow = first.getDay();
          return (
            <div key={m} className="border border-slate-200 rounded-xl p-2">
              <p className="text-xs font-bold text-slate-600 mb-1.5 text-center">{year}년 {m}월</p>
              <div className="grid grid-cols-7 gap-0.5 text-[9px] text-slate-300 mb-0.5">
                {WEEKDAY_LABELS.map(d => <div key={d} className="text-center">{d}</div>)}
              </div>
              <div className="grid grid-cols-7 gap-0.5">
                {Array.from({ length: firstDow }).map((_, i) => <div key={`e${i}`} />)}
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => {
                  const dateStr = `${year}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                  const cat = getCategory(dateStr);
                  return (
                    <button key={d} onClick={() => cycle(dateStr)} title={dateStr}
                      className={`aspect-square text-[10px] rounded flex items-center justify-center font-medium transition-colors ${CATEGORY_STYLE[cat]}`}>
                      {d}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
