import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface PaymentRequest {
  appointmentId: string;
  amount: number;
  currency?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { appointmentId, amount, currency = 'CAD' }: PaymentRequest = await req.json();

    if (!appointmentId || !amount) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: eligibilityData, error: eligibilityError } = await supabase.rpc(
      'check_automatic_payment_eligibility',
      { p_appointment_id: appointmentId }
    );

    if (eligibilityError) {
      throw eligibilityError;
    }

    const eligibility = eligibilityData as any;

    if (!eligibility.eligible) {
      return new Response(
        JSON.stringify({
          success: false,
          error: eligibility.reason,
          notEligible: true,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (eligibility.spending_limit_per_charge && amount > eligibility.spending_limit_per_charge) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Amount exceeds spending limit per charge',
          limitExceeded: true,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: paymentMethod } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('id', eligibility.payment_method_id)
      .single();

    if (!paymentMethod) {
      throw new Error('Payment method not found');
    }

    const attemptData = {
      appointment_id: appointmentId,
      patient_id: eligibility.patient_id,
      authorization_id: eligibility.authorization_id,
      payment_method_id: eligibility.payment_method_id,
      amount,
      currency,
      attempt_number: 1,
      status: 'pending',
      processed_at: new Date().toISOString(),
    };

    const { data: attempt, error: attemptError } = await supabase
      .from('automatic_payment_attempts')
      .insert(attemptData)
      .select()
      .single();

    if (attemptError) throw attemptError;

    const mockPaymentSuccess = Math.random() > 0.1;

    if (mockPaymentSuccess) {
      const { data: transaction, error: transactionError } = await supabase
        .from('payment_transactions_extended')
        .insert({
          patient_id: eligibility.patient_id,
          payment_method_id: eligibility.payment_method_id,
          transaction_type: 'charge',
          amount,
          currency,
          status: 'completed',
          gateway_transaction_id: `auto_${Date.now()}`,
          gateway_response: { message: 'Payment processed successfully' },
          processed_at: new Date().toISOString(),
          notes: `Automatic payment for appointment ${appointmentId}`,
        })
        .select()
        .single();

      if (transactionError) throw transactionError;

      await supabase
        .from('automatic_payment_attempts')
        .update({
          status: 'success',
          transaction_id: transaction.id,
        })
        .eq('id', attempt.id);

      await supabase
        .from('appointments')
        .update({
          auto_payment_status: 'charged',
          payment_transaction_id: transaction.id,
        })
        .eq('id', appointmentId);

      if (eligibility.notification_preferences?.email_on_charge) {
        await supabase.functions.invoke('send-payment-confirmation', {
          body: {
            patientId: eligibility.patient_id,
            appointmentId,
            amount,
            transactionId: transaction.id,
          },
        });
      }

      return new Response(
        JSON.stringify({
          success: true,
          transactionId: transaction.id,
          attemptId: attempt.id,
          message: 'Payment processed successfully',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      const failureReason = 'Insufficient funds';

      await supabase
        .from('automatic_payment_attempts')
        .update({
          status: 'failed',
          failure_reason: failureReason,
          retry_scheduled_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        })
        .eq('id', attempt.id);

      await supabase
        .from('appointments')
        .update({
          auto_payment_status: 'failed',
        })
        .eq('id', appointmentId);

      if (eligibility.notification_preferences?.email_on_failure) {
        await supabase.functions.invoke('send-payment-failure-notification', {
          body: {
            patientId: eligibility.patient_id,
            appointmentId,
            failureReason,
            attemptId: attempt.id,
          },
        });
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: failureReason,
          attemptId: attempt.id,
          willRetry: true,
          retryAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        }),
        { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Error processing automatic payment:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
