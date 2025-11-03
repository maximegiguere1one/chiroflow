import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'npm:@supabase/supabase-js@2';
import { getOrganizationBranding, getFromEmail, getEmailFooter } from '../_shared/branding.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface EmailRequest {
  to: string;
  subject: string;
  message: string;
  patient_name: string;
  tracking_id?: string;
  owner_id?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { to, subject, message, patient_name, tracking_id, owner_id }: EmailRequest = await req.json();

    if (!to || !subject || !message) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: to, subject, message" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const RESEND_DOMAIN = Deno.env.get("RESEND_DOMAIN") || "janiechiro.com";

    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let branding;
    let clinicName = "Votre Clinique";

    if (owner_id) {
      branding = await getOrganizationBranding(owner_id);
      clinicName = branding.clinic_name;
    } else {
      const authHeader = req.headers.get('Authorization');
      if (authHeader) {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        const { data: { user } } = await supabase.auth.getUser(
          authHeader.replace('Bearer ', '')
        );

        if (user) {
          branding = await getOrganizationBranding(user.id);
          clinicName = branding.clinic_name;
        }
      }
    }

    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .email-container {
      background: white;
      border-radius: 12px;
      padding: 32px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #3b82f6;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #1e40af;
      margin: 0;
      font-size: 24px;
    }
    .content {
      color: #374151;
      white-space: pre-wrap;
      line-height: 1.8;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>Message de ${clinicName}</h1>
    </div>

    <div class="content">
      <p>Bonjour ${patient_name},</p>
      <p>${message}</p>
    </div>

    ${getEmailFooter(clinicName, branding?.email, branding?.phone)}
  </div>
</body>
</html>
    `;

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: getFromEmail(clinicName, RESEND_DOMAIN),
        to: [to],
        subject: subject,
        html: htmlBody,
      }),
    });

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text();
      console.error("Resend API error:", errorText);
      throw new Error(`Resend API error: ${resendResponse.status}`);
    }

    const resendData = await resendResponse.json();

    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: "INFO",
      message: "Custom email sent successfully",
      metadata: {
        to,
        subject,
        tracking_id,
        clinic_name: clinicName,
        resend_id: resendData.id,
      },
    }));

    return new Response(
      JSON.stringify({
        success: true,
        message: "Email sent successfully",
        resend_id: resendData.id,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: "ERROR",
      message: "Error sending custom email",
      error: error instanceof Error ? error.message : String(error),
    }));

    return new Response(
      JSON.stringify({
        error: "Failed to send email",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
