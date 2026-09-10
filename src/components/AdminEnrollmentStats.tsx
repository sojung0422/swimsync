import { useStore } from '../store/StoreContext';
import { UserPlus2, UserMinus, TrendingUp, Users, Wallet } from 'lucide-react';
import { format, subMonths } from 'date-fns';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

const VISIT_ROUTE_COLORS: Record<string, string> = {
  '인터넷검색': '#0891b2', '홍보물': '#8b5cf6', '지인추천': '#f59e0b', '직접': '#10b981', '기타': '#94a3b8',
};

const SERIES = [
  { key: 'new', label: '신규', color: '#0891b2' },
  { key: 'active', label: '재원', color: '#0f172a' },
  { key: 'withdrawn', label: '퇴원', color: '#10b981' },
  { key: 'paused', label: '휴원', color: '#f59e0b' },
] as const;

function EnrollmentTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-3.5 py-2.5 text-xs">
      <p className="font-bold text-slate-700 mb-1.5">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-slate-500"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />{p.name}</span>
          <span className="font-semibold text-slate-700">{p.value.toLocaleString()}명</span>
        </div>
      ))}
    </div>
  );
}

function RefundTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-3.5 py-2.5 text-xs">
      <p className="font-bold text-slate-700 mb-1.5">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-slate-500"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />{p.name}</span>
          <span className="font-semibold text-slate-700">{p.dataKey === '환불금액' ? `${p.value.toLocaleString()}원` : `${p.value}명`}</span>
        </div>
      ))}
    </div>
  );
}

export default function AdminEnrollmentStats() {
  const { students, withdrawalRequests, enrollmentApplications } = useStore();

  const months = Array.from({ length: 12 }, (_, i) => format(subMonths(new Date(), 11 - i), 'yyyy-MM'));

  const chartData = months.map(m => {
    const newCount = students.filter(s => s.registrationDate.startsWith(m)).length;
    const withdrawnCount = withdrawalRequests.filter(r => r.status === 'approved' && r.resolvedAt.startsWith(m)).length;
    const pausedCount = students.filter(s => s.pausedAt?.startsWith(m)).length;
    const activeCount = students.filter(s => s.status === 'active' && s.registrationDate <= `${m}-31`).length;
    return { month: m.slice(2), new: newCount, active: activeCount, withdrawn: withdrawnCount, paused: pausedCount };
  });

  const refundData = months.map(m => {
    const approvedThisMonth = withdrawalRequests.filter(r => r.status === 'approved' && r.resolvedAt.startsWith(m));
    return {
      month: m.slice(2),
      환불금액: approvedThisMonth.reduce((sum, r) => sum + (r.refundAmount ?? 0), 0),
      퇴원인원: approvedThisMonth.length,
    };
  });

  const rateData = chartData.map(d => {
    const base = d.active + d.withdrawn;
    return {
      month: d.month,
      재원율: base > 0 ? Math.round((d.active / base) * 1000) / 10 : 0,
      퇴원율: base > 0 ? Math.round((d.withdrawn / base) * 1000) / 10 : 0,
    };
  });

  const visitRouteData = Object.entries(
    enrollmentApplications.reduce((acc, a) => { acc[a.visitRoute] = (acc[a.visitRoute] ?? 0) + 1; return acc; }, {} as Record<string, number>)
  ).map(([route, count]) => ({ route, count })).sort((a, b) => b.count - a.count);

  const thisMonth = months[months.length - 1];
  const thisMonthNew = chartData[chartData.length - 1].new;
  const thisMonthWithdrawn = chartData[chartData.length - 1].withdrawn;
  const thisMonthNet = thisMonthNew - thisMonthWithdrawn;
  const activeTotal = students.filter(s => s.status === 'active').length;
  const totalRefund6mo = refundData.slice(-6).reduce((sum, r) => sum + r.환불금액, 0);

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="shrink-0 px-6 py-4 bg-white border-b border-slate-200">
        <h1 className="text-lg font-bold text-slate-800 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-cyan-600" /> 증감 현황</h1>
        <p className="text-slate-400 text-xs mt-0.5">매월 신규 등록·퇴원·휴원 현황과 순증감 추이를 확인해요. ({thisMonth} 기준)</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto p-6 space-y-5">
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2"><Users className="w-4 h-4 text-cyan-600" /><span className="text-slate-500 text-xs font-medium">현재 재원생</span></div>
              <p className="text-slate-800 text-xl font-bold">{activeTotal}명</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2"><UserPlus2 className="w-4 h-4 text-cyan-600" /><span className="text-slate-500 text-xs font-medium">이번 달 신규</span></div>
              <p className="text-slate-800 text-xl font-bold">{thisMonthNew}명</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2"><UserMinus className="w-4 h-4 text-red-500" /><span className="text-slate-500 text-xs font-medium">이번 달 퇴원</span></div>
              <p className="text-slate-800 text-xl font-bold">{thisMonthWithdrawn}명</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2"><TrendingUp className={`w-4 h-4 ${thisMonthNet >= 0 ? 'text-emerald-500' : 'text-red-500'}`} /><span className="text-slate-500 text-xs font-medium">이번 달 순증감</span></div>
              <p className={`text-xl font-bold ${thisMonthNet >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{thisMonthNet >= 0 ? '+' : ''}{thisMonthNet}명</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-600" />
              <h2 className="text-[14px] font-semibold text-slate-700">월별(12개월) 인원 증감현황</h2>
            </div>
            <div className="p-6">
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <Tooltip content={<EnrollmentTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  {SERIES.map(s => (
                    <Line key={s.key} type="monotone" dataKey={s.key} name={s.label} stroke={s.color} strokeWidth={2} dot={{ r: 3 }} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h2 className="text-[14px] font-semibold text-slate-700">월별 상세</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm whitespace-nowrap">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 sticky left-0 bg-slate-50">구분</th>
                    {months.map(m => <th key={m} className="px-4 py-2.5 text-right text-xs font-medium text-slate-500">{m.slice(2)}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {SERIES.map(s => (
                    <tr key={s.key} className="border-b border-slate-50 last:border-0">
                      <td className="px-4 py-2.5 font-semibold sticky left-0 bg-white" style={{ color: s.color }}>{s.label}</td>
                      {chartData.map(d => <td key={d.month} className="px-4 py-2.5 text-right text-slate-600">{(d as any)[s.key]}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-cyan-600" />
                <h2 className="text-[14px] font-semibold text-slate-700">월별 퇴원/환불 현황</h2>
              </div>
              <span className="text-slate-400 text-xs">최근 6개월 환불 합계 {totalRefund6mo.toLocaleString()}원</span>
            </div>
            <div className="p-6">
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={refundData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis yAxisId="won" tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={v => `${Math.round(v / 10000)}만`} />
                  <YAxis yAxisId="count" orientation="right" tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
                  <Tooltip content={<RefundTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line yAxisId="won" type="monotone" dataKey="환불금액" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
                  <Line yAxisId="count" type="monotone" dataKey="퇴원인원" stroke="#94a3b8" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="4 3" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="overflow-x-auto border-t border-slate-100">
              <table className="w-full text-sm whitespace-nowrap">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 sticky left-0 bg-slate-50">구분</th>
                    {months.map(m => <th key={m} className="px-4 py-2.5 text-right text-xs font-medium text-slate-500">{m.slice(2)}</th>)}
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-slate-500">합계</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-50">
                    <td className="px-4 py-2.5 font-semibold text-red-500 sticky left-0 bg-white">환불</td>
                    {refundData.map(d => <td key={d.month} className="px-4 py-2.5 text-right text-slate-600">{d.환불금액.toLocaleString()}</td>)}
                    <td className="px-4 py-2.5 text-right font-bold text-slate-700">{refundData.reduce((s, d) => s + d.환불금액, 0).toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 font-semibold text-slate-500 sticky left-0 bg-white">퇴원</td>
                    {refundData.map(d => <td key={d.month} className="px-4 py-2.5 text-right text-slate-600">{d.퇴원인원}</td>)}
                    <td className="px-4 py-2.5 text-right font-bold text-slate-700">{refundData.reduce((s, d) => s + d.퇴원인원, 0)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-600" />
              <h2 className="text-[14px] font-semibold text-slate-700">월별 재원율/퇴원율</h2>
            </div>
            <div className="p-6">
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={rateData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} unit="%" domain={[0, 100]} />
                  <Tooltip formatter={(v: number) => `${v}%`} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="재원율" stroke="#0f172a" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="퇴원율" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-600" />
              <h2 className="text-[14px] font-semibold text-slate-700">방문경로 (입회 신청서 기준, 누적 {enrollmentApplications.length}건)</h2>
            </div>
            <div className="p-6">
              {visitRouteData.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-8">아직 작성된 입회 신청서가 없습니다.</p>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={visitRouteData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <YAxis type="category" dataKey="route" tick={{ fontSize: 12, fill: '#475569' }} width={70} />
                    <Tooltip formatter={(v: number) => `${v}명`} />
                    <Bar dataKey="count" name="인원" radius={[0, 6, 6, 0]}>
                      {visitRouteData.map(d => <Cell key={d.route} fill={VISIT_ROUTE_COLORS[d.route] ?? '#0891b2'} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
