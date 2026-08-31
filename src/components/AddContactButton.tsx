import { UserPlus } from 'lucide-react';
import { downloadVCard } from '../lib/vcard';

// 전화번호 옆에 붙이는 "연락처 추가" 버튼 — vCard(.vcf) 다운로드로 OS 연락처 앱의 저장 화면을 연다.
export default function AddContactButton({ name, phone, className = '', compact = false }: { name: string; phone: string; className?: string; compact?: boolean }) {
  if (!phone) return null;
  if (compact) {
    return (
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); downloadVCard({ name, phone }); }}
        title="연락처 추가"
        className={`w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 flex items-center justify-center transition-colors shrink-0 ${className}`}
      >
        <UserPlus className="w-3.5 h-3.5" />
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); downloadVCard({ name, phone }); }}
      title="연락처 추가"
      className={`inline-flex items-center gap-1 text-[11px] font-medium text-cyan-600 hover:text-cyan-700 transition-colors ${className}`}
    >
      <UserPlus className="w-3.5 h-3.5" /> 연락처 추가
    </button>
  );
}
