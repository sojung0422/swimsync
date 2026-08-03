import { useState } from 'react';
import { useAuth } from '../store/AuthContext';
import { isSupabaseConfigured } from '../lib/supabaseClient';
import { Waves, Mail, Lock, User, AlertCircle, Loader2 } from 'lucide-react';

export default function AuthScreen() {
  const { signInWithPassword, signUpWithPassword, signInWithGoogle } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);

  const inputCls = 'w-full border border-slate-200 rounded-xl pl-10 pr-3 py-3 text-slate-800 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-400 transition-colors bg-white';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setNotice(''); setLoading(true);
    if (mode === 'signin') {
      const { error: err } = await signInWithPassword(email, password);
      if (err) setError(err);
    } else {
      if (!fullName.trim()) { setError('이름을 입력해주세요.'); setLoading(false); return; }
      const { error: err } = await signUpWithPassword(email, password, fullName.trim());
      if (err) setError(err);
      else setNotice('가입 확인 이메일을 보냈어요. 메일함을 확인해주세요.');
    }
    setLoading(false);
  };

  if (!isSupabaseConfigured) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50 p-6">
        <div className="max-w-md w-full bg-white border border-amber-200 rounded-2xl p-8 text-center shadow-sm">
          <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6 text-amber-500" />
          </div>
          <h2 className="text-slate-800 font-bold text-lg mb-2">백엔드 연결이 필요해요</h2>
          <p className="text-slate-500 text-sm leading-relaxed">
            프로젝트 루트의 <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">.env</code> 파일에
            <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs mx-1">VITE_SUPABASE_URL</code>과
            <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs mx-1">VITE_SUPABASE_ANON_KEY</code>를
            채워주세요. (<code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">.env.example</code> 참고)
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-screen bg-slate-50 p-6">
      <div className="max-w-sm w-full">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-sm"
            style={{ background: 'linear-gradient(135deg,#0891b2,#3b82f6)' }}>
            <Waves size={22} className="text-white" />
          </div>
          <h1 className="text-slate-900 font-bold text-xl tracking-tight">SwimSync</h1>
          <p className="text-slate-400 text-sm mt-1">수영장·강사 통합 관리</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-7 shadow-sm">
          <div className="flex bg-slate-50 rounded-xl p-1 mb-6">
            {(['signin', 'signup'] as const).map(m => (
              <button key={m} onClick={() => { setMode(m); setError(''); setNotice(''); }}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${mode === m ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400'}`}>
                {m === 'signin' ? '로그인' : '회원가입'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === 'signup' && (
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input className={inputCls} placeholder="이름" value={fullName} onChange={e => setFullName(e.target.value)} />
              </div>
            )}
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="email" required className={inputCls} placeholder="이메일" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="password" required minLength={6} className={inputCls} placeholder="비밀번호 (6자 이상)" value={password} onChange={e => setPassword(e.target.value)} />
            </div>

            {error && <p className="text-red-500 text-xs bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</p>}
            {notice && <p className="text-emerald-600 text-xs bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">{notice}</p>}

            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors text-sm">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {mode === 'signin' ? '로그인' : '가입하기'}
            </button>
          </form>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-slate-100" />
            <span className="text-slate-300 text-xs">또는</span>
            <div className="flex-1 h-px bg-slate-100" />
          </div>

          <button onClick={() => signInWithGoogle()}
            className="w-full flex items-center justify-center gap-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold py-3 rounded-xl transition-colors text-sm">
            <svg className="w-4 h-4" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.5 0 10.4-1.9 14.3-5.1l-6.6-5.6C29.6 35.4 26.9 36.4 24 36.4c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.6 39.6 16.3 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.3-4.1 5.7l6.6 5.6C41.9 35.9 44 30.4 44 24c0-1.3-.1-2.7-.4-3.5z"/></svg>
            구글로 계속하기
          </button>
        </div>
      </div>
    </div>
  );
}
