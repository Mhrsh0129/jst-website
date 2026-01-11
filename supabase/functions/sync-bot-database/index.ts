import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Main website database
    const mainDb = createClient(
      "https://pqlycsuxmyuqacxbldey.supabase.co",
      Deno.env.get("MAIN_DB_SERVICE_KEY") || ""
    );

    // Bot database (this instance)
    const botDb = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );

    // Sync tables: profiles, user_roles, products, bills, payments, orders
    const tables = [
      "profiles",
      "user_roles",
      "products",
      "bills",
      "payments",
      "orders",
      "order_items",
    ];

    let syncedCount = 0;

    for (const table of tables) {
      // Fetch from main DB
      const { data: mainData, error: fetchError } = await mainDb
        .from(table)
        .select("*");

      if (fetchError) {
        console.error(`Error fetching from ${table}:`, fetchError);
        continue;
      }

      if (!mainData || mainData.length === 0) continue;

      // Clear bot DB table
      await botDb.from(table).delete().neq("id", "00000000-0000-0000-0000-000000000000");

      // Insert synced data
      const { error: insertError } = await botDb.from(table).insert(mainData);

      if (insertError) {
        console.error(`Error syncing ${table}:`, insertError);
      } else {
        syncedCount += mainData.length;
        console.log(`✅ Synced ${mainData.length} records from ${table}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Synced ${syncedCount} records from main database`,
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Sync error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
