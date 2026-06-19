import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (__DEV__) {
  const urlOk = typeof supabaseUrl === 'string' && supabaseUrl.startsWith('https://') && supabaseUrl.includes('.supabase.co');
  // 신규 형식: sb_publishable_... / 레거시 형식: eyJ... (JWT) 둘 다 허용
  const keyOk = typeof supabaseAnonKey === 'string' && supabaseAnonKey.length > 20;

  console.log('[CafeOps] Supabase 환경 변수 검증');
  console.log('  URL    :', supabaseUrl ?? '(없음)', urlOk ? '✓' : '✗ 형식 오류');
  console.log('  AnonKey:', supabaseAnonKey ? `${supabaseAnonKey.slice(0, 12)}...` : '(없음)', keyOk ? '✓' : '✗ 누락 또는 너무 짧음');

  if (!urlOk || !keyOk) {
    console.error('[CafeOps] .env 파일의 EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY를 확인하세요.');
  }
}

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase 환경 변수가 설정되지 않았습니다. .env 파일을 확인하세요.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
