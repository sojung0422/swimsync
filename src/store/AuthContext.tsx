import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

export type OrgMembership = {
  id: string; // organization_members.id
  organizationId: string;
  organizationName: string;
  branchName: string;
  plan: 'freelance' | 'academy';
  role: 'owner' | 'instructor';
  status: 'invited' | 'active' | 'removed';
  displayName: string;
};

type AuthContextType = {
  loading: boolean;
  session: Session | null;
  userId: string | null;
  fullName: string;
  memberships: OrgMembership[]; // 활성 소속 (원장 또는 강사로 활동 중인 모든 조직)
  pendingInvites: OrgMembership[]; // 아직 수락하지 않은 초대
  currentOrgId: string | null;
  setCurrentOrgId: (id: string) => void;
  signInWithPassword: (email: string, password: string) => Promise<{ error: string | null }>;
  signUpWithPassword: (email: string, password: string, fullName: string) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  acceptInvite: (membershipId: string) => Promise<void>;
  refreshMemberships: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [fullName, setFullName] = useState('');
  const [memberships, setMemberships] = useState<OrgMembership[]>([]);
  const [pendingInvites, setPendingInvites] = useState<OrgMembership[]>([]);
  const [currentOrgId, setCurrentOrgIdState] = useState<string | null>(
    typeof window !== 'undefined' ? window.localStorage.getItem('swimsync-current-org') : null
  );

  const setCurrentOrgId = (id: string) => {
    setCurrentOrgIdState(id);
    window.localStorage.setItem('swimsync-current-org', id);
  };

  const loadMemberships = async (userId: string) => {
    const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', userId).maybeSingle();
    setFullName(profile?.full_name ?? '');

    const { data } = await supabase
      .from('organization_members')
      .select('id, organization_id, role, status, display_name, organizations(name, branch_name, plan)')
      .eq('user_id', userId);

    const rows = (data ?? []) as unknown as Array<{
      id: string; organization_id: string; role: 'owner' | 'instructor'; status: 'invited' | 'active' | 'removed';
      display_name: string; organizations: { name: string; branch_name: string; plan: 'freelance' | 'academy' } | null;
    }>;

    const toMembership = (r: (typeof rows)[number]): OrgMembership => ({
      id: r.id,
      organizationId: r.organization_id,
      organizationName: r.organizations?.name ?? '알 수 없는 조직',
      branchName: r.organizations?.branch_name ?? '',
      plan: r.organizations?.plan ?? 'freelance',
      role: r.role,
      status: r.status,
      displayName: r.display_name,
    });

    const active = rows.filter(r => r.status === 'active').map(toMembership);
    const invited = rows.filter(r => r.status === 'invited').map(toMembership);
    setMemberships(active);
    setPendingInvites(invited);

    setCurrentOrgIdState(prev => {
      if (prev && active.some(m => m.organizationId === prev)) return prev;
      return active[0]?.organizationId ?? null;
    });
  };

  const refreshMemberships = async () => {
    if (session?.user.id) await loadMemberships(session.user.id);
  };

  useEffect(() => {
    if (!isSupabaseConfigured) { setLoading(false); return; }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) loadMemberships(data.session.user.id).finally(() => setLoading(false));
      else setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession) loadMemberships(newSession.user.id);
      else { setMemberships([]); setPendingInvites([]); setFullName(''); }
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const signInWithPassword = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signUpWithPassword = async (email: string, password: string, fullNameInput: string) => {
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: fullNameInput } },
    });
    return { error: error?.message ?? null };
  };

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    window.localStorage.removeItem('swimsync-current-org');
  };

  const acceptInvite = async (membershipId: string) => {
    await supabase.from('organization_members').update({ status: 'active' }).eq('id', membershipId);
    await refreshMemberships();
  };

  return (
    <AuthContext.Provider value={{
      loading, session, userId: session?.user.id ?? null, fullName,
      memberships, pendingInvites, currentOrgId, setCurrentOrgId,
      signInWithPassword, signUpWithPassword, signInWithGoogle, signOut,
      acceptInvite, refreshMemberships,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
