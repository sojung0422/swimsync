import { useStore } from '../store/StoreContext';
import { UserPlus2, UserMinus, TrendingUp, Users } from 'lucide-react';
import { format, subMonths } from 'date-fns';

function BarRow({ label, value, max, colorClass, valueLabel }: { label: string; value: number; max: number; colorClass: string; valueLabel: string }) {
  const pct = max > 0 ? Math.max(2, Math.round((Math.abs(value) / max) * 100)) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-slate-400 text-xs w-14 shrink-0">{label}</span>
      <div className="flex-1 h-5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${colorClass}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-slate-600 text-xs font-semibold w-16 text-right shrink-0">{valueLabel}</span>
    </div>
  );
}

export default function AdminEnrollmentStats() {
  const { students, withdrawalRequests } = useStore();

  const months = Array.from({ length: 6 }, (_, i) => format(subMonths(new Date(), 5 - i), 'yyyy-MM'));
  const newByMonth = months.map(m => ({ month: m, count: students.filter(s => s.registrationDate.startsWith(m)).length }));
  const withdrawnByMonth = months.map(m => ({
    month: m,
    count: withdrawalRequests.filter(r => r.status === 'approved' && r.resolvedAt.startsWith(m)).length,
  }));
  const netByMonth = months.map((m, i) => ({ month: m, net: newByMonth[i].count - withdrawnByMonth[i].count }));
  const maxFlow = Math.max(1, ...newByMonth.map(r => r.count), ...withdrawnByMonth.map(r => r.count));
  const maxNet = Math.max(1, ...netByMonth.map(r => Math.abs(r.net)));

  const thisMonth = months[months.length - 1];
  const thisMonthNew = newByMonth[newByMonth.length - 1].count;
  const thisMonthWithdrawn = withdrawnByMonth[withdrawnByMonth.length - 1].count;
  const thisMonthNet = thisMonthNew - thisMonthWithdrawn;
  const activeTotal = students.filter(s => s.status === 'active').length;

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="shrink-0 px-6 py-4 bg-white border-b border-slate-200">
        <h1 className="text-lg font-bold text-slate-800 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-cyan-600" /> 증감 현황</h1>
        <p className="text-slate-400 text-xs mt-0.5">매월 신규 등록·퇴원 현황과 순증감 추이를 확인해요. ({thisMonth} 기준)</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-6 space-y-5">
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
              <h2 className="text-[14px] font-semibold text-slate-700">신규 등록 vs 퇴원 (최근 6개월)</h2>
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
              <TrendingUp className="w-4 h-4 text-cyan-600" />
              <h2 className="text-[14px] font-semibold text-slate-700">월별 순증감 추이</h2>
            </div>
            <div className="p-6 space-y-2">
              {netByMonth.map(r => (
                <BarRow key={r.month} label={r.month.slice(5)} value={r.net} max={maxNet} colorClass={r.net >= 0 ? 'bg-emerald-500' : 'bg-red-400'} valueLabel={`${r.net >= 0 ? '+' : ''}${r.net}명`} />
              ))}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h2 className="text-[14px] font-semibold text-slate-700">월별 상세</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    {['월', '신규 등록', '퇴원', '순증감'].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-slate-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {months.map((m, i) => (
                    <tr key={m} className="border-b border-slate-50 last:border-0">
                      <td className="px-4 py-2.5 text-slate-700 font-medium">{m}</td>
                      <td className="px-4 py-2.5 text-cyan-600 font-semibold">+{newByMonth[i].count}</td>
                      <td className="px-4 py-2.5 text-red-500 font-semibold">-{withdrawnByMonth[i].count}</td>
                      <td className={`px-4 py-2.5 font-bold ${netByMonth[i].net >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {netByMonth[i].net >= 0 ? '+' : ''}{netByMonth[i].net}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
