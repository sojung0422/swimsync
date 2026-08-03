import { useState } from 'react';
import { useStore, getClassDivision } from '../store/StoreContext';
import type { MakeupRequest } from '../store/StoreContext';
import { format, parseISO, isAfter } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  FileWarning, Image as ImageIcon, CheckCircle2, XCircle, Wallet,
  Clock, X, CalendarClock, AlertCircle
} from 'lucide-react';

const STATUS_META: Record<MakeupRequest['status'], { label: string; color: string }> = {
  pending:            { label: '승인 대기',   color: 'bg-amber-50 text-amber-700 border-amber-200' },
  approved_makeup:    { label: '보강 확정',   color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  approved_carryover: { label: '이월 처리',   color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  rejected:           { label: '거절됨',     color: 'bg-red-50 text-red-600 border-red-200' },
};

// ─── 보강 슬롯 선택 모달 ───────────────────────────────────────────────────────

function AssignSlotModal({ request, onClose }: { request: MakeupRequest; onClose: () => void }) {
  const { classes, instructors, students, approveMakeupRequestAsSlot } = useStore();
  const today = new Date();
  const student = students.find(s => s.id === request.studentId);

  const candidates = classes
    .filter(c => isAfter(parseISO(c.date), today))
    .map(c => {
      const instructor = instructors.find(i => i.id === c.instructorId);
      const current = c.studentIds.length + c.makeupStudentIds.length - c.absentStudentIds.length;
      const remaining = (instructor?.maxCapacity ?? 5) - current;
      const division = getClassDivision(c, students);
      return { c, instructor, remaining, division };
    })
    // 보강은 같은 구분(유치부/정규반/성인반) 내에서만 가능
    .filter(x => x.remaining > 0 && (x.division === null || x.division === student?.division))
    .sort((a, b) => a.c.date.localeCompare(b.c.date) || a.c.time.localeCompare(b.c.time))
    .slice(0, 30);

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-xl flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <h2 className="text-[15px] font-semibold text-slate-800">보강 슬롯 배정 — {student?.studentName}</h2>
            <p className="text-slate-400 text-xs mt-1">{student?.division} 구분의 자리만 표시돼요</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {candidates.length === 0 && (
            <p className="text-slate-400 text-sm text-center py-8">배정 가능한 자리가 없습니다.</p>
          )}
          {candidates.map(({ c, instructor, remaining }) => (
            <button key={c.id} onClick={() => { approveMakeupRequestAsSlot(request.id, c.id); onClose(); }}
              className="w-full text-left border border-slate-200 rounded-xl p-3.5 flex justify-between items-center hover:border-cyan-500 hover:bg-cyan-50 transition-colors">
              <div>
                <p className="font-bold text-slate-800 text-sm">{format(parseISO(c.date), 'M월 d일 (E)', { locale: ko })} {c.time}</p>
                <p className="text-slate-400 text-xs mt-0.5">{instructor?.name} 강사</p>
              </div>
              <span className="text-xs font-medium text-cyan-600 bg-cyan-50 px-2.5 py-1 rounded-full border border-cyan-100">잔여 {remaining}자리</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── 요청 카드 ────────────────────────────────────────────────────────────────

function RequestCard({ request }: { request: MakeupRequest }) {
  const { students, classes, instructors, approveMakeupRequestAsCarryover, rejectMakeupRequest } = useStore();
  const [showAssign, setShowAssign] = useState(false);
  const [showDoc, setShowDoc] = useState(false);

  const student = students.find(s => s.id === request.studentId);
  const assignedInstructor = student ? instructors.find(i => i.id === student.instructorId) : null;
  const fromClass = classes.find(c => c.id === request.fromClassId);
  const meta = STATUS_META[request.status];
  const toClass = request.toClassId ? classes.find(c => c.id === request.toClassId) : null;
  const toInstructor = toClass ? instructors.find(i => i.id === toClass.instructorId) : null;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5">
      <div className="flex items-start gap-4">
        <button onClick={() => setShowDoc(true)}
          className="w-14 h-14 rounded-xl overflow-hidden border border-slate-200 shrink-0 bg-slate-50 flex items-center justify-center hover:opacity-80 transition-opacity">
          {request.docPhoto ? <img src={request.docPhoto} className="w-full h-full object-cover" alt="서류" /> : <ImageIcon className="w-5 h-5 text-slate-300" />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-slate-800 text-sm font-semibold">{student?.studentName ?? '알 수 없음'}</p>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${meta.color}`}>{meta.label}</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-slate-50 text-slate-500 border-slate-200 inline-flex items-center gap-1">
              {request.preferredResolution === 'carryover' ? <><Wallet className="w-3 h-3" /> 학부모 희망: 이월</> : <><CalendarClock className="w-3 h-3" /> 학부모 희망: 보강</>}
            </span>
          </div>
          <p className="text-slate-400 text-xs mt-1">
            담당 강사: {assignedInstructor?.name ?? '-'} · 결석: {fromClass ? `${format(parseISO(fromClass.date), 'M월 d일', { locale: ko })} ${fromClass.time}` : '-'}
          </p>
          {request.reason && <p className="text-slate-500 text-xs mt-1 bg-slate-50 rounded-lg px-2.5 py-1.5 inline-block">사유: {request.reason}</p>}
          <p className="text-slate-300 text-[11px] mt-1.5">신청: {request.requestedAt}</p>

          {request.status === 'approved_makeup' && toClass && (
            <p className="text-emerald-600 text-xs mt-1.5 font-medium">
              → {format(parseISO(toClass.date), 'M월 d일', { locale: ko })} {toClass.time} ({toInstructor?.name} 강사)로 배정됨
            </p>
          )}
          {request.status === 'approved_carryover' && (
            <p className="text-indigo-600 text-xs mt-1.5 font-medium">다음 달 결제 {request.carryoverAmount.toLocaleString()}원 차감 처리됨</p>
          )}
        </div>

        {request.status === 'pending' && (
          <div className="flex flex-col gap-1.5 shrink-0">
            <button onClick={() => setShowAssign(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-xs font-medium transition-colors">
              <CalendarClock className="w-3.5 h-3.5" /> 보강 배정
            </button>
            <button onClick={() => approveMakeupRequestAsCarryover(request.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 rounded-lg text-xs font-medium transition-colors">
              <Wallet className="w-3.5 h-3.5" /> 이월 처리
            </button>
            <button onClick={() => rejectMakeupRequest(request.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded-lg text-xs font-medium transition-colors">
              <XCircle className="w-3.5 h-3.5" /> 거절
            </button>
          </div>
        )}
      </div>

      {showAssign && <AssignSlotModal request={request} onClose={() => setShowAssign(false)} />}

      {showDoc && request.docPhoto && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowDoc(false)}>
          <img src={request.docPhoto} className="max-w-full max-h-full rounded-xl shadow-2xl" alt="제출 서류" />
        </div>
      )}
    </div>
  );
}

// ─── 메인 ─────────────────────────────────────────────────────────────────────

export default function AdminMakeups() {
  const { makeupRequests } = useStore();
  const [filter, setFilter] = useState<'pending' | 'resolved'>('pending');

  const pending = makeupRequests.filter(r => r.status === 'pending').slice().reverse();
  const resolved = makeupRequests.filter(r => r.status !== 'pending').slice().reverse();
  const list = filter === 'pending' ? pending : resolved;

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="shrink-0 px-6 py-4 bg-white border-b border-slate-200 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-800">보강 요청 관리</h1>
          </div>
          <p className="text-slate-400 text-xs mt-0.5">서류 제출이 필요한 보강 신청을 검토합니다</p>
        </div>
        {pending.length > 0 && (
          <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full">
            <AlertCircle className="w-3.5 h-3.5" /> {pending.length}건 대기 중
          </span>
        )}
      </div>

      <div className="shrink-0 flex border-b border-slate-200 bg-white px-6">
        <button onClick={() => setFilter('pending')}
          className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${filter === 'pending' ? 'border-cyan-600 text-cyan-700' : 'border-transparent text-slate-400 hover:text-slate-700'}`}>
          <Clock className="w-4 h-4" /> 승인 대기 ({pending.length})
        </button>
        <button onClick={() => setFilter('resolved')}
          className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${filter === 'resolved' ? 'border-cyan-600 text-cyan-700' : 'border-transparent text-slate-400 hover:text-slate-700'}`}>
          <CheckCircle2 className="w-4 h-4" /> 처리 완료 ({resolved.length})
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto p-6 space-y-3">
          {list.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl py-16 text-center text-slate-400">
              <FileWarning className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">{filter === 'pending' ? '대기 중인 보강 요청이 없습니다.' : '처리된 요청이 없습니다.'}</p>
            </div>
          ) : (
            list.map(r => <RequestCard key={r.id} request={r} />)
          )}
        </div>
      </div>
    </div>
  );
}
