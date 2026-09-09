import { useState } from 'react';
import { useStore, CARE_CHECKLIST_ITEMS, careChecklistKey } from '../store/StoreContext';
import { ClipboardCheck, Package, Plus, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

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

function InventoryTab() {
  const { inventoryItems, addInventoryItem, deleteInventoryItem, inventoryTransactions, recordInventoryTransaction } = useStore();
  const [newItemName, setNewItemName] = useState('');
  const [draft, setDraft] = useState<Record<string, { in: string; out: string }>>({});
  const today = new Date().toISOString().slice(0, 10);

  const remainingOf = (itemId: string) => inventoryTransactions
    .filter(t => t.itemId === itemId)
    .reduce((sum, t) => sum + t.inAmount - t.outAmount, 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <input value={newItemName} onChange={e => setNewItemName(e.target.value)} placeholder="새 품목명 (예: 수모)"
          className="border border-slate-200 rounded-xl px-3 py-2 text-sm w-56" />
        <button onClick={() => { if (newItemName.trim()) { addInventoryItem(newItemName.trim()); setNewItemName(''); } }}
          className="flex items-center gap-1 px-3 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-sm font-medium transition-colors">
          <Plus className="w-3.5 h-3.5" /> 품목 추가
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100"><h3 className="text-sm font-bold text-slate-700">품목별 입출고·잔여수량</h3></div>
        <div className="divide-y divide-slate-50">
          {inventoryItems.map(item => {
            const d = draft[item.id] ?? { in: '', out: '' };
            return (
              <div key={item.id} className="px-5 py-3.5 flex items-center gap-4">
                <p className="text-slate-800 text-sm font-semibold flex-1 min-w-0">{item.name}</p>
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
                <p className="text-cyan-700 font-bold text-sm w-24 text-right shrink-0">잔여 {remainingOf(item.id)}개</p>
                <button onClick={() => deleteInventoryItem(item.id)} className="text-red-400 hover:text-red-600 shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            );
          })}
          {inventoryItems.length === 0 && <div className="py-12 text-center text-slate-400 text-sm">등록된 품목이 없습니다.</div>}
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
