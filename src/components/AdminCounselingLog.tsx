import { useState } from 'react';
import { useStore } from '../store/StoreContext';
import type { LeadRecord } from '../store/StoreContext';
import { NotebookPen, Plus, Trash2, X, Send, CheckCircle2, Settings2, ArrowRightCircle, Image as ImageIcon, Star, Bookmark } from 'lucide-react';
import { format } from 'date-fns';

const STATUS_META: Record<LeadRecord['status'], { label: string; color: string }> = {
  open:      { label: '진행 중', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  converted: { label: '전환됨', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  closed:    { label: '종결',   color: 'bg-slate-100 text-slate-500 border-slate-200' },
};

function LeadFormModal({ initial, categories, onClose, onSave }: {
  initial?: LeadRecord; categories: string[]; onClose: () => void;
  onSave: (l: { name: string; phone: string; category: string; note: string }) => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [phone, setPhone] = useState(initial?.phone ?? '');
  const [category, setCategory] = useState(initial?.category ?? categories[0] ?? '');
  const [note, setNote] = useState(initial?.note ?? '');
  const inputCls = "w-full border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 placeholder:text-slate-400 text-sm focus:outline-none focus:border-cyan-500 transition-colors";
  const labelCls = "block text-xs font-medium text-slate-500 mb-1";

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-[15px] font-semibold text-slate-800">{initial ? '상담 기록 수정' : '상담 기록 추가'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className={labelCls}>상담자명 *</label>
            <input className={inputCls} value={name} onChange={e => setName(e.target.value)} placeholder="예: 김민준 학부모" />
          </div>
          <div>
            <label className={labelCls}>전화번호 *</label>
            <input className={inputCls} value={phone} onChange={e => setPhone(e.target.value)} placeholder="010-0000-0000" />
          </div>
          <div>
            <label className={labelCls}>구분</label>
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
              {categories.map(c => (
                <button key={c} type="button" onClick={() => setCategory(c)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${category === c ? 'bg-cyan-600 border-cyan-600 text-white' : 'bg-white border-slate-200 text-slate-500'}`}>
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className={labelCls}>내용</label>
            <textarea className={`${inputCls} resize-none`} rows={3} value={note} onChange={e => setNote(e.target.value)} placeholder="상담 내용을 입력하세요" />
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-slate-600 text-sm hover:bg-slate-50 transition-colors">취소</button>
            <button onClick={() => { if (!name.trim() || !phone.trim()) return; onSave({ name: name.trim(), phone: phone.trim(), category, note: note.trim() }); onClose(); }}
              className="flex-1 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-sm font-medium transition-colors">
              저장
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CategoryManagerModal({ categories, onClose, onAdd, onRemove }: {
  categories: string[]; onClose: () => void; onAdd: (c: string) => void; onRemove: (c: string) => void;
}) {
  const [newCat, setNewCat] = useState('');
  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-[15px] font-semibold text-slate-800">구분 카테고리 관리</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex flex-wrap gap-1.5">
            {categories.map(c => (
              <button key={c} onClick={() => onRemove(c)} title="클릭하면 삭제해요"
                className="px-2.5 py-1.5 rounded-lg text-xs font-medium border bg-cyan-600 border-cyan-600 text-white hover:bg-red-500 hover:border-red-500 transition-colors">
                {c} ✕
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm" placeholder="새 구분 입력" value={newCat} onChange={e => setNewCat(e.target.value)} />
            <button onClick={() => { if (!newCat.trim() || categories.includes(newCat.trim())) return; onAdd(newCat.trim()); setNewCat(''); }}
              className="px-3 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-sm font-medium transition-colors">추가</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function BulkSmsModal({ recipients, onClose }: { recipients: LeadRecord[]; onClose: () => void }) {
  const { messageTemplates, addMessageTemplate, deleteMessageTemplate, addNotification, sendNotification } = useStore();
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [templateLabel, setTemplateLabel] = useState('');
  const [sent, setSent] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => setImages(prev => [...prev, ev.target?.result as string]);
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const applyTemplate = (t: { content: string }) => setContent(t.content);

  const confirmSaveTemplate = () => {
    if (!content.trim()) return;
    addMessageTemplate(templateLabel.trim() || content.trim().slice(0, 14), content.trim());
    setTemplateLabel('');
    setSavingTemplate(false);
  };

  const handleSend = () => {
    if (!content.trim()) return;
    const phones = recipients.map(r => r.phone).filter(Boolean);
    if (phones.length === 0) return;
    const id = addNotification({ type: 'event', title: '이벤트 안내 (상담일지 대상 발송)', content: content.trim(), recipientIds: [], recipientPhones: phones, images });
    sendNotification(id);
    setSent(true);
    setTimeout(onClose, 1200);
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 shrink-0">
          <div>
            <h2 className="text-[15px] font-semibold text-slate-800">단체 문자 발송</h2>
            <p className="text-slate-400 text-xs mt-0.5">{recipients.length}명에게 보내요 — {recipients.slice(0, 3).map(r => r.name).join(', ')}{recipients.length > 3 ? ` 외 ${recipients.length - 3}명` : ''}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto">
          {messageTemplates.length > 0 && (
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1.5 flex items-center gap-1"><Star className="w-3.5 h-3.5 text-amber-400" /> 자주 사용하는 내용</p>
              <div className="flex flex-wrap gap-1.5">
                {messageTemplates.map(t => (
                  <div key={t.id} className="group relative">
                    <button onClick={() => applyTemplate(t)} title={t.content}
                      className="px-2.5 py-1.5 pr-6 rounded-lg text-xs font-medium border bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100 transition-colors">
                      {t.label}
                    </button>
                    <button onClick={() => deleteMessageTemplate(t.id)} title="삭제"
                      className="absolute right-1 top-1/2 -translate-y-1/2 text-amber-400 hover:text-red-500 text-[10px]">✕</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">발송할 메시지 내용</label>
            <textarea className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:border-cyan-500 transition-colors"
              rows={4} value={content} onChange={e => setContent(e.target.value)} placeholder="메시지 내용을 입력하세요 (템플릿을 불러온 뒤 수정해도 돼요)" />
            {!savingTemplate ? (
              <button onClick={() => setSavingTemplate(true)} disabled={!content.trim()}
                className="mt-1.5 flex items-center gap-1 text-cyan-600 hover:text-cyan-700 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-medium">
                <Bookmark className="w-3.5 h-3.5" /> 자주 쓰는 내용으로 저장
              </button>
            ) : (
              <div className="mt-1.5 flex items-center gap-1.5">
                <input className="flex-1 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs" placeholder="템플릿 이름 (선택, 비우면 내용 앞부분 사용)"
                  value={templateLabel} onChange={e => setTemplateLabel(e.target.value)} autoFocus />
                <button onClick={confirmSaveTemplate} className="px-2.5 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-xs font-medium transition-colors shrink-0">저장</button>
                <button onClick={() => setSavingTemplate(false)} className="px-2 py-1.5 text-slate-400 hover:text-slate-600 text-xs shrink-0">취소</button>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5 flex items-center gap-1"><ImageIcon className="w-3.5 h-3.5" /> 이미지 첨부 (여러 장 가능)</label>
            <div className="flex flex-wrap gap-2">
              {images.map((src, i) => (
                <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-200 shrink-0">
                  <img src={src} className="w-full h-full object-cover" alt="첨부 이미지" />
                  <button onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))}
                    className="absolute top-0.5 right-0.5 w-4 h-4 bg-black/60 rounded-full text-white text-[9px] flex items-center justify-center">✕</button>
                </div>
              ))}
              <label className="w-16 h-16 rounded-lg border-2 border-dashed border-slate-200 flex items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors shrink-0">
                <ImageIcon className="w-4 h-4 text-slate-400" />
                <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
              </label>
            </div>
          </div>
        </div>

        <div className="p-6 pt-0 shrink-0">
          {sent ? (
            <p className="text-emerald-600 text-sm font-semibold flex items-center justify-center gap-1.5 py-2.5"><CheckCircle2 className="w-4 h-4" /> 발송했어요.</p>
          ) : (
            <button onClick={handleSend} disabled={!content.trim()}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-40 text-white rounded-xl text-sm font-medium transition-colors">
              <Send className="w-4 h-4" /> {recipients.length}명에게 발송
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminCounselingLog() {
  const { leads, settings, addLead, updateLead, deleteLead, convertLeadToEnrolled, updateSettings } = useStore();
  const [categoryFilter, setCategoryFilter] = useState<'all' | string>('all');
  const [modal, setModal] = useState<{ mode: 'add' | 'edit'; lead?: LeadRecord } | null>(null);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [selectedForSms, setSelectedForSms] = useState<string[]>([]);
  const [showBulkSms, setShowBulkSms] = useState(false);

  const filtered = leads.filter(l => categoryFilter === 'all' || l.category === categoryFilter).slice().reverse();
  const isSmsEligible = (l: LeadRecord) => l.status === 'open' && l.category !== '정규수강' && !!l.phone;

  const toggleSmsTarget = (id: string) => setSelectedForSms(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const smsRecipients = leads.filter(l => selectedForSms.includes(l.id));

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="shrink-0 px-6 py-4 bg-white border-b border-slate-200 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-800 flex items-center gap-2"><NotebookPen className="w-5 h-5 text-cyan-600" /> 데스크 상담일지</h1>
          <p className="text-slate-400 text-xs mt-0.5">등록 전 문의·상담 기록을 구분 태그로 관리해요. 정규문의가 실제 등록하면 정규수강으로 전환할 수 있어요.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowCategoryManager(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-xl text-xs font-medium transition-colors">
            <Settings2 className="w-3.5 h-3.5" /> 구분 관리
          </button>
          <button onClick={() => setModal({ mode: 'add' })}
            className="flex items-center gap-1.5 px-3 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-medium transition-colors">
            <Plus className="w-3.5 h-3.5" /> 상담 기록 추가
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-6 space-y-5">

          {/* 필터 + 대량 SMS 액션 */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={() => setCategoryFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${categoryFilter === 'all' ? 'bg-cyan-50 border-cyan-200 text-cyan-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                전체 {leads.length}
              </button>
              {settings.leadCategories.map(c => {
                const count = leads.filter(l => l.category === c).length;
                if (count === 0) return null;
                return (
                  <button key={c} onClick={() => setCategoryFilter(c)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${categoryFilter === c ? 'bg-cyan-50 border-cyan-200 text-cyan-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                    {c} {count}
                  </button>
                );
              })}
            </div>
            {selectedForSms.length > 0 && (
              <button onClick={() => setShowBulkSms(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-semibold transition-colors animate-fade-up">
                <Send className="w-3.5 h-3.5" /> 단체 문자 ({selectedForSms.length}명 선택)
              </button>
            )}
          </div>

          {/* 상담 기록 목록 */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="px-4 py-3 w-8"></th>
                    {['구분', '날짜', '상담자', '전화번호', '내용', '상태', '작업'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium text-slate-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 && (
                    <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-400 text-sm">해당하는 상담 기록이 없습니다.</td></tr>
                  )}
                  {filtered.map(l => (
                    <tr key={l.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        {isSmsEligible(l) && (
                          <input type="checkbox" className="w-4 h-4 accent-cyan-600 cursor-pointer" title="단체 문자 대상으로 선택"
                            checked={selectedForSms.includes(l.id)} onChange={() => toggleSmsTarget(l.id)} />
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium border bg-violet-50 text-violet-700 border-violet-200">{l.category}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{format(new Date(l.createdAt.replace(' ', 'T')), 'yyyy-MM-dd')}</td>
                      <td className="px-4 py-3 text-slate-700 text-sm font-medium">{l.name}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{l.phone}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs max-w-xs truncate">{l.note || '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${STATUS_META[l.status].color}`}>{STATUS_META[l.status].label}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {l.category === '정규문의' && l.status === 'open' && (
                            <button onClick={() => convertLeadToEnrolled(l.id)} title="정규수강으로 전환"
                              className="flex items-center gap-1 px-2 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-lg text-[11px] font-medium transition-colors">
                              <ArrowRightCircle className="w-3 h-3" /> 정규수강 전환
                            </button>
                          )}
                          <button onClick={() => setModal({ mode: 'edit', lead: l })} className="p-1.5 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors">
                            <NotebookPen className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => deleteLead(l.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {modal && (
        <LeadFormModal
          initial={modal.lead}
          categories={settings.leadCategories}
          onClose={() => setModal(null)}
          onSave={data => modal.mode === 'add' ? addLead(data) : updateLead(modal.lead!.id, data)}
        />
      )}
      {showCategoryManager && (
        <CategoryManagerModal
          categories={settings.leadCategories}
          onClose={() => setShowCategoryManager(false)}
          onAdd={c => updateSettings({ leadCategories: [...settings.leadCategories, c] })}
          onRemove={c => updateSettings({ leadCategories: settings.leadCategories.filter(x => x !== c) })}
        />
      )}
      {showBulkSms && (
        <BulkSmsModal recipients={smsRecipients} onClose={() => { setShowBulkSms(false); setSelectedForSms([]); }} />
      )}
    </div>
  );
}
