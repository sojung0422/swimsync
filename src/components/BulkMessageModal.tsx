import { useState } from 'react';
import { useStore } from '../store/StoreContext';
import { X, Send, CheckCircle2, Image as ImageIcon, Star, Bookmark } from 'lucide-react';

// 여러 화면(데스크 상담일지의 미등록 리드, 강습생 관리의 재원생 등)에서 공통으로 쓰는
// 단체 문자 작성 모달 — 실제 발송 방식(recipientIds vs recipientPhones)은 호출부의 onSend가 결정함
export default function BulkMessageModal({ recipientNames, onSend, onClose }: {
  recipientNames: string[];
  onSend: (content: string, images: string[]) => void;
  onClose: () => void;
}) {
  const { messageTemplates, addMessageTemplate, deleteMessageTemplate } = useStore();
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

  const confirmSaveTemplate = () => {
    if (!content.trim()) return;
    addMessageTemplate(templateLabel.trim() || content.trim().slice(0, 14), content.trim());
    setTemplateLabel('');
    setSavingTemplate(false);
  };

  const handleSend = () => {
    if (!content.trim() || recipientNames.length === 0) return;
    onSend(content.trim(), images);
    setSent(true);
    setTimeout(onClose, 1200);
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 shrink-0">
          <div>
            <h2 className="text-[15px] font-semibold text-slate-800">단체 문자 발송</h2>
            <p className="text-slate-400 text-xs mt-0.5">{recipientNames.length}명에게 보내요 — {recipientNames.slice(0, 3).join(', ')}{recipientNames.length > 3 ? ` 외 ${recipientNames.length - 3}명` : ''}</p>
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
                    <button onClick={() => setContent(t.content)} title={t.content}
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
              <Send className="w-4 h-4" /> {recipientNames.length}명에게 발송
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
