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

    console.log("🔍 Monitor Waitlist System - Starting check...");

    const unprocessedSlots = [];
    const retriedSlots = [];
    const errors = [];

    // 1. Trouver les slot offers qui n'ont jamais été traités (invitation_count = 0)
    const { data: untreatedSlots, error: untreatedError } = await supabase
      .from("appointment_slot_offers")
      .select("*")
      .eq("status", "available")
      .eq("invitation_count", 0)
      .gte("expires_at", new Date().toISOString())
      .order("created_at", { ascending: true })
      .limit(20);

    if (untreatedError) {
      console.error("Error fetching untreated slots:", untreatedError);
      errors.push({ type: "fetch_untreated", error: untreatedError.message });
    }

    // 2. Traiter les slots non traités
    if (untreatedSlots && untreatedSlots.length > 0) {
      console.log(`📋 Found ${untreatedSlots.length} untreated slots`);

      for (const slot of untreatedSlots) {
        try {
          console.log(`🔄 Processing untreated slot ${slot.id}`);

          // Vérifier s'il y a des logs d'erreur pour ce slot
          const { data: logs } = await supabase
            .from("waitlist_trigger_logs")
            .select("*")
            .eq("slot_offer_id", slot.id)
            .order("created_at", { ascending: false })
            .limit(1);

          const hasFailedBefore = logs && logs.length > 0 && logs[0].status === "error";
          const retryCount = hasFailedBefore ? (logs[0].retry_count || 0) + 1 : 1;

          // Créer un log pour cette tentative
          await supabase.from("waitlist_trigger_logs").insert({
            slot_offer_id: slot.id,
            trigger_type: "monitor",
            action: "retry_process_slot",
            status: "pending",
            retry_count: retryCount,
            metadata: {
              reason: hasFailedBefore ? "retry_after_failure" : "first_attempt_missed",
              previous_attempts: retryCount - 1,
            },
          });

          // Appeler process-cancellation
          const functionUrl = `${supabaseUrl}/functions/v1/process-cancellation`;
          const response = await fetch(functionUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${supabaseKey}`,
            },
            body: JSON.stringify({
              slot_offer_id: slot.id,
              slot_datetime: slot.slot_datetime,
              appointment_id: slot.cancelled_appointment_id,
            }),
          });

          const result = await response.json();

          if (response.ok) {
            console.log(`✅ Slot ${slot.id} processed successfully`);
            unprocessedSlots.push({
              slot_id: slot.id,
              status: "processed",
              invitations_sent: result.invitations_sent || 0,
            });
          } else {
            console.error(`❌ Failed to process slot ${slot.id}:`, result);
            errors.push({
              type: "process_slot",
              slot_id: slot.id,
              error: result.error || "Unknown error",
            });
          }
        } catch (error) {
          console.error(`❌ Exception processing slot ${slot.id}:`, error);
          errors.push({
            type: "exception",
            slot_id: slot.id,
            error: error.message,
          });
        }
      }
    }

    // 3. Vérifier les logs d'erreur récents (dernières 24h)
    const { data: recentErrors, error: recentErrorsError } = await supabase
      .from("waitlist_trigger_logs")
      .select("*, slot_offer:appointment_slot_offers(*)")
      .eq("status", "error")
      .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order("created_at", { ascending: false })
      .limit(10);

    if (recentErrorsError) {
      console.error("Error fetching recent errors:", recentErrorsError);
    }

    // 4. Statistiques générales
    const { data: stats } = await supabase
      .from("appointment_slot_offers")
      .select("status")
      .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    const statusCounts = stats?.reduce((acc, slot) => {
      acc[slot.status] = (acc[slot.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const summary = {
      timestamp: new Date().toISOString(),
      untreated_slots_found: untreatedSlots?.length || 0,
      slots_processed: unprocessedSlots.length,
      errors_encountered: errors.length,
      recent_errors_last_24h: recentErrors?.length || 0,
      stats_last_7_days: statusCounts || {},
      processed_slots: unprocessedSlots,
      errors: errors,
      recent_error_details: recentErrors?.slice(0, 3).map(log => ({
        slot_id: log.slot_offer_id,
        error: log.error_message,
        created_at: log.created_at,
        retry_count: log.retry_count,
      })) || [],
    };

    console.log("📊 Monitor Summary:", summary);

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("❌ Monitor error:", error);
    return new Response(
      JSON.stringify({
        error: error.message,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});