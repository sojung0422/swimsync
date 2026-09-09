import { useState } from 'react';
import { useStore } from '../store/StoreContext';
import { BookOpen, Wallet, Users, ClipboardCheck, Waves, CalendarClock, Repeat, ArrowRight } from 'lucide-react';

const inputCls = 'w-full border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-400 transition-colors bg-white';

function SectionCard({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
      <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2">
        <Icon className="w-4 h-4 text-cyan-600" />
        <h3 className="text-sm font-bold text-slate-700">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

export default function AdminWorkGuide({ onNavigate }: { onNavigate?: (tab: string) => void }) {
  const { settings, updateSettings, instructors } = useStore();
  const [policyDraft, setPolicyDraft] = useState({
    reRegStart: settings.reRegistrationPeriod.startDay, reRegEnd: settings.reRegistrationPeriod.endDay,
    newRegStart: settings.newRegistrationPeriod.startDay, newRegEnd: settings.newRegistrationPeriod.endDay,
  });
  const [roleGuideDraft, setRoleGuideDraft] = useState(settings.roleGuides);

  const teachingCount = instructors.filter(i => i.status === 'active' && i.jobType === '강사').length;

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="shrink-0 px-6 py-4 bg-white border-b border-slate-200">
        <h1 className="text-lg font-bold text-slate-800 flex items-center gap-2"><BookOpen className="w-5 h-5 text-cyan-600" /> 업무 안내</h1>
        <p className="text-slate-400 text-xs mt-0.5">급여·업무·체크리스트·운영 방침을 한 곳에서 확인하는 참조 페이지예요.</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-6 space-y-5">

          <SectionCard icon={Repeat} title="운영 방침">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-slate-400 text-xs mb-1">청구·보강 운영 방식</p>
                <p className="font-semibold text-slate-700">{settings.operatingMode === 'fiveWeek' ? '5주차 대체보강 방식' : '기존 방식 (달력 정확 계산)'}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-slate-400 text-xs mb-1">연차 지급 여부</p>
                <p className="font-semibold text-slate-700">{settings.annualLeaveEnabled ? '지급함' : '지급하지 않음'}</p>
              </div>
            </div>
            <p className="text-slate-400 text-xs mt-3">변경은 스케줄 관리 &gt; 시간표 및 강사 색상 설정 &gt; 운영 방침에서 할 수 있어요.</p>
          </SectionCard>

          <SectionCard icon={CalendarClock} title="재등록·신규 결제 기간 설정">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1 font-medium">재등록 결제 기간</label>
                <div className="flex items-center gap-1.5">
                  <input type="number" min={1} max={31} className={`${inputCls} w-16`} value={policyDraft.reRegStart}
                    onChange={e => setPolicyDraft({ ...policyDraft, reRegStart: parseInt(e.target.value) || 1 })}
                    onBlur={() => updateSettings({ reRegistrationPeriod: { startDay: policyDraft.reRegStart, endDay: policyDraft.reRegEnd } })} />
                  <span className="text-slate-400 text-xs">일 ~</span>
                  <input type="number" min={1} max={31} className={`${inputCls} w-16`} value={policyDraft.reRegEnd}
                    onChange={e => setPolicyDraft({ ...policyDraft, reRegEnd: parseInt(e.target.value) || 1 })}
                    onBlur={() => updateSettings({ reRegistrationPeriod: { startDay: policyDraft.reRegStart, endDay: policyDraft.reRegEnd } })} />
                  <span className="text-slate-400 text-xs">일</span>
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1 font-medium">신규 결제 기간</label>
                <div className="flex items-center gap-1.5">
                  <input type="number" min={1} max={31} className={`${inputCls} w-16`} value={policyDraft.newRegStart}
                    onChange={e => setPolicyDraft({ ...policyDraft, newRegStart: parseInt(e.target.value) || 1 })}
                    onBlur={() => updateSettings({ newRegistrationPeriod: { startDay: policyDraft.newRegStart, endDay: policyDraft.newRegEnd } })} />
                  <span className="text-slate-400 text-xs">일 ~</span>
                  <input type="number" min={1} max={31} className={`${inputCls} w-16`} value={policyDraft.newRegEnd}
                    onChange={e => setPolicyDraft({ ...policyDraft, newRegEnd: parseInt(e.target.value) || 1 })}
                    onBlur={() => updateSettings({ newRegistrationPeriod: { startDay: policyDraft.newRegStart, endDay: policyDraft.newRegEnd } })} />
                  <span className="text-slate-400 text-xs">일</span>
                </div>
              </div>
            </div>
            <p className="text-slate-400 text-xs mt-3">재등록 기간 시작일에 학부모 앱으로 안내 알림이 자동 발송돼요 (문구는 시스템 설정에서 편집).</p>
          </SectionCard>

          <SectionCard icon={Wallet} title="급여·인센티브 기준">
            <div className="grid grid-cols-2 gap-3 text-sm mb-3">
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-slate-400 text-xs mb-1">신규 정규직 기본급</p>
                <p className="font-semibold text-slate-700">{settings.payrollSettings.baseSalaryDefault.toLocaleString()}원</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-slate-400 text-xs mb-1">추가 근무 시간당 단가</p>
                <p className="font-semibold text-slate-700">{settings.payrollSettings.overtimeHourlyRate.toLocaleString()}원</p>
              </div>
            </div>
            <p className="text-xs font-semibold text-slate-600 mb-1.5">인센티브 자동 계산 규칙</p>
            <div className="space-y-1">
              {settings.payrollSettings.incentiveFormulaRules.map(r => (
                <p key={r.id} className="text-xs text-slate-500">{r.label} — {r.metric === 'reRegRate' ? '재등록률' : r.metric === 'withdrawalRate' ? '퇴원률' : '담당 매출'} {r.comparator === 'gte' ? '이상' : '이하'} {r.threshold}{r.metric === 'revenue' ? '원' : '%'}이면 {r.amount.toLocaleString()}원 지급</p>
              ))}
              {settings.payrollSettings.incentiveFormulaRules.length === 0 && <p className="text-xs text-slate-300">설정된 규칙이 없습니다.</p>}
            </div>
            <p className="text-slate-400 text-xs mt-3">세부 수정은 직원 관리 &gt; 급여 정산 &gt; 급여 계산 기준 설정에서 할 수 있어요.</p>
          </SectionCard>

          <SectionCard icon={Users} title="역할별 업무 내용 (강사·차량·데스크)">
            <div className="space-y-3">
              {roleGuideDraft.map((rg, idx) => (
                <div key={rg.role}>
                  <label className="block text-xs text-slate-500 mb-1 font-medium">{rg.role}</label>
                  <textarea className={`${inputCls} w-full`} rows={2} value={rg.content}
                    onChange={e => { const next = [...roleGuideDraft]; next[idx] = { ...rg, content: e.target.value }; setRoleGuideDraft(next); }}
                    onBlur={() => updateSettings({ roleGuides: roleGuideDraft })} />
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard icon={ClipboardCheck} title="케어팀 체크리스트 · 비품 관리">
            <p className="text-slate-500 text-sm mb-3">일간·주간·월간·분기별 청소 체크리스트와 비품 입출고·잔여수량을 관리해요.</p>
            <button onClick={() => onNavigate?.('care-ops')}
              className="flex items-center gap-1.5 text-cyan-700 text-sm font-semibold hover:text-cyan-800">
              케어팀·비품 관리 화면으로 이동 <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </SectionCard>

          <SectionCard icon={Waves} title="자유수영 시간 안내">
            <div className="space-y-1.5">
              {settings.freeSwimSlots.map(slot => (
                <p key={slot.id} className="text-sm text-slate-600">{slot.days.join('·')} {slot.startTime}~{slot.endTime}</p>
              ))}
              {settings.freeSwimSlots.length === 0 && <p className="text-slate-300 text-sm">등록된 자유수영 시간이 없습니다.</p>}
            </div>
          </SectionCard>

          <SectionCard icon={CalendarClock} title="연차 기준">
            {settings.annualLeaveEnabled ? (
              <div className="space-y-1 text-sm text-slate-600">
                <p>연차(종일) 1일 차감, 반차 0.5일 차감, 반반차 0.25일 차감</p>
                <p className="text-slate-400 text-xs">연차·근무불가 승인은 원장·팀장만 할 수 있어요. 현재 강사 {teachingCount}명이 연차 대상입니다.</p>
              </div>
            ) : (
              <p className="text-slate-400 text-sm">이 학원은 연차를 지급하지 않아요 (근무 불가일만 등록).</p>
            )}
          </SectionCard>

        </div>
      </div>
    </div>
  );
}
