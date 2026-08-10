import { useState, useRef, Fragment } from 'react';
import { useStore, getMakeupLimitForSessions, getAllEnrollments, getPrimaryEnrollment, getPrimaryContactPhone } from '../store/StoreContext';
import type { Student, Enrollment } from '../store/StoreContext';
import {
  Search, Plus, X, ChevronLeft, List, Settings,
  Camera, Edit2, Trash2, CreditCard, Phone, BookOpen,
  User, Calendar, Clock, CheckCircle, XCircle,
  AlertCircle, ArrowUpDown, GraduationCap, LayoutGrid, MapPin, Car, FileSpreadsheet,
  Repeat, PauseCircle, StopCircle, Wallet, Banknote
} from 'lucide-react';
import { EmptyStateGuide } from './GuideSystem';
import BulkImportModal from './BulkImportModal';

const statusLabel: Record<string, { text: string; color: string }> = {
  active:   { text: '수강 중', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  deferred: { text: '휴강 중', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  inactive: { text: '퇴원',   color: 'bg-red-50 text-red-600 border-red-200' },
};

const levelColor: Record<string, string> = {
  '초급': 'bg-blue-50 text-blue-700 border-blue-200',
  '중급': 'bg-violet-50 text-violet-700 border-violet-200',
  '고급': 'bg-rose-50 text-rose-700 border-rose-200',
};

function Avatar({ student, size = 'md' }: { student: Student; size?: 'sm' | 'md' | 'lg' }) {
  const s = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-20 h-20 text-2xl' }[size];
  if (student.studentPhoto) {
    return <img src={student.studentPhoto} className={`${s} rounded-full object-cover ring-2 ring-slate-100`} alt={student.studentName} />;
  }
  return (
    <div className={`${s} rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-white shrink-0`}>
      {student.studentName[0]}
    </div>
  );
}

const DAYS = ['월', '화', '수', '목', '금', '토', '일'];

// ─── 강습반 관리 모달 ──────────────────────────────────────────────────────────

const blankLessonClassForm = () => ({ name: '', description: '', defaultTime: '15:00', capacity: 5, eligibilityCondition: '' });

function LessonClassManagerModal({ onClose }: { onClose: () => void }) {
  const { lessonClasses, settings, addLessonClass, deleteLessonClass, updateLessonClass } = useStore();
  const [newForm, setNewForm] = useState(blankLessonClassForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(blankLessonClassForm());

  const handleAdd = () => {
    if (!newForm.name.trim()) return;
    addLessonClass({ ...newForm, name: newForm.name.trim(), description: newForm.description.trim() });
    setNewForm(blankLessonClassForm());
  };

  const handleEditSave = (id: string) => {
    updateLessonClass(id, editForm);
    setEditingId(null);
  };

  const fieldCls = "w-full border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 text-sm focus:outline-none focus:border-cyan-500";

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-xl">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-[15px] font-semibold text-slate-800 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-cyan-600" /> 강습반 관리
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="px-6 pt-4 text-xs text-slate-400">반명은 여러 담당쌤이 공유할 수 있어요 — 같은 반명을 다른 담당쌤에게 배정할 때도 여기서 정한 정원·수강 조건이 그대로 적용되고, 시간만 배정 시 바꿀 수 있어요.</p>
        <div className="p-6 space-y-2 max-h-80 overflow-y-auto">
          {lessonClasses.length === 0 && (
            <p className="text-slate-400 text-sm text-center py-4">등록된 강습반이 없습니다.</p>
          )}
          {lessonClasses.map(lc => (
            <div key={lc.id} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
              {editingId === lc.id ? (
                <div className="space-y-2">
                  <input className={fieldCls} placeholder="반명" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
                  <input className={fieldCls} placeholder="설명 (선택)" value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} />
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">기본 시간</label>
                      <select className={fieldCls} value={editForm.defaultTime} onChange={e => setEditForm({ ...editForm, defaultTime: e.target.value })}>
                        {settings.designatedTimes.map(t => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">정원(명)</label>
                      <input type="number" min={1} className={fieldCls} value={editForm.capacity} onChange={e => setEditForm({ ...editForm, capacity: parseInt(e.target.value) || 1 })} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">수강 가능 조건 (선택)</label>
                    <input className={fieldCls} placeholder="예: 만 3~7세, 초급 레벨 이상" value={editForm.eligibilityCondition} onChange={e => setEditForm({ ...editForm, eligibilityCondition: e.target.value })} />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleEditSave(lc.id)} className="flex-1 bg-cyan-600 text-white rounded-lg py-1.5 text-xs font-medium">저장</button>
                    <button onClick={() => setEditingId(null)} className="flex-1 bg-slate-100 text-slate-600 rounded-lg py-1.5 text-xs">취소</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-800 text-sm font-medium">{lc.name}</p>
                    <p className="text-slate-400 text-xs mt-0.5">
                      {lc.defaultTime} · 정원 {lc.capacity}명{lc.eligibilityCondition ? ` · ${lc.eligibilityCondition}` : ''}
                    </p>
                    {lc.description && <p className="text-slate-400 text-xs mt-0.5">{lc.description}</p>}
                  </div>
                  <button onClick={() => { setEditingId(lc.id); setEditForm({ name: lc.name, description: lc.description, defaultTime: lc.defaultTime, capacity: lc.capacity, eligibilityCondition: lc.eligibilityCondition }); }} className="text-slate-400 hover:text-cyan-600 transition-colors shrink-0">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => deleteLessonClass(lc.id)} className="text-slate-400 hover:text-red-500 transition-colors shrink-0">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="p-6 border-t border-slate-100 space-y-2">
          <p className="text-xs font-semibold text-slate-600">신규 반 개설</p>
          <input className={fieldCls} placeholder="반명 (예: 유치반, 마스터반)" value={newForm.name} onChange={e => setNewForm({ ...newForm, name: e.target.value })} />
          <input className={fieldCls} placeholder="설명 (선택)" value={newForm.description} onChange={e => setNewForm({ ...newForm, description: e.target.value })} />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] text-slate-400 mb-1">기본 시간</label>
              <select className={fieldCls} value={newForm.defaultTime} onChange={e => setNewForm({ ...newForm, defaultTime: e.target.value })}>
                {settings.designatedTimes.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 mb-1">정원(명)</label>
              <input type="number" min={1} className={fieldCls} value={newForm.capacity} onChange={e => setNewForm({ ...newForm, capacity: parseInt(e.target.value) || 1 })} />
            </div>
          </div>
          <input className={fieldCls} placeholder="수강 가능 조건 (선택, 예: 만 3~7세)" value={newForm.eligibilityCondition} onChange={e => setNewForm({ ...newForm, eligibilityCondition: e.target.value })} />
          <button onClick={handleAdd} className="w-full bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl py-2 text-sm font-medium transition-colors">
            <Plus className="w-4 h-4 inline mr-1" /> 강습반 추가
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── 강습생 등록/수정 모달 ────────────────────────────────────────────────────

type FormData = Omit<Student, 'id' | 'studentNumber' | 'usedReschedules' | 'additionalEnrollments'>;

const defaultForm = (): FormData => ({
  studentName: '', nickname: '', parentName: '', birthDate: '', gender: '남',
  registrationDate: new Date().toISOString().slice(0, 10),
  lessonClassId: '', regularDays: [], regularTime: '15:00',
  phone: '', motherPhone: '', fatherPhone: '', smsRecipients: ['mother'],
  level: '초급', status: 'active', instructorId: '',
  paymentAmount: 0, paymentDate: '', paymentRenewalDate: '',
  paymentCompleted: false, studentPhoto: '',
  age: 0, region: '', passType: '주 2회', totalClasses: 8,
  rescheduleLimit: 2, notes: '', progress: '',
  address: '', vehicleId: '', category: 'child', paymentPlanId: '', division: '정규반',
  pauseReason: '', expectedReturnDate: '', withdrawalReason: '',
});

function StudentFormModal({ initial, onClose, onSave, title }: {
  initial?: Student; onClose: () => void; onSave: (data: FormData) => void; title: string;
}) {
  const { instructors, lessonClasses, settings, vehicles, drivers, paymentPlans } = useStore();
  const [form, setForm] = useState<FormData>(
    initial ? {
      studentName: initial.studentName, nickname: initial.nickname || '', parentName: initial.parentName,
      birthDate: initial.birthDate, gender: initial.gender,
      registrationDate: initial.registrationDate, lessonClassId: initial.lessonClassId,
      regularDays: [...initial.regularDays], regularTime: initial.regularTime,
      phone: initial.phone, motherPhone: initial.motherPhone || '', fatherPhone: initial.fatherPhone || '',
      smsRecipients: initial.smsRecipients?.length ? [...initial.smsRecipients] : ['mother'],
      level: initial.level, status: initial.status,
      instructorId: initial.instructorId, paymentAmount: initial.paymentAmount,
      paymentDate: initial.paymentDate, paymentRenewalDate: initial.paymentRenewalDate,
      paymentCompleted: initial.paymentCompleted, studentPhoto: initial.studentPhoto,
      age: initial.age, region: initial.region, passType: initial.passType,
      totalClasses: initial.totalClasses, rescheduleLimit: initial.rescheduleLimit,
      notes: initial.notes, progress: initial.progress,
      address: initial.address || '', vehicleId: initial.vehicleId || '',
      category: initial.category || 'child', paymentPlanId: initial.paymentPlanId || '',
      division: initial.division || '정규반',
      pauseReason: initial.pauseReason || '', expectedReturnDate: initial.expectedReturnDate || '',
      withdrawalReason: initial.withdrawalReason || '',
    } : defaultForm()
  );
  const fileRef = useRef<HTMLInputElement>(null);
  const [section, setSection] = useState<'basic' | 'lesson' | 'payment'>('basic');

  const set = (key: keyof FormData, val: unknown) => setForm(prev => ({ ...prev, [key]: val }));

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => set('studentPhoto', ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const toggleDay = (day: string) => {
    set('regularDays', form.regularDays.includes(day)
      ? form.regularDays.filter(d => d !== day)
      : [...form.regularDays, day]
    );
  };

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!form.studentName.trim()) return;
    onSave(form);
  };

  const inputCls = "w-full border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 placeholder:text-slate-400 text-sm focus:outline-none focus:border-cyan-500 transition-colors bg-white";
  const labelCls = "block text-xs text-slate-500 mb-1 font-medium";

  const sections = [
    { id: 'basic', label: '기본 정보' },
    { id: 'lesson', label: '강습 정보' },
    { id: 'payment', label: '결제 정보' },
  ] as const;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl shadow-xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-[15px] font-semibold text-slate-800">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex border-b border-slate-100 px-6">
          {sections.map(s => (
            <button key={s.id} onClick={() => setSection(s.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${section === s.id ? 'border-cyan-600 text-cyan-700' : 'border-transparent text-slate-400 hover:text-slate-700'}`}>
              {s.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-4">

            {section === 'basic' && (
              <>
                <div className="flex items-center gap-4 mb-2">
                  <div className="relative">
                    {form.studentPhoto
                      ? <img src={form.studentPhoto} className="w-20 h-20 rounded-full object-cover ring-2 ring-slate-200" />
                      : <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center ring-2 ring-slate-200">
                          <Camera className="w-7 h-7 text-slate-400" />
                        </div>
                    }
                    <button type="button" onClick={() => fileRef.current?.click()}
                      className="absolute bottom-0 right-0 w-6 h-6 bg-cyan-600 rounded-full flex items-center justify-center border-2 border-white">
                      <Plus className="w-3 h-3 text-white" />
                    </button>
                  </div>
                  <div>
                    <p className="text-slate-700 text-sm font-medium">강습생 사진</p>
                    <p className="text-slate-400 text-xs mt-0.5">JPG, PNG 파일 업로드</p>
                    <button type="button" onClick={() => fileRef.current?.click()} className="mt-1.5 text-xs text-cyan-600 hover:text-cyan-700">사진 선택</button>
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>이름 *</label>
                    <input className={inputCls} placeholder="홍길동" value={form.studentName} onChange={e => set('studentName', e.target.value)} required />
                  </div>
                  <div>
                    <label className={labelCls}>닉네임</label>
                    <input className={inputCls} placeholder="(선택)" value={form.nickname} onChange={e => set('nickname', e.target.value)} />
                  </div>
                  <div>
                    <label className={labelCls}>학부모명</label>
                    <input className={inputCls} placeholder="홍부모" value={form.parentName} onChange={e => set('parentName', e.target.value)} />
                  </div>
                  <div>
                    <label className={labelCls}>생년월일</label>
                    <input type="date" className={inputCls} value={form.birthDate} onChange={e => {
                      const birthDate = e.target.value;
                      set('birthDate', birthDate);
                      const parsed = new Date(birthDate);
                      if (!Number.isNaN(parsed.getTime())) {
                        const age = Math.max(0, Math.floor((Date.now() - parsed.getTime()) / (365.25 * 24 * 3600 * 1000)));
                        set('age', age);
                      }
                    }} />
                  </div>
                  <div>
                    <label className={labelCls}>등록일</label>
                    <input type="date" className={inputCls} value={form.registrationDate} onChange={e => set('registrationDate', e.target.value)} />
                  </div>
                  <div>
                    <label className={labelCls}>성별</label>
                    <div className="flex gap-2">
                      {(['남', '여'] as const).map(g => (
                        <button key={g} type="button" onClick={() => set('gender', g)}
                          className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors ${form.gender === g ? 'bg-cyan-600 border-cyan-600 text-white' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className={labelCls}>연락처(원생)</label>
                    <input className={inputCls} placeholder="010-0000-0000" value={form.phone} onChange={e => set('phone', e.target.value)} />
                  </div>
                  <div>
                    <label className={labelCls}>연락처(모)</label>
                    <input className={inputCls} placeholder="010-0000-0000" value={form.motherPhone} onChange={e => set('motherPhone', e.target.value)} />
                  </div>
                  <div>
                    <label className={labelCls}>연락처(부)</label>
                    <input className={inputCls} placeholder="010-0000-0000" value={form.fatherPhone} onChange={e => set('fatherPhone', e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>문자(SMS) 수신 대상</label>
                  <div className="flex gap-4">
                    {([['self', '본인'], ['mother', '모'], ['father', '부']] as const).map(([val, label]) => (
                      <label key={val} className="flex items-center gap-1.5 text-sm text-slate-600 cursor-pointer">
                        <input type="checkbox" className="w-4 h-4 accent-cyan-600"
                          checked={form.smsRecipients.includes(val)}
                          onChange={() => set('smsRecipients', form.smsRecipients.includes(val)
                            ? form.smsRecipients.filter(r => r !== val)
                            : [...form.smsRecipients, val])} />
                        {label}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className={labelCls}>구분 (보강은 같은 구분 내에서만 가능해요)</label>
                  <div className="flex gap-2">
                    {(['유치부', '정규반', '성인반'] as const).map(div => (
                      <button key={div} type="button" onClick={() => { set('division', div); set('category', div === '성인반' ? 'adult' : 'child'); }}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors ${form.division === div ? 'bg-cyan-600 border-cyan-600 text-white' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                        {div}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>주소</label>
                    <input className={inputCls} placeholder="서울시 강남구 역삼동 123-45" value={form.address} onChange={e => set('address', e.target.value)} />
                  </div>
                  <div>
                    <label className={labelCls}>지역 (간단 표기)</label>
                    <input className={inputCls} placeholder="서울시 강남구" value={form.region} onChange={e => set('region', e.target.value)} />
                  </div>
                </div>

                <div>
                  <label className={labelCls}>배차 차량</label>
                  <select className={`${inputCls} cursor-pointer`} value={form.vehicleId} onChange={e => set('vehicleId', e.target.value)}>
                    <option value="">차량 미배정</option>
                    {vehicles.map(v => {
                      const driver = drivers.find(d => d.id === v.driverId);
                      return <option key={v.id} value={v.id}>{v.vehicleNumber} ({v.route}) — {driver?.name ?? '기사 미배정'}</option>;
                    })}
                  </select>
                </div>

                <div>
                  <label className={labelCls}>비고</label>
                  <textarea className={`${inputCls} resize-none`} rows={3} placeholder="특이사항 입력..." value={form.notes} onChange={e => set('notes', e.target.value)} />
                </div>
              </>
            )}

            {section === 'lesson' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>강습반</label>
                    <select className={`${inputCls} cursor-pointer`} value={form.lessonClassId} onChange={e => set('lessonClassId', e.target.value)}>
                      <option value="">선택하세요</option>
                      {lessonClasses.map(lc => <option key={lc.id} value={lc.id}>{lc.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>담당 강사</label>
                    <select className={`${inputCls} cursor-pointer`} value={form.instructorId} onChange={e => set('instructorId', e.target.value)}>
                      <option value="">선택하세요</option>
                      {instructors.map(i => <option key={i.id} value={i.id}>{i.name} ({i.type})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>수준</label>
                    <select className={`${inputCls} cursor-pointer`} value={form.level} onChange={e => set('level', e.target.value)}>
                      {['초급', '중급', '고급'].map(l => <option key={l}>{l}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>상태</label>
                    <select className={`${inputCls} cursor-pointer`} value={form.status} onChange={e => set('status', e.target.value as Student['status'])}>
                      <option value="active">수강 중</option>
                      <option value="deferred">휴강 중</option>
                      <option value="inactive">퇴원</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className={labelCls}>수강 요일</label>
                  <div className="flex gap-2">
                    {DAYS.map(day => (
                      <button key={day} type="button" onClick={() => toggleDay(day)}
                        className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors ${form.regularDays.includes(day) ? 'bg-cyan-600 border-cyan-600 text-white' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                        {day}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className={labelCls}>수강 시간</label>
                  <select className={`${inputCls} cursor-pointer`} value={form.regularTime} onChange={e => set('regularTime', e.target.value)}>
                    {settings.designatedTimes.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className={labelCls}>수강권 유형</label>
                    <select className={`${inputCls} cursor-pointer`} value={form.passType} onChange={e => set('passType', e.target.value)}>
                      <option>주 2회</option><option>주 3회</option><option>주 5회</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>월 총 수업 수</label>
                    <input type="number" className={inputCls} value={form.totalClasses} onChange={e => set('totalClasses', parseInt(e.target.value) || 0)} min={0} />
                  </div>
                  <div>
                    <label className={labelCls}>보강 가능 횟수</label>
                    <input type="number" className={inputCls} value={form.rescheduleLimit} onChange={e => set('rescheduleLimit', parseInt(e.target.value) || 0)} min={0} />
                  </div>
                </div>

                <div>
                  <label className={labelCls}>진도 현황</label>
                  <input className={inputCls} placeholder="예: 자유형 발차기 완료" value={form.progress} onChange={e => set('progress', e.target.value)} />
                </div>
              </div>
            )}

            {section === 'payment' && (
              <div className="space-y-3">
                <div>
                  <label className={labelCls}>결제 플랜</label>
                  <select className={`${inputCls} cursor-pointer`} value={form.paymentPlanId} onChange={e => {
                    const planId = e.target.value;
                    set('paymentPlanId', planId);
                    const plan = paymentPlans.find(p => p.id === planId);
                    if (plan) set('rescheduleLimit', getMakeupLimitForSessions(settings.makeupSettings.makeupPolicies, plan.sessionsPerWeek));
                  }}>
                    <option value="">플랜 없음 (직접 입력)</option>
                    {paymentPlans.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} — {p.monthlyPrice.toLocaleString()}원/월 {p.hasFreeSwim ? '(자유수영 포함)' : ''}
                      </option>
                    ))}
                  </select>
                  {form.paymentPlanId && (
                    <p className="text-cyan-600 text-xs mt-1.5">
                      이 플랜의 학원 정책 기준 보강 가능 횟수: {getMakeupLimitForSessions(settings.makeupSettings.makeupPolicies, paymentPlans.find(p => p.id === form.paymentPlanId)?.sessionsPerWeek ?? 0)}회 (아래 "보강 가능 횟수"에 자동 반영, 필요 시 수정 가능)
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>결제 금액 (원)</label>
                    <input type="number" className={inputCls} placeholder="120000" value={form.paymentAmount || ''} onChange={e => set('paymentAmount', parseInt(e.target.value) || 0)} />
                  </div>
                  <div>
                    <label className={labelCls}>결제일</label>
                    <input type="date" className={inputCls} value={form.paymentDate} onChange={e => set('paymentDate', e.target.value)} />
                  </div>
                  <div>
                    <label className={labelCls}>결제 갱신일</label>
                    <input type="date" className={inputCls} value={form.paymentRenewalDate} onChange={e => set('paymentRenewalDate', e.target.value)} />
                  </div>
                  <div className="flex flex-col justify-end">
                    <label className={labelCls}>결제 완료 여부</label>
                    <button type="button" onClick={() => set('paymentCompleted', !form.paymentCompleted)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors ${form.paymentCompleted ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-slate-200 text-slate-500'}`}>
                      {form.paymentCompleted
                        ? <><CheckCircle className="w-4 h-4" /> 결제 완료</>
                        : <><XCircle className="w-4 h-4" /> 미결제</>}
                    </button>
                  </div>
                </div>

                {form.paymentAmount > 0 && (
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <p className="text-slate-400 text-xs mb-1">결제 금액</p>
                    <p className="text-slate-800 text-xl font-bold">{form.paymentAmount.toLocaleString()}원</p>
                    <p className={`text-sm mt-1 font-medium ${form.paymentCompleted ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {form.paymentCompleted ? '결제 완료' : '결제 대기 중'}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="sticky bottom-0 bg-white border-t border-slate-100 p-4 flex gap-3">
            {section !== 'basic' && (
              <button type="button" onClick={() => setSection(section === 'payment' ? 'lesson' : 'basic')}
                className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 text-sm hover:bg-slate-100 transition-colors">
                이전
              </button>
            )}
            {section !== 'payment' ? (
              <button type="button" onClick={() => setSection(section === 'basic' ? 'lesson' : 'payment')}
                className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl py-2.5 text-sm font-medium transition-colors">
                다음
              </button>
            ) : (
              <button type="submit" className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl py-2.5 text-sm font-medium transition-colors">
                {initial ? '수정 완료' : '강습생 등록'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── 반 등록/변경 폼 (담당쌤·반·요일·시간 선택) ─────────────────────────────────

function EnrollmentFormModal({ enrollment, onClose, onSave, title }: {
  enrollment?: Enrollment; onClose: () => void; onSave: (data: Omit<Enrollment, 'id'>) => void; title: string;
}) {
  const { instructors, lessonClasses, settings, paymentPlans, students } = useStore();
  const [lessonClassId, setLessonClassId] = useState(enrollment?.lessonClassId ?? '');
  const [instructorId, setInstructorId] = useState(enrollment?.instructorId ?? '');
  const [regularDays, setRegularDays] = useState<string[]>(enrollment?.regularDays ?? []);
  const [regularTime, setRegularTime] = useState(enrollment?.regularTime ?? (settings.designatedTimes[0] ?? '15:00'));
  const [passType, setPassType] = useState(enrollment?.passType ?? '주 2회');
  const [paymentPlanId, setPaymentPlanId] = useState(enrollment?.paymentPlanId ?? '');
  const [monthlyPrice, setMonthlyPrice] = useState(enrollment?.monthlyPrice ?? 0);
  const [startDate, setStartDate] = useState(enrollment?.startDate ?? new Date().toISOString().slice(0, 10));

  const inputCls = "w-full border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 placeholder:text-slate-400 text-sm focus:outline-none focus:border-cyan-500 transition-colors bg-white";
  const labelCls = "block text-xs text-slate-500 mb-1 font-medium";

  const toggleDay = (d: string) => setRegularDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);

  const selectedLessonClass = lessonClasses.find(lc => lc.id === lessonClassId);

  const handleLessonClassChange = (id: string) => {
    setLessonClassId(id);
    const lc = lessonClasses.find(l => l.id === id);
    if (lc?.defaultTime) setRegularTime(lc.defaultTime);
  };

  // 반명(lessonClassId) 기준 정원 — 같은 반명이면 담당쌤이 달라도 공통 정원을 공유함. 반에 정원이 없으면 담당쌤의 1타임 정원으로 대체
  const instructorCap = instructors.find(i => i.id === instructorId)?.maxCapacity ?? 0;
  const effectiveCap = selectedLessonClass?.capacity || instructorCap;
  const matchingCount = lessonClassId && instructorId && regularTime && regularDays.length > 0
    ? students.flatMap(s => getAllEnrollments(s)).filter(e =>
        e.status === 'active' && e.lessonClassId === lessonClassId && e.instructorId === instructorId && e.regularTime === regularTime && e.regularDays.some(d => regularDays.includes(d))
      ).length
    : 0;

  const canSave = lessonClassId && instructorId && regularDays.length > 0;

  const handleSave = () => {
    if (!canSave) return;
    onSave({
      lessonClassId, instructorId, regularDays, regularTime, startDate,
      endDate: enrollment?.endDate ?? '', status: 'active', passType, paymentPlanId, monthlyPrice,
      pauseReason: enrollment?.pauseReason ?? '', expectedReturnDate: enrollment?.expectedReturnDate ?? '',
      withdrawalReason: enrollment?.withdrawalReason ?? '',
    });
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-xl max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-[15px] font-semibold text-slate-800">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>강습반 *</label>
              <select className={`${inputCls} cursor-pointer`} value={lessonClassId} onChange={e => handleLessonClassChange(e.target.value)}>
                <option value="">선택하세요</option>
                {lessonClasses.map(lc => <option key={lc.id} value={lc.id}>{lc.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>담당 강사 *</label>
              <select className={`${inputCls} cursor-pointer`} value={instructorId} onChange={e => setInstructorId(e.target.value)}>
                <option value="">선택하세요</option>
                {instructors.map(i => <option key={i.id} value={i.id}>{i.name} ({i.type})</option>)}
              </select>
            </div>
          </div>

          {selectedLessonClass && (selectedLessonClass.eligibilityCondition || selectedLessonClass.capacity) && (
            <div className="rounded-xl px-3 py-2.5 text-xs text-cyan-700 bg-cyan-50 border border-cyan-200">
              "{selectedLessonClass.name}" 기본 정원 {selectedLessonClass.capacity}명
              {selectedLessonClass.eligibilityCondition && ` · 수강 가능 조건: ${selectedLessonClass.eligibilityCondition}`}
            </div>
          )}

          <div>
            <label className={labelCls}>요일 *</label>
            <div className="flex gap-2">
              {DAYS.map(day => (
                <button key={day} type="button" onClick={() => toggleDay(day)}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors ${regularDays.includes(day) ? 'bg-cyan-600 border-cyan-600 text-white' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                  {day}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={labelCls}>시간 {selectedLessonClass?.defaultTime && <span className="text-slate-400 font-normal">(기본 {selectedLessonClass.defaultTime}, 담당쌤별로 변경 가능)</span>}</label>
            <select className={`${inputCls} cursor-pointer`} value={regularTime} onChange={e => setRegularTime(e.target.value)}>
              {settings.designatedTimes.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>

          {lessonClassId && instructorId && regularDays.length > 0 && (
            <div className={`rounded-xl px-3 py-2.5 text-xs font-medium ${matchingCount >= effectiveCap ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-slate-50 text-slate-600 border border-slate-200'}`}>
              현재 이 반·시간대 등록 인원: {matchingCount}/{effectiveCap}명 {matchingCount >= effectiveCap && '(정원 초과 주의)'}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>수강권 유형</label>
              <select className={`${inputCls} cursor-pointer`} value={passType} onChange={e => setPassType(e.target.value)}>
                <option>주 1회</option><option>주 2회</option><option>주 3회</option><option>주 5회</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>시작일</label>
              <input type="date" className={inputCls} value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
          </div>

          <div>
            <label className={labelCls}>결제 플랜 (선택)</label>
            <select className={`${inputCls} cursor-pointer`} value={paymentPlanId} onChange={e => {
              const planId = e.target.value;
              setPaymentPlanId(planId);
              const plan = paymentPlans.find(p => p.id === planId);
              if (plan) setMonthlyPrice(plan.monthlyPrice);
            }}>
              <option value="">플랜 없음 (직접 입력)</option>
              {paymentPlans.map(p => <option key={p.id} value={p.id}>{p.name} — {p.monthlyPrice.toLocaleString()}원/월</option>)}
            </select>
          </div>

          <div>
            <label className={labelCls}>월 수강료 (원)</label>
            <input type="number" className={inputCls} value={monthlyPrice || ''} onChange={e => setMonthlyPrice(parseInt(e.target.value) || 0)} />
          </div>

          <button onClick={handleSave} disabled={!canSave}
            className="w-full bg-cyan-600 hover:bg-cyan-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl py-2.5 text-sm font-medium transition-colors">
            저장
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── 반 등록정보 (다중 반) ────────────────────────────────────────────────────

const ENROLLMENT_STATUS_META: Record<Enrollment['status'], { text: string; color: string }> = {
  active: { text: '등록', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  paused: { text: '휴학', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  ended:  { text: '종강', color: 'bg-slate-100 text-slate-500 border-slate-200' },
};

const PAUSE_REASON_CHIPS = ['여행', '출장', '수술', '기타'];

function PauseReasonModal({ onClose, onConfirm }: { onClose: () => void; onConfirm: (reason: string, expectedReturnDate: string) => void }) {
  const [chip, setChip] = useState('여행');
  const [detail, setDetail] = useState('');
  const [expectedReturnDate, setExpectedReturnDate] = useState('');
  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-sm shadow-xl p-6 space-y-4">
        <div>
          <h3 className="text-slate-800 font-semibold">장기 결석(차감) 처리</h3>
          <p className="text-slate-500 text-xs mt-1 leading-relaxed">2주 이상 여행·출장·수술 등으로 결석할 때 사용해요. 해당 월 수강료는 선납 처리되고, 자동으로 재개되지 않아요 — 복귀 시 별도로 "복귀 신청"을 해야 해요.</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 mb-1.5 font-medium">사유</p>
          <div className="grid grid-cols-4 gap-1.5">
            {PAUSE_REASON_CHIPS.map(c => (
              <button key={c} onClick={() => setChip(c)}
                className={`py-1.5 rounded-lg text-xs font-medium border transition-colors ${chip === c ? 'bg-amber-500 border-amber-500 text-white' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                {c}
              </button>
            ))}
          </div>
          <input className="w-full mt-2 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400" placeholder="상세 사유 (선택)" value={detail} onChange={e => setDetail(e.target.value)} />
        </div>
        <div>
          <p className="text-xs text-slate-500 mb-1.5 font-medium">예상 복귀일 (선택)</p>
          <input type="date" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400" value={expectedReturnDate} onChange={e => setExpectedReturnDate(e.target.value)} />
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-slate-600 text-sm hover:bg-slate-50 transition-colors">취소</button>
          <button onClick={() => onConfirm(detail.trim() ? `${chip} — ${detail.trim()}` : chip, expectedReturnDate)}
            className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-medium transition-colors">처리하기</button>
        </div>
      </div>
    </div>
  );
}

function WithdrawalReasonModal({ onClose, onConfirm }: { onClose: () => void; onConfirm: (reason: string) => void }) {
  const [reason, setReason] = useState('');
  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-sm shadow-xl p-6 space-y-4">
        <div>
          <h3 className="text-slate-800 font-semibold">퇴원 처리</h3>
          <p className="text-slate-500 text-xs mt-1">복귀 의사가 없는 경우 퇴원으로 처리해요.</p>
        </div>
        <textarea className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-400 resize-none" rows={3} placeholder="퇴원 사유 (선택)" value={reason} onChange={e => setReason(e.target.value)} />
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-slate-600 text-sm hover:bg-slate-50 transition-colors">취소</button>
          <button onClick={() => onConfirm(reason.trim())} className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-medium transition-colors">퇴원 처리하기</button>
        </div>
      </div>
    </div>
  );
}

function ReturnDateModal({ onClose, onConfirm }: { onClose: () => void; onConfirm: (date: string) => void }) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-sm shadow-xl p-6 space-y-4">
        <div>
          <h3 className="text-slate-800 font-semibold">복귀 신청</h3>
          <p className="text-slate-500 text-xs mt-1 leading-relaxed">복귀 희망일을 선택하면 신청이 접수돼요. 담당쌤·데스크가 자리를 확인하고 승인해야 실제로 다시 수강할 수 있어요.</p>
        </div>
        <input type="date" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-400" value={date} onChange={e => setDate(e.target.value)} />
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-slate-600 text-sm hover:bg-slate-50 transition-colors">취소</button>
          <button onClick={() => onConfirm(date)} className="flex-1 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-sm font-medium transition-colors">복귀 신청하기</button>
        </div>
      </div>
    </div>
  );
}

function EnrollmentSection({ student }: { student: Student }) {
  const {
    lessonClasses, instructors, addEnrollment, updateEnrollment, cancelEnrollment,
    pauseEnrollmentLongTerm, withdrawalRequests, submitWithdrawalRequest, approveWithdrawalRequest, rejectWithdrawalRequest,
    returnRequests, submitReturnRequest, approveReturnRequest, rejectReturnRequest,
  } = useStore();
  const [showAdd, setShowAdd] = useState(false);
  const [editTarget, setEditTarget] = useState<Enrollment | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Enrollment | null>(null);
  const [pauseTarget, setPauseTarget] = useState<Enrollment | null>(null);
  const [withdrawTarget, setWithdrawTarget] = useState<Enrollment | null>(null);
  const [returnTarget, setReturnTarget] = useState<Enrollment | null>(null);

  const enrollments = getAllEnrollments(student);

  const handleStatusChange = (enr: Enrollment, status: Enrollment['status']) => {
    updateEnrollment(student.id, enr.id, { status, endDate: status !== 'active' ? new Date().toISOString().slice(0, 10) : '' });
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-slate-700 font-semibold text-sm flex items-center gap-2"><Repeat className="w-4 h-4 text-cyan-600" /> 반 등록정보</h3>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-medium transition-colors">
          <Plus className="w-3.5 h-3.5" /> 신규 등록(반 배정)하기
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              {['반명', '담당강사', '요일/시간', '구분', '시작일', '종료일', '작업'].map(h => (
                <th key={h} className="px-4 py-2.5 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {enrollments.map(enr => {
              const lc = lessonClasses.find(l => l.id === enr.lessonClassId);
              const inst = instructors.find(i => i.id === enr.instructorId);
              const meta = ENROLLMENT_STATUS_META[enr.status];
              const pendingWithdrawal = withdrawalRequests.find(r => r.studentId === student.id && r.enrollmentId === enr.id && r.status === 'pending');
              const pendingReturn = returnRequests.find(r => r.studentId === student.id && r.enrollmentId === enr.id && r.status === 'pending');
              return (
                <Fragment key={enr.id}>
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-semibold text-slate-800">
                    {lc?.name ?? '-'} {enr.id === 'primary' && <span className="text-[10px] text-slate-400 font-normal ml-1">(기본)</span>}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{inst?.name ?? '-'}</td>
                  <td className="px-4 py-3 text-slate-500">{enr.regularDays.join('·')} {enr.regularTime}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-[11px] border ${meta.color}`}>{meta.text}</span></td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{enr.startDate || '-'}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{enr.endDate || '-'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {enr.status === 'active' ? (
                        <>
                          <button onClick={() => setPauseTarget(enr)} title="장기 결석(차감) 처리" className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"><PauseCircle className="w-3.5 h-3.5" /></button>
                          <button onClick={() => handleStatusChange(enr, 'ended')} title="종강" className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"><StopCircle className="w-3.5 h-3.5" /></button>
                          <button onClick={() => setWithdrawTarget(enr)} title="퇴원 처리" className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><XCircle className="w-3.5 h-3.5" /></button>
                        </>
                      ) : enr.status === 'paused' ? (
                        <button onClick={() => setReturnTarget(enr)} title="복귀 신청" className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"><CheckCircle className="w-3.5 h-3.5" /></button>
                      ) : null}
                      <button onClick={() => setEditTarget(enr)} title="수정(반 이동 포함)" className="p-1.5 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                      {enr.id !== 'primary' && (
                        <button onClick={() => setCancelTarget(enr)} title="등록취소" className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                      )}
                    </div>
                  </td>
                </tr>
                {enr.status === 'paused' && (enr.pauseReason || enr.expectedReturnDate) && (
                  <tr className="bg-amber-50/50">
                    <td colSpan={7} className="px-4 py-2 text-amber-700 text-xs">
                      장기 결석 사유: {enr.pauseReason || '-'} {enr.expectedReturnDate && `· 예상 복귀일: ${enr.expectedReturnDate}`}
                    </td>
                  </tr>
                )}
                {pendingWithdrawal && (
                  <tr className="bg-red-50/60">
                    <td colSpan={7} className="px-4 py-2.5">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <span className="text-red-700 text-xs">
                          퇴원 요청 있음 ({pendingWithdrawal.requestedBy === 'parent' ? '학부모 신청' : '관리자 등록'}) — 사유: {pendingWithdrawal.reason || '-'}
                        </span>
                        <div className="flex gap-1.5">
                          <button onClick={() => approveWithdrawalRequest(pendingWithdrawal.id)} className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[11px] font-semibold">확인 후 퇴원 처리</button>
                          <button onClick={() => rejectWithdrawalRequest(pendingWithdrawal.id)} className="px-2.5 py-1 bg-white border border-slate-200 text-slate-500 rounded-lg text-[11px]">거절</button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
                {pendingReturn && (
                  <tr className="bg-cyan-50/60">
                    <td colSpan={7} className="px-4 py-2.5">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <span className="text-cyan-700 text-xs">
                          복귀 신청 대기중 — 희망일 {pendingReturn.requestedReturnDate} {pendingReturn.hasSeatAvailable ? '(자리 있음)' : '(정원 초과 주의)'}
                        </span>
                        <div className="flex gap-1.5">
                          <button onClick={() => approveReturnRequest(pendingReturn.id)} className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-[11px] font-semibold">확인 후 신규로 받기</button>
                          <button onClick={() => rejectReturnRequest(pendingReturn.id)} className="px-2.5 py-1 bg-white border border-slate-200 text-slate-500 rounded-lg text-[11px]">거절</button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <EnrollmentFormModal title="신규 반 등록" onClose={() => setShowAdd(false)}
          onSave={data => { addEnrollment(student.id, data); setShowAdd(false); }} />
      )}
      {editTarget && (
        <EnrollmentFormModal title="반 등록 수정 (담당쌤·반·시간 변경 가능)" enrollment={editTarget} onClose={() => setEditTarget(null)}
          onSave={data => { updateEnrollment(student.id, editTarget.id, data); setEditTarget(null); }} />
      )}
      {cancelTarget && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-sm shadow-xl p-6 space-y-4">
            <div>
              <h3 className="text-slate-800 font-semibold">반 등록취소</h3>
              <p className="text-slate-500 text-sm mt-1">이 반 등록을 취소합니다. 이 반에 대한 수납 이력도 함께 삭제돼요.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setCancelTarget(null)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-slate-600 text-sm hover:bg-slate-50 transition-colors">취소</button>
              <button onClick={() => { cancelEnrollment(student.id, cancelTarget.id); setCancelTarget(null); }} className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-medium transition-colors">등록취소</button>
            </div>
          </div>
        </div>
      )}
      {pauseTarget && (
        <PauseReasonModal onClose={() => setPauseTarget(null)}
          onConfirm={(reason, expectedReturnDate) => { pauseEnrollmentLongTerm(student.id, pauseTarget.id, reason, expectedReturnDate); setPauseTarget(null); }} />
      )}
      {withdrawTarget && (
        <WithdrawalReasonModal onClose={() => setWithdrawTarget(null)}
          onConfirm={reason => { submitWithdrawalRequest(student.id, withdrawTarget.id, reason, 'admin'); setWithdrawTarget(null); }} />
      )}
      {returnTarget && (
        <ReturnDateModal onClose={() => setReturnTarget(null)}
          onConfirm={date => { submitReturnRequest(student.id, returnTarget.id, date); setReturnTarget(null); }} />
      )}
    </div>
  );
}

// ─── 수납 내역 (월별 원장) ────────────────────────────────────────────────────

function PaymentLedgerSection({ student }: { student: Student }) {
  const { paymentRecords, lessonClasses, paymentPlans, markPaymentPaid, addPaymentRecord } = useStore();
  const records = paymentRecords.filter(p => p.studentId === student.id).sort((a, b) => b.billingMonth.localeCompare(a.billingMonth));
  const enrollments = getAllEnrollments(student);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [method, setMethod] = useState<'card' | 'cash' | 'transfer'>('card');

  const enrollmentLabel = (enrollmentId: string) => {
    const enr = enrollments.find(e => e.id === enrollmentId);
    const lc = enr ? lessonClasses.find(l => l.id === enr.lessonClassId) : null;
    return lc?.name ?? (enrollmentId === 'primary' ? '기본반' : '추가반');
  };

  const handleGenerateBilling = () => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    enrollments.filter(e => e.status === 'active').forEach(enr => {
      const already = paymentRecords.some(p => p.studentId === student.id && p.enrollmentId === enr.id && p.billingMonth === currentMonth);
      if (already) return;
      const plan = paymentPlans.find(p => p.id === enr.paymentPlanId);
      const amount = enr.monthlyPrice || plan?.monthlyPrice || (enr.id === 'primary' ? student.paymentAmount : 0);
      addPaymentRecord({ studentId: student.id, enrollmentId: enr.id, billingMonth: currentMonth, targetAmount: amount, paidAmount: 0, paidAt: '', method: '', status: 'unpaid', note: '' });
    });
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <h3 className="text-slate-700 font-semibold text-sm flex items-center gap-2"><Wallet className="w-4 h-4 text-amber-500" /> 수납 내역</h3>
        <button onClick={handleGenerateBilling} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-600 text-xs font-medium transition-colors">
          <Banknote className="w-3.5 h-3.5" /> 이번 달 청구 생성
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              {['수강월', '반명', '대상금액', '수납액', '수납일', '수단', '상태', '작업'].map(h => (
                <th key={h} className="px-4 py-2.5 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {records.map(r => (
              <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 font-medium text-slate-700">{r.billingMonth}</td>
                <td className="px-4 py-3 text-slate-500">{enrollmentLabel(r.enrollmentId)}</td>
                <td className="px-4 py-3 text-slate-700">{r.targetAmount.toLocaleString()}원</td>
                <td className="px-4 py-3 text-slate-700">{r.paidAmount.toLocaleString()}원</td>
                <td className="px-4 py-3 text-slate-400 text-xs">{r.paidAt || '-'}</td>
                <td className="px-4 py-3 text-slate-500 text-xs">{r.method === 'card' ? '카드' : r.method === 'cash' ? '현금' : r.method === 'transfer' ? '계좌이체' : '-'}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-[11px] border ${r.status === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : r.status === 'partial' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                    {r.status === 'paid' ? '완납' : r.status === 'partial' ? '부분납' : '미납'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {r.status !== 'paid' ? (
                    payingId === r.id ? (
                      <div className="flex items-center gap-1">
                        <select value={method} onChange={e => setMethod(e.target.value as 'card' | 'cash' | 'transfer')} className="border border-slate-200 rounded-lg px-1.5 py-1 text-xs">
                          <option value="card">카드</option><option value="cash">현금</option><option value="transfer">계좌이체</option>
                        </select>
                        <button onClick={() => { markPaymentPaid(r.id, method); setPayingId(null); }} className="px-2 py-1 bg-cyan-600 text-white rounded-lg text-[11px] font-semibold">확인</button>
                        <button onClick={() => setPayingId(null)} className="px-2 py-1 text-slate-400 text-[11px]">취소</button>
                      </div>
                    ) : (
                      <button onClick={() => setPayingId(r.id)} className="px-2.5 py-1.5 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 text-cyan-700 rounded-lg text-xs font-medium transition-colors">수납 처리</button>
                    )
                  ) : (
                    <span className="text-slate-300 text-xs">-</span>
                  )}
                </td>
              </tr>
            ))}
            {records.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-400 text-sm">수납 이력이 없습니다.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── 강습생 상세 뷰 ───────────────────────────────────────────────────────────

function StudentDetailView({ student, onBack, onEdit, onDelete, onExtend, onDefer }: {
  student: Student; onBack: () => void; onEdit: (s: Student) => void;
  onDelete: (s: Student) => void; onExtend: (s: Student) => void; onDefer: (s: Student) => void;
}) {
  const { instructors, lessonClasses, vehicles, drivers, paymentPlans, updateStudent } = useStore();
  const instructor = instructors.find(i => i.id === student.instructorId);
  const lessonClass = lessonClasses.find(lc => lc.id === student.lessonClassId);
  const vehicle = vehicles.find(v => v.id === student.vehicleId);
  const driver = vehicle ? drivers.find(d => d.id === vehicle.driverId) : null;
  const paymentPlan = paymentPlans.find(p => p.id === student.paymentPlanId);
  const status = statusLabel[student.status] ?? statusLabel.active;

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-slate-100 px-6 py-3.5 flex items-center gap-4">
        <button onClick={onBack} className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 transition-colors text-sm">
          <ChevronLeft className="w-4 h-4" /> 목록으로
        </button>
        <div className="flex-1" />
        <button onClick={() => onEdit(student)} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-600 text-sm transition-colors">
          <Edit2 className="w-3.5 h-3.5" /> 수정
        </button>
        <button onClick={() => onDelete(student)} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl text-red-600 text-sm transition-colors">
          <Trash2 className="w-3.5 h-3.5" /> 삭제
        </button>
      </div>

      <div className="p-6 space-y-5 max-w-3xl mx-auto">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 flex items-start gap-5">
          <Avatar student={student} size="lg" />
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">{student.studentName}</h2>
                <p className="text-slate-400 text-sm mt-0.5">#{student.studentNumber}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${status.color}`}>{status.text}</span>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${levelColor[student.level] ?? levelColor['초급']}`}>{student.level}</span>
              <span className="px-2.5 py-1 rounded-full text-xs font-medium border bg-slate-50 border-slate-200 text-slate-600">{student.gender}</span>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${student.division === '성인반' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : student.division === '유치부' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-sky-50 text-sky-700 border-sky-200'}`}>
                {student.division}
              </span>
              {lessonClass && (
                <span className="px-2.5 py-1 rounded-full text-xs font-medium border bg-violet-50 text-violet-700 border-violet-200">{lessonClass.name}</span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
            <h3 className="text-slate-700 font-semibold text-sm flex items-center gap-2"><User className="w-4 h-4 text-cyan-600" /> 기본 정보</h3>
            {[
              { label: '닉네임', value: student.nickname || '-' },
              { label: '생년월일', value: student.birthDate || '-' },
              { label: '등록일', value: student.registrationDate || '-' },
              { label: '성별', value: student.gender },
              { label: '학부모명', value: student.parentName || '-' },
              { label: '연락처(원생)', value: student.phone || '-' },
              { label: '연락처(모)', value: student.motherPhone || '-' },
              { label: '연락처(부)', value: student.fatherPhone || '-' },
              { label: 'SMS 수신', value: student.smsRecipients.map(r => r === 'self' ? '본인' : r === 'mother' ? '모' : '부').join(', ') || '-' },
            ].map(row => (
              <div key={row.label} className="flex justify-between items-center py-1.5 border-b border-slate-50 last:border-0">
                <span className="text-slate-400 text-sm">{row.label}</span>
                <span className="text-slate-700 text-sm font-medium">{row.value}</span>
              </div>
            ))}
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
            <h3 className="text-slate-700 font-semibold text-sm flex items-center gap-2"><MapPin className="w-4 h-4 text-emerald-500" /> 주소 & 차량</h3>
            <div className="flex justify-between items-start py-1.5 border-b border-slate-50">
              <span className="text-slate-400 text-sm">주소</span>
              <span className="text-slate-700 text-sm font-medium text-right max-w-[200px]">{student.address || '-'}</span>
            </div>
            {vehicle ? (
              <>
                <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
                  <span className="text-slate-400 text-sm">차량번호</span>
                  <span className="text-slate-700 text-sm font-medium">{vehicle.vehicleNumber}</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
                  <span className="text-slate-400 text-sm">노선</span>
                  <span className="text-slate-700 text-sm font-medium">{vehicle.route}</span>
                </div>
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-slate-400 text-sm">기사명</span>
                  <span className="text-slate-700 text-sm font-medium">{driver?.name ?? '-'}</span>
                </div>
              </>
            ) : (
              <div className="py-3 text-slate-400 text-sm text-center">차량 미배정</div>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
            <h3 className="text-slate-700 font-semibold text-sm flex items-center gap-2"><GraduationCap className="w-4 h-4 text-violet-500" /> 강습 정보</h3>
            {[
              { label: '강습반', value: lessonClass?.name ?? '-' },
              { label: '담당 강사', value: instructor?.name ?? '-' },
              { label: '수강 요일', value: student.regularDays.join(', ') || '-' },
              { label: '수강 시간', value: student.regularTime || '-' },
              { label: '수강권', value: student.passType || '-' },
              { label: '월 수업', value: `${student.totalClasses}회` },
              { label: '보강 잔여', value: `${student.rescheduleLimit - student.usedReschedules}회` },
            ].map(row => (
              <div key={row.label} className="flex justify-between items-center py-1.5 border-b border-slate-50 last:border-0">
                <span className="text-slate-400 text-sm">{row.label}</span>
                <span className="text-slate-700 text-sm font-medium">{row.value}</span>
              </div>
            ))}
            <div className="pt-1.5">
              <span className="text-slate-400 text-sm block mb-1">진도 현황 (강사 기록)</span>
              <p className="text-cyan-700 text-sm font-semibold bg-cyan-50 border border-cyan-100 rounded-xl px-3 py-2">{student.progress || '아직 기록된 진도가 없습니다.'}</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
            <h3 className="text-slate-700 font-semibold text-sm flex items-center gap-2"><CreditCard className="w-4 h-4 text-amber-500" /> 결제 정보</h3>
            {paymentPlan && (
              <div className="bg-cyan-50 border border-cyan-100 rounded-xl p-3 mb-2">
                <p className="text-cyan-700 text-xs font-semibold">{paymentPlan.name}</p>
                <p className="text-cyan-600 text-sm font-bold mt-0.5">{paymentPlan.monthlyPrice.toLocaleString()}원/월</p>
                {paymentPlan.hasFreeSwim && <span className="text-cyan-500 text-xs">자유수영 포함</span>}
              </div>
            )}
            <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
              <span className="text-slate-400 text-sm">결제 금액</span>
              <span className="text-slate-700 text-sm font-bold">{student.paymentAmount ? student.paymentAmount.toLocaleString() + '원' : '-'}</span>
            </div>
            {[
              { label: '결제일', value: student.paymentDate || '-' },
              { label: '갱신일', value: student.paymentRenewalDate || '-' },
            ].map(row => (
              <div key={row.label} className="flex justify-between items-center py-1.5 border-b border-slate-50 last:border-0">
                <span className="text-slate-400 text-sm">{row.label}</span>
                <span className="text-slate-700 text-sm font-medium">{row.value}</span>
              </div>
            ))}
            <div className="flex justify-between items-center py-1.5">
              <span className="text-slate-400 text-sm">결제 상태</span>
              <button onClick={() => updateStudent(student.id, { paymentCompleted: !student.paymentCompleted })}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-colors ${student.paymentCompleted ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'}`}>
                {student.paymentCompleted ? <><CheckCircle className="w-3.5 h-3.5" /> 결제 완료</> : <><XCircle className="w-3.5 h-3.5" /> 미결제</>}
              </button>
            </div>
          </div>
        </div>

        <EnrollmentSection student={student} />
        <PaymentLedgerSection student={student} />

        {student.notes && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <h3 className="text-slate-700 font-semibold text-sm flex items-center gap-2 mb-2"><BookOpen className="w-4 h-4 text-slate-400" /> 비고</h3>
            <p className="text-slate-600 text-sm leading-relaxed">{student.notes}</p>
          </div>
        )}

        <div className="flex flex-wrap gap-3 pb-4">
          {student.status !== 'deferred' && (
            <button onClick={() => onDefer(student)} className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl text-amber-700 text-sm font-medium transition-colors">
              <Clock className="w-4 h-4" /> 휴강 처리
            </button>
          )}
          {student.status === 'deferred' && (
            <button onClick={() => updateStudent(student.id, { status: 'active' })} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-emerald-700 text-sm font-medium transition-colors">
              <CheckCircle className="w-4 h-4" /> 수업 재개
            </button>
          )}
          <button onClick={() => onExtend(student)} className="flex items-center gap-2 px-4 py-2.5 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 rounded-xl text-cyan-700 text-sm font-medium transition-colors">
            <Calendar className="w-4 h-4" /> 수강 연장
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── 강습반별 보기 ────────────────────────────────────────────────────────────

function ByClassView({ students, onSelect }: { students: Student[]; onSelect: (s: Student) => void }) {
  const { lessonClasses, instructors } = useStore();
  const grouped = lessonClasses.map(lc => ({ lc, students: students.filter(s => s.lessonClassId === lc.id) }));
  const unclassed = students.filter(s => !lessonClasses.some(lc => lc.id === s.lessonClassId));

  const renderStudent = (student: Student) => {
    const instructor = instructors.find(i => i.id === student.instructorId);
    const status = statusLabel[student.status] ?? statusLabel.active;
    return (
      <div key={student.id} onClick={() => onSelect(student)}
        className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors group">
        <Avatar student={student} size="sm" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-slate-800 text-sm font-medium group-hover:text-cyan-700 transition-colors truncate">{student.studentName}</span>
            <span className="text-slate-400 text-xs">#{student.studentNumber}</span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-slate-400 text-xs">{student.regularDays.join('·')} {student.regularTime}</span>
            {instructor && <span className="text-slate-400 text-xs">· {instructor.name}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`px-2 py-0.5 rounded-full text-xs border ${levelColor[student.level] ?? levelColor['초급']}`}>{student.level}</span>
          <span className={`px-2 py-0.5 rounded-full text-xs border ${status.color}`}>{status.text}</span>
          {!student.paymentCompleted && <span className="px-2 py-0.5 rounded-full text-xs border bg-amber-50 text-amber-700 border-amber-200">미결제</span>}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-5">
      {grouped.map(({ lc, students: lcStudents }) => (
        <div key={lc.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50">
            <div>
              <h3 className="text-slate-700 font-semibold text-sm">{lc.name}</h3>
              {lc.description && <p className="text-slate-400 text-xs mt-0.5">{lc.description}</p>}
            </div>
            <span className="text-slate-400 text-sm">{lcStudents.length}명</span>
          </div>
          {lcStudents.length === 0 ? (
            <p className="text-slate-400 text-sm px-5 py-4">등록된 강습생이 없습니다.</p>
          ) : (
            <div className="p-2 space-y-0.5">{lcStudents.map(renderStudent)}</div>
          )}
        </div>
      ))}
      {unclassed.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
            <h3 className="text-slate-400 font-semibold text-sm">미배정</h3>
            <span className="text-slate-400 text-sm">{unclassed.length}명</span>
          </div>
          <div className="p-2 space-y-0.5">{unclassed.map(renderStudent)}</div>
        </div>
      )}
    </div>
  );
}

// ─── 전체 목록 보기 ───────────────────────────────────────────────────────────

type SortKey = 'name' | 'registrationDate' | 'birthDate';

function AllStudentsView({ students, onSelect }: { students: Student[]; onSelect: (s: Student) => void }) {
  const { instructors, lessonClasses } = useStore();
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortAsc, setSortAsc] = useState(true);
  const [filterClass, setFilterClass] = useState('all');

  const sorted = [...students]
    .filter(s => filterClass === 'all' || s.lessonClassId === filterClass)
    .sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'name') cmp = a.studentName.localeCompare(b.studentName, 'ko');
      else if (sortKey === 'registrationDate') cmp = (a.registrationDate || '').localeCompare(b.registrationDate || '');
      else if (sortKey === 'birthDate') cmp = (a.birthDate || '').localeCompare(b.birthDate || '');
      return sortAsc ? cmp : -cmp;
    });

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(p => !p);
    else { setSortKey(key); setSortAsc(true); }
  };

  const SortBtn = ({ k, label }: { k: SortKey; label: string }) => (
    <button onClick={() => toggleSort(k)}
      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${sortKey === k ? 'bg-cyan-50 border-cyan-200 text-cyan-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
      {label}<ArrowUpDown className="w-3 h-3" />{sortKey === k && <span>{sortAsc ? '↑' : '↓'}</span>}
    </button>
  );

  return (
    <div className="p-6 space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-slate-500 text-sm">정렬:</span>
        <SortBtn k="name" label="ㄱㄴㄷ순" />
        <SortBtn k="registrationDate" label="신청일순" />
        <SortBtn k="birthDate" label="생년월일순" />
        <div className="ml-auto flex items-center gap-2">
          <span className="text-slate-500 text-sm">강습반:</span>
          <select value={filterClass} onChange={e => setFilterClass(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-1.5 text-slate-700 text-sm focus:outline-none focus:border-cyan-500 bg-white">
            <option value="all">전체</option>
            {lessonClasses.map(lc => <option key={lc.id} value={lc.id}>{lc.name}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {['번호', '이름', '구분', '강습반', '수강 요일·시간', '담당 강사', '수준', '상태', '결제', '신청일'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 && (
                <tr><td colSpan={10} className="px-4 py-8 text-center text-slate-400 text-sm">해당하는 강습생이 없습니다.</td></tr>
              )}
              {sorted.map(student => {
                const instructor = instructors.find(i => i.id === student.instructorId);
                const lessonClass = lessonClasses.find(lc => lc.id === student.lessonClassId);
                const status = statusLabel[student.status] ?? statusLabel.active;
                return (
                  <tr key={student.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-slate-400 text-xs">{student.studentNumber}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 cursor-pointer" onClick={() => onSelect(student)}>
                        <Avatar student={student} size="sm" />
                        <span className="text-slate-700 text-sm font-medium hover:text-cyan-700 transition-colors">{student.studentName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs border ${student.category === 'child' ? 'bg-sky-50 text-sky-700 border-sky-200' : 'bg-indigo-50 text-indigo-700 border-indigo-200'}`}>
                        {student.category === 'child' ? '아동' : '성인'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-sm">{lessonClass?.name ?? '-'}</td>
                    <td className="px-4 py-3 text-slate-600 text-sm">{student.regularDays.join('·')} {student.regularTime}</td>
                    <td className="px-4 py-3 text-slate-600 text-sm">{instructor?.name ?? '-'}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs border ${levelColor[student.level] ?? levelColor['초급']}`}>{student.level}</span></td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs border ${status.color}`}>{status.text}</span></td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs border ${student.paymentCompleted ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                        {student.paymentCompleted ? '완료' : '미결제'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{student.registrationDate || '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-slate-400 text-xs text-right">총 {sorted.length}명</p>
    </div>
  );
}

// ─── 연장/휴강 모달 ────────────────────────────────────────────────────────────

function MonthPickerModal({ title, desc, onConfirm, onClose }: {
  title: string; desc: string; onConfirm: (m: number) => void; onClose: () => void;
}) {
  const [months, setMonths] = useState(1);
  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-sm shadow-xl">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-[15px] font-semibold text-slate-800">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-slate-500 text-sm">{desc}</p>
          <div className="flex gap-3">
            {[1, 2, 3].map(m => (
              <button key={m} onClick={() => setMonths(m)}
                className={`flex-1 py-3 rounded-xl text-sm font-medium border transition-colors ${months === m ? 'bg-cyan-600 border-cyan-600 text-white' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                {m}개월
              </button>
            ))}
          </div>
          <button onClick={() => { onConfirm(months); onClose(); }} className="w-full bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl py-3 text-sm font-medium transition-colors">확인</button>
        </div>
      </div>
    </div>
  );
}

// ─── 메인 컴포넌트 ────────────────────────────────────────────────────────────

export default function AdminStudents() {
  const { students, addStudent, updateStudent, deleteStudent, extendStudentClasses, deferStudentClasses } = useStore();

  const [view, setView] = useState<'by-class' | 'all'>('by-class');
  const [detailStudent, setDetailStudent] = useState<Student | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Student[] | null>(null);
  const [showRegister, setShowRegister] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [showClassManager, setShowClassManager] = useState(false);
  const [extendTarget, setExtendTarget] = useState<Student | null>(null);
  const [deferTarget, setDeferTarget] = useState<Student | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Student | null>(null);

  const handleSearch = () => {
    if (!searchQuery.trim()) { setSearchResults(null); return; }
    const q = searchQuery.toLowerCase();
    const results = students.filter(s =>
      s.studentName.includes(searchQuery) || s.studentNumber.toLowerCase().includes(q) ||
      s.phone.includes(searchQuery) || s.motherPhone.includes(searchQuery) || s.fatherPhone.includes(searchQuery)
    );
    if (results.length === 1) { setDetailStudent(results[0]); setSearchResults(null); }
    else setSearchResults(results);
  };

  const handleRegister = (data: FormData) => {
    addStudent(data as Parameters<typeof addStudent>[0]);
    setShowRegister(false);
  };

  const handleEdit = (data: FormData) => {
    if (!editingStudent) return;
    updateStudent(editingStudent.id, data as Partial<Student>);
    setEditingStudent(null);
    if (detailStudent?.id === editingStudent.id) setDetailStudent({ ...editingStudent, ...data } as Student);
  };

  const handleDelete = (student: Student) => {
    deleteStudent(student.id);
    setDeleteConfirm(null);
    if (detailStudent?.id === student.id) setDetailStudent(null);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="shrink-0 px-6 py-4 bg-white border-b border-slate-200 flex items-center gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-800">강습생 관리</h1>
          </div>
          <p className="text-slate-400 text-xs mt-0.5">총 {students.length}명 등록</p>
        </div>

        <div className="flex items-center gap-2 flex-1 min-w-48 max-w-80">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              className="w-full border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-slate-800 placeholder:text-slate-400 text-sm focus:outline-none focus:border-cyan-500 bg-white transition-colors"
              placeholder="이름, 번호, 전화번호 검색" value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <button onClick={handleSearch} className="px-3 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-sm font-medium transition-colors">검색</button>
          {(searchResults !== null || searchQuery) && (
            <button onClick={() => { setSearchQuery(''); setSearchResults(null); }} className="text-slate-400 hover:text-slate-700"><X className="w-4 h-4" /></button>
          )}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <div className="flex items-center gap-2">
            <button onClick={() => setShowClassManager(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-600 text-sm transition-colors">
              <Settings className="w-4 h-4" /> 강습반 관리
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowBulkImport(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-600 text-sm transition-colors">
              <FileSpreadsheet className="w-4 h-4" /> 일괄 등록
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowRegister(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded-xl text-white text-sm font-medium transition-colors">
              <Plus className="w-4 h-4" /> 강습생 등록
            </button>
          </div>
        </div>
      </div>

      {students.length === 0 && !detailStudent && !searchResults && (
        <div className="shrink-0 px-6 py-6 bg-slate-50 border-b border-slate-200">
          <EmptyStateGuide
            icon={User}
            title="첫 강습생을 등록해보세요"
            description="학생 정보를 등록하면 수업 일정, 결제, 보강 관리가 자동으로 연결돼요. 여기서 첫 등록을 시작해보세요."
            ctaLabel="강습생 등록"
            onCta={() => setShowRegister(true)}
          />
        </div>
      )}

      {!detailStudent && !searchResults && (
        <div className="shrink-0 flex border-b border-slate-200 bg-white px-6">
          <button onClick={() => setView('by-class')}
            className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${view === 'by-class' ? 'border-cyan-600 text-cyan-700' : 'border-transparent text-slate-400 hover:text-slate-700'}`}>
            <LayoutGrid className="w-4 h-4" /> 강습반별 보기
          </button>
          <button onClick={() => setView('all')}
            className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${view === 'all' ? 'border-cyan-600 text-cyan-700' : 'border-transparent text-slate-400 hover:text-slate-700'}`}>
            <List className="w-4 h-4" /> 전체 목록
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {searchResults !== null && (
          <div className="p-6">
            <p className="text-slate-500 text-sm mb-4">"{searchQuery}" 검색 결과: {searchResults.length}명</p>
            {searchResults.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <AlertCircle className="w-10 h-10 mx-auto mb-3 opacity-40" /><p>검색 결과가 없습니다.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {searchResults.map(s => {
                  const status = statusLabel[s.status] ?? statusLabel.active;
                  return (
                    <div key={s.id} onClick={() => { setDetailStudent(s); setSearchResults(null); setSearchQuery(''); }}
                      className="flex items-center gap-4 p-4 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl cursor-pointer transition-colors">
                      <Avatar student={s} size="md" />
                      <div className="flex-1">
                        <p className="text-slate-700 font-medium">{s.studentName} <span className="text-slate-400 text-sm font-normal">#{s.studentNumber}</span></p>
                        <p className="text-slate-400 text-sm">{getPrimaryContactPhone(s)} · {s.regularDays.join('·')} {s.regularTime}</p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs border ${status.color}`}>{status.text}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {!searchResults && detailStudent && (
          <StudentDetailView
            student={students.find(s => s.id === detailStudent.id) ?? detailStudent}
            onBack={() => setDetailStudent(null)}
            onEdit={s => setEditingStudent(s)}
            onDelete={s => setDeleteConfirm(s)}
            onExtend={s => setExtendTarget(s)}
            onDefer={s => setDeferTarget(s)}
          />
        )}

        {!searchResults && !detailStudent && view === 'by-class' && <ByClassView students={students} onSelect={setDetailStudent} />}
        {!searchResults && !detailStudent && view === 'all' && <AllStudentsView students={students} onSelect={setDetailStudent} />}
      </div>

      {showRegister && <StudentFormModal title="강습생 등록" onClose={() => setShowRegister(false)} onSave={handleRegister} />}
      {showBulkImport && <BulkImportModal onClose={() => setShowBulkImport(false)} />}
      {editingStudent && <StudentFormModal title="강습생 정보 수정" initial={editingStudent} onClose={() => setEditingStudent(null)} onSave={handleEdit} />}
      {showClassManager && <LessonClassManagerModal onClose={() => setShowClassManager(false)} />}
      {extendTarget && <MonthPickerModal title="수강 연장" desc={`${extendTarget.studentName} 강습생의 수업을 연장합니다.`} onConfirm={m => extendStudentClasses(extendTarget.id, m)} onClose={() => setExtendTarget(null)} />}
      {deferTarget && <MonthPickerModal title="휴강 처리" desc={`${deferTarget.studentName} 강습생을 휴강 처리합니다.`} onConfirm={m => deferStudentClasses(deferTarget.id, m)} onClose={() => setDeferTarget(null)} />}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-sm shadow-xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-50 border border-red-100 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="text-slate-800 font-semibold">강습생 삭제</h3>
                <p className="text-slate-500 text-sm">{deleteConfirm.studentName} 강습생을 삭제합니다.</p>
              </div>
            </div>
            <p className="text-slate-500 text-sm bg-slate-50 rounded-xl p-3">삭제 시 예정된 모든 수업이 취소되며 복구할 수 없습니다.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 text-sm hover:bg-slate-100 transition-colors">취소</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 rounded-xl text-white text-sm font-medium transition-colors">삭제 확인</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
