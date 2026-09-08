import { useState } from 'react';
import { useStore, getClassOfferings } from '../store/StoreContext';
import { CheckCircle2, MapPin, Waves, AlertCircle } from 'lucide-react';

// 온보딩 셀프 가입신청서 — 데스크가 링크를 보내면 사용자가 직접 접속해 작성하는 화면.
// 실제 서비스라면 별도 공개 URL이지만, 이 데모에서는 "앱 미리보기" 메뉴에서 확인할 수 있다.
export default function RegistrationApplicationForm() {
  const { settings, students, instructors, lessonClasses, paymentPlans, submitRegistrationApplication } = useStore();

  const [applicantName, setApplicantName] = useState('');
  const [phone, setPhone] = useState('');
  const [category, setCategory] = useState<'child' | 'adult'>('child');
  const [region, setRegion] = useState('');
  const [note, setNote] = useState('');
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [result, setResult] = useState<{ ok: boolean; error?: string } | null>(null);

  const offerings = getClassOfferings(null, students, instructors)
    .map(o => {
      const lc = lessonClasses.find(l => l.id === o.lessonClassId);
      const instructor = instructors.find(i => i.id === o.instructorId);
      const plan = paymentPlans.find(p => p.id === o.paymentPlanId);
      return { ...o, lc, instructor, plan };
    })
    .filter(o => o.remaining > 0 && o.lc && o.instructor)
    .filter(o => !o.plan || o.plan.category === category)
    .sort((a, b) => a.time.localeCompare(b.time));

  const keyOf = (o: typeof offerings[number]) => `${o.lessonClassId}__${o.instructorId}__${o.time}`;
  const selected = offerings.find(o => keyOf(o) === selectedKey);

  const canSubmit = applicantName.trim() && phone.trim() && region.trim() && selected;

  const handleSubmit = () => {
    if (!selected) return;
    const res = submitRegistrationApplication({
      applicantName: applicantName.trim(), phone: phone.trim(), category, region: region.trim(),
      desiredLessonClassId: selected.lessonClassId, desiredInstructorId: selected.instructorId,
      desiredDays: selected.days, desiredTime: selected.time, note: note.trim(),
    });
    setResult(res);
  };

  if (result?.ok) {
    return (
      <div className="flex items-center justify-center h-full bg-slate-100 p-8">
        <div className="w-[390px] h-[844px] bg-white rounded-[3rem] shadow-2xl border-[8px] border-slate-800 overflow-hidden relative flex flex-col items-center justify-center text-center px-8">
          <CheckCircle2 className="w-16 h-16 text-emerald-500 mb-4" />
          <h2 className="text-lg font-bold text-slate-800">가입신청이 접수됐어요!</h2>
          <p className="text-slate-500 text-sm mt-2">
            {selected?.lc?.name} · {selected?.instructor?.name} 강사 · {selected?.days.join('·')} {selected?.time}
          </p>
          <p className="text-slate-400 text-xs mt-4">바로 등록이 완료되어 전체 스케줄표에 반영됐어요. 학원에서 곧 연락드릴게요.</p>
          <button onClick={() => { setResult(null); setApplicantName(''); setPhone(''); setRegion(''); setNote(''); setSelectedKey(null); }}
            className="mt-6 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600 text-sm font-medium transition-colors">
            새로 작성하기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-full bg-slate-100 p-8">
      <div className="w-[390px] h-[844px] bg-white rounded-[3rem] shadow-2xl border-[8px] border-slate-800 overflow-hidden relative flex flex-col">
        <div className="h-12 bg-white flex items-center justify-between px-6 text-xs font-semibold text-slate-800 shrink-0" />
        <div className="flex-1 overflow-y-auto bg-slate-50 px-6 pb-8">
          <div className="pt-2 pb-4 text-center">
            <div className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center shadow-sm mb-2" style={{ background: 'linear-gradient(135deg,#0891b2,#3b82f6)' }}>
              <Waves className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-lg font-bold text-slate-800">{settings.academyName} 가입신청서</h1>
            <p className="text-slate-400 text-xs mt-1 flex items-center justify-center gap-1"><MapPin className="w-3 h-3" />{settings.branchName}</p>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => { setCategory('child'); setSelectedKey(null); }}
                className={`py-2.5 rounded-xl text-sm font-semibold border transition-colors ${category === 'child' ? 'bg-cyan-50 border-cyan-400 text-cyan-700' : 'bg-white border-slate-200 text-slate-500'}`}>
                아동
              </button>
              <button onClick={() => { setCategory('adult'); setSelectedKey(null); }}
                className={`py-2.5 rounded-xl text-sm font-semibold border transition-colors ${category === 'adult' ? 'bg-cyan-50 border-cyan-400 text-cyan-700' : 'bg-white border-slate-200 text-slate-500'}`}>
                성인
              </button>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">이름 *</label>
              <input className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-cyan-500"
                value={applicantName} onChange={e => setApplicantName(e.target.value)} placeholder="홍길동" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">연락처 *</label>
              <input className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-cyan-500"
                value={phone} onChange={e => setPhone(e.target.value)} placeholder="010-0000-0000" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">지역 *</label>
              <input className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-cyan-500"
                value={region} onChange={e => setRegion(e.target.value)} placeholder="예: 서울시 강남구" />
            </div>

            <div>
              <p className="text-slate-700 text-sm font-semibold mb-2">희망 반 선택 (실시간 여유 자리만 표시)</p>
              {offerings.length === 0 ? (
                <div className="text-center py-8 text-slate-400 bg-white border border-slate-200 rounded-xl text-sm">
                  현재 {category === 'adult' ? '성인' : '아동'} 반에 여유 자리가 없어요.
                </div>
              ) : (
                <div className="space-y-2">
                  {offerings.map(o => (
                    <button key={keyOf(o)} onClick={() => setSelectedKey(keyOf(o))}
                      className={`w-full text-left border rounded-xl p-3.5 transition-colors ${selectedKey === keyOf(o) ? 'border-cyan-500 bg-cyan-50' : 'border-slate-200 bg-white hover:border-cyan-300'}`}>
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-bold text-slate-800 text-sm">{o.lc?.name}</p>
                          <p className="text-slate-400 text-xs mt-0.5">{o.instructor?.name} 강사 · {o.days.join('·')} {o.time}</p>
                        </div>
                        <span className="text-xs font-medium text-cyan-600 bg-cyan-50 px-2.5 py-1 rounded-full border border-cyan-100">잔여 {o.remaining}자리</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">전달 사항 (선택)</label>
              <textarea className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-cyan-500 resize-none" rows={2}
                value={note} onChange={e => setNote(e.target.value)} placeholder="궁금한 점이나 참고할 내용을 적어주세요" />
            </div>

            {result && !result.ok && (
              <p className="text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-xs flex items-start gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {result.error}
              </p>
            )}

            <button onClick={handleSubmit} disabled={!canSubmit}
              className="w-full py-3.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-bold text-sm transition-colors">
              가입신청서 제출하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
