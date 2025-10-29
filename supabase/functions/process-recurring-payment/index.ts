import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const today = new Date().toISOString().split("T")[0];

    const { data: subscriptions, error: subsError } = await supabase
      .from("payment_subscriptions")
      .select("*, payment_methods(*)")
      .eq("status", "active")
      .lte("next_billing_date", today);

    if (subsError) {
      throw new Error(`Failed to fetch subscriptions: ${subsError.message}`);
    }

    const results = [];

    for (const subscription of subscriptions || []) {
      try {
        if (!subscription.payment_methods) {
          await logScheduleAttempt(supabase, subscription.id, today, "failed", 0, "No payment method attached");
          continue;
        }

        const mockGatewayTransactionId = `ch_${crypto.randomUUID().replace(/-/g, '')}`;
        const mockSuccess = Math.random() > 0.1;

        const transactionData = {
          patient_id: subscription.patient_id,
          payment_method_id: subscription.payment_method_id,
          subscription_id: subscription.id,
          transaction_type: "charge",
          amount: subscription.amount,
          currency: subscription.currency,
          status: mockSuccess ? "completed" : "failed",
          gateway_transaction_id: mockGatewayTransactionId,
          failure_reason: mockSuccess ? null : "Insufficient funds",
          failure_code: mockSuccess ? null : "card_declined",
          processed_at: new Date().toISOString(),
          notes: `Recurring charge for ${subscription.description}`,
        };

        const { data: transaction, error: txError } = await supabase
          .from("payment_transactions_extended")
          .insert(transactionData)
          .select()
          .single();

        if (mockSuccess) {
          const nextBillingDate = calculateNextBillingDate(
            subscription.next_billing_date,
            subscription.frequency,
            subscription.interval_count
          );

          await supabase
            .from("payment_subscriptions")
            .update({
              next_billing_date: nextBillingDate,
              retry_attempts: 0,
            })
            .eq("id", subscription.id);

          await logScheduleAttempt(supabase, subscription.id, today, "success", 0, null, transaction?.id);
        } else {
          const newRetryCount = (subscription.retry_attempts || 0) + 1;
          const shouldCancel = newRetryCount >= subscription.max_retry_attempts;

          await supabase
            .from("payment_subscriptions")
            .update({
              retry_attempts: newRetryCount,
              status: shouldCancel ? "cancelled" : "active",
            })
            .eq("id", subscription.id);

          await logScheduleAttempt(
            supabase,
            subscription.id,
            today,
            "failed",
            newRetryCount,
            "Payment declined",
            transaction?.id
          );
        }

        results.push({
          subscriptionId: subscription.id,
          success: mockSuccess,
          transactionId: transaction?.id,
        });
      } catch (subError: any) {
        console.error(`Error processing subscription ${subscription.id}:`, subError);
        results.push({
          subscriptionId: subscription.id,
          success: false,
          error: subError.message,
        });
      }
    }

    const response = {
      success: true,
      processedCount: results.length,
      results,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error: any) {
    console.error("Error processing recurring payments:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to process recurring payments",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});

async function logScheduleAttempt(
  supabase: any,
  subscriptionId: string,
  scheduledDate: string,
  status: string,
  retryNumber: number,
  errorMessage: string | null,
  transactionId?: string
) {
  await supabase.from("payment_schedule_logs").insert({
    subscription_id: subscriptionId,
    transaction_id: transactionId || null,
    scheduled_date: scheduledDate,
    attempted_at: new Date().toISOString(),
    status,
    retry_number: retryNumber,
    error_message: errorMessage,
  });
}

function calculateNextBillingDate(currentDate: string, frequency: string, intervalCount: number): string {
  const date = new Date(currentDate);

  switch (frequency) {
    case "weekly":
      date.setDate(date.getDate() + 7 * intervalCount);
      break;
    case "biweekly":
      date.setDate(date.getDate() + 14 * intervalCount);
      break;
    case "monthly":
      date.setMonth(date.getMonth() + intervalCount);
      break;
    case "quarterly":
      date.setMonth(date.getMonth() + 3 * intervalCount);
      break;
    case "yearly":
      date.setFullYear(date.getFullYear() + intervalCount);
      break;
  }

  return date.toISOString().split("T")[0];
}
