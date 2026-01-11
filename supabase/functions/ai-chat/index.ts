import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const { messages, chatType } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Different system prompts based on chat type
    let systemPrompt = "";

    if (chatType === "product") {
      systemPrompt = `You are a helpful product assistant for Jay Shree Traders, a wholesale fabric business specializing in pocketing and lining fabrics.

Your role is to:
- Help customers understand different fabric types (pocketing, lining, cotton blends)
- Explain fabric specifications like GSM, width, thread count
- Suggest appropriate fabrics based on customer needs (garment type, budget, quality requirements)
- Answer questions about minimum order quantities, pricing structures, and bulk discounts
- Explain care instructions and fabric properties

Key product categories:
1. Pocketing fabrics - For trouser/jacket pockets, various weights and colors
2. Lining fabrics - For suits, jackets, dresses in polyester and silk blends
3. Interlining - For garment structure and support

Be friendly, professional, and knowledgeable. If you don't know specific pricing or stock availability, suggest the customer check with sales or view the products page.

Keep responses concise and helpful. Use bullet points for listing information.`;
    } else if (chatType === "order") {
      systemPrompt = `You are an order support assistant for Jay Shree Traders, a wholesale fabric business.

Your role is to help customers with:
- Understanding their bill and invoice details
- Payment methods (UPI, bank transfer)
- Order status inquiries
- Delivery timelines and shipping information
- Return and exchange policies
- Credit limit and payment terms
- Bill download and invoice requests

Key policies:
- Payment terms: Typically 30 days from invoice date
- Minimum order: Usually 50-100 meters depending on fabric
- Delivery: 3-7 business days for standard orders
- Returns: Within 7 days for defective goods only

Be empathetic, professional, and solution-oriented. For specific order issues, guide them to contact customer service or their account manager.

Keep responses clear and actionable. Always acknowledge the customer's concern first.`;
    } else {
      systemPrompt = `You are a helpful assistant for Jay Shree Traders, a wholesale fabric business. Help customers with any questions they have about products, orders, or the business.`;
    }

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [{ role: "system", content: systemPrompt }, ...messages],
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Service temporarily unavailable. Please try again later." }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to get AI response" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("AI chat error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
