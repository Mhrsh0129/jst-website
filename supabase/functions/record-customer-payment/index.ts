// Deno Edge Function - HTTP imports and Deno global are valid in Deno runtime
// VS Code may show errors but the code works correctly when deployed
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Max-Age": "86400",
};

type Mode = "single" | "bulk";

type Payload = {
  mode: Mode;
  amount: number;
  bill_id?: string;
  payment_method?: string;
  transaction_id?: string | null;
  notes?: string | null;
  payment_date?: string | null;
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    // Create clients
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const adminClient = createClient(supabaseUrl, serviceKey);

    const body = (await req.json()) as Payload;

    // Validate input
    if (!body || typeof body.amount !== "number" || isNaN(body.amount) || body.amount <= 0) {
      return new Response(JSON.stringify({ error: "amount must be a positive number" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (body.mode !== "single" && body.mode !== "bulk") {
      return new Response(JSON.stringify({ error: "mode must be 'single' or 'bulk'" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (body.mode === "single" && !body.bill_id) {
      return new Response(JSON.stringify({ error: "bill_id is required for single mode" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const paymentMethod = body.payment_method || "upi";
    const transactionId = body.transaction_id || null;
    const notes = body.notes || null;
    const createdAt = body.payment_date || new Date().toISOString();

    // Fetch bills with RLS
    let bills: Array<{ id: string; balance_due: number; paid_amount: number; status: string; customer_id: string }>;

    if (body.mode === "single") {
      const { data: bill, error } = await userClient
        .from("bills")
        .select("id, balance_due, paid_amount, status, customer_id")
        .eq("id", body.bill_id!)
        .gt("balance_due", 0)
        .single();
      if (error || !bill) {
        return new Response(JSON.stringify({ error: "Bill not found or not payable" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      bills = [bill];
    } else {
      const { data, error } = await userClient
        .from("bills")
        .select("id, balance_due, paid_amount, status, customer_id")
        .gt("balance_due", 0)
        .order("created_at", { ascending: true });
      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      bills = data || [];
    }

    if (!bills || bills.length === 0) {
      return new Response(JSON.stringify({ error: "No unpaid bills to apply payment" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Compute allocations
    let remaining = body.amount;
    const allocations: Array<{ bill_id: string; amount: number }> = [];

    if (body.mode === "single") {
      const billItem = bills[0];
      const apply = Math.min(remaining, Number(billItem.balance_due));
      if (apply <= 0) {
        return new Response(JSON.stringify({ error: "Nothing to allocate to this bill" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      allocations.push({ bill_id: billItem.id, amount: apply });
      remaining -= apply;
    } else {
      for (const billItem of bills) {
        if (remaining <= 0) break;
        const due = Number(billItem.balance_due);
        if (due <= 0) continue;
        const apply = Math.min(remaining, due);
        if (apply > 0) {
          allocations.push({ bill_id: billItem.id, amount: apply });
          remaining -= apply;
        }
      }
    }

    if (allocations.length === 0) {
      return new Response(JSON.stringify({ error: "No allocations computed" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Apply allocations
    for (const alloc of allocations) {
      const billItem = bills.find(b => b.id === alloc.bill_id);
      if (!billItem) continue;

      // Insert payment
      const { error: payErr } = await adminClient.from("payments").insert({
        bill_id: alloc.bill_id,
        customer_id: billItem.customer_id,
        amount: alloc.amount,
        payment_method: paymentMethod,
        transaction_id: transactionId,
        notes: body.mode === "bulk" ? `Bulk payment: ${notes || ""}` : notes,
        created_at: createdAt,
      });

      if (payErr) {
        return new Response(JSON.stringify({ error: `Insert payment failed: ${payErr.message}` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Update bill
      const { data: billData, error: fetchErr } = await adminClient
        .from("bills")
        .select("paid_amount, balance_due")
        .eq("id", alloc.bill_id)
        .single();

      if (fetchErr || !billData) {
        return new Response(JSON.stringify({ error: `Fetch bill failed: ${fetchErr?.message}` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const newPaid = Number(billData.paid_amount) + alloc.amount;
      const newBalance = Math.max(0, Number(billData.balance_due) - alloc.amount);
      const newStatus = newBalance <= 0 ? "paid" : "partial";

      const { error: updErr } = await adminClient
        .from("bills")
        .update({ paid_amount: newPaid, balance_due: newBalance, status: newStatus })
        .eq("id", alloc.bill_id);

      if (updErr) {
        return new Response(JSON.stringify({ error: `Update bill failed: ${updErr.message}` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        total_amount: body.amount,
        allocated_count: allocations.length,
        remaining,
        allocations,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("Function error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
