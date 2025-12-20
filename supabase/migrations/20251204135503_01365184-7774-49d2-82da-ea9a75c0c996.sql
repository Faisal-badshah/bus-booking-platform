
-- Analytics RPC functions for dashboard

-- 1. Trip stats function
CREATE OR REPLACE FUNCTION public.get_analytics_trip_stats(
  p_start_date timestamp with time zone,
  p_end_date timestamp with time zone
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_trips', (
      SELECT COUNT(DISTINCT t.id) 
      FROM trips t
      WHERE t.created_at >= p_start_date AND t.created_at < p_end_date
    ),
    'active_trips', (
      SELECT COUNT(*) 
      FROM live_locations ll
      WHERE ll.updated_at >= NOW() - INTERVAL '30 seconds'
    ),
    'trips_by_date', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object('date', d, 'count', c)
      ), '[]'::jsonb)
      FROM (
        SELECT DATE(b.booking_date) as d, COUNT(DISTINCT b.trip_id) as c
        FROM bookings b
        WHERE b.booking_date >= p_start_date AND b.booking_date < p_end_date
        AND b.status IN ('confirmed', 'cancellation_requested')
        GROUP BY DATE(b.booking_date)
        ORDER BY d
      ) sub
    )
  ) INTO v_result;
  
  RETURN v_result;
END;
$$;

-- 2. Passenger stats function
CREATE OR REPLACE FUNCTION public.get_analytics_passenger_stats(
  p_start_date timestamp with time zone,
  p_end_date timestamp with time zone
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_passengers', (
      SELECT COUNT(*) 
      FROM bookings b
      WHERE b.booking_date >= p_start_date AND b.booking_date < p_end_date
      AND b.status IN ('confirmed', 'cancellation_requested')
    ),
    'load_factor', (
      SELECT COALESCE(
        ROUND(AVG(
          CASE WHEN bus.seat_count > 0 
          THEN (booked.cnt::numeric / bus.seat_count::numeric) * 100 
          ELSE 0 END
        ), 1),
        0
      )
      FROM (
        SELECT b.trip_id, COUNT(*) as cnt
        FROM bookings b
        WHERE b.booking_date >= p_start_date AND b.booking_date < p_end_date
        AND b.status IN ('confirmed', 'cancellation_requested')
        GROUP BY b.trip_id
      ) booked
      JOIN trips t ON t.id = booked.trip_id
      JOIN buses bus ON bus.id = t.bus_id
    ),
    'bookings_by_date', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object('date', d, 'count', c)
      ), '[]'::jsonb)
      FROM (
        SELECT DATE(b.created_at) as d, COUNT(*) as c
        FROM bookings b
        WHERE b.created_at >= p_start_date AND b.created_at < p_end_date
        AND b.status IN ('confirmed', 'cancellation_requested')
        GROUP BY DATE(b.created_at)
        ORDER BY d
      ) sub
    )
  ) INTO v_result;
  
  RETURN v_result;
END;
$$;

-- 3. Route stats function
CREATE OR REPLACE FUNCTION public.get_analytics_route_stats(
  p_start_date timestamp with time zone,
  p_end_date timestamp with time zone
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'route_popularity', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object('route', r.name, 'bookings', cnt)
      ), '[]'::jsonb)
      FROM (
        SELECT t.route_id, COUNT(*) as cnt
        FROM bookings b
        JOIN trips t ON t.id = b.trip_id
        WHERE b.booking_date >= p_start_date AND b.booking_date < p_end_date
        AND b.status IN ('confirmed', 'cancellation_requested')
        GROUP BY t.route_id
        ORDER BY cnt DESC
        LIMIT 10
      ) sub
      JOIN routes r ON r.id = sub.route_id
    )
  ) INTO v_result;
  
  RETURN v_result;
END;
$$;

-- 4. Revenue stats function
CREATE OR REPLACE FUNCTION public.get_analytics_revenue_stats(
  p_start_date timestamp with time zone,
  p_end_date timestamp with time zone
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_revenue', (
      SELECT COALESCE(SUM(b.total_amount), 0)
      FROM bookings b
      WHERE b.confirmed_at >= p_start_date AND b.confirmed_at < p_end_date
      AND b.status IN ('confirmed', 'cancellation_requested')
      AND b.payment_reference IS NOT NULL
    ),
    'online_bookings', (
      SELECT COUNT(*)
      FROM bookings b
      WHERE b.created_at >= p_start_date AND b.created_at < p_end_date
      AND b.status IN ('confirmed', 'cancellation_requested')
      AND b.payment_reference IS NOT NULL
    ),
    'offline_bookings', (
      SELECT COUNT(*)
      FROM bookings b
      WHERE b.created_at >= p_start_date AND b.created_at < p_end_date
      AND b.status IN ('confirmed', 'cancellation_requested')
      AND b.payment_reference IS NULL
    ),
    'payment_distribution', (
      SELECT jsonb_build_object(
        'online', COALESCE((
          SELECT COUNT(*)
          FROM bookings b
          WHERE b.created_at >= p_start_date AND b.created_at < p_end_date
          AND b.status IN ('confirmed', 'cancellation_requested')
          AND b.payment_reference IS NOT NULL
        ), 0),
        'offline', COALESCE((
          SELECT COUNT(*)
          FROM bookings b
          WHERE b.created_at >= p_start_date AND b.created_at < p_end_date
          AND b.status IN ('confirmed', 'cancellation_requested')
          AND b.payment_reference IS NULL
        ), 0)
      )
    )
  ) INTO v_result;
  
  RETURN v_result;
END;
$$;

-- 5. Cancellation stats function
CREATE OR REPLACE FUNCTION public.get_analytics_cancellation_stats(
  p_start_date timestamp with time zone,
  p_end_date timestamp with time zone
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_cancellations', (
      SELECT COUNT(*)
      FROM cancellations c
      WHERE c.requested_at >= p_start_date AND c.requested_at < p_end_date
    ),
    'by_reason', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object('reason', COALESCE(reason, 'No reason'), 'count', cnt)
      ), '[]'::jsonb)
      FROM (
        SELECT c.reason, COUNT(*) as cnt
        FROM cancellations c
        WHERE c.requested_at >= p_start_date AND c.requested_at < p_end_date
        GROUP BY c.reason
        ORDER BY cnt DESC
      ) sub
    )
  ) INTO v_result;
  
  RETURN v_result;
END;
$$;

-- 6. Tracking stats function
CREATE OR REPLACE FUNCTION public.get_analytics_tracking_stats(
  p_start_date timestamp with time zone,
  p_end_date timestamp with time zone
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'active_tracking_count', (
      SELECT COUNT(*)
      FROM live_locations ll
      WHERE ll.updated_at >= NOW() - INTERVAL '30 seconds'
    ),
    'tracking_by_date', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object('date', d, 'updates', c)
      ), '[]'::jsonb)
      FROM (
        SELECT DATE(ll.updated_at) as d, COUNT(*) as c
        FROM live_locations ll
        WHERE ll.updated_at >= p_start_date AND ll.updated_at < p_end_date
        GROUP BY DATE(ll.updated_at)
        ORDER BY d
      ) sub
    )
  ) INTO v_result;
  
  RETURN v_result;
END;
$$;

-- 7. Fleet overview function for real-time map
CREATE OR REPLACE FUNCTION public.get_fleet_overview()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (
    SELECT COALESCE(jsonb_agg(
      jsonb_build_object(
        'trip_id', ll.trip_id,
        'latitude', ll.latitude,
        'longitude', ll.longitude,
        'speed', ll.speed,
        'heading', ll.heading,
        'updated_at', ll.updated_at,
        'staff_id', ll.staff_id,
        'route_name', r.name,
        'bus_name', bus.name,
        'departure_time', t.departure_time,
        'arrival_time', t.arrival_time,
        'from_city', t.from_city,
        'to_city', t.to_city,
        'passenger_count', (
          SELECT COUNT(*)
          FROM bookings b
          WHERE b.trip_id = ll.trip_id
          AND b.status IN ('confirmed', 'cancellation_requested')
          AND b.booking_date = CURRENT_DATE
        ),
        'boarded_count', (
          SELECT COUNT(DISTINCT bl.booking_id)
          FROM boarding_logs bl
          WHERE bl.trip_id = ll.trip_id
          AND DATE(bl.boarded_at) = CURRENT_DATE
        )
      )
    ), '[]'::jsonb)
    FROM live_locations ll
    JOIN trips t ON t.id = ll.trip_id
    JOIN routes r ON r.id = t.route_id
    JOIN buses bus ON bus.id = t.bus_id
    WHERE ll.updated_at >= NOW() - INTERVAL '5 minutes'
  );
END;
$$;
