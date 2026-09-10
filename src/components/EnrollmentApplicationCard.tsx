import { useState } from 'react';
import { useStore } from '../store/StoreContext';
import type { EnrollmentApplication, VisitRoute, SwimLevelSelfReport } from '../store/StoreContext';
import { FileText, X, Edit2 } from 'lucide-react';

const VISIT_ROUTES: VisitRoute[] = ['인터넷검색', '홍보물', '지인추천', '직접', '기타'];
const STROKES = ['자유형', '배영', '평영', '접영'];
const SWIM_LEVELS: SwimLevelSelfReport[] = ['매우잘함', '잘함', '보통', '부족함', '매우부족함'];

export const blankApplication = (): Omit<EnrollmentApplication, 'id' | 'studentId'> => ({
  visitRoute: '직접', visitRouteNote: '',
  hasFearOfWater: false,
  priorAcademy: '', priorStrokes: [], priorMonths: 0,
  swimLevelSelfReport: '보통',
  healthNote: '', hasAllergy: false, allergyNote: '', habitNote: '', teacherNote: '',
  desiredTeacherNote: '', cashReceiptNumber: '',
  guardianName: '', submittedAt: new Date().toISOString().slice(0, 10),
});

const inputCls = 'w-full border border-slate-200 rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:border-cyan-500 transition-colors';
const labelCls = 'block text-xs text-slate-500 mb-1 font-medium';
const chipCls = (active: boolean) => `px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${active ? 'bg-cyan-600 border-cyan-600 text-white' : 'bg-white border-slate-200 text-slate-500'}`;

// 입회원서 항목만 렌더링하는 컨트롤드 컴포넌트 — 관리자 카드(저장/취소 버튼 포함)와 셀프 가입신청서(자체 제출 버튼 사용) 양쪽에서 재사용
export function ApplicationFormFields({ value: form, onChange: setForm }: {
  value: Omit<EnrollmentApplication, 'id' | 'studentId'>;
  onChange: (data: Omit<EnrollmentApplication, 'id' | 'studentId'>) => void;
}) {
  const set = <K extends keyof typeof form>(key: K, val: (typeof form)[K]) => setForm({ ...form, [key]: val });
  const toggleStroke = (s: string) => set('priorStrokes', form.priorStrokes.includes(s) ? form.priorStrokes.filter(x => x !== s) : [...form.priorStrokes, s]);

  return (
    <div className="space-y-4">
      <div>
        <label className={labelCls}>방문경로</label>
        <div className="flex flex-wrap gap-1.5">
          {VISIT_ROUTES.map(r => (
            <button key={r} onClick={() => set('visitRoute', r)} className={chipCls(form.visitRoute === r)}>{r}</button>
          ))}
        </div>
        {form.visitRoute === '기타' && (
          <input className={`${inputCls} mt-1.5`} placeholder="기타 방문경로" value={form.visitRouteNote} onChange={e => set('visitRouteNote', e.target.value)} />
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>물에 대한 공포심</label>
          <div className="flex gap-1.5">
            <button onClick={() => set('hasFearOfWater', true)} className={chipCls(form.hasFearOfWater)}>있다</button>
            <button onClick={() => set('hasFearOfWater', false)} className={chipCls(!form.hasFearOfWater)}>없다</button>
          </div>
        </div>
        <div>
          <label className={labelCls}>수영 실력 (본인/보호자 평가)</label>
          <select className={inputCls} value={form.swimLevelSelfReport} onChange={e => set('swimLevelSelfReport', e.target.value as SwimLevelSelfReport)}>
            {SWIM_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className={labelCls}>강습 경험 (있으면 작성)</label>
        <input className={`${inputCls} mb-1.5`} placeholder="어떤 업체에서 강습을 받았나요" value={form.priorAcademy} onChange={e => set('priorAcademy', e.target.value)} />
        <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
          {STROKES.map(s => (
            <button key={s} onClick={() => toggleStroke(s)} className={chipCls(form.priorStrokes.includes(s))}>{s}</button>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          <input type="number" min={0} className={`${inputCls} w-24`} value={form.priorMonths} onChange={e => set('priorMonths', parseInt(e.target.value) || 0)} />
          <span className="text-slate-400 text-xs">개월 수강</span>
        </div>
      </div>

      <div>
        <label className={labelCls}>건강상태 (지병 등 파악해야 할 내용)</label>
        <textarea className={`${inputCls} resize-none`} rows={2} value={form.healthNote} onChange={e => set('healthNote', e.target.value)} />
      </div>

      <div>
        <label className={labelCls}>알레르기</label>
        <div className="flex gap-1.5 mb-1.5">
          <button onClick={() => set('hasAllergy', true)} className={chipCls(form.hasAllergy)}>있음</button>
          <button onClick={() => set('hasAllergy', false)} className={chipCls(!form.hasAllergy)}>없음</button>
        </div>
        {form.hasAllergy && (
          <input className={inputCls} placeholder="알레르기명" value={form.allergyNote} onChange={e => set('allergyNote', e.target.value)} />
        )}
      </div>

      <div>
        <label className={labelCls}>습관/성격</label>
        <input className={inputCls} value={form.habitNote} onChange={e => set('habitNote', e.target.value)} />
      </div>

      <div>
        <label className={labelCls}>선생님이 알아야 할 우리 아이 추가사항</label>
        <textarea className={`${inputCls} resize-none`} rows={2} value={form.teacherNote} onChange={e => set('teacherNote', e.target.value)} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>희망교사 및 담당사항</label>
          <input className={inputCls} value={form.desiredTeacherNote} onChange={e => set('desiredTeacherNote', e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>현금영수증 번호</label>
          <input className={inputCls} value={form.cashReceiptNumber} onChange={e => set('cashReceiptNumber', e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>보호자 성함</label>
          <input className={inputCls} value={form.guardianName} onChange={e => set('guardianName', e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>등록일자</label>
          <input type="date" className={inputCls} value={form.submittedAt} onChange={e => set('submittedAt', e.target.value)} />
        </div>
      </div>
    </div>
  );
}

// 관리자 카드용 — 위 필드 컴포넌트를 저장/취소 버튼으로 감쌈
function ApplicationForm({ initial, onSave, onCancel }: {
  initial: Omit<EnrollmentApplication, 'id' | 'studentId'>;
  onSave: (data: Omit<EnrollmentApplication, 'id' | 'studentId'>) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState(initial);
  return (
    <div className="space-y-4">
      <ApplicationFormFields value={form} onChange={setForm} />
      <div className="flex gap-2 pt-1">
        <button onClick={onCancel} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-slate-500 text-sm">취소</button>
        <button onClick={() => onSave(form)} className="flex-1 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-sm font-semibold transition-colors">저장</button>
      </div>
    </div>
  );
}

function ApplicationSummary({ app }: { app: EnrollmentApplication }) {
  return (
    <div className="space-y-3 text-sm">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-50 rounded-xl p-3">
          <p className="text-slate-400 text-xs mb-1">방문경로</p>
          <p className="text-slate-700 font-medium">{app.visitRoute}{app.visitRoute === '기타' && app.visitRouteNote ? ` (${app.visitRouteNote})` : ''}</p>
        </div>
        <div className="bg-slate-50 rounded-xl p-3">
          <p className="text-slate-400 text-xs mb-1">물 공포심</p>
          <p className="text-slate-700 font-medium">{app.hasFearOfWater ? '있음' : '없음'}</p>
        </div>
      </div>
      <div className="bg-slate-50 rounded-xl p-3">
        <p className="text-slate-400 text-xs mb-1">수업 관련 기본 정보</p>
        <p className="text-slate-700">강습 경험: {app.priorAcademy || '없음'}{app.priorStrokes.length > 0 ? ` · ${app.priorStrokes.join(', ')}` : ''}{app.priorMonths ? ` · ${app.priorMonths}개월` : ''}</p>
        <p className="text-slate-700 mt-1">수영 실력: {app.swimLevelSelfReport}</p>
      </div>
      <div className="bg-slate-50 rounded-xl p-3 space-y-1">
        <p className="text-slate-400 text-xs mb-1">특이사항</p>
        <p className="text-slate-700">건강상태: {app.healthNote || '-'}</p>
        <p className="text-slate-700">알레르기: {app.hasAllergy ? (app.allergyNote || '있음') : '없음'}</p>
        <p className="text-slate-700">습관/성격: {app.habitNote || '-'}</p>
        {app.teacherNote && <p className="text-slate-700">선생님 참고사항: {app.teacherNote}</p>}
      </div>
      {(app.desiredTeacherNote || app.cashReceiptNumber) && (
        <div className="bg-slate-50 rounded-xl p-3 space-y-1">
          <p className="text-slate-400 text-xs mb-1">기타사항</p>
          {app.desiredTeacherNote && <p className="text-slate-700">희망교사/담당사항: {app.desiredTeacherNote}</p>}
          {app.cashReceiptNumber && <p className="text-slate-700">현금영수증: {app.cashReceiptNumber}</p>}
        </div>
      )}
      <p className="text-slate-300 text-[11px]">{app.guardianName ? `보호자: ${app.guardianName} · ` : ''}등록일 {app.submittedAt}</p>
    </div>
  );
}

// 학생 상세 화면(입회 신청서 탭)에서 쓰는 전체 카드 — 없으면 작성, 있으면 조회+수정
export function EnrollmentApplicationSection({ studentId }: { studentId: string }) {
  const { enrollmentApplications, saveEnrollmentApplication } = useStore();
  const app = enrollmentApplications.find(a => a.studentId === studentId);
  const [editing, setEditing] = useState(false);

  if (editing || !app) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        <h3 className="text-slate-700 font-semibold text-sm flex items-center gap-2 mb-4"><FileText className="w-4 h-4 text-cyan-600" /> 입회 신청서 {app ? '수정' : '작성'}</h3>
        <ApplicationForm initial={app ?? blankApplication()}
          onSave={data => { saveEnrollmentApplication(studentId, data); setEditing(false); }}
          onCancel={() => setEditing(false)} />
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-slate-700 font-semibold text-sm flex items-center gap-2"><FileText className="w-4 h-4 text-cyan-600" /> 입회 신청서</h3>
        <button onClick={() => setEditing(true)} className="flex items-center gap-1 text-cyan-600 hover:text-cyan-700 text-xs font-medium">
          <Edit2 className="w-3.5 h-3.5" /> 수정
        </button>
      </div>
      <ApplicationSummary app={app} />
    </div>
  );
}

// 강습생 목록에서 이름 옆 아이콘 클릭 시 뜨는 빠른 조회 모달 — 방문경로/수업 관련 기본정보/특이사항만
export function EnrollmentApplicationQuickModal({ studentId, studentName, onClose }: { studentId: string; studentName: string; onClose: () => void }) {
  const { enrollmentApplications } = useStore();
  const app = enrollmentApplications.find(a => a.studentId === studentId);

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[70] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h3 className="text-slate-800 font-bold text-sm flex items-center gap-2"><FileText className="w-4 h-4 text-cyan-600" /> {studentName} 입회 신청서</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5">
          {app ? <ApplicationSummary app={app} /> : (
            <p className="text-slate-400 text-sm text-center py-8">작성된 입회 신청서가 없습니다.<br />강습생 상세 &gt; 입회 신청서 탭에서 작성할 수 있어요.</p>
          )}
        </div>
      </div>
    </div>
  );
}
