import { useState } from 'react';
import { useStore, CARE_CHECKLIST_ITEMS, careChecklistKey } from '../store/StoreContext';
import { ClipboardCheck, Package, Plus, Trash2, ChevronLeft, ChevronRight, Wallet } from 'lucide-react';
import { format, subMonths } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function CareChecklistTab() {
  const { careChecklist, toggleCareChecklistItem } = useStore();
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const daysInMonth = new Date(year, month, 0).getDate();

  const dailyItems = CARE_CHECKLIST_ITEMS.filter(i => i.category === 'daily');
  const weeklyItems = CARE_CHECKLIST_ITEMS.filter(i => i.category === 'weekly');
  const quarterlyItems = CARE_CHECKLIST_ITEMS.filter(i => i.category === 'quarterly');

  const Cell = ({ category, itemName, period }: { category: 'daily' | 'weekly' | 'quarterly'; itemName: string; period: number }) => {
    const key = careChecklistKey(year, month, category, itemName, period);
    const done = !!careChecklist[key];
    return (
      <td className="text-center border border-slate-100 p-0">
        <button onClick={() => toggleCareChecklistItem(key)}
          className={`w-full h-8 flex items-center justify-center text-xs transition-colors ${done ? 'bg-emerald-500 text-white' : 'bg-white hover:bg-slate-50 text-slate-300'}`}>
          {done ? '✓' : ''}
        </button>
      </td>
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <button onClick={() => setMonth(m => m === 1 ? (setYear(y => y - 1), 12) : m - 1)} className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50"><ChevronLeft className="w-4 h-4" /></button>
        <span className="text-slate-800 font-bold text-sm w-24 text-center">{year}년 {month}월</span>
        <button onClick={() => setMonth(m => m === 12 ? (setYear(y => y + 1), 1) : m + 1)} className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50"><ChevronRight className="w-4 h-4" /></button>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100"><h3 className="text-sm font-bold text-slate-700">일간 체크리스트</h3></div>
        <div className="overflow-x-auto">
          <table className="text-xs border-collapse w-full">
            <thead>
              <tr>
                <th className="sticky left-0 bg-slate-50 border border-slate-100 px-3 py-2 text-left font-medium text-slate-500 min-w-[160px]">항목</th>
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => (
                  <th key={d} className="border border-slate-100 px-1 py-2 font-medium text-slate-400 w-8">{d}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dailyItems.map(item => (
                <tr key={item.itemName}>
                  <td className="sticky left-0 bg-white border border-slate-100 px-3 py-1.5 text-slate-600 font-medium whitespace-nowrap">{item.itemName}</td>
                  {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => (
                    <Cell key={d} category="daily" itemName={item.itemName} period={d} />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100"><h3 className="text-sm font-bold text-slate-700">주간·월간 체크리스트</h3></div>
        <div className="overflow-x-auto">
          <table className="text-xs border-collapse w-full">
            <thead>
              <tr>
                <th className="sticky left-0 bg-slate-50 border border-slate-100 px-3 py-2 text-left font-medium text-slate-500 min-w-[160px]">항목</th>
                {[1, 2, 3, 4].map(w => <th key={w} className="border border-slate-100 px-3 py-2 font-medium text-slate-400">{w}주차</th>)}
              </tr>
            </thead>
            <tbody>
              {weeklyItems.map(item => (
                <tr key={item.itemName}>
                  <td className="sticky left-0 bg-white border border-slate-100 px-3 py-1.5 text-slate-600 font-medium whitespace-nowrap">{item.itemName}</td>
                  {[1, 2, 3, 4].map(w => <Cell key={w} category="weekly" itemName={item.itemName} period={w} />)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100"><h3 className="text-sm font-bold text-slate-700">분기별 체크리스트 ({year}년)</h3></div>
        <div className="overflow-x-auto">
          <table className="text-xs border-collapse w-full">
            <thead>
              <tr>
                <th className="sticky left-0 bg-slate-50 border border-slate-100 px-3 py-2 text-left font-medium text-slate-500 min-w-[160px]">항목</th>
                {[1, 2, 3, 4].map(q => <th key={q} className="border border-slate-100 px-3 py-2 font-medium text-slate-400">{q}분기</th>)}
              </tr>
            </thead>
            <tbody>
              {quarterlyItems.map(item => (
                <tr key={item.itemName}>
                  <td className="sticky left-0 bg-white border border-slate-100 px-3 py-1.5 text-slate-600 font-medium whitespace-nowrap">{item.itemName}</td>
                  {[1, 2, 3, 4].map(q => <Cell key={q} category="quarterly" itemName={item.itemName} period={q} />)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const INVENTORY_BAR_COLORS = ['#0891b2', '#8b5cf6', '#f59e0b', '#10b981', '#ec4899', '#6366f1', '#f97316'];

function InventoryTab() {
  const { inventoryItems, addInventoryItem, updateInventoryItem, deleteInventoryItem, inventoryTransactions, recordInventoryTransaction } = useStore();
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [draft, setDraft] = useState<Record<string, { in: string; out: string }>>({});
  const [priceDraft, setPriceDraft] = useState<Record<string, string>>({});
  const today = new Date().toISOString().slice(0, 10);

  const remainingOf = (itemId: string) => inventoryTransactions
    .filter(t => t.itemId === itemId)
    .reduce((sum, t) => sum + t.inAmount - t.outAmount, 0);

  const months = Array.from({ length: 6 }, (_, i) => format(subMonths(new Date(), 5 - i), 'yyyy-MM'));
  const monthlySpendData = months.map(m => {
    const row: Record<string, string | number> = { month: m.slice(2) };
    let total = 0;
    inventoryItems.forEach(item => {
      const spend = inventoryTransactions
        .filter(t => t.itemId === item.id && t.date.startsWith(m))
        .reduce((sum, t) => sum + t.inAmount * item.unitPrice, 0);
      row[item.name] = spend;
      total += spend;
    });
    row['합계'] = total;
    return row;
  });
  const totalSpend6mo = monthlySpendData.reduce((sum, r) => sum + (r['합계'] as number), 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <input value={newItemName} onChange={e => setNewItemName(e.target.value)} placeholder="새 품목명 (예: 수모)"
          className="border border-slate-200 rounded-xl px-3 py-2 text-sm w-48" />
        <input type="number" value={newItemPrice} onChange={e => setNewItemPrice(e.target.value)} placeholder="개당 금액"
          className="border border-slate-200 rounded-xl px-3 py-2 text-sm w-32" />
        <button onClick={() => { if (newItemName.trim()) { addInventoryItem(newItemName.trim(), parseInt(newItemPrice) || 0); setNewItemName(''); setNewItemPrice(''); } }}
          className="flex items-center gap-1 px-3 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-sm font-medium transition-colors">
          <Plus className="w-3.5 h-3.5" /> 품목 추가
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100"><h3 className="text-sm font-bold text-slate-700">품목별 입출고·잔여수량</h3></div>
        <div className="divide-y divide-slate-50">
          {inventoryItems.map(item => {
            const d = draft[item.id] ?? { in: '', out: '' };
            const remaining = remainingOf(item.id);
            return (
              <div key={item.id} className="px-5 py-3.5 flex items-center gap-3 flex-wrap">
                <p className="text-slate-800 text-sm font-semibold w-28 shrink-0 truncate">{item.name}</p>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-slate-400">개당</span>
                  <input type="number" value={priceDraft[item.id] ?? item.unitPrice} onChange={e => setPriceDraft(prev => ({ ...prev, [item.id]: e.target.value }))}
                    onBlur={() => updateInventoryItem(item.id, { unitPrice: parseInt(priceDraft[item.id] ?? String(item.unitPrice)) || 0 })}
                    className="w-20 border border-slate-200 rounded-lg px-2 py-1 text-xs text-right" />
                  <span className="text-xs text-slate-400">원</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-400">입고</span>
                  <input type="number" value={d.in} onChange={e => setDraft(prev => ({ ...prev, [item.id]: { ...d, in: e.target.value } }))}
                    className="w-16 border border-slate-200 rounded-lg px-2 py-1 text-xs text-right" />
                  <span className="text-xs text-slate-400">출고</span>
                  <input type="number" value={d.out} onChange={e => setDraft(prev => ({ ...prev, [item.id]: { ...d, out: e.target.value } }))}
                    className="w-16 border border-slate-200 rounded-lg px-2 py-1 text-xs text-right" />
                  <button onClick={() => {
                    recordInventoryTransaction(item.id, today, parseInt(d.in) || 0, parseInt(d.out) || 0);
                    setDraft(prev => ({ ...prev, [item.id]: { in: '', out: '' } }));
                  }} className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium transition-colors">기록</button>
                </div>
                <div className="flex-1" />
                <p className="text-cyan-700 font-bold text-sm text-right shrink-0">잔여 {remaining}개</p>
                <p className="text-slate-400 text-xs w-24 text-right shrink-0">(총 {(remaining * item.unitPrice).toLocaleString()}원)</p>
                <button onClick={() => deleteInventoryItem(item.id)} className="text-red-400 hover:text-red-600 shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            );
          })}
          {inventoryItems.length === 0 && <div className="py-12 text-center text-slate-400 text-sm">등록된 품목이 없습니다.</div>}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2"><Wallet className="w-4 h-4 text-cyan-600" /> 월별 비품 지출 (입고 금액 기준, 최근 6개월)</h3>
          <span className="text-slate-400 text-xs">합계 {totalSpend6mo.toLocaleString()}원</span>
        </div>
        <div className="p-5">
          {inventoryItems.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-8">등록된 품목이 없습니다.</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={monthlySpendData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={v => `${Math.round(v / 1000)}천`} />
                <Tooltip formatter={(v: number) => `${v.toLocaleString()}원`} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                {inventoryItems.map((item, i) => (
                  <Bar key={item.id} dataKey={item.name} stackId="spend" fill={INVENTORY_BAR_COLORS[i % INVENTORY_BAR_COLORS.length]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminCareOps() {
  const [tab, setTab] = useState<'care' | 'inventory'>('care');
  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="shrink-0 px-6 py-4 bg-white border-b border-slate-200">
        <h1 className="text-lg font-bold text-slate-800 flex items-center gap-2"><ClipboardCheck className="w-5 h-5 text-cyan-600" /> 케어팀·비품 관리</h1>
        <p className="text-slate-400 text-xs mt-0.5">청소 체크리스트와 비품 입출고·잔여수량을 관리해요.</p>
      </div>
      <div className="shrink-0 flex border-b border-slate-200 bg-white px-6">
        <button onClick={() => setTab('care')}
          className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${tab === 'care' ? 'border-cyan-600 text-cyan-700' : 'border-transparent text-slate-400 hover:text-slate-700'}`}>
          <ClipboardCheck className="w-4 h-4" /> 케어팀 체크리스트
        </button>
        <button onClick={() => setTab('inventory')}
          className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${tab === 'inventory' ? 'border-cyan-600 text-cyan-700' : 'border-transparent text-slate-400 hover:text-slate-700'}`}>
          <Package className="w-4 h-4" /> 비품 관리
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-6">
          {tab === 'care' ? <CareChecklistTab /> : <InventoryTab />}
        </div>
      </div>
    </div>
  );
}
