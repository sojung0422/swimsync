import { useState } from 'react';
import { useStore } from '../store/StoreContext';
import { MessageCircle, CheckCircle2, Trash2, UserCircle, Smartphone } from 'lucide-react';

export default function AdminFeedback() {
  const { feedbackNotes, markFeedbackReviewed, deleteFeedbackNote } = useStore();
  const [filter, setFilter] = useState<'all' | 'new' | 'reviewed'>('all');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'parent' | 'instructor'>('all');

  const list = feedbackNotes
    .filter(n => filter === 'all' || n.status === filter)
    .filter(n => sourceFilter === 'all' || n.sourceApp === sourceFilter)
    .slice().reverse();
  const newCount = feedbackNotes.filter(n => n.status === 'new').length;

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="shrink-0 px-6 py-4 bg-white border-b border-slate-200 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-800 flex items-center gap-2"><MessageCircle className="w-5 h-5 text-cyan-600" /> 의견함</h1>
          <p className="text-slate-400 text-xs mt-0.5">학부모·성인 회원·강사·데스크가 앱에서 남긴 건의사항이에요. 전부 반영되진 않지만, 필요하다고 판단되면 참고해요.</p>
        </div>
        {newCount > 0 && (
          <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full">
            새 의견 {newCount}건
          </span>
        )}
      </div>

      <div className="shrink-0 px-6 py-3 bg-white border-b border-slate-100 flex items-center gap-2 flex-wrap">
        {(['all', 'new', 'reviewed'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${filter === f ? 'bg-cyan-50 border-cyan-200 text-cyan-700' : 'bg-white border-slate-200 text-slate-500'}`}>
            {f === 'all' ? '전체' : f === 'new' ? '새 의견' : '확인함'}
          </button>
        ))}
        <div className="w-px h-4 bg-slate-200" />
        {(['all', 'parent', 'instructor'] as const).map(f => (
          <button key={f} onClick={() => setSourceFilter(f)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${sourceFilter === f ? 'bg-slate-800 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-500'}`}>
            {f === 'all' ? '전체' : f === 'parent' ? '학부모/성인' : '강사/데스크'}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto p-6 space-y-3">
          {list.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl py-16 text-center text-slate-400">
              <MessageCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">등록된 의견이 없습니다.</p>
            </div>
          ) : list.map(n => (
            <div key={n.id} className="bg-white border border-slate-200 rounded-2xl p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${n.sourceApp === 'parent' ? 'bg-sky-50 text-sky-700 border-sky-200' : 'bg-violet-50 text-violet-700 border-violet-200'}`}>
                      {n.sourceApp === 'parent' ? <Smartphone className="w-3 h-3" /> : <UserCircle className="w-3 h-3" />}
                      {n.sourceApp === 'parent' ? '학부모/성인' : '강사/데스크'}
                    </span>
                    <span className="text-slate-700 text-sm font-semibold">{n.authorName}</span>
                    {n.status === 'new' && <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">새 의견</span>}
                  </div>
                  <p className="text-slate-600 text-sm mt-2 leading-relaxed whitespace-pre-wrap">{n.content}</p>
                  <p className="text-slate-300 text-[11px] mt-2">{n.createdAt}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {n.status === 'new' && (
                    <button onClick={() => markFeedbackReviewed(n.id)}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 rounded-lg text-cyan-700 text-xs font-medium transition-colors">
                      <CheckCircle2 className="w-3.5 h-3.5" /> 확인
                    </button>
                  )}
                  <button onClick={() => deleteFeedbackNote(n.id)} className="text-slate-300 hover:text-red-500 transition-colors p-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
