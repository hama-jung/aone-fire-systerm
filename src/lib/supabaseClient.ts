import { createClient } from '@supabase/supabase-js';

// 환경 변수 가져오기
const env = (import.meta as any).env || {};
const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY;

// 경고 메시지 출력 (개발 및 배포 디버깅용)
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('⚠️ Supabase 환경 변수가 설정되지 않았습니다.');
  console.warn('Vercel 배포 시 Settings > Environment Variables에 VITE_SUPABASE_URL 및 VITE_SUPABASE_ANON_KEY를 등록해야 합니다.');
}

// createClient는 URL이 필수이므로, 누락 시 앱이 크래시되지 않도록 더미 값을 할당합니다.
// 이렇게 하면 "Uncaught Error: supabaseUrl is required" 에러를 방지하고 화면을 띄울 수 있습니다.
// 실제 로그인은 Vercel에서 환경변수를 설정해야 작동합니다.
const safeUrl = SUPABASE_URL || 'https://placeholder.supabase.co';
const safeKey = SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(safeUrl, safeKey);