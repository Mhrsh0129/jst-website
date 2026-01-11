import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify the requesting user is an admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Create client with user's auth to verify they're admin
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    
    if (authError || !user) {
      console.error("Auth error:", authError?.message);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user is admin
    const { data: roleData, error: roleError } = await userClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (roleError || roleData?.role !== "admin") {
      console.error("User is not admin:", user.id);
      return new Response(
        JSON.stringify({ error: "Forbidden - Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse and validate input
    const body = await req.json();
    const { 
      full_name, 
      business_name, 
      phone, 
      email, 
      address, 
      gst_number, 
      credit_limit,
      password 
    } = body;

    // Validate required fields
    if (!full_name || typeof full_name !== "string" || full_name.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Customer name is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return new Response(
        JSON.stringify({ error: "Valid email is required for customer login" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate field lengths
    if (full_name.length > 100) {
      return new Response(
        JSON.stringify({ error: "Name must be under 100 characters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (business_name && business_name.length > 200) {
      return new Response(
        JSON.stringify({ error: "Business name must be under 200 characters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create admin client to create auth user
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Generate a secure password if not provided
    const customerPassword = password || `JST-${Math.random().toString(36).slice(-8)}${Date.now().toString(36)}`;

    console.log(`Creating customer auth user for: ${email}`);

    // Create the auth user
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email: email.trim(),
      password: customerPassword,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: full_name.trim(),
        business_name: business_name?.trim() || null,
        phone: phone?.trim() || null,
      },
    });

    if (createError) {
      console.error("Error creating auth user:", createError);
      return new Response(
        JSON.stringify({ error: createError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Auth user created: ${newUser.user.id}`);

    // Update the profile with additional details (profile is created by trigger)
    const { error: profileError } = await adminClient
      .from("profiles")
      .update({
        business_name: business_name?.trim() || null,
        phone: phone?.trim() || null,
        address: address?.trim() || null,
        gst_number: gst_number?.trim() || null,
        credit_limit: credit_limit ? parseFloat(credit_limit) : 50000,
      })
      .eq("user_id", newUser.user.id);

    if (profileError) {
      console.error("Error updating profile:", profileError);
      // Don't fail completely - the user was created
    }

    // Fetch the complete profile
    const { data: profile, error: fetchError } = await adminClient
      .from("profiles")
      .select("*")
      .eq("user_id", newUser.user.id)
      .single();

    if (fetchError) {
      console.error("Error fetching profile:", fetchError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        profile: profile,
        message: `Customer created successfully. Login: ${email}`,
        // Only return password if it was auto-generated (for admin to share with customer)
        ...(password ? {} : { generatedPassword: customerPassword })
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Create customer error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
