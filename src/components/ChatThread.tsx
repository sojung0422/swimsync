import { useState } from 'react';
import { useStore } from '../store/StoreContext';
import { Phone, Send, PhoneCall } from 'lucide-react';
import { format, parseISO, isToday } from 'date-fns';
import { ko } from 'date-fns/locale';

type ChatThreadProps = {
  studentId: string;
  viewerRole: 'parent' | 'instructor';
  counterpartName: string;
  counterpartSubtitle: string; // 예: "김민준 학생 담당 강사" 또는 "김민준 학부모"
  counterpartPhone?: string;
};

export default function ChatThread({ studentId, viewerRole, counterpartName, counterpartSubtitle, counterpartPhone }: ChatThreadProps) {
  const { messages, sendMessage } = useStore();
  const [text, setText] = useState('');
  const [showCallNote, setShowCallNote] = useState(false);
  const [callNoteText, setCallNoteText] = useState('');

  const thread = messages.filter(m => m.studentId === studentId).sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  const handleSend = () => {
    if (!text.trim()) return;
    sendMessage(studentId, viewerRole, text, 'text');
    setText('');
  };

  const handleSaveCallNote = () => {
    if (!callNoteText.trim()) return;
    sendMessage(studentId, viewerRole, callNoteText, 'call_note');
    setCallNoteText('');
    setShowCallNote(false);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="shrink-0 bg-white border-b border-slate-100 px-4 py-3 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
          {counterpartName[0]}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-slate-800 text-sm font-semibold truncate">{counterpartName}</p>
          <p className="text-slate-400 text-[11px] truncate">{counterpartSubtitle}</p>
        </div>
        {counterpartPhone && (
          <div className="flex items-center gap-1.5 shrink-0">
            <button onClick={() => setShowCallNote(p => !p)}
              title="통화 메모 남기기"
              className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 flex items-center justify-center transition-colors">
              <PhoneCall className="w-3.5 h-3.5" />
            </button>
            <a href={`tel:${counterpartPhone}`}
              title="전화 걸기"
              className="w-8 h-8 rounded-full bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 text-cyan-700 flex items-center justify-center transition-colors">
              <Phone className="w-3.5 h-3.5" />
            </a>
          </div>
        )}
      </div>

      {showCallNote && (
        <div className="shrink-0 bg-amber-50 border-b border-amber-100 px-4 py-3 space-y-2">
          <p className="text-amber-700 text-[11px] font-semibold">전화 통화 후 나눈 이야기를 짧게 남겨보세요</p>
          <textarea value={callNoteText} onChange={e => setCallNoteText(e.target.value)} rows={2}
            placeholder="예: 오늘 컨디션 괜찮다고 하셨음, 다음 주 보강 일정 논의함"
            className="w-full border border-amber-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:border-amber-400 transition-colors resize-none" />
          <div className="flex gap-2">
            <button onClick={handleSaveCallNote} className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-semibold transition-colors">메모 저장</button>
            <button onClick={() => setShowCallNote(false)} className="px-3 py-1.5 text-amber-600 text-xs font-medium">취소</button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {thread.length === 0 && (
          <div className="text-center py-12 text-slate-400 text-sm">아직 주고받은 메시지가 없어요.</div>
        )}
        {thread.map(m => {
          if (m.kind === 'call_note') {
            return (
              <div key={m.id} className="flex justify-center">
                <div className="max-w-[85%] bg-amber-50 border border-amber-200 rounded-xl px-3.5 py-2 flex items-start gap-2">
                  <PhoneCall className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-amber-800 text-xs leading-5">{m.text}</p>
                    <p className="text-amber-500 text-[10px] mt-0.5">
                      {m.senderRole === 'parent' ? '학부모' : '강사'} 통화 메모 · {isToday(parseISO(m.createdAt)) ? format(parseISO(m.createdAt), 'HH:mm') : format(parseISO(m.createdAt), 'M/d HH:mm', { locale: ko })}
                    </p>
                  </div>
                </div>
              </div>
            );
          }
          const isMine = m.senderRole === viewerRole;
          return (
            <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 ${isMine ? 'bg-cyan-600 text-white rounded-br-sm' : 'bg-white border border-slate-200 text-slate-700 rounded-bl-sm'}`}>
                <p className="text-sm leading-5 whitespace-pre-wrap break-words">{m.text}</p>
                <p className={`text-[10px] mt-1 ${isMine ? 'text-cyan-100' : 'text-slate-400'}`}>
                  {isToday(parseISO(m.createdAt)) ? format(parseISO(m.createdAt), 'HH:mm') : format(parseISO(m.createdAt), 'M/d HH:mm', { locale: ko })}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="shrink-0 bg-white border-t border-slate-100 px-3 py-3 flex items-center gap-2">
        <input value={text} onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
          placeholder="메시지를 입력하세요"
          className="flex-1 border border-slate-200 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-400 transition-colors" />
        <button onClick={handleSend} disabled={!text.trim()}
          className="w-9 h-9 rounded-full bg-cyan-600 hover:bg-cyan-700 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center shrink-0 transition-colors">
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
