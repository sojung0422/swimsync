import { useState } from 'react';
import { useStore } from '../store/StoreContext';
import type { Vendor } from '../store/StoreContext';
import { Building2, Plus, Search, Trash2, MessageSquare, Save } from 'lucide-react';

const blankVendor = (): Omit<Vendor, 'id'> => ({
  name: '', bizType: '', bizRegNo: '', corpRegNo: '', industry: '', category: '', ceoName: '', vendorType: '',
  phone: '', fax: '', contactName: '', contactPhone: '', bank: '', accountNumber: '', accountHolder: '',
  address: '', note: '', active: true,
});

const inputCls = 'border border-slate-200 rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:border-cyan-500 transition-colors w-full';
const labelCls = 'block text-xs text-slate-500 mb-1 font-medium';

export default function AdminVendors() {
  const { vendors, addVendor, updateVendor, deleteVendor, addNotification, sendNotification } = useStore();
  const [nameFilter, setNameFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('active');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<Vendor, 'id'>>(blankVendor());
  const [selectedForSms, setSelectedForSms] = useState<string[]>([]);
  const [smsContent, setSmsContent] = useState('');
  const [showSms, setShowSms] = useState(false);

  const filtered = vendors.filter(v => {
    if (activeFilter !== 'all' && v.active !== (activeFilter === 'active')) return false;
    if (nameFilter.trim() && !v.name.includes(nameFilter.trim())) return false;
    return true;
  });

  const set = <K extends keyof Omit<Vendor, 'id'>>(key: K, val: Omit<Vendor, 'id'>[K]) => setForm(prev => ({ ...prev, [key]: val }));

  const selectVendor = (v: Vendor) => { setSelectedId(v.id); setForm({ ...v }); };
  const startNew = () => { setSelectedId(null); setForm(blankVendor()); };

  const handleSave = () => {
    if (!form.name.trim()) return;
    if (selectedId) updateVendor(selectedId, form);
    else addVendor(form);
    startNew();
  };

  const toggleSmsTarget = (id: string) => setSelectedForSms(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const sendBulkSms = () => {
    const phones = vendors.filter(v => selectedForSms.includes(v.id)).map(v => v.contactPhone || v.phone).filter(Boolean);
    if (phones.length === 0 || !smsContent.trim()) return;
    const id = addNotification({ type: 'custom', title: '거래처 안내 문자', content: smsContent.trim(), recipientIds: [], recipientPhones: phones });
    sendNotification(id);
    setSmsContent(''); setSelectedForSms([]); setShowSms(false);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="shrink-0 px-6 py-4 bg-white border-b border-slate-200">
        <h1 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Building2 className="w-5 h-5 text-cyan-600" /> 거래처 관리</h1>
        <p className="text-slate-400 text-xs mt-0.5">비품·용품 업체 등 학원 운영에 필요한 외부 거래처 정보를 관리해요.</p>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* List */}
        <div className="w-[360px] shrink-0 border-r border-slate-200 bg-white flex flex-col">
          <div className="p-4 space-y-2 border-b border-slate-100">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-300 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input value={nameFilter} onChange={e => setNameFilter(e.target.value)} placeholder="거래처명 검색"
                className={`${inputCls} pl-8`} />
            </div>
            <div className="flex gap-1.5">
              {(['all', 'active', 'inactive'] as const).map(f => (
                <button key={f} onClick={() => setActiveFilter(f)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${activeFilter === f ? 'bg-cyan-50 border-cyan-200 text-cyan-700' : 'bg-white border-slate-200 text-slate-500'}`}>
                  {f === 'all' ? '전체' : f === 'active' ? '사용' : '미사용'}
                </button>
              ))}
            </div>
            <div className="flex gap-1.5">
              <button onClick={startNew} className="flex-1 flex items-center justify-center gap-1 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-xs font-semibold transition-colors">
                <Plus className="w-3.5 h-3.5" /> 신규 거래처
              </button>
              <button onClick={() => setShowSms(p => !p)} className="flex-1 flex items-center justify-center gap-1 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition-colors">
                <MessageSquare className="w-3.5 h-3.5" /> 담당자 SMS
              </button>
            </div>
            {showSms && (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 space-y-1.5">
                <input value={smsContent} onChange={e => setSmsContent(e.target.value)} placeholder="발송할 메시지"
                  className={inputCls} />
                <button onClick={sendBulkSms} disabled={selectedForSms.length === 0 || !smsContent.trim()}
                  className="w-full py-1.5 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-40 text-white rounded-lg text-xs font-medium transition-colors">
                  {selectedForSms.length}곳에 발송
                </button>
              </div>
            )}
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
            {filtered.map(v => (
              <div key={v.id}
                className={`px-4 py-3 flex items-center gap-2.5 cursor-pointer hover:bg-slate-50 transition-colors ${selectedId === v.id ? 'bg-cyan-50' : ''}`}>
                {showSms && (
                  <input type="checkbox" checked={selectedForSms.includes(v.id)} onChange={() => toggleSmsTarget(v.id)} className="w-4 h-4 accent-cyan-600 shrink-0" />
                )}
                <button onClick={() => selectVendor(v)} className="flex-1 min-w-0 text-left">
                  <p className="text-slate-800 text-sm font-semibold truncate">{v.name}</p>
                  <p className="text-slate-400 text-xs mt-0.5 truncate">{v.vendorType || v.bizType || '-'} · {v.contactPhone || v.phone || '-'}</p>
                </button>
                {!v.active && <span className="text-[10px] text-slate-400 border border-slate-200 rounded-full px-2 py-0.5 shrink-0">미사용</span>}
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="py-16 text-center text-slate-400 text-sm">등록된 거래처가 없습니다.</div>
            )}
          </div>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-2xl bg-white border border-slate-200 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-slate-800 font-bold text-base">{selectedId ? '거래처 수정' : '신규 거래처 입력'}</h2>
              <label className="flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer">
                <input type="checkbox" checked={form.active} onChange={e => set('active', e.target.checked)} className="w-4 h-4 accent-cyan-600" /> 사용
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>거래처명 *</label>
                <input className={inputCls} value={form.name} onChange={e => set('name', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>거래처유형</label>
                <input className={inputCls} placeholder="예: 용품업체, 청소업체" value={form.vendorType} onChange={e => set('vendorType', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>사업자구분</label>
                <input className={inputCls} placeholder="예: 개인, 법인" value={form.bizType} onChange={e => set('bizType', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>사업자번호</label>
                <input className={inputCls} value={form.bizRegNo} onChange={e => set('bizRegNo', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>법인번호</label>
                <input className={inputCls} value={form.corpRegNo} onChange={e => set('corpRegNo', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>대표자명</label>
                <input className={inputCls} value={form.ceoName} onChange={e => set('ceoName', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>업태</label>
                <input className={inputCls} value={form.industry} onChange={e => set('industry', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>종목</label>
                <input className={inputCls} value={form.category} onChange={e => set('category', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>전화번호</label>
                <input className={inputCls} value={form.phone} onChange={e => set('phone', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>팩스번호</label>
                <input className={inputCls} value={form.fax} onChange={e => set('fax', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>담당자</label>
                <input className={inputCls} value={form.contactName} onChange={e => set('contactName', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>담당자연락처</label>
                <input className={inputCls} value={form.contactPhone} onChange={e => set('contactPhone', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>거래은행</label>
                <input className={inputCls} value={form.bank} onChange={e => set('bank', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>계좌번호</label>
                <input className={inputCls} value={form.accountNumber} onChange={e => set('accountNumber', e.target.value)} />
              </div>
              <div className="col-span-2">
                <label className={labelCls}>예금주</label>
                <input className={inputCls} value={form.accountHolder} onChange={e => set('accountHolder', e.target.value)} />
              </div>
              <div className="col-span-2">
                <label className={labelCls}>주소</label>
                <input className={inputCls} value={form.address} onChange={e => set('address', e.target.value)} />
              </div>
              <div className="col-span-2">
                <label className={labelCls}>비고</label>
                <textarea className={`${inputCls} resize-none`} rows={3} value={form.note} onChange={e => set('note', e.target.value)} />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              {selectedId && (
                <button onClick={() => { deleteVendor(selectedId); startNew(); }}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl text-red-600 text-sm font-medium transition-colors">
                  <Trash2 className="w-4 h-4" /> 삭제
                </button>
              )}
              <div className="flex-1" />
              <button onClick={handleSave} disabled={!form.name.trim()}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-40 text-white rounded-xl text-sm font-semibold transition-colors">
                <Save className="w-4 h-4" /> 저장
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
