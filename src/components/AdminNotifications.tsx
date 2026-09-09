import { useState } from 'react';
import { useStore, getPrimaryContactPhone } from '../store/StoreContext';
import type { NotificationRecord, NotificationGroup } from '../store/StoreContext';
import {
  Bell, Send, Trash2, CheckCircle, Clock, Users, ChevronDown,
  ChevronUp, Plus, X, Gift, CreditCard, CalendarOff, MessageSquare, Settings2, FolderPlus
} from 'lucide-react';
import { format } from 'date-fns';

// ─── 발송 그룹 관리 모달 ────────────────────────────────────────────────────────

function GroupManagerModal({ onClose }: { onClose: () => void }) {
  const { students, notificationGroups, addNotificationGroup, updateNotificationGroup, deleteNotificationGroup } = useStore();
  const [category, setCategory] = useState<'adult' | 'child'>('child');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nameDraft, setNameDraft] = useState('');
  const [memberDraft, setMemberDraft] = useState<string[]>([]);
  const [showForm, setShowForm] = useState(false);

  const categoryStudents = students.filter(s => s.status === 'active' && s.category === category);
  const categoryGroups = notificationGroups.filter(g => g.category === category);

  const startNew = () => { setEditingId(null); setNameDraft(''); setMemberDraft([]); setShowForm(true); };
  const startEdit = (g: NotificationGroup) => { setEditingId(g.id); setNameDraft(g.name); setMemberDraft(g.studentIds); setShowForm(true); };
  const toggleMember = (id: string) => setMemberDraft(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const handleSave = () => {
    if (!nameDraft.trim()) return;
    if (editingId) updateNotificationGroup(editingId, { name: nameDraft.trim(), studentIds: memberDraft });
    else addNotificationGroup({ name: nameDraft.trim(), category, studentIds: memberDraft });
    setShowForm(false);
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 shrink-0">
          <h2 className="text-[15px] font-semibold text-slate-800 flex items-center gap-2"><Settings2 className="w-4 h-4 text-cyan-600" /> 발송 그룹 관리</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
        </div>
        <div className="px-6 pt-4 flex gap-2 shrink-0">
          {(['child', 'adult'] as const).map(c => (
            <button key={c} onClick={() => { setCategory(c); setShowForm(false); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${category === c ? 'bg-cyan-50 border-cyan-200 text-cyan-700' : 'bg-white border-slate-200 text-slate-500'}`}>
              {c === 'child' ? '아동' : '성인'}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-2">
          {!showForm && categoryGroups.map(g => (
            <div key={g.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <p className="text-slate-700 text-sm font-semibold">{g.name}</p>
                <p className="text-slate-400 text-xs mt-0.5">{g.studentIds.length}명</p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => startEdit(g)} className="text-cyan-600 hover:text-cyan-700 text-xs font-medium px-2 py-1">수정</button>
                <button onClick={() => deleteNotificationGroup(g.id)} className="text-slate-300 hover:text-red-500 p-1"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ))}
          {!showForm && categoryGroups.length === 0 && (
            <p className="text-slate-400 text-sm text-center py-6">등록된 {category === 'child' ? '아동' : '성인'} 그룹이 없습니다.</p>
          )}
          {!showForm && (
            <button onClick={startNew} className="w-full flex items-center justify-center gap-1.5 py-2.5 border border-dashed border-cyan-300 text-cyan-600 rounded-xl text-sm font-medium hover:bg-cyan-50 transition-colors">
              <FolderPlus className="w-4 h-4" /> 새 그룹 만들기 (예: {category === 'child' ? '정규반, 유치반' : '오전반, 저녁반'})
            </button>
          )}
          {showForm && (
            <div className="space-y-3">
              <input className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-cyan-500"
                placeholder="그룹 이름 (예: 성인 오전)" value={nameDraft} onChange={e => setNameDraft(e.target.value)} />
              <p className="text-xs text-slate-500 font-medium">포함할 회원 선택 ({memberDraft.length}명)</p>
              <div className="border border-slate-200 rounded-xl max-h-56 overflow-y-auto divide-y divide-slate-50">
                {categoryStudents.map(s => (
                  <label key={s.id} className="flex items-center gap-2.5 px-3 py-2 hover:bg-slate-50 cursor-pointer">
                    <input type="checkbox" checked={memberDraft.includes(s.id)} onChange={() => toggleMember(s.id)} className="w-4 h-4 accent-cyan-600" />
                    <span className="text-sm text-slate-700">{s.studentName}</span>
                  </label>
                ))}
                {categoryStudents.length === 0 && <p className="px-3 py-4 text-slate-400 text-sm text-center">해당 구분의 회원이 없습니다.</p>}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-slate-600 text-sm hover:bg-slate-50 transition-colors">취소</button>
                <button onClick={handleSave} disabled={!nameDraft.trim()} className="flex-1 py-2.5 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-40 text-white rounded-xl text-sm font-medium transition-colors">저장</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const TYPE_META = {
  event:   { label: '이벤트',   color: 'bg-violet-50 text-violet-700 border-violet-200',   icon: Gift,         template: '[이벤트] ' },
  payment: { label: '결제 안내', color: 'bg-amber-50 text-amber-700 border-amber-200',     icon: CreditCard,   template: '[결제 안내] ' },
  holiday: { label: '휴무 안내', color: 'bg-red-50 text-red-600 border-red-200',           icon: CalendarOff,  template: '[휴무 안내] ' },
  custom:  { label: '일반 공지', color: 'bg-cyan-50 text-cyan-700 border-cyan-200',         icon: MessageSquare, template: '' },
} as const;

type NotifType = keyof typeof TYPE_META;

export default function AdminNotifications() {
  const { students, notifications, addNotification, sendNotification, deleteNotification, notificationGroups } = useStore();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<NotifType>('custom');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showIndividual, setShowIndividual] = useState(false);
  const [showGroupManager, setShowGroupManager] = useState(false);
  const [recipientCategory, setRecipientCategory] = useState<'child' | 'adult'>('child');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterSent, setFilterSent] = useState<'all' | 'sent' | 'draft'>('all');

  const activeStudents = students.filter(s => s.status === 'active' && getPrimaryContactPhone(s));
  const categoryGroups = notificationGroups.filter(g => g.category === recipientCategory);

  const isGroupFullySelected = (g: NotificationGroup) => g.studentIds.length > 0 && g.studentIds.every(id => selectedIds.includes(id));
  const toggleGroup = (g: NotificationGroup) => {
    if (isGroupFullySelected(g)) setSelectedIds(prev => prev.filter(id => !g.studentIds.includes(id)));
    else setSelectedIds(prev => Array.from(new Set([...prev, ...g.studentIds])));
  };

  const toggleStudent = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const selectAll = () => setSelectedIds(activeStudents.map(s => s.id));
  const deselectAll = () => setSelectedIds([]);

  const applyTemplate = (t: NotifType) => {
    setType(t);
    const tmpl = TYPE_META[t].template;
    if (tmpl && !title.startsWith(tmpl.slice(0, 3))) setTitle(tmpl);
  };

  const handleCreate = () => {
    if (!title.trim() || !content.trim() || selectedIds.length === 0) return;
    addNotification({ type, title: title.trim(), content: content.trim(), recipientIds: selectedIds });
    setTitle(''); setContent(''); setSelectedIds([]);
  };

  const filtered = notifications.filter(n => {
    if (filterSent === 'sent') return n.sentAt !== null;
    if (filterSent === 'draft') return n.sentAt === null;
    return true;
  }).slice().reverse();

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header */}
      <div className="shrink-0 px-6 py-4 bg-white border-b border-slate-200">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-bold text-slate-800">공지 발송</h1>
        </div>
        <p className="text-slate-400 text-xs mt-0.5">등록 회원에게 SMS / 앱 푸시 공지를 발송합니다</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto p-6 space-y-6">

          {/* ── Compose ── */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
              <Plus className="w-4 h-4 text-cyan-600" />
              <h2 className="text-[14px] font-semibold text-slate-700">새 공지 작성</h2>
            </div>

            <div className="p-6 space-y-4">
              {/* Type selector */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-2">공지 유형</label>
                <div className="flex gap-2 flex-wrap">
                  {(Object.entries(TYPE_META) as [NotifType, typeof TYPE_META[NotifType]][]).map(([key, meta]) => {
                    const Icon = meta.icon;
                    return (
                      <button key={key} onClick={() => applyTemplate(key)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-colors ${type === key ? meta.color + ' font-semibold' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                        <Icon className="w-3.5 h-3.5" /> {meta.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">제목</label>
                <input
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 placeholder:text-slate-400 text-sm focus:outline-none focus:border-cyan-500 transition-colors"
                  placeholder="공지 제목을 입력하세요"
                  value={title} onChange={e => setTitle(e.target.value)}
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">내용</label>
                <textarea
                  rows={4}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 placeholder:text-slate-400 text-sm focus:outline-none focus:border-cyan-500 transition-colors resize-none"
                  placeholder="공지 내용을 입력하세요"
                  value={content} onChange={e => setContent(e.target.value)}
                />
                <p className="text-xs text-slate-400 mt-1 text-right">{content.length}자</p>
              </div>

              {/* Recipients */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-medium text-slate-500">수신 대상</label>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium ${selectedIds.length > 0 ? 'text-cyan-700' : 'text-slate-400'}`}>
                      {selectedIds.length}명 선택
                    </span>
                    <button onClick={selectAll} className="text-xs text-cyan-600 hover:text-cyan-700 transition-colors">전체 선택</button>
                    <button onClick={deselectAll} className="text-xs text-slate-400 hover:text-slate-600 transition-colors">해제</button>
                    <button onClick={() => setShowGroupManager(true)} className="text-xs text-slate-500 hover:text-cyan-600 transition-colors flex items-center gap-1">
                      <Settings2 className="w-3 h-3" /> 그룹 관리
                    </button>
                  </div>
                </div>

                <div className="flex gap-2 mb-2">
                  {(['child', 'adult'] as const).map(c => (
                    <button key={c} onClick={() => setRecipientCategory(c)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${recipientCategory === c ? 'bg-cyan-50 border-cyan-200 text-cyan-700' : 'bg-white border-slate-200 text-slate-500'}`}>
                      {c === 'child' ? '아동' : '성인'}
                    </button>
                  ))}
                </div>

                <div className="border border-slate-200 rounded-xl p-3 flex flex-wrap gap-2 bg-slate-50">
                  {categoryGroups.map(g => {
                    const selected = isGroupFullySelected(g);
                    return (
                      <button key={g.id} onClick={() => toggleGroup(g)}
                        className={`px-3 py-2 rounded-xl text-xs font-medium border transition-colors ${selected ? 'bg-cyan-600 border-cyan-600 text-white' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'}`}>
                        {g.name} <span className={selected ? 'text-cyan-100' : 'text-slate-400'}>({g.studentIds.length}명)</span>
                      </button>
                    );
                  })}
                  {categoryGroups.length === 0 && (
                    <p className="text-slate-400 text-xs py-1">
                      {recipientCategory === 'child' ? '아동' : '성인'} 그룹이 아직 없어요. "그룹 관리"에서 정규반·유치반처럼 원하는 묶음을 만들어보세요.
                    </p>
                  )}
                </div>

                <button
                  onClick={() => setShowIndividual(p => !p)}
                  className="w-full flex items-center justify-between px-4 py-2.5 mt-2 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 transition-colors text-xs text-slate-500">
                  <span>개별 선택으로 세부 조정하기</span>
                  {showIndividual ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {showIndividual && (
                  <div className="mt-2 border border-slate-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                    {activeStudents.map(s => (
                      <label key={s.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0 transition-colors">
                        <input type="checkbox" checked={selectedIds.includes(s.id)} onChange={() => toggleStudent(s.id)}
                          className="w-4 h-4 accent-cyan-600" />
                        <div className="flex-1">
                          <span className="text-slate-700 text-sm font-medium">{s.studentName}</span>
                          <span className="text-slate-400 text-xs ml-2">{s.category === 'child' ? '아동' : '성인'}</span>
                        </div>
                        <span className="text-slate-400 text-xs">{getPrimaryContactPhone(s)}</span>
                      </label>
                    ))}
                    {activeStudents.length === 0 && (
                      <p className="px-4 py-4 text-slate-400 text-sm text-center">전화번호가 등록된 수강 중인 회원이 없습니다.</p>
                    )}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button onClick={handleCreate}
                  disabled={!title.trim() || !content.trim() || selectedIds.length === 0}
                  className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl text-slate-700 text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                  <Clock className="w-4 h-4" /> 임시 저장
                </button>
                <button
                  onClick={() => {
                    if (!title.trim() || !content.trim() || selectedIds.length === 0) return;
                    const newId = addNotification({ type, title: title.trim(), content: content.trim(), recipientIds: selectedIds });
                    sendNotification(newId);
                    setTitle(''); setContent(''); setSelectedIds([]);
                  }}
                  disabled={!title.trim() || !content.trim() || selectedIds.length === 0}
                  className="flex items-center gap-2 px-5 py-2.5 bg-cyan-600 hover:bg-cyan-700 rounded-xl text-white text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                  <Send className="w-4 h-4" /> {selectedIds.length > 0 ? `${selectedIds.length}명에게 발송` : '발송'}
                </button>
              </div>
            </div>
          </div>

          {/* ── History ── */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-cyan-600" />
                <h2 className="text-[14px] font-semibold text-slate-700">발송 내역</h2>
              </div>
              <div className="flex items-center gap-1">
                {(['all', 'sent', 'draft'] as const).map(f => (
                  <button key={f} onClick={() => setFilterSent(f)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${filterSent === f ? 'bg-cyan-50 border-cyan-200 text-cyan-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                    {f === 'all' ? '전체' : f === 'sent' ? '발송 완료' : '임시 저장'}
                  </button>
                ))}
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="py-16 text-center text-slate-400">
                <Bell className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">발송 내역이 없습니다.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {filtered.map(n => {
                  const meta = TYPE_META[n.type];
                  const Icon = meta.icon;
                  const isExpanded = expandedId === n.id;
                  const recipientNames = n.recipientIds.map(id => students.find(s => s.id === id)?.studentName).filter(Boolean);
                  const recipientCount = n.recipientPhones?.length ? n.recipientPhones.length : n.recipientIds.length;

                  return (
                    <div key={n.id} className="px-6 py-4">
                      <div className="flex items-start gap-4">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${meta.color}`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${meta.color}`}>{meta.label}</span>
                            <span className="text-slate-800 text-sm font-medium truncate">{n.title}</span>
                            {n.sentAt ? (
                              <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-medium">
                                <CheckCircle className="w-3 h-3" /> 발송 완료
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-[10px] text-amber-600 font-medium">
                                <Clock className="w-3 h-3" /> 임시 저장
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-slate-400 text-xs flex items-center gap-1">
                              <Users className="w-3 h-3" /> {recipientCount}명
                            </span>
                            <span className="text-slate-400 text-xs">{n.createdAt}</span>
                            {n.sentAt && <span className="text-slate-400 text-xs">발송: {n.sentAt}</span>}
                          </div>

                          {isExpanded && (
                            <div className="mt-3 space-y-2 animate-fade-up">
                              <p className="text-slate-600 text-sm bg-slate-50 rounded-xl p-3 leading-relaxed">{n.content}</p>
                              <p className="text-slate-400 text-xs">수신자: {n.recipientPhones?.length ? n.recipientPhones.join(', ') : recipientNames.join(', ')}</p>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button onClick={() => setExpandedId(isExpanded ? null : n.id)}
                            className="text-slate-400 hover:text-slate-700 transition-colors p-1">
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                          {!n.sentAt && (
                            <button onClick={() => sendNotification(n.id)}
                              className="flex items-center gap-1 px-2.5 py-1.5 bg-cyan-600 hover:bg-cyan-700 rounded-lg text-white text-xs font-medium transition-colors">
                              <Send className="w-3 h-3" /> 발송
                            </button>
                          )}
                          <button onClick={() => deleteNotification(n.id)}
                            className="text-slate-300 hover:text-red-500 transition-colors p-1">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
      {showGroupManager && <GroupManagerModal onClose={() => setShowGroupManager(false)} />}
    </div>
  );
}
