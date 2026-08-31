import { useState } from 'react';
import { useStore, canApproveStaffRequests, getFreeInstructorsAt } from '../store/StoreContext';
import type { SubRequest } from '../store/StoreContext';
import { Clock, CheckCircle2, XCircle, RefreshCw, Repeat, Users } from 'lucide-react';

function RequestCard({ request, canManage }: { request: SubRequest; canManage: boolean }) {
  const { instructors, classes, cancelSubRequest } = useStore();
  const requester = instructors.find(i => i.id === request.requestingInstructorId);
  const substitute = request.substituteInstructorId ? instructors.find(i => i.id === request.substituteInstructorId) : null;
  const eligibleCount = request.status === 'open'
    ? getFreeInstructorsAt(request.date, request.time, instructors, classes, request.requestingInstructorId).length
    : null;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-slate-800 text-sm font-semibold">{requester?.name ?? '알 수 없음'} → 대타 요청</p>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
              request.status === 'open' ? 'bg-amber-50 text-amber-700 border-amber-200'
              : request.status === 'filled' ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-slate-50 text-slate-500 border-slate-200'
            }`}>
              {request.status === 'open' ? '대기 중' : request.status === 'filled' ? '확정됨' : '취소됨'}
            </span>
          </div>
          <p className="text-slate-600 text-sm mt-2">{request.date} {request.time} · {request.reason || '사유 없음'}</p>
          {request.status === 'open' && (
            <p className="text-slate-400 text-[11px] mt-1 flex items-center gap-1">
              <Users className="w-3 h-3" /> 이 시간에 수업 없는 강사 {eligibleCount}명에게 동시 노출 중 — 먼저 수락하는 강사로 확정돼요
            </p>
          )}
          {substitute && (
            <p className="text-emerald-600 text-[11px] mt-1">대타 확정: {substitute.name} ({request.filledAt?.slice(0, 16).replace('T', ' ')})</p>
          )}
          <p className="text-slate-300 text-[11px] mt-2">요청: {request.createdAt.slice(0, 16).replace('T', ' ')}</p>
        </div>

        {request.status === 'open' && canManage && (
          <button onClick={() => cancelSubRequest(request.id, request.requestingInstructorId)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded-lg text-xs font-medium transition-colors shrink-0">
            <XCircle className="w-3.5 h-3.5" /> 요청 취소
          </button>
        )}
      </div>
    </div>
  );
}

export default function AdminSubRequests() {
  const { subRequests, instructors, currentInstructorId } = useStore();
  const [filter, setFilter] = useState<'open' | 'resolved'>('open');

  const currentInstructor = instructors.find(i => i.id === currentInstructorId);
  const canManage = !!currentInstructor && canApproveStaffRequests(currentInstructor.role);

  const open = subRequests.filter(r => r.status === 'open').slice().reverse();
  const resolved = subRequests.filter(r => r.status !== 'open').slice().reverse();
  const list = filter === 'open' ? open : resolved;

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="shrink-0 px-6 py-4 bg-white border-b border-slate-200 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-800">대타 관리</h1>
          <p className="text-slate-400 text-xs mt-0.5">강사끼리 주고받는 대타 요청 현황이에요. 수락은 강사 앱에서 직접 처리돼요.</p>
        </div>
        {open.length > 0 && (
          <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full">
            <Repeat className="w-3.5 h-3.5" /> {open.length}건 대기 중
          </span>
        )}
      </div>

      <div className="shrink-0 flex border-b border-slate-200 bg-white px-6">
        <button onClick={() => setFilter('open')}
          className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${filter === 'open' ? 'border-cyan-600 text-cyan-700' : 'border-transparent text-slate-400 hover:text-slate-700'}`}>
          <Clock className="w-4 h-4" /> 대기 중 ({open.length})
        </button>
        <button onClick={() => setFilter('resolved')}
          className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${filter === 'resolved' ? 'border-cyan-600 text-cyan-700' : 'border-transparent text-slate-400 hover:text-slate-700'}`}>
          <CheckCircle2 className="w-4 h-4" /> 확정/취소 ({resolved.length})
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto p-6 space-y-3">
          {list.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl py-16 text-center text-slate-400">
              <RefreshCw className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">{filter === 'open' ? '대기 중인 대타 요청이 없습니다.' : '확정되거나 취소된 요청이 없습니다.'}</p>
            </div>
          ) : (
            list.map(r => <RequestCard key={r.id} request={r} canManage={canManage} />)
          )}
        </div>
      </div>
    </div>
  );
}
