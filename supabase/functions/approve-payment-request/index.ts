import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, content-type, x-client-info, apikey",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { paymentRequestId, action } = body;

    console.log("Payload:", { paymentRequestId, action });

    if (!paymentRequestId || !action) {
      return new Response(
        JSON.stringify({ error: "Missing paymentRequestId or action" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const client = createClient(supabaseUrl, supabaseServiceKey);

    // Get payment request
    const { data: request, error: fetchErr } = await client
      .from("payment_requests")
      .select("*")
      .eq("id", paymentRequestId)
      .single();

    if (fetchErr) {
      console.error("Fetch error:", fetchErr);
      return new Response(
        JSON.stringify({ error: "Not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "reject") {
      const { error: updateErr } = await client
        .from("payment_requests")
        .update({ status: "rejected", approved_at: new Date().toISOString() })
        .eq("id", paymentRequestId);

      if (updateErr) throw updateErr;

      return new Response(
        JSON.stringify({ success: true, message: "Payment rejected" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "approve") {
      // Mark as approved
      await client
        .from("payment_requests")
        .update({ status: "approved", approved_at: new Date().toISOString() })
        .eq("id", paymentRequestId);

      // Get bills
      const { data: bills } = await client
        .from("bills")
        .select("*")
        .in("id", request.bills_allocated)
        .order("created_at", { ascending: true });

      if (!bills || bills.length === 0) {
        return new Response(
          JSON.stringify({ success: true, message: "Payment approved but no bills found" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Calculate allocations
      let remaining = request.amount;
      const allocations: any[] = [];

      for (const bill of bills) {
        if (remaining <= 0) break;
        const due = Number(bill.balance_due || 0);
        if (due <= 0) continue;
        
        const apply = Math.min(remaining, due);
        allocations.push({ billId: bill.id, amount: apply, bill_number: bill.bill_number });
        remaining -= apply;
      }

      // Insert payment
      await client.from("payments").insert({
        customer_id: request.customer_id,
        amount: request.amount,
        payment_date: new Date().toISOString(),
        payment_method: "bank_transfer",
        notes: `Payment request ${paymentRequestId}`,
      });

      // Update bills - add to paid_amount and subtract from balance_due
      for (const alloc of allocations) {
        const bill = bills.find((b: any) => b.id === alloc.billId);
        if (!bill) continue;
        
        const newBalance = Math.max(0, Number(bill.balance_due) - alloc.amount);
        const newPaid = (Number(bill.paid_amount || 0) || 0) + alloc.amount;
        
        console.log(`Updating bill ${alloc.billId}: balance ${bill.balance_due} - ${alloc.amount} = ${newBalance}, paid ${bill.paid_amount} + ${alloc.amount} = ${newPaid}`);

        const { error: updateErr } = await client
          .from("bills")
          .update({
            balance_due: newBalance,
            paid_amount: newPaid,
            status: newBalance === 0 ? "paid" : "pending",
          })
          .eq("id", alloc.billId);
        
        if (updateErr) {
          console.error(`Update failed for bill ${alloc.billId}:`, updateErr);
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Approved. ${allocations.length} bills updated.`,
          allocations 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Unknown action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("ERROR:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
