-- Add recurring trip support columns to trips table
ALTER TABLE trips
ADD COLUMN recurrence_type text NOT NULL DEFAULT 'fixed',
ADD COLUMN recurrence_days integer[],
ADD COLUMN start_date date NOT NULL DEFAULT CURRENT_DATE,
ADD COLUMN end_date date NOT NULL DEFAULT CURRENT_DATE,
ADD COLUMN max_booking_days_ahead integer NOT NULL DEFAULT 7;

-- Add constraint for recurrence_type enum
ALTER TABLE trips
ADD CONSTRAINT trips_recurrence_type_check 
CHECK (recurrence_type IN ('fixed', 'daily', 'weekly', 'custom'));

-- Add constraint: end_date must be >= start_date
ALTER TABLE trips
ADD CONSTRAINT trips_date_range_check 
CHECK (end_date >= start_date);

-- Add constraint: recurrence_days must be between 0-6
ALTER TABLE trips
ADD CONSTRAINT trips_recurrence_days_check 
CHECK (
  recurrence_days IS NULL OR 
  (
    array_length(recurrence_days, 1) > 0 AND
    recurrence_days <@ ARRAY[0,1,2,3,4,5,6]
  )
);

-- Migrate existing trips to use new structure
-- Set start_date and end_date to trip_date for all existing trips
UPDATE trips
SET 
  start_date = trip_date,
  end_date = trip_date,
  recurrence_type = 'fixed';

-- Add index for efficient recurring trip queries
CREATE INDEX idx_trips_recurrence ON trips(recurrence_type, start_date, end_date, status);
CREATE INDEX idx_trips_route_status ON trips(route_id, status);