-- Drop old status check constraint
ALTER TABLE bookings
DROP CONSTRAINT IF EXISTS bookings_status_check;

-- Add updated status check constraint with all valid statuses
ALTER TABLE bookings ADD CONSTRAINT bookings_status_check CHECK (
  status IN (
    'pending_payment',
    'confirmed',
    'cancelled',
    'cancellation_requested',
    'expired'
  )
);