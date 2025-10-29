import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("🎯 Waitlist Listener - Starting Realtime subscription...");

    const channel = supabase
      .channel("db-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "appointment_slot_offers",
        },
        async (payload) => {
          console.log("🔔 New slot offer detected:", payload.new);

          const slotOffer = payload.new;

          if (slotOffer.status !== "available") {
            console.log("⏭️ Skipping - slot is not available");
            return;
          }

          try {
            const functionUrl = `${supabaseUrl}/functions/v1/process-cancellation`;

            console.log(`📤 Calling process-cancellation for slot ${slotOffer.id}`);

            const response = await fetch(functionUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${supabaseKey}`,
              },
              body: JSON.stringify({
                slot_offer_id: slotOffer.id,
                slot_datetime: slotOffer.slot_datetime,
                appointment_id: slotOffer.cancelled_appointment_id,
              }),
            });

            const result = await response.json();

            if (response.ok) {
              console.log(`✅ Process-cancellation succeeded:`, result);
            } else {
              console.error(`❌ Process-cancellation failed:`, result);
            }
          } catch (error) {
            console.error("❌ Error calling process-cancellation:", error);
          }
        }
      )
      .subscribe((status) => {
        console.log(`📡 Realtime subscription status: ${status}`);
      });

    return new Response(
      JSON.stringify({
        message: "Waitlist listener started successfully",
        status: "listening",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error starting listener:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
