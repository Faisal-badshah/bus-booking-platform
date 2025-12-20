import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authHeader = req.headers.get("Authorization")!;

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify user is authenticated and is staff
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user has staff role in user_roles table
    const { data: staffRole, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "staff")
      .maybeSingle();

    if (roleError || !staffRole) {
      console.error("Role check error:", roleError);
      return new Response(
        JSON.stringify({ error: "Staff access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { trip_id, latitude, longitude, speed, heading } = await req.json();

    if (!trip_id || latitude === undefined || longitude === undefined) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: trip_id, latitude, longitude" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use service role client for checking assignment and upserting location
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Verify staff is assigned to this trip today
    const today = new Date().toISOString().split("T")[0];
    const { data: assignment, error: assignmentError } = await adminClient
      .from("staff_trip_assignments")
      .select("id")
      .eq("staff_id", user.id)
      .eq("trip_id", trip_id)
      .eq("assignment_date", today)
      .maybeSingle();

    if (assignmentError) {
      console.error("Assignment check error:", assignmentError);
      return new Response(
        JSON.stringify({ error: "Failed to verify trip assignment" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!assignment) {
      console.error(`Staff ${user.id} not assigned to trip ${trip_id} on ${today}`);
      return new Response(
        JSON.stringify({ error: "You are not assigned to this trip" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check tracking permission using client_limits table
    const { data: clientLimits, error: limitsError } = await adminClient
      .from("client_limits")
      .select("tracking_enabled, tracking_trial_ends_at, plan_name")
      .limit(1)
      .maybeSingle();

    if (limitsError) {
      console.error("Client limits check error:", limitsError);
      return new Response(
        JSON.stringify({ error: "Failed to check tracking permissions" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Determine if tracking is allowed
    const now = new Date();
    let trackingAllowed = false;
    let blockReason = "Tracking not enabled";

    if (clientLimits) {
      // Check if tracking is explicitly enabled
      if (clientLimits.tracking_enabled) {
        trackingAllowed = true;
      }
      // Check if trial is still active
      else if (clientLimits.tracking_trial_ends_at) {
        const trialEnds = new Date(clientLimits.tracking_trial_ends_at);
        if (now <= trialEnds) {
          trackingAllowed = true;
        } else {
          blockReason = "Tracking trial has expired";
        }
      }
    } else {
      // No client_limits row exists - create one with trial
      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + 60);
      
      await adminClient.from("client_limits").insert({
        client_id: user.id,
        tracking_enabled: false,
        tracking_trial_ends_at: trialEnd.toISOString(),
        plan_name: 'free',
      });
      
      // Trial just started, allow tracking
      trackingAllowed = true;
    }

    if (!trackingAllowed) {
      console.log(`Tracking blocked for trip ${trip_id}: ${blockReason}`);
      return new Response(
        JSON.stringify({ error: blockReason, code: "TRACKING_NOT_ALLOWED" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Saving location for trip ${trip_id}: lat=${latitude}, lng=${longitude}`);

    // Upsert location (only keep latest per trip)
    const { data, error: upsertError } = await adminClient
      .from("live_locations")
      .upsert(
        {
          trip_id,
          staff_id: user.id,
          latitude,
          longitude,
          speed: speed || 0,
          heading: heading || 0,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "trip_id" }
      )
      .select()
      .single();

    if (upsertError) {
      console.error("Upsert error:", upsertError);
      return new Response(
        JSON.stringify({ error: "Failed to save location", details: upsertError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Location saved successfully:", data);

    return new Response(
      JSON.stringify({ success: true, location: data }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Unexpected error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: "Internal server error", details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
