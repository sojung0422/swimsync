import { useState } from 'react';
import { useStore, isWithinReRegistrationPeriod } from '../store/StoreContext';
import type { ScheduleChangeRequest } from '../store/StoreContext';
import {
  Clock, CheckCircle2, XCircle, AlertCircle, Settings2, ArrowRight, RefreshCw,
} from 'lucide-react';

function RequestCard({ request }: { request: ScheduleChangeRequest }) {
  const { students, settings, approveScheduleChangeRequest, rejectScheduleChangeRequest } = useStore();
  const student = students.find(s => s.id === request.studentId);
  const inPeriod = isWithinReRegistrationPeriod(settings.reRegistrationPeriod);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-slate-800 text-sm font-semibold">{student?.studentName ?? '알 수 없음'}</p>
            {request.isFrequencyChange && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-violet-50 text-violet-700 border-violet-200">
                수강 횟수 변경
              </span>
            )}
            {request.status !== 'pending' && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${request.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                {request.status === 'approved' ? '승인됨' : '거절됨'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
            <span className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
              {request.currentDays.join('·')} {request.currentTime} · {request.currentPassType}
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
            <span className="bg-cyan-50 border border-cyan-200 text-cyan-700 rounded-lg px-2.5 py-1.5 font-medium">
              {request.requestedDays.join('·')} {request.requestedTime} · {request.requestedPassType}
            </span>
          </div>

          {request.isFrequencyChange && request.status === 'pending' && !inPeriod && (
            <p className="text-amber-600 text-[11px] mt-2 flex items-center gap-1">
              <AlertCircle className="w-3 h-3 shrink-0" /> 오늘은 재등록 기간(매월 {settings.reRegistrationPeriod.startDay}일~{settings.reRegistrationPeriod.endDay}일) 밖이에요 — 승인은 가능하지만 학원 정책을 다시 확인해보세요.
            </p>
          )}

          <p className="text-slate-300 text-[11px] mt-2">신청: {request.requestedAt}{request.resolvedAt && ` · 처리: ${request.resolvedAt}`}</p>
        </div>

        {request.status === 'pending' && (
          <div className="flex flex-col gap-1.5 shrink-0">
            <button onClick={() => approveScheduleChangeRequest(request.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-xs font-medium transition-colors">
              <CheckCircle2 className="w-3.5 h-3.5" /> 승인
            </button>
            <button onClick={() => rejectScheduleChangeRequest(request.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded-lg text-xs font-medium transition-colors">
              <XCircle className="w-3.5 h-3.5" /> 거절
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminScheduleChanges() {
  const { scheduleChangeRequests, settings, updateSettings } = useStore();
  const [filter, setFilter] = useState<'pending' | 'resolved'>('pending');

  const pending = scheduleChangeRequests.filter(r => r.status === 'pending').slice().reverse();
  const resolved = scheduleChangeRequests.filter(r => r.status !== 'pending').slice().reverse();
  const list = filter === 'pending' ? pending : resolved;
  const inPeriod = isWithinReRegistrationPeriod(settings.reRegistrationPeriod);

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="shrink-0 px-6 py-4 bg-white border-b border-slate-200 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-800">일정 변경 요청 관리</h1>
          <p className="text-slate-400 text-xs mt-0.5">학부모 앱에서 들어온 요일·시간·수강 횟수 변경 요청을 검토합니다</p>
        </div>
        {pending.length > 0 && (
          <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full">
            <AlertCircle className="w-3.5 h-3.5" /> {pending.length}건 대기 중
          </span>
        )}
      </div>

      <div className="shrink-0 px-6 py-3 bg-white border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2.5">
          <Settings2 className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-medium text-slate-500">재등록 기간 (매월)</span>
          <div className="flex items-center gap-1.5 text-sm">
            <input type="number" min={1} max={31} value={settings.reRegistrationPeriod.startDay}
              onChange={e => updateSettings({ reRegistrationPeriod: { ...settings.reRegistrationPeriod, startDay: Math.max(1, Math.min(31, parseInt(e.target.value) || 1)) } })}
              className="w-14 border border-slate-200 rounded-lg px-2 py-1.5 text-center" />
            <span className="text-slate-400">일 ~</span>
            <input type="number" min={1} max={31} value={settings.reRegistrationPeriod.endDay}
              onChange={e => updateSettings({ reRegistrationPeriod: { ...settings.reRegistrationPeriod, endDay: Math.max(1, Math.min(31, parseInt(e.target.value) || 1)) } })}
              className="w-14 border border-slate-200 rounded-lg px-2 py-1.5 text-center" />
            <span className="text-slate-400">일</span>
          </div>
          <span className={`text-[11px] font-semibold px-2 py-1 rounded-full border ${inPeriod ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
            {inPeriod ? '오늘은 재등록 기간이에요' : '오늘은 재등록 기간이 아니에요'}
          </span>
        </div>
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
              <RefreshCw className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">{filter === 'pending' ? '대기 중인 변경 요청이 없습니다.' : '처리된 요청이 없습니다.'}</p>
            </div>
          ) : (
            list.map(r => <RequestCard key={r.id} request={r} />)
          )}
        </div>
      </div>
    </div>
  );
}
