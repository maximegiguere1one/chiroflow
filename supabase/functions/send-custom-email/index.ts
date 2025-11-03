import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'npm:@supabase/supabase-js@2';

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

interface BrandingInfo {
  clinic_name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  logo_url: string | null;
  website: string | null;
}

async function getOrganizationBranding(ownerId: string): Promise<BrandingInfo> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data, error } = await supabase.rpc('get_organization_branding', {
    p_owner_id: ownerId
  });

  if (error) {
    console.error('Error fetching branding:', error);
    return {
      clinic_name: 'Votre Clinique',
      email: null,
      phone: null,
      address: null,
      logo_url: null,
      website: null,
    };
  }

  return data as BrandingInfo;
}

function getFromEmail(clinicName: string, domain?: string): string {
  const resendDomain = domain || Deno.env.get("RESEND_DOMAIN") || "janiechiro.com";
  return `${clinicName} <noreply@${resendDomain}>`;
}

function getEmailFooter(clinicName: string, clinicEmail?: string | null, clinicPhone?: string | null): string {
  const currentYear = new Date().getFullYear();

  let contactInfo = '';
  if (clinicEmail || clinicPhone) {
    contactInfo = '<p style="margin: 10px 0 0 0;">';
    if (clinicEmail) contactInfo += `Email: ${clinicEmail}`;
    if (clinicEmail && clinicPhone) contactInfo += ' | ';
    if (clinicPhone) contactInfo += `Tél: ${clinicPhone}`;
    contactInfo += '</p>';
  }

  return `
    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 14px; color: #6b7280;">
      <p style="margin: 0;">Ceci est un message automatisé de votre clinique.</p>
      ${contactInfo}
      <p style="margin: 10px 0 0 0;">© ${currentYear} ${clinicName} - Tous droits réservés</p>
    </div>
  `;
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
      console.log('Using provided owner_id:', owner_id);
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
          console.log('User authenticated:', user.id, user.email);
          branding = await getOrganizationBranding(user.id);
          console.log('Branding loaded:', branding);
          clinicName = branding.clinic_name;
        } else {
          console.log('No user found from auth header');
        }
      } else {
        console.log('No Authorization header provided');
      }
    }

    console.log('Final clinic name for email:', clinicName);
    const fromEmail = getFromEmail(clinicName, RESEND_DOMAIN);
    console.log('From email address:', fromEmail);

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
        from: fromEmail,
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
        from_email: fromEmail,
        resend_id: resendData.id,
      },
    }));

    return new Response(
      JSON.stringify({
        success: true,
        message: "Email sent successfully",
        resend_id: resendData.id,
        clinic_name: clinicName,
        from: fromEmail,
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
