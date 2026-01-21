-- 기존 데이터 초기화 (필요시 주석 해제)
-- TRUNCATE TABLE public.common_codes RESTART IDENTITY;

-- [기존 시스템 코드]
INSERT INTO public.common_codes (code, name, description, "groupCode", "groupName", status) VALUES
-- SMS 예약 구분
('SRG01', '시장', '시장 - SMS RESERVED GUBUN 코드', 'SMS_RESERVED_GUBUN', 'SMS_RESERVED_GUBUN 코드', '사용'),
('SRG02', '화재감지기', '화재감지기-SMS_RESERVED_GUBUN 코드', 'SMS_RESERVED_GUBUN', 'SMS_RESERVED_GUBUN 코드', '사용'),

-- 감지기 상태값
('7C', '감지기 통신이상', '감지기 통신이상', 'DETECTORSTS', '감지기 상태값', '사용'),
('7B', '화재감지기 배터리 이상', '화재감지기 배터리 이상', 'DETECTORSTS', '감지기 상태값', '사용'),

-- 디바이스 구분
('DEV06', 'CCTV', 'CCTV 기기코드', 'DEVICE', '디바이스 구분', '사용'),
('DEV05', '경종', '경종 기기코드', 'DEVICE', '디바이스 구분', '사용'),
('DEV04', '발신기', '발신기 기기코드', 'DEVICE', '디바이스 구분', '사용'),
('DEV03', '수신기', '수신기 기기코드', 'DEVICE', '디바이스 구분', '사용'),
('DEV02', '중계기', '중계기 기기코드', 'DEVICE', '디바이스 구분', '사용'),
('DEV01', '감지기', '감지기 기기코드', 'DEVICE', '디바이스 구분', '사용'),

-- 통신 상태
('COMM01', '정상', '통신 정상', 'COMM_STATUS', '통신 상태', '사용'),
('COMM02', '이상', '통신 이상', 'COMM_STATUS', '통신 상태', '사용');

-- [신규 추가: 화재 수신/중계 코드 정의]
INSERT INTO public.common_codes (code, name, description, "groupCode", "groupName", status) VALUES
-- 수신기 상태 (10: 화재알람 등)
('10', '화재알람', '수신기 화재 발생 알람', 'RCV_STATUS', '수신기 상태', '사용'),
-- 중계기 상태 (46: 화재알람 등)
('46', '화재알람', '중계기 화재 발생 알람', 'RPT_STATUS', '중계기 상태', '사용'),
-- 공통/통신 메시지 (49: 화재해소, 35: 고장, 14: 단선)
('49', '화재해소', '화재 복구 및 해소', 'SYS_EVENT', '시스템 이벤트', '사용'),
('35', '고장', '기기 통신 불량 및 고장', 'SYS_EVENT', '시스템 이벤트', '사용'),
('14', '단선', '선로 단선', 'SYS_EVENT', '시스템 이벤트', '사용'),
('00', '정상', '정상 상태', 'SYS_EVENT', '시스템 이벤트', '사용'),
('01', '정상', '정상 상태', 'SYS_EVENT', '시스템 이벤트', '사용'),
('06', '작동', '기기 작동', 'SYS_EVENT', '시스템 이벤트', '사용');
