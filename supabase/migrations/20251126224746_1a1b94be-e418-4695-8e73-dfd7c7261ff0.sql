-- Add max_seats_per_booking setting to system_settings table
ALTER TABLE system_settings
ADD COLUMN IF NOT EXISTS max_seats_per_booking integer DEFAULT 6;

COMMENT ON COLUMN system_settings.max_seats_per_booking IS 'Maximum number of seats allowed per booking group';