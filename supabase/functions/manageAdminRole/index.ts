import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Verify the request is from a super_admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is super_admin
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'super_admin')
      .maybeSingle();

    if (roleError || !roleData) {
      return new Response(
        JSON.stringify({ error: 'Only super admins can manage admin roles' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, email, password, fullName, clientId, userId } = await req.json();
    console.log('manageAdminRole called with action:', action);

    if (action === 'assign') {
      // Check if user exists by email
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
      let targetUser = existingUsers?.users?.find(u => u.email === email);

      if (!targetUser) {
        // Create new user if doesn't exist
        if (!password) {
          return new Response(
            JSON.stringify({ error: 'Password required for new users' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { full_name: fullName || email },
        });

        if (authError) {
          console.error('Error creating user:', authError);
          return new Response(
            JSON.stringify({ error: authError.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        targetUser = authData.user;

        // Update profile
        if (targetUser) {
          await supabaseAdmin
            .from('profiles')
            .upsert({
              id: targetUser.id,
              full_name: fullName || email,
            });
        }
      }

      if (!targetUser) {
        return new Response(
          JSON.stringify({ error: 'Failed to find or create user' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if already admin
      const { data: existingRole } = await supabaseAdmin
        .from('user_roles')
        .select('id')
        .eq('user_id', targetUser.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (existingRole) {
        return new Response(
          JSON.stringify({ error: 'User is already an admin' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Assign admin role
      const { error: roleInsertError } = await supabaseAdmin
        .from('user_roles')
        .insert({
          user_id: targetUser.id,
          role: 'admin',
        });

      if (roleInsertError) {
        console.error('Error assigning admin role:', roleInsertError);
        return new Response(
          JSON.stringify({ error: roleInsertError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Ensure client_limits exists for this admin
      const { data: existingLimits } = await supabaseAdmin
        .from('client_limits')
        .select('client_id')
        .eq('client_id', targetUser.id)
        .maybeSingle();

      if (!existingLimits) {
        await supabaseAdmin
          .from('client_limits')
          .insert({
            client_id: targetUser.id,
            max_buses: 2,
            max_seats_per_bus: 50,
            tracking_enabled: false,
            plan_name: 'free',
          });
      }

      // Log action
      await supabaseAdmin.from('superadmin_logs').insert({
        super_admin_id: user.id,
        client_id: targetUser.id,
        action: 'assign_admin',
        old_value: null,
        new_value: { email, role: 'admin' },
      });

      return new Response(
        JSON.stringify({ success: true, userId: targetUser.id }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (action === 'revoke') {
      if (!userId) {
        return new Response(
          JSON.stringify({ error: 'userId required for revoke action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check how many admins exist for this client
      const { data: adminCount } = await supabaseAdmin
        .from('user_roles')
        .select('id', { count: 'exact' })
        .eq('role', 'admin');

      // Get user email for logging
      const { data: userData } = await supabaseAdmin.auth.admin.getUserById(userId);

      // Delete admin role
      const { error: deleteError } = await supabaseAdmin
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', 'admin');

      if (deleteError) {
        console.error('Error revoking admin role:', deleteError);
        return new Response(
          JSON.stringify({ error: deleteError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Log action
      await supabaseAdmin.from('superadmin_logs').insert({
        super_admin_id: user.id,
        client_id: userId,
        action: 'revoke_admin',
        old_value: { email: userData?.user?.email, role: 'admin' },
        new_value: null,
      });

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (action === 'list') {
      // List all admins
      const { data: adminRoles, error: rolesError } = await supabaseAdmin
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');

      if (rolesError) {
        return new Response(
          JSON.stringify({ error: rolesError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const adminIds = adminRoles?.map(r => r.user_id) || [];
      const admins = [];

      for (const adminId of adminIds) {
        const { data: userData } = await supabaseAdmin.auth.admin.getUserById(adminId);
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('full_name')
          .eq('id', adminId)
          .maybeSingle();

        if (userData?.user) {
          admins.push({
            id: adminId,
            email: userData.user.email,
            full_name: profile?.full_name || userData.user.user_metadata?.full_name,
          });
        }
      }

      return new Response(
        JSON.stringify({ admins }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in manageAdminRole:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
