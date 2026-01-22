
-- [중요] 이 스크립트를 Supabase SQL Editor에서 실행하세요.
-- 배포된 사이트에서 데이터가 보이지 않는 경우(빈 배열 반환)를 해결하기 위해 모든 테이블의 읽기/쓰기 권한을 허용합니다.

BEGIN;

-- 1. 테이블 리스트
-- users, roles, menus, common_codes, markets, distributors, stores
-- receivers, repeaters, detectors, transmitters, alarms
-- work_logs, fire_history, device_status, data_reception, detector_stores

-- 2. 각 테이블별 RLS 활성화 및 정책 생성 (존재하는 정책 삭제 후 재생성)

-- Helper Macro is not available in standard SQL here, so we repeat blocks.

-- [Menus]
ALTER TABLE public.menus ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Select Menus" ON public.menus;
DROP POLICY IF EXISTS "Public Insert Menus" ON public.menus;
DROP POLICY IF EXISTS "Public Update Menus" ON public.menus;
DROP POLICY IF EXISTS "Public Delete Menus" ON public.menus;
CREATE POLICY "Public Select Menus" ON public.menus FOR SELECT USING (true);
CREATE POLICY "Public Insert Menus" ON public.menus FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Menus" ON public.menus FOR UPDATE USING (true);
CREATE POLICY "Public Delete Menus" ON public.menus FOR DELETE USING (true);

-- [Users]
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Select Users" ON public.users;
DROP POLICY IF EXISTS "Public Insert Users" ON public.users;
DROP POLICY IF EXISTS "Public Update Users" ON public.users;
DROP POLICY IF EXISTS "Public Delete Users" ON public.users;
CREATE POLICY "Public Select Users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Public Insert Users" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Users" ON public.users FOR UPDATE USING (true);
CREATE POLICY "Public Delete Users" ON public.users FOR DELETE USING (true);

-- [Roles]
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Select Roles" ON public.roles;
DROP POLICY IF EXISTS "Public Insert Roles" ON public.roles;
DROP POLICY IF EXISTS "Public Update Roles" ON public.roles;
DROP POLICY IF EXISTS "Public Delete Roles" ON public.roles;
CREATE POLICY "Public Select Roles" ON public.roles FOR SELECT USING (true);
CREATE POLICY "Public Insert Roles" ON public.roles FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Roles" ON public.roles FOR UPDATE USING (true);
CREATE POLICY "Public Delete Roles" ON public.roles FOR DELETE USING (true);

-- [Common Codes]
ALTER TABLE public.common_codes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Select CommonCodes" ON public.common_codes;
DROP POLICY IF EXISTS "Public Insert CommonCodes" ON public.common_codes;
DROP POLICY IF EXISTS "Public Update CommonCodes" ON public.common_codes;
DROP POLICY IF EXISTS "Public Delete CommonCodes" ON public.common_codes;
CREATE POLICY "Public Select CommonCodes" ON public.common_codes FOR SELECT USING (true);
CREATE POLICY "Public Insert CommonCodes" ON public.common_codes FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update CommonCodes" ON public.common_codes FOR UPDATE USING (true);
CREATE POLICY "Public Delete CommonCodes" ON public.common_codes FOR DELETE USING (true);

-- [Distributors]
ALTER TABLE public.distributors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Select Distributors" ON public.distributors;
DROP POLICY IF EXISTS "Public Insert Distributors" ON public.distributors;
DROP POLICY IF EXISTS "Public Update Distributors" ON public.distributors;
DROP POLICY IF EXISTS "Public Delete Distributors" ON public.distributors;
CREATE POLICY "Public Select Distributors" ON public.distributors FOR SELECT USING (true);
CREATE POLICY "Public Insert Distributors" ON public.distributors FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Distributors" ON public.distributors FOR UPDATE USING (true);
CREATE POLICY "Public Delete Distributors" ON public.distributors FOR DELETE USING (true);

-- [Markets]
ALTER TABLE public.markets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Select Markets" ON public.markets;
DROP POLICY IF EXISTS "Public Insert Markets" ON public.markets;
DROP POLICY IF EXISTS "Public Update Markets" ON public.markets;
DROP POLICY IF EXISTS "Public Delete Markets" ON public.markets;
CREATE POLICY "Public Select Markets" ON public.markets FOR SELECT USING (true);
CREATE POLICY "Public Insert Markets" ON public.markets FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Markets" ON public.markets FOR UPDATE USING (true);
CREATE POLICY "Public Delete Markets" ON public.markets FOR DELETE USING (true);

-- [Stores]
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Select Stores" ON public.stores;
DROP POLICY IF EXISTS "Public Insert Stores" ON public.stores;
DROP POLICY IF EXISTS "Public Update Stores" ON public.stores;
DROP POLICY IF EXISTS "Public Delete Stores" ON public.stores;
CREATE POLICY "Public Select Stores" ON public.stores FOR SELECT USING (true);
CREATE POLICY "Public Insert Stores" ON public.stores FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Stores" ON public.stores FOR UPDATE USING (true);
CREATE POLICY "Public Delete Stores" ON public.stores FOR DELETE USING (true);

-- [Work Logs]
ALTER TABLE public.work_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Select WorkLogs" ON public.work_logs;
DROP POLICY IF EXISTS "Public Insert WorkLogs" ON public.work_logs;
DROP POLICY IF EXISTS "Public Update WorkLogs" ON public.work_logs;
DROP POLICY IF EXISTS "Public Delete WorkLogs" ON public.work_logs;
CREATE POLICY "Public Select WorkLogs" ON public.work_logs FOR SELECT USING (true);
CREATE POLICY "Public Insert WorkLogs" ON public.work_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update WorkLogs" ON public.work_logs FOR UPDATE USING (true);
CREATE POLICY "Public Delete WorkLogs" ON public.work_logs FOR DELETE USING (true);

-- [Receivers]
ALTER TABLE public.receivers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Select Receivers" ON public.receivers;
DROP POLICY IF EXISTS "Public Insert Receivers" ON public.receivers;
DROP POLICY IF EXISTS "Public Update Receivers" ON public.receivers;
DROP POLICY IF EXISTS "Public Delete Receivers" ON public.receivers;
CREATE POLICY "Public Select Receivers" ON public.receivers FOR SELECT USING (true);
CREATE POLICY "Public Insert Receivers" ON public.receivers FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Receivers" ON public.receivers FOR UPDATE USING (true);
CREATE POLICY "Public Delete Receivers" ON public.receivers FOR DELETE USING (true);

-- [Repeaters]
ALTER TABLE public.repeaters ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Select Repeaters" ON public.repeaters;
DROP POLICY IF EXISTS "Public Insert Repeaters" ON public.repeaters;
DROP POLICY IF EXISTS "Public Update Repeaters" ON public.repeaters;
DROP POLICY IF EXISTS "Public Delete Repeaters" ON public.repeaters;
CREATE POLICY "Public Select Repeaters" ON public.repeaters FOR SELECT USING (true);
CREATE POLICY "Public Insert Repeaters" ON public.repeaters FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Repeaters" ON public.repeaters FOR UPDATE USING (true);
CREATE POLICY "Public Delete Repeaters" ON public.repeaters FOR DELETE USING (true);

-- [Detectors]
ALTER TABLE public.detectors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Select Detectors" ON public.detectors;
DROP POLICY IF EXISTS "Public Insert Detectors" ON public.detectors;
DROP POLICY IF EXISTS "Public Update Detectors" ON public.detectors;
DROP POLICY IF EXISTS "Public Delete Detectors" ON public.detectors;
CREATE POLICY "Public Select Detectors" ON public.detectors FOR SELECT USING (true);
CREATE POLICY "Public Insert Detectors" ON public.detectors FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Detectors" ON public.detectors FOR UPDATE USING (true);
CREATE POLICY "Public Delete Detectors" ON public.detectors FOR DELETE USING (true);

-- [Detector Stores Junction]
ALTER TABLE public.detector_stores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Select DetectorStores" ON public.detector_stores;
DROP POLICY IF EXISTS "Public Insert DetectorStores" ON public.detector_stores;
DROP POLICY IF EXISTS "Public Update DetectorStores" ON public.detector_stores;
DROP POLICY IF EXISTS "Public Delete DetectorStores" ON public.detector_stores;
CREATE POLICY "Public Select DetectorStores" ON public.detector_stores FOR SELECT USING (true);
CREATE POLICY "Public Insert DetectorStores" ON public.detector_stores FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update DetectorStores" ON public.detector_stores FOR UPDATE USING (true);
CREATE POLICY "Public Delete DetectorStores" ON public.detector_stores FOR DELETE USING (true);

-- [Transmitters]
ALTER TABLE public.transmitters ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Select Transmitters" ON public.transmitters;
DROP POLICY IF EXISTS "Public Insert Transmitters" ON public.transmitters;
DROP POLICY IF EXISTS "Public Update Transmitters" ON public.transmitters;
DROP POLICY IF EXISTS "Public Delete Transmitters" ON public.transmitters;
CREATE POLICY "Public Select Transmitters" ON public.transmitters FOR SELECT USING (true);
CREATE POLICY "Public Insert Transmitters" ON public.transmitters FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Transmitters" ON public.transmitters FOR UPDATE USING (true);
CREATE POLICY "Public Delete Transmitters" ON public.transmitters FOR DELETE USING (true);

-- [Alarms]
ALTER TABLE public.alarms ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Select Alarms" ON public.alarms;
DROP POLICY IF EXISTS "Public Insert Alarms" ON public.alarms;
DROP POLICY IF EXISTS "Public Update Alarms" ON public.alarms;
DROP POLICY IF EXISTS "Public Delete Alarms" ON public.alarms;
CREATE POLICY "Public Select Alarms" ON public.alarms FOR SELECT USING (true);
CREATE POLICY "Public Insert Alarms" ON public.alarms FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Alarms" ON public.alarms FOR UPDATE USING (true);
CREATE POLICY "Public Delete Alarms" ON public.alarms FOR DELETE USING (true);

-- [Fire History]
ALTER TABLE public.fire_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Select FireHistory" ON public.fire_history;
DROP POLICY IF EXISTS "Public Insert FireHistory" ON public.fire_history;
DROP POLICY IF EXISTS "Public Update FireHistory" ON public.fire_history;
DROP POLICY IF EXISTS "Public Delete FireHistory" ON public.fire_history;
CREATE POLICY "Public Select FireHistory" ON public.fire_history FOR SELECT USING (true);
CREATE POLICY "Public Insert FireHistory" ON public.fire_history FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update FireHistory" ON public.fire_history FOR UPDATE USING (true);
CREATE POLICY "Public Delete FireHistory" ON public.fire_history FOR DELETE USING (true);

-- [Device Status]
ALTER TABLE public.device_status ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Select DeviceStatus" ON public.device_status;
DROP POLICY IF EXISTS "Public Insert DeviceStatus" ON public.device_status;
DROP POLICY IF EXISTS "Public Update DeviceStatus" ON public.device_status;
DROP POLICY IF EXISTS "Public Delete DeviceStatus" ON public.device_status;
CREATE POLICY "Public Select DeviceStatus" ON public.device_status FOR SELECT USING (true);
CREATE POLICY "Public Insert DeviceStatus" ON public.device_status FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update DeviceStatus" ON public.device_status FOR UPDATE USING (true);
CREATE POLICY "Public Delete DeviceStatus" ON public.device_status FOR DELETE USING (true);

-- [Data Reception]
ALTER TABLE public.data_reception ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Select DataReception" ON public.data_reception;
DROP POLICY IF EXISTS "Public Insert DataReception" ON public.data_reception;
DROP POLICY IF EXISTS "Public Update DataReception" ON public.data_reception;
DROP POLICY IF EXISTS "Public Delete DataReception" ON public.data_reception;
CREATE POLICY "Public Select DataReception" ON public.data_reception FOR SELECT USING (true);
CREATE POLICY "Public Insert DataReception" ON public.data_reception FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update DataReception" ON public.data_reception FOR UPDATE USING (true);
CREATE POLICY "Public Delete DataReception" ON public.data_reception FOR DELETE USING (true);

COMMIT;
