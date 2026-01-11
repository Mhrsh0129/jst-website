import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Creating CA user...");

    // Create admin client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const caUser = {
      email: "ca@jst.com",
      password: "ca123456",
      full_name: "Credit Agent",
      business_name: "Jay Shree Traders",
      phone: "9999999999",
    };

    // Create auth user with metadata
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: caUser.email,
      password: caUser.password,
      email_confirm: true,
      user_metadata: {
        full_name: caUser.full_name,
        business_name: caUser.business_name,
        phone: caUser.phone
      }
    });

    if (authError) {
      console.error(`Error creating CA user:`, authError.message);
      return new Response(
        JSON.stringify({ success: false, error: authError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`Auth user created: ${authData.user?.id}`);

    if (authData.user) {
      // Update the user_roles table to set role as 'ca'
      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .update({ role: 'ca' })
        .eq('user_id', authData.user.id);

      if (roleError) {
        console.error(`Error updating role:`, roleError.message);
      } else {
        console.log(`Role updated to 'ca' for user ${authData.user.id}`);
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "CA user created successfully",
          email: caUser.email,
          userId: authData.user.id,
          role: "ca"
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: "User creation failed" }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("Error creating CA user:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
