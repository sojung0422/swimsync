import { useStore, computeInstructorMetrics } from '../store/StoreContext';
import { Award, Users, TrendingUp, TrendingDown, Repeat, Info } from 'lucide-react';
import { format, subMonths } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function MetricBar({ value, average, colorClass }: { value: number; average: number; colorClass: string }) {
  const pct = Math.max(2, Math.min(100, Math.round(value)));
  const isAboveAvg = value >= average;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden relative">
        <div className={`h-full rounded-full ${colorClass}`} style={{ width: `${pct}%` }} />
        {average > 0 && <div className="absolute top-0 bottom-0 w-0.5 bg-slate-400" style={{ left: `${Math.min(100, average)}%` }} title={`평균 ${average.toFixed(1)}%`} />}
      </div>
      <span className={`text-xs font-bold w-14 text-right shrink-0 ${isAboveAvg ? 'text-emerald-600' : 'text-slate-500'}`}>{value.toFixed(1)}%</span>
    </div>
  );
}

export default function AdminInstructorPerformance() {
  const { instructors, students, withdrawalRequests, scheduleChangeRequests } = useStore();

  const teachingInstructors = instructors.filter(i => i.status === 'active' && i.jobType === '강사');

  const rows = teachingInstructors.map(inst => {
    const m = computeInstructorMetrics(inst.id, students, withdrawalRequests, scheduleChangeRequests);
    return { inst, activeCount: m.activeCount, reRegRate: m.reRegRate, withdrawalRate: m.withdrawalRate, transferRate: m.transferRate };
  });

  const avg = (key: 'reRegRate' | 'withdrawalRate' | 'transferRate') =>
    rows.length > 0 ? rows.reduce((sum, r) => sum + r[key], 0) / rows.length : 0;
  const avgReReg = avg('reRegRate');
  const avgWithdrawal = avg('withdrawalRate');
  const avgTransfer = avg('transferRate');

  const sorted = [...rows].sort((a, b) => b.reRegRate - a.reRegRate);

  const months = Array.from({ length: 12 }, (_, i) => format(subMonths(new Date(), 11 - i), 'yyyy-MM'));
  // 각 월 시점 기준으로 조직 평균 재등록률/퇴원률/반이동률을 계산해 12개월 추이를 만듦
  const orgTrend = months.map((m, i) => {
    const refDate = subMonths(new Date(), 11 - i);
    const perInstructor = teachingInstructors.map(inst => computeInstructorMetrics(inst.id, students, withdrawalRequests, scheduleChangeRequests, refDate));
    const count = perInstructor.length || 1;
    const avgOf = (key: 'reRegRate' | 'withdrawalRate' | 'transferRate') => perInstructor.reduce((s, p) => s + p[key], 0) / count;
    return {
      month: m.slice(2),
      재등록률: Math.round(avgOf('reRegRate') * 10) / 10,
      퇴원률: Math.round(avgOf('withdrawalRate') * 10) / 10,
      반이동률: Math.round(avgOf('transferRate') * 10) / 10,
    };
  });

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="shrink-0 px-6 py-4 bg-white border-b border-slate-200">
        <h1 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Award className="w-5 h-5 text-cyan-600" /> 강사 실적/역량</h1>
        <p className="text-slate-400 text-xs mt-0.5">강사별 재등록률·퇴원률·반이동률을 전체 평균과 함께 확인해요 (최근 6개월 기준).</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto p-6 space-y-5">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2"><TrendingUp className="w-4 h-4 text-emerald-500" /><span className="text-slate-500 text-xs font-medium">평균 재등록률</span></div>
              <p className="text-slate-800 text-xl font-bold">{avgReReg.toFixed(1)}%</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2"><TrendingDown className="w-4 h-4 text-red-500" /><span className="text-slate-500 text-xs font-medium">평균 퇴원률</span></div>
              <p className="text-slate-800 text-xl font-bold">{avgWithdrawal.toFixed(1)}%</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2"><Repeat className="w-4 h-4 text-violet-500" /><span className="text-slate-500 text-xs font-medium">평균 반이동률</span></div>
              <p className="text-slate-800 text-xl font-bold">{avgTransfer.toFixed(1)}%</p>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 flex items-start gap-2">
            <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-amber-700 text-xs leading-relaxed">
              재등록률은 현재 재원생 중 등록 2개월 이상 유지 중인 비율, 퇴원률은 최근 6개월 내 퇴원 비율, 반이동률은 최근 6개월 내 다른 강사로 반을 옮긴 비율이에요.
              그래프의 회색 세로선은 전체 강사 평균이에요.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-600" />
              <h2 className="text-[14px] font-semibold text-slate-700">월별(12개월) 조직 평균 추이</h2>
            </div>
            <div className="p-6">
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={orgTrend} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} unit="%" />
                  <Tooltip formatter={(v: number) => `${v}%`} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="재등록률" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="퇴원률" stroke="#f87171" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="반이동률" stroke="#a78bfa" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-600" />
              <h2 className="text-[14px] font-semibold text-slate-700">강사별 역량 비교 (당월 기준)</h2>
            </div>
            <div className="divide-y divide-slate-50">
              {sorted.map(r => (
                <div key={r.inst.id} className="px-6 py-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ backgroundColor: `${r.inst.color}20`, color: r.inst.color }}>
                      {r.inst.name[0]}
                    </div>
                    <p className="text-slate-800 text-sm font-bold">{r.inst.name}</p>
                    <span className="text-slate-400 text-xs">재원 {r.activeCount}명</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-2 pl-11">
                    <div>
                      <p className="text-slate-400 text-[10.5px] mb-1">재등록률</p>
                      <MetricBar value={r.reRegRate} average={avgReReg} colorClass="bg-emerald-500" />
                    </div>
                    <div>
                      <p className="text-slate-400 text-[10.5px] mb-1">퇴원률</p>
                      <MetricBar value={r.withdrawalRate} average={avgWithdrawal} colorClass="bg-red-400" />
                    </div>
                    <div>
                      <p className="text-slate-400 text-[10.5px] mb-1">반이동률</p>
                      <MetricBar value={r.transferRate} average={avgTransfer} colorClass="bg-violet-400" />
                    </div>
                  </div>
                </div>
              ))}
              {sorted.length === 0 && (
                <div className="py-12 text-center text-slate-400 text-sm">재직 중인 강사가 없습니다.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
