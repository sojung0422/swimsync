import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  // eslint-disable-next-line no-console
  console.warn(
    'Supabase 환경변수가 설정되지 않았어요. .env 파일에 VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY를 채워주세요. ' +
    '(.env.example 참고) — 설정 전까지는 로그인/데이터 저장이 동작하지 않아요.'
  );
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key'
);
