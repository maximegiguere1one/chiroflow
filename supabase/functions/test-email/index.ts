import "jsr:@supabase/functions-js/edge-runtime.d.ts";

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
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const resendDomain = Deno.env.get("RESEND_DOMAIN") || "example.com";

    console.log("🧪 Test Email Function - Starting");
    console.log("- RESEND_API_KEY exists:", !!resendApiKey);
    console.log("- RESEND_DOMAIN:", resendDomain);
    console.log("- Using test mode:", resendDomain === "example.com");

    if (!resendApiKey) {
      console.error("❌ RESEND_API_KEY is missing!");
      return new Response(
        JSON.stringify({
          error: "RESEND_API_KEY not configured",
          hint: "Add RESEND_API_KEY secret in Supabase Dashboard > Project Settings > Edge Functions > Secrets",
          status: "configuration_error",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (resendDomain === "example.com") {
      console.warn("⚠️ WARNING: Using default domain 'example.com'");
      console.warn("⚠️ Emails will go to delivered@resend.dev (Resend test inbox)");
      console.warn("⚠️ Configure RESEND_DOMAIN secret with your verified domain");
    }

    const { to, subject, name, html } = await req.json().catch(() => ({
      to: "test@example.com",
      subject: "Test Email Clinique Janie",
      name: "Test Patient",
      html: null,
    }));

    console.log(`📧 Preparing to send test email to: ${to}`);

    let domainVerified = false;
    let verificationWarning = "";

    if (resendDomain !== "example.com") {
      try {
        const domainsResponse = await fetch("https://api.resend.com/domains", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
          },
        });

        if (domainsResponse.ok) {
          const domainsResult = await domainsResponse.json();
          const domain = domainsResult.data?.find((d: any) => d.name === resendDomain);

          if (domain) {
            domainVerified = domain.status === "verified";
            console.log(`🔍 Domain ${resendDomain} status:`, domain.status);

            if (!domainVerified) {
              verificationWarning = `Le domaine ${resendDomain} n'est PAS vérifié dans Resend. L'email sera envoyé à delivered@resend.dev au lieu de ${to}`;
              console.warn(`⚠️ ${verificationWarning}`);
            }
          } else {
            verificationWarning = `Le domaine ${resendDomain} n'existe pas dans votre compte Resend`;
            console.warn(`⚠️ ${verificationWarning}`);
          }
        }
      } catch (error) {
        console.error("Error checking domain verification:", error.message);
      }
    }

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8f9fa;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #d4af37 0%, #c5a028 100%); padding: 40px 30px; text-align: center; border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">🧪 Test Email</h1>
              <p style="margin: 10px 0 0 0; color: rgba(255,255,255,0.95); font-size: 16px;">Clinique Janie - Configuration Resend</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px 0; color: #333; font-size: 16px;">Bonjour <strong>${name}</strong>,</p>
              <p style="margin: 0 0 30px 0; color: #555; font-size: 16px; line-height: 1.6;">
                Félicitations! Votre configuration Resend fonctionne correctement.
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%); border-radius: 8px; margin-bottom: 30px; border: 2px solid #4caf50;">
                <tr>
                  <td style="padding: 30px; text-align: center;">
                    <div style="font-size: 48px; margin-bottom: 15px;">✅</div>
                    <div style="font-size: 20px; font-weight: 600; color: #2e7d32; margin-bottom: 8px;">Configuration réussie!</div>
                    <div style="font-size: 14px; color: #388e3c;">Domaine: ${resendDomain}</div>
                  </td>
                </tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #e3f2fd; border-left: 4px solid #2196f3; border-radius: 4px; margin-bottom: 25px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 10px 0; color: #0d47a1; font-size: 14px; font-weight: 600;">ℹ️ Informations techniques:</p>
                    <ul style="margin: 0; padding-left: 20px; color: #1565c0; font-size: 14px; line-height: 1.8;">
                      <li>Domaine configuré: ${resendDomain}</li>
                      <li>API Key: Configurée ✓</li>
                      <li>Test effectué le: ${new Date().toLocaleString("fr-CA")}</li>
                    </ul>
                  </td>
                </tr>
              </table>

              <p style="margin: 0; color: #777; font-size: 14px; line-height: 1.6;">
                Vous pouvez maintenant utiliser le système de liste d'attente intelligente.
                Les emails d'invitation seront envoyés automatiquement lors des annulations.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #dee2e6; border-radius: 0 0 12px 12px;">
              <p style="margin: 0; color: #6c757d; font-size: 12px;">Clinique Chiropratique Dre Janie Leblanc</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    console.log(`📧 Sending test email to: ${to}`);

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: `Clinique Chiropratique Dre Janie Leblanc <info@janiechiro.com>`,
        to: [to],
        subject: subject,
        html: html || emailHtml,
      }),
    });

    const responseText = await resendResponse.text();
    console.log("Resend Response Status:", resendResponse.status);
    console.log("Resend Response:", responseText);

    if (!resendResponse.ok) {
      let parsedError;
      try {
        parsedError = JSON.parse(responseText);
      } catch {
        parsedError = { message: responseText };
      }

      const errorMessage = parsedError.message || parsedError.error || "Unknown error";
      const isAuthError = resendResponse.status === 401 || resendResponse.status === 403;
      const isDomainError = errorMessage.toLowerCase().includes("domain") || errorMessage.toLowerCase().includes("from");

      console.error("❌ Resend API Error Details:");
      console.error("- Status:", resendResponse.status);
      console.error("- Message:", errorMessage);
      console.error("- Is Auth Error:", isAuthError);
      console.error("- Is Domain Error:", isDomainError);

      return new Response(
        JSON.stringify({
          error: "Failed to send email via Resend",
          status: resendResponse.status,
          message: errorMessage,
          details: responseText,
          diagnosis: isAuthError
            ? {
                issue: "API Key Authentication Failed",
                likely_cause: "RESEND_API_KEY est invalide, révoquée, ou a expiré",
                actions: [
                  "1. Vérifiez que votre RESEND_API_KEY commence par 're_'",
                  "2. Allez sur resend.com/api-keys",
                  "3. Vérifiez que la clé est active (pas révoquée)",
                  "4. Générez une nouvelle clé si nécessaire",
                  "5. Mettez à jour le secret dans Supabase Dashboard",
                ],
              }
            : isDomainError
            ? {
                issue: "Domain Configuration Problem",
                likely_cause: "Le domaine info@janiechiro.com n'est pas vérifié ou configuré",
                actions: [
                  "1. Allez sur resend.com/domains",
                  "2. Vérifiez que 'janiechiro.com' existe dans votre compte",
                  "3. Vérifiez que le statut est 'Verified' (pas 'Pending')",
                  "4. Si non vérifié, configurez les DNS records (SPF, DKIM, DMARC)",
                  "5. Attendez 5-30 minutes après configuration DNS",
                ],
              }
            : {
                issue: "Email Send Failed",
                likely_cause: errorMessage,
                actions: [
                  "1. Vérifiez l'adresse email destinataire",
                  "2. Consultez les logs Resend: resend.com/emails",
                  "3. Vérifiez votre quota d'envoi Resend",
                  "4. Contactez le support Resend si le problème persiste",
                ],
              },
          troubleshooting: {
            domain_verified: resendDomain !== "example.com",
            api_key_configured: true,
            response_status: resendResponse.status,
          },
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const resendData = JSON.parse(responseText);

    const responseData: any = {
      success: true,
      message: domainVerified
        ? `Email envoyé avec succès à ${to}!`
        : "Email envoyé (mais attention au domaine non vérifié)",
      resend_id: resendData.id,
      recipient: to,
      domain: resendDomain,
      domain_verified: domainVerified,
      sent_at: new Date().toISOString(),
      next_steps: domainVerified
        ? [
            "✅ Vérifiez votre boîte mail",
            "✅ Le domaine est vérifié - les emails iront aux vrais destinataires",
            "Test invitation flow with real appointment cancellation",
          ]
        : [
            "⚠️ IMPORTANT: Vérifiez delivered@resend.dev (inbox de test Resend)",
            "⚠️ L'email n'a PAS été envoyé à votre vraie adresse",
            "🔧 Action requise: Allez sur resend.com/domains et vérifiez votre domaine",
            "📖 Consultez RESEND_SETUP_GUIDE.md pour les instructions",
          ],
    };

    if (verificationWarning) {
      responseData.warning = verificationWarning;
      console.warn("📧 Response includes verification warning");
    }

    return new Response(
      JSON.stringify(responseData),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("❌ Error in test-email function:", error);
    return new Response(
      JSON.stringify({
        error: error.message,
        stack: error.stack,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});