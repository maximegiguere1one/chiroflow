import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface SecretCheck {
  name: string;
  exists: boolean;
  valid: boolean;
  issue?: string;
  recommendation?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const checks: SecretCheck[] = [];
    let criticalErrors = 0;
    let warnings = 0;

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const resendDomain = Deno.env.get("RESEND_DOMAIN");
    const appDomain = Deno.env.get("APP_DOMAIN");
    const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioPhoneNumber = Deno.env.get("TWILIO_PHONE_NUMBER");

    checks.push({
      name: "RESEND_API_KEY",
      exists: !!resendApiKey,
      valid: resendApiKey ? resendApiKey.startsWith("re_") && resendApiKey.length > 20 : false,
      issue: !resendApiKey
        ? "Secret manquant"
        : !resendApiKey.startsWith("re_")
        ? "Format incorrect (devrait commencer par 're_')"
        : resendApiKey.length <= 20
        ? "Clé trop courte (probablement invalide)"
        : undefined,
      recommendation: !resendApiKey
        ? "Ajoutez RESEND_API_KEY dans Supabase Dashboard > Project Settings > Edge Functions > Secrets"
        : !resendApiKey.startsWith("re_")
        ? "Vérifiez que vous avez copié la clé complète depuis resend.com/api-keys"
        : undefined,
    });

    checks.push({
      name: "RESEND_DOMAIN",
      exists: !!resendDomain,
      valid: resendDomain ? !resendDomain.includes("http") && !resendDomain.includes("www") && resendDomain.includes(".") : false,
      issue: !resendDomain
        ? "Secret manquant"
        : resendDomain.includes("http")
        ? "Ne devrait PAS contenir 'http://' ou 'https://'"
        : resendDomain.includes("www")
        ? "Ne devrait PAS contenir 'www'"
        : !resendDomain.includes(".")
        ? "Format de domaine invalide"
        : resendDomain === "example.com"
        ? "Domaine par défaut (non configuré)"
        : undefined,
      recommendation: !resendDomain
        ? "Ajoutez RESEND_DOMAIN=janiechiro.com dans Supabase"
        : "Utilisez seulement le domaine nu: 'janiechiro.com' (sans http, sans www)",
    });

    checks.push({
      name: "APP_DOMAIN",
      exists: !!appDomain,
      valid: appDomain ? !appDomain.includes("http") : false,
      issue: !appDomain ? "Secret manquant (optionnel mais recommandé)" : undefined,
      recommendation: !appDomain ? "Ajoutez APP_DOMAIN=janiechiro.com pour les URLs d'invitation" : undefined,
    });

    checks.push({
      name: "TWILIO_ACCOUNT_SID",
      exists: !!twilioAccountSid,
      valid: twilioAccountSid ? twilioAccountSid.startsWith("AC") && twilioAccountSid.length === 34 : false,
      issue: !twilioAccountSid
        ? "Secret manquant"
        : !twilioAccountSid.startsWith("AC")
        ? "Format incorrect (devrait commencer par 'AC')"
        : twilioAccountSid.length !== 34
        ? "Longueur incorrecte (devrait être 34 caractères)"
        : undefined,
      recommendation: !twilioAccountSid
        ? "Ajoutez TWILIO_ACCOUNT_SID depuis console.twilio.com"
        : undefined,
    });

    checks.push({
      name: "TWILIO_AUTH_TOKEN",
      exists: !!twilioAuthToken,
      valid: twilioAuthToken ? twilioAuthToken.length === 32 : false,
      issue: !twilioAuthToken
        ? "Secret manquant"
        : twilioAuthToken.length !== 32
        ? "Longueur incorrecte (devrait être 32 caractères)"
        : undefined,
      recommendation: !twilioAuthToken
        ? "Ajoutez TWILIO_AUTH_TOKEN depuis console.twilio.com"
        : undefined,
    });

    checks.push({
      name: "TWILIO_PHONE_NUMBER",
      exists: !!twilioPhoneNumber,
      valid: twilioPhoneNumber ? twilioPhoneNumber.startsWith("+") : false,
      issue: !twilioPhoneNumber
        ? "Secret manquant"
        : !twilioPhoneNumber.startsWith("+")
        ? "Format incorrect (devrait commencer par '+' ex: +15551234567)"
        : undefined,
      recommendation: !twilioPhoneNumber
        ? "Ajoutez TWILIO_PHONE_NUMBER au format E.164 (+15551234567)"
        : undefined,
    });

    for (const check of checks) {
      if (!check.exists && check.name !== "APP_DOMAIN") {
        criticalErrors++;
      } else if (check.exists && !check.valid) {
        if (check.name === "APP_DOMAIN") {
          warnings++;
        } else {
          criticalErrors++;
        }
      }
    }

    let domainVerificationStatus = null;
    let domainVerificationDetails = null;

    if (resendApiKey && resendApiKey.startsWith("re_")) {
      try {
        const domainsResponse = await fetch("https://api.resend.com/domains", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
          },
        });

        if (domainsResponse.ok) {
          const domainsResult = await domainsResponse.json();
          const targetDomain = resendDomain || "janiechiro.com";
          const domain = domainsResult.data?.find((d: any) => d.name === targetDomain);

          if (domain) {
            domainVerificationStatus = domain.status;
            domainVerificationDetails = {
              name: domain.name,
              status: domain.status,
              region: domain.region,
              created_at: domain.created_at,
            };

            if (domain.status !== "verified") {
              criticalErrors++;
            }
          } else {
            criticalErrors++;
            domainVerificationStatus = "not_found";
            domainVerificationDetails = {
              error: `Le domaine '${targetDomain}' n'existe pas dans votre compte Resend`,
              available_domains: domainsResult.data?.map((d: any) => d.name) || [],
            };
          }
        } else {
          const errorData = await domainsResponse.json();
          domainVerificationStatus = "api_error";
          domainVerificationDetails = {
            error: "Impossible de vérifier les domaines",
            status: domainsResponse.status,
            message: errorData.message || "Erreur API Resend",
          };
          warnings++;
        }
      } catch (error) {
        domainVerificationStatus = "check_failed";
        domainVerificationDetails = {
          error: "Exception lors de la vérification du domaine",
          message: error.message,
        };
        warnings++;
      }
    }

    const overallStatus = criticalErrors === 0 ? (warnings === 0 ? "ready" : "warning") : "critical";

    const actionItems: string[] = [];

    if (!resendApiKey) {
      actionItems.push(
        "1. Allez sur resend.com/api-keys",
        "2. Créez une nouvelle API Key avec 'Sending access'",
        "3. Copiez la clé (commence par 're_')",
        "4. Allez dans Supabase Dashboard > Project Settings > Edge Functions > Secrets",
        "5. Ajoutez: Name=RESEND_API_KEY, Value=votre_cle"
      );
    } else if (!resendApiKey.startsWith("re_")) {
      actionItems.push(
        "RESEND_API_KEY a un format invalide",
        "- La clé devrait commencer par 're_'",
        "- Vérifiez que vous avez copié la clé complète",
        "- Générez une nouvelle clé sur resend.com si nécessaire"
      );
    }

    if (!resendDomain || resendDomain === "example.com") {
      actionItems.push(
        "Configurez RESEND_DOMAIN:",
        "- Allez dans Supabase Secrets",
        "- Ajoutez: Name=RESEND_DOMAIN, Value=janiechiro.com"
      );
    }

    if (domainVerificationStatus === "not_found") {
      actionItems.push(
        "Votre domaine n'existe pas dans Resend:",
        "1. Allez sur resend.com/domains",
        "2. Cliquez 'Add Domain'",
        "3. Entrez: janiechiro.com",
        "4. Suivez les instructions pour configurer les DNS records"
      );
    } else if (domainVerificationStatus && domainVerificationStatus !== "verified") {
      actionItems.push(
        "Votre domaine n'est PAS vérifié dans Resend:",
        "1. Allez sur resend.com/domains",
        "2. Sélectionnez votre domaine",
        "3. Configurez les 3 DNS records (SPF, DKIM, DMARC)",
        "4. Attendez 5-30 minutes pour la propagation",
        "5. Cliquez 'Verify Domain'"
      );
    }

    const response = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      summary: {
        critical_errors: criticalErrors,
        warnings: warnings,
        secrets_configured: checks.filter((c) => c.exists).length,
        secrets_valid: checks.filter((c) => c.valid).length,
        secrets_total: checks.length,
      },
      secrets: checks,
      domain_verification: {
        status: domainVerificationStatus,
        details: domainVerificationDetails,
      },
      action_items: actionItems.length > 0 ? actionItems : ["Configuration complète! Vous pouvez tester l'envoi d'emails."],
      next_steps: overallStatus === "ready"
        ? [
            "Testez l'envoi avec le bouton 'Tester Configuration Email' dans le Dashboard",
            "Vérifiez votre boîte mail pour l'email de test",
            "Lancez un test d'annulation pour vérifier le flux complet",
          ]
        : [
            "Suivez les action items ci-dessus dans l'ordre",
            "Exécutez ce diagnostic à nouveau après chaque correction",
            "Une fois status='ready', testez l'envoi d'emails",
          ],
    };

    return new Response(JSON.stringify(response, null, 2), {
      status: overallStatus === "critical" ? 500 : 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error in check-secrets:", error);
    return new Response(
      JSON.stringify({
        error: "Erreur lors de la vérification des secrets",
        message: error.message,
        stack: error.stack,
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
