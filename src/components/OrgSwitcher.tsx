import { useState } from 'react';
import { useAuth } from '../store/AuthContext';
import { ChevronDown, Building2, Bell, Check, X } from 'lucide-react';

export default function OrgSwitcher() {
  const { memberships, pendingInvites, currentOrgId, setCurrentOrgId, acceptInvite } = useAuth();
  const [open, setOpen] = useState(false);
  const [showInvites, setShowInvites] = useState(false);

  const current = memberships.find(m => m.organizationId === currentOrgId);

  return (
    <div className="relative">
      <button onClick={() => setOpen(p => !p)}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100 transition-colors text-left">
        <div className="w-7 h-7 rounded-lg bg-cyan-50 border border-cyan-100 flex items-center justify-center shrink-0">
          <Building2 size={13} className="text-cyan-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-slate-400 leading-none">{current?.role === 'owner' ? '원장' : '강사'}</p>
          <p className="text-[13px] text-slate-700 font-semibold mt-0.5 truncate">{current?.organizationName ?? '조직 선택'}</p>
        </div>
        {pendingInvites.length > 0 && (
          <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center shrink-0">{pendingInvites.length}</span>
        )}
        <ChevronDown size={14} className="text-slate-400 shrink-0" />
      </button>

      {open && (
        <div className="absolute bottom-full mb-2 left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden z-50">
          <div className="max-h-56 overflow-y-auto">
            {memberships.map(m => (
              <button key={m.id} onClick={() => { setCurrentOrgId(m.organizationId); setOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-slate-50 transition-colors ${m.organizationId === currentOrgId ? 'bg-cyan-50/60' : ''}`}>
                <div className="flex-1 min-w-0">
                  <p className="text-slate-700 text-sm font-medium truncate">{m.organizationName}</p>
                  <p className="text-slate-400 text-[11px]">{m.role === 'owner' ? '원장' : '강사'} · {m.plan === 'freelance' ? '개인' : '기관'}</p>
                </div>
                {m.organizationId === currentOrgId && <Check size={14} className="text-cyan-600 shrink-0" />}
              </button>
            ))}
          </div>
          {pendingInvites.length > 0 && (
            <button onClick={() => { setShowInvites(true); setOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2.5 border-t border-slate-100 text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors text-xs font-semibold">
              <Bell size={13} /> 대기 중인 초대 {pendingInvites.length}건
            </button>
          )}
        </div>
      )}

      {showInvites && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-sm shadow-xl">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h3 className="text-slate-800 font-semibold text-sm">기관 초대</h3>
              <button onClick={() => setShowInvites(false)} className="text-slate-400 hover:text-slate-700"><X size={16} /></button>
            </div>
            <div className="p-3 space-y-2 max-h-80 overflow-y-auto">
              {pendingInvites.map(inv => (
                <div key={inv.id} className="flex items-center justify-between gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="min-w-0">
                    <p className="text-slate-800 text-sm font-medium truncate">{inv.organizationName}</p>
                    <p className="text-slate-400 text-xs">강사로 초대됨</p>
                  </div>
                  <button onClick={() => acceptInvite(inv.id)}
                    className="shrink-0 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-xs font-semibold transition-colors">
                    수락
                  </button>
                </div>
              ))}
              {pendingInvites.length === 0 && <p className="text-slate-400 text-sm text-center py-6">대기 중인 초대가 없어요.</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
