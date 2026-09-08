import { useStore } from '../store/StoreContext';
import { CheckCircle2, XCircle, ClipboardList } from 'lucide-react';

export default function AdminRegistrationApplications() {
  const { registrationApplications, lessonClasses, instructors } = useStore();
  const sorted = [...registrationApplications].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="shrink-0 px-6 py-4 bg-white border-b border-slate-200">
        <h1 className="text-lg font-bold text-slate-800">가입신청 이력</h1>
        <p className="text-slate-400 text-xs mt-0.5">셀프 가입신청서로 접수된 신청 내역이에요. "등록 완료"는 제출 즉시 학생으로 자동 등록·반배정된 건이에요.</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-6">
          {sorted.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl py-16 text-center text-slate-400">
              <ClipboardList className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              아직 접수된 가입신청서가 없습니다.
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-50 overflow-hidden">
              {sorted.map(app => {
                const lc = lessonClasses.find(l => l.id === app.desiredLessonClassId);
                const instructor = instructors.find(i => i.id === app.desiredInstructorId);
                return (
                  <div key={app.id} className="px-6 py-4 flex items-start gap-4">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${app.status === 'registered' ? 'bg-emerald-50' : 'bg-red-50'}`}>
                      {app.status === 'registered'
                        ? <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600" />
                        : <XCircle className="w-4.5 h-4.5 text-red-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-slate-800 text-sm">{app.applicantName}</p>
                        <span className="text-slate-400 text-xs">{app.phone}</span>
                        <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-full">{app.category === 'adult' ? '성인' : '아동'}</span>
                      </div>
                      <p className="text-slate-500 text-xs mt-1">
                        {lc?.name ?? '반 정보 없음'} · {instructor?.name ?? '-'} 강사 · {app.desiredDays.join('·')} {app.desiredTime} · {app.region}
                      </p>
                      {app.note && <p className="text-slate-400 text-xs mt-1">"{app.note}"</p>}
                      {app.status === 'failed' && <p className="text-red-500 text-xs mt-1 font-medium">등록 실패: {app.failReason}</p>}
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-xs font-semibold ${app.status === 'registered' ? 'text-emerald-600' : 'text-red-500'}`}>
                        {app.status === 'registered' ? '등록 완료' : '등록 실패'}
                      </p>
                      <p className="text-slate-300 text-[11px] mt-1">{app.submittedAt}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
