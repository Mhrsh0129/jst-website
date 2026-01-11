import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "http://localhost:8080",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const adminUser = {
      email: "admin@jst.com",
      password: "admin@0129",
      full_name: "Administrator",
      business_name: "Jay Shree Traders",
      phone: "9999999999",
    };

    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: adminUser.email,
      password: adminUser.password,
      email_confirm: true,
      user_metadata: {
        full_name: adminUser.full_name,
        business_name: adminUser.business_name,
        phone: adminUser.phone,
      },
    });

    let userId: string | null = null;
    if (authError) {
      // If already registered, look up the user id via profiles/auth
      if (authError.message && authError.message.includes("User already registered")) {
        const { data: existingProfile } = await adminClient
          .from("profiles")
          .select("user_id")
          .eq("email", adminUser.email)
          .maybeSingle();
        userId = existingProfile?.user_id ?? null;
      } else {
        return new Response(
          JSON.stringify({ success: false, error: authError.message }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }
    } else {
      if (!authData.user) {
        return new Response(
          JSON.stringify({ success: false, error: "No user returned from createUser" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }
      userId = authData.user.id;
    }

    const { error: roleError } = await adminClient
      .from("user_roles")
      .update({ role: "admin" })
      .eq("user_id", userId);

    if (roleError) {
      // If role row doesn't exist yet, insert it
      const { error: insertRoleError } = await adminClient
        .from("user_roles")
        .insert({ user_id: userId, role: "admin" });
      if (insertRoleError) {
        return new Response(
          JSON.stringify({ success: false, error: insertRoleError.message }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Admin user created",
        email: adminUser.email,
        userId,
        role: "admin",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
