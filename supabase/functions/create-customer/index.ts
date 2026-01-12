// Deno Edge Function - HTTP imports and Deno global are valid in Deno runtime
// VS Code may show errors but the code works correctly when deployed
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

// Input validation helpers
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

function validatePhone(phone: string): boolean {
  const phoneRegex = /^[\d\s+\-()]+$/;
  return phoneRegex.test(phone) && phone.length >= 10 && phone.length <= 20;
}

function sanitizeInput(input: string): string {
  return input.trim().slice(0, 500); // Limit length and trim whitespace
}

// CORS headers - restricted to all origins for broad access (Vercel/mobile)
const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Max-Age": "86400",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log("Received request body:", body);

    let { full_name, business_name, phone, email, address, gst_number, credit_limit } = body;

    // Input validation
    if (!full_name || typeof full_name !== "string") {
      console.error("Validation failed: full_name invalid");
      return new Response(JSON.stringify({ error: "Full name is required and must be a string" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Sanitize and validate inputs
    full_name = sanitizeInput(full_name);
    if (full_name.length < 2 || full_name.length > 100) {
      return new Response(JSON.stringify({ error: "Full name must be 2-100 characters" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (phone && (typeof phone !== "string" || !validatePhone(phone))) {
      return new Response(JSON.stringify({ error: "Invalid phone format" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (email && (typeof email !== "string" || !validateEmail(email))) {
      return new Response(JSON.stringify({ error: "Invalid email format" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Sanitize optional fields
    business_name = business_name ? sanitizeInput(String(business_name)) : null;
    phone = phone ? sanitizeInput(String(phone)) : null;
    email = email ? sanitizeInput(String(email)) : null;
    address = address ? sanitizeInput(String(address)) : null;
    gst_number = gst_number ? sanitizeInput(String(gst_number)) : null;

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    console.log("Creating admin client...");
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Auto-generate email and password from phone number
    // If phone exists: email = phone@jst.com, password = phone
    // If no phone: use provided email and generate password
    let loginEmail: string;
    let loginPassword: string;
    let generatedPassword = false;

    if (phone && phone.length >= 10) {
      // Use phone-based credentials
      loginEmail = `${phone}@jst.com`;
      loginPassword = phone;
      generatedPassword = true;
    } else if (email) {
      // Use email with random password
      loginEmail = email;
      loginPassword = `JST${Math.random().toString(36).slice(-8)}`;
      generatedPassword = true;
    } else {
      return new Response(JSON.stringify({ error: "Either phone or email is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Creating user with email:", loginEmail);
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email: loginEmail,
      password: loginPassword,
      email_confirm: true,
      user_metadata: {
        full_name: full_name.trim(),
        business_name: business_name || "",
        phone: phone || "",
      },
    });

    if (createError) {
      console.error("Auth create error:", createError);
      return new Response(JSON.stringify({ error: `Auth error: ${createError.message}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("User created, updating profile...");
    const profileUpdate: Record<string, string | number | null> = {
      full_name,
      business_name,
      phone,
      email,
      address,
      gst_number,
    };

    // Add credit_limit if provided
    if (credit_limit !== undefined && credit_limit !== null) {
      profileUpdate.credit_limit = parseFloat(String(credit_limit));
    }

    const { error: profileError } = await adminClient
      .from("profiles")
      .update(profileUpdate)
      .eq("user_id", newUser.user.id);

    if (profileError) {
      console.error("Profile update error:", profileError);
    }

    console.log("Customer created successfully");
    return new Response(
      JSON.stringify({
        success: true,
        user_id: newUser.user.id,
        email: loginEmail,
        password: loginPassword,
        message: "Customer created successfully",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Unhandled error:", error);
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
