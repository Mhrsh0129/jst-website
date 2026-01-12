// Deno Edge Function - HTTP imports and Deno global are valid in Deno runtime
// VS Code may show errors but the code works correctly when deployed
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS, GET",
  "Access-Control-Allow-Headers": "authorization, content-type, x-client-info, apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { customerId, amount, billIds } = body;

    console.log("Received:", { customerId, amount, billIds });

    if (!customerId || !amount || !billIds || billIds.length === 0) {
      return new Response(
        JSON.stringify({
          error: "Missing: customerId, amount, or billIds",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use service key - no RLS
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Insert payment request
    const { data: paymentRequest, error: insertError } = await adminClient
      .from("payment_requests")
      .insert({
        customer_id: customerId,
        amount: Number(amount),
        status: "pending",
        bills_allocated: billIds,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(
        JSON.stringify({ error: insertError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Created payment request:", paymentRequest);

    return new Response(
      JSON.stringify({
        success: true,
        paymentRequest,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    console.error("Function error:", errorMsg);
    return new Response(
      JSON.stringify({ error: errorMsg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
