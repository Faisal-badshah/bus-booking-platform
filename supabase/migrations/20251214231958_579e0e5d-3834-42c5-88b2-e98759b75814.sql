-- Add plan_name column to client_limits if not exists
ALTER TABLE public.client_limits 
ADD COLUMN IF NOT EXISTS plan_name TEXT DEFAULT 'free';

-- Rename gps_trial_end to tracking_trial_ends_at for clarity (it's a date, convert to timestamp)
-- First add new column, then migrate data
ALTER TABLE public.client_limits 
ADD COLUMN IF NOT EXISTS tracking_trial_ends_at TIMESTAMP WITH TIME ZONE;

-- Migrate existing data
UPDATE public.client_limits 
SET tracking_trial_ends_at = gps_trial_end::timestamp with time zone 
WHERE tracking_trial_ends_at IS NULL AND gps_trial_end IS NOT NULL;

-- Set default for new rows
ALTER TABLE public.client_limits 
ALTER COLUMN tracking_trial_ends_at SET DEFAULT (now() + interval '60 days');

-- Rename gps_enabled to tracking_enabled for consistency
-- We'll keep gps_enabled for now and add tracking_enabled as an alias/new column
ALTER TABLE public.client_limits 
ADD COLUMN IF NOT EXISTS tracking_enabled BOOLEAN DEFAULT false;

-- Sync existing gps_enabled values to tracking_enabled
UPDATE public.client_limits 
SET tracking_enabled = gps_enabled 
WHERE tracking_enabled IS NULL OR tracking_enabled = false;