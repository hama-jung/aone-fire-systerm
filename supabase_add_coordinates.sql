
-- 1. 수신기 (Receivers)
ALTER TABLE public.receivers 
ADD COLUMN IF NOT EXISTS "x_pos" double precision,
ADD COLUMN IF NOT EXISTS "y_pos" double precision;

-- 2. 중계기 (Repeaters)
ALTER TABLE public.repeaters 
ADD COLUMN IF NOT EXISTS "x_pos" double precision,
ADD COLUMN IF NOT EXISTS "y_pos" double precision;

-- 3. 감지기 (Detectors)
ALTER TABLE public.detectors 
ADD COLUMN IF NOT EXISTS "x_pos" double precision,
ADD COLUMN IF NOT EXISTS "y_pos" double precision;

-- 4. 발신기 (Transmitters)
ALTER TABLE public.transmitters 
ADD COLUMN IF NOT EXISTS "x_pos" double precision,
ADD COLUMN IF NOT EXISTS "y_pos" double precision;

-- 5. 경종 (Alarms)
ALTER TABLE public.alarms 
ADD COLUMN IF NOT EXISTS "x_pos" double precision,
ADD COLUMN IF NOT EXISTS "y_pos" double precision;
