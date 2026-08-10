import { useState } from 'react';
import { useStore } from '../store/StoreContext';
import type { Student } from '../store/StoreContext';
import { parseImportFile, mapRowsToDrafts } from '../lib/studentImport';
import type { ImportedStudentDraft } from '../lib/studentImport';
import { Upload, X, FileSpreadsheet, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

function draftToStudentInput(draft: ImportedStudentDraft): Omit<Student, 'id' | 'studentNumber' | 'usedReschedules' | 'additionalEnrollments'> {
  return {
    studentName: draft.studentName, nickname: '', parentName: '',
    birthDate: draft.birthDate, registrationDate: draft.registrationDate, gender: draft.gender,
    lessonClassId: '', regularDays: [], regularTime: '15:00',
    phone: '', motherPhone: draft.phone, fatherPhone: '', smsRecipients: ['mother'],
    level: '초급', status: draft.status, instructorId: '',
    paymentAmount: 0, paymentDate: '', paymentRenewalDate: '',
    paymentCompleted: false, studentPhoto: '',
    age: draft.age, region: '', passType: '주 2회', totalClasses: 8,
    rescheduleLimit: 2, notes: draft.notes, progress: '',
    address: draft.address, vehicleId: '', category: 'child', paymentPlanId: '', division: '정규반',
    pauseReason: '', expectedReturnDate: '', withdrawalReason: '',
  };
}

export default function BulkImportModal({ onClose }: { onClose: () => void }) {
  const { addStudent } = useStore();
  const [stage, setStage] = useState<'upload' | 'preview' | 'done'>('upload');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [drafts, setDrafts] = useState<ImportedStudentDraft[]>([]);
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const [importedCount, setImportedCount] = useState(0);

  const handleFile = async (file: File) => {
    setError('');
    setLoading(true);
    try {
      const { headers, rows } = await parseImportFile(file);
      const parsed = mapRowsToDrafts(headers, rows);
      if (parsed.length === 0) {
        setError('인식할 수 있는 회원 데이터를 찾지 못했어요. "성명" 컬럼이 있는지 확인해주세요.');
        setLoading(false);
        return;
      }
      setDrafts(parsed);
      setChecked(new Set(parsed.map((_, i) => i)));
      setStage('preview');
    } catch {
      setError('파일을 읽는 중 문제가 발생했어요. CSV 또는 엑셀(.xlsx) 파일인지 확인해주세요.');
    }
    setLoading(false);
  };

  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const toggleRow = (i: number) => {
    setChecked(prev => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });
  };

  const handleImport = () => {
    let count = 0;
    drafts.forEach((draft, i) => {
      if (!checked.has(i)) return;
      addStudent(draftToStudentInput(draft));
      count++;
    });
    setImportedCount(count);
    setStage('done');
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl shadow-xl flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-[15px] font-semibold text-slate-800 flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-cyan-600" /> 엑셀/CSV 일괄 등록
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors"><X className="w-5 h-5" /></button>
        </div>

        {stage === 'upload' && (
          <div className="p-6 space-y-4">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-500 leading-relaxed">
              기존에 쓰시던 회원명부 엑셀/CSV 파일을 그대로 올리면 돼요. <strong className="text-slate-700">성명, 원생HP, 부모HP(모), 생일, 성별, 주소, 등록시작일</strong> 등 컬럼명을 자동으로 인식해서 매칭해요.
              강습반·담당강사·요일/시간·결제 정보는 이 파일에 없으므로 등록 후 강습생 상세에서 개별로 채워주셔야 해요.
            </div>
            <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer hover:bg-slate-50 hover:border-cyan-300 transition-colors">
              {loading ? (
                <Loader2 className="w-8 h-8 text-cyan-500 animate-spin mb-2" />
              ) : (
                <Upload className="w-8 h-8 text-slate-300 mb-2" />
              )}
              <span className="text-slate-500 text-sm font-medium">{loading ? '파일을 읽는 중...' : '클릭해서 파일 선택'}</span>
              <span className="text-slate-400 text-xs mt-1">.xlsx, .xls, .csv 지원</span>
              <input type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={onFileInput} disabled={loading} />
            </label>
            {error && (
              <div className="flex items-start gap-2 text-red-600 text-xs bg-red-50 border border-red-100 rounded-xl p-3">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {error}
              </div>
            )}
          </div>
        )}

        {stage === 'preview' && (
          <>
            <div className="px-6 pt-4 pb-2 flex items-center justify-between shrink-0">
              <p className="text-slate-500 text-xs">
                총 <strong className="text-slate-700">{drafts.length}명</strong> 인식됨 · <strong className="text-cyan-700">{checked.size}명</strong> 선택됨
              </p>
              <div className="flex gap-2">
                <button onClick={() => setChecked(new Set(drafts.map((_, i) => i)))} className="text-xs text-cyan-600 hover:text-cyan-700">전체 선택</button>
                <button onClick={() => setChecked(new Set())} className="text-xs text-slate-400 hover:text-slate-600">전체 해제</button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-6 pb-2">
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="px-3 py-2 w-8"></th>
                      {['이름', '연락처', '생년월일', '성별', '주소', '등록일', '상태'].map(h => (
                        <th key={h} className="px-3 py-2 text-left font-bold text-slate-400 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {drafts.map((d, i) => (
                      <tr key={i} className={`transition-colors ${checked.has(i) ? '' : 'opacity-40'}`}>
                        <td className="px-3 py-2">
                          <input type="checkbox" checked={checked.has(i)} onChange={() => toggleRow(i)} className="w-3.5 h-3.5 accent-cyan-600" />
                        </td>
                        <td className="px-3 py-2 font-semibold text-slate-800">{d.studentName}</td>
                        <td className="px-3 py-2 text-slate-500">{d.phone || '-'}</td>
                        <td className="px-3 py-2 text-slate-500">{d.birthDate || '-'}</td>
                        <td className="px-3 py-2 text-slate-500">{d.gender}</td>
                        <td className="px-3 py-2 text-slate-500 max-w-[160px] truncate">{d.address || '-'}</td>
                        <td className="px-3 py-2 text-slate-500">{d.registrationDate}</td>
                        <td className="px-3 py-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] border ${d.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                            {d.status === 'active' ? '재원' : '퇴원'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="p-6 pt-3 border-t border-slate-100 flex gap-3 shrink-0">
              <button onClick={() => setStage('upload')} className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 text-sm hover:bg-slate-100 transition-colors">다른 파일 선택</button>
              <button onClick={handleImport} disabled={checked.size === 0}
                className="flex-1 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl py-2.5 text-sm font-medium transition-colors">
                {checked.size}명 일괄 등록
              </button>
            </div>
          </>
        )}

        {stage === 'done' && (
          <div className="p-10 flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-4">
              <CheckCircle className="w-7 h-7 text-emerald-500" />
            </div>
            <p className="text-slate-800 font-semibold">{importedCount}명 등록 완료</p>
            <p className="text-slate-400 text-sm mt-1.5">강습반·담당 강사·요일/시간·결제 정보는 각 강습생 상세에서 이어서 입력해주세요.</p>
            <button onClick={onClose} className="mt-6 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-medium transition-colors">확인</button>
          </div>
        )}
      </div>
    </div>
  );
}
