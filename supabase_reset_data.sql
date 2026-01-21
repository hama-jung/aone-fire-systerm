-- [데이터 일괄 초기화 스크립트]
-- 주의: 이 스크립트를 실행하면 등록된 "업무 데이터"가 모두 삭제됩니다.
-- 메뉴(menus), 역할(roles) 등 시스템 설정 데이터는 유지하거나 필요 시 주석을 해제하여 초기화하세요.

BEGIN;

-- 1. 업무 데이터 테이블 비우기 (의존성 순서 무관하게 CASCADE로 처리)
-- RESTART IDENTITY: ID 값을 1부터 다시 시작
-- CASCADE: 이 테이블을 참조하는 하위 테이블 데이터도 함께 삭제
TRUNCATE TABLE
  public.work_logs,
  public.detector_stores,
  public.detectors,
  public.transmitters,
  public.alarms,
  public.repeaters,
  public.receivers,
  public.stores,
  public.markets,
  public.distributors,
  public.users, -- 사용자도 초기화 (아래에서 관리자 다시 생성)
  public.fire_events -- 대시보드 로그 초기화
RESTART IDENTITY CASCADE;

-- (선택사항) 시스템 설정도 초기화하려면 아래 주석 해제
-- TRUNCATE TABLE public.roles, public.menus RESTART IDENTITY CASCADE;


-- 2. 기본 관리자 계정 복구
-- 데이터를 다 지웠으므로 로그인 가능한 관리자 계정 하나는 다시 만들어줍니다.
INSERT INTO public.users (
  "userId", 
  password, 
  name, 
  role, 
  department, 
  status, 
  "smsReceive"
) VALUES (
  'admin',        -- 아이디
  '12341234!',    -- 비밀번호
  '시스템관리자',   -- 이름
  '시스템관리자',   -- 역할
  '본사',          -- 소속
  '사용',          -- 상태
  '수신'           -- SMS 수신여부
);

COMMIT;

-- [실행 결과 확인]
-- Data deleted successfully. Admin user reset.
