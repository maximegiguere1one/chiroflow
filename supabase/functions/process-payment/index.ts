import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ProcessPaymentRequest {
  patientId: string;
  paymentMethodId: string;
  amount: number;
  currency?: string;
  invoiceId?: string;
  subscriptionId?: string;
  description?: string;
}

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

    const requestData: ProcessPaymentRequest = await req.json();
    const {
      patientId,
      paymentMethodId,
      amount,
      currency = "CAD",
      invoiceId,
      subscriptionId,
      description = "Payment",
    } = requestData;

    if (amount <= 0) {
      throw new Error("Amount must be greater than 0");
    }

    const { data: paymentMethod, error: pmError } = await supabase
      .from("payment_methods")
      .select("*")
      .eq("id", paymentMethodId)
      .eq("patient_id", patientId)
      .eq("is_active", true)
      .maybeSingle();

    if (pmError || !paymentMethod) {
      throw new Error("Payment method not found or inactive");
    }

    const mockGatewayTransactionId = `ch_${crypto.randomUUID().replace(/-/g, '')}`;
    const mockGatewayResponse = {
      id: mockGatewayTransactionId,
      amount: amount * 100,
      currency,
      status: "succeeded",
      payment_method: paymentMethod.card_token,
      created: Date.now(),
    };

    const transactionData = {
      patient_id: patientId,
      invoice_id: invoiceId || null,
      payment_method_id: paymentMethodId,
      subscription_id: subscriptionId || null,
      transaction_type: "charge",
      amount,
      currency,
      status: "completed",
      gateway_transaction_id: mockGatewayTransactionId,
      gateway_response: mockGatewayResponse,
      processed_at: new Date().toISOString(),
      notes: description,
    };

    const { data: transaction, error: txError } = await supabase
      .from("payment_transactions_extended")
      .insert(transactionData)
      .select()
      .single();

    if (txError) {
      throw new Error(`Failed to create transaction: ${txError.message}`);
    }

    if (invoiceId) {
      await supabase
        .from("billing")
        .update({
          payment_status: "paid",
          paid_date: new Date().toISOString().split("T")[0],
          payment_method: `${paymentMethod.card_brand} •••• ${paymentMethod.last_four_digits}`,
        })
        .eq("id", invoiceId);
    }

    const response = {
      success: true,
      transaction,
      message: "Payment processed successfully",
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error: any) {
    console.error("Error processing payment:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to process payment",
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
