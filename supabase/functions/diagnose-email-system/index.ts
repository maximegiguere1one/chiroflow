import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface DiagnosticResult {
  category: string;
  status: "success" | "warning" | "error";
  message: string;
  details?: any;
}

function createSafeResponse(data: any, status: number = 200) {
  try {
    const jsonString = JSON.stringify(data, null, 2);
    console.log(`✅ Response prepared: ${jsonString.length} bytes, status ${status}`);
    return new Response(jsonString, {
      status,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("❌ Failed to stringify response:", error);
    return new Response(
      JSON.stringify({
        error: "Response serialization failed",
        message: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
}

Deno.serve(async (req: Request) => {
  const requestId = crypto.randomUUID();
  console.log(`🔍 [${requestId}] Diagnostic request received at ${new Date().toISOString()}`);

  if (req.method === "OPTIONS") {
    console.log(`✅ [${requestId}] OPTIONS preflight handled`);
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    console.log(`📊 [${requestId}] Starting diagnostic checks...`);
    const diagnostics: DiagnosticResult[] = [];
    let checkCount = 0;

    // 1. Vérifier les variables d'environnement Resend
    console.log(`📋 [${requestId}] Check ${++checkCount}: Environment variables`);
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const resendDomain = Deno.env.get("RESEND_DOMAIN");
    const appDomain = Deno.env.get("APP_DOMAIN");

    diagnostics.push({
      category: "Configuration Resend",
      status: resendApiKey ? "success" : "error",
      message: resendApiKey
        ? "✅ RESEND_API_KEY est configurée"
        : "❌ RESEND_API_KEY est MANQUANTE",
      details: {
        apiKeyExists: !!resendApiKey,
        apiKeyFormat: resendApiKey
          ? resendApiKey.startsWith("re_")
            ? "Correct (commence par re_)"
            : "⚠️ Format incorrect (devrait commencer par re_)"
          : "N/A",
        domain: resendDomain || "non configuré",
        appDomain: appDomain || "non configuré",
      },
    });
    console.log(`✅ [${requestId}] Check ${checkCount} completed`);

    // 2. Vérifier la validité de l'API Key Resend (sans envoyer d'email)
    if (resendApiKey) {
      console.log(`📋 [${requestId}] Check ${++checkCount}: Resend API Key validation`);
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const domainsResponse = await fetch("https://api.resend.com/domains", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
          },
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        const responseText = await domainsResponse.text();
        let domainsResult;
        try {
          domainsResult = JSON.parse(responseText);
        } catch (parseError) {
          console.error(`❌ [${requestId}] Failed to parse Resend response:`, responseText.substring(0, 200));
          throw new Error("Invalid JSON response from Resend API");
        }

        if (domainsResponse.ok) {
          const verifiedDomains = domainsResult.data?.filter((d: any) => d.status === "verified") || [];
          const configuredDomain = resendDomain || "non configuré";
          const isDomainVerified = verifiedDomains.some((d: any) => d.name === configuredDomain);

          diagnostics.push({
            category: "API Key Resend",
            status: "success",
            message: "✅ API Key Resend valide",
            details: {
              totalDomains: domainsResult.data?.length || 0,
              verifiedDomains: verifiedDomains.length,
              verifiedDomainsList: verifiedDomains.map((d: any) => d.name),
              configuredDomain,
              isDomainVerified,
            },
          });

          if (!isDomainVerified && configuredDomain !== "non configuré") {
            diagnostics.push({
              category: "Configuration Domaine",
              status: "error",
              message: `❌ Le domaine configuré "${configuredDomain}" n'est PAS vérifié dans Resend`,
              details: {
                configuredDomain,
                verifiedDomains: verifiedDomains.map((d: any) => d.name),
                hint: "Les emails seront envoyés à delivered@resend.dev jusqu'à ce que le domaine soit vérifié",
              },
            });
          } else if (isDomainVerified) {
            diagnostics.push({
              category: "Configuration Domaine",
              status: "success",
              message: `✅ Le domaine "${configuredDomain}" est vérifié et prêt`,
              details: {
                configuredDomain,
                status: "verified",
              },
            });
          }
        } else {
          console.warn(`⚠️ [${requestId}] Resend API returned ${domainsResponse.status}`);
          diagnostics.push({
            category: "API Key Resend",
            status: "error",
            message: `❌ API Key invalide: ${domainsResult.message || "Vérifiez votre clé"}`,
            details: {
              statusCode: domainsResponse.status,
              response: domainsResult,
            },
          });
        }
        console.log(`✅ [${requestId}] Check ${checkCount} completed`);
      } catch (error) {
        console.error(`❌ [${requestId}] Resend API check failed:`, error);
        diagnostics.push({
          category: "API Key Resend",
          status: "error",
          message: `❌ Impossible de vérifier l'API Key: ${error.message}`,
          details: {
            error: error.message,
            name: error.name,
          },
        });
      }
    }

    // 3. Vérifier la configuration Supabase
    console.log(`📋 [${requestId}] Check ${++checkCount}: Supabase configuration`);
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    diagnostics.push({
      category: "Configuration Supabase",
      status: supabaseUrl && supabaseKey ? "success" : "error",
      message:
        supabaseUrl && supabaseKey
          ? "✅ Variables Supabase configurées"
          : "❌ Variables Supabase manquantes",
      details: {
        supabaseUrlExists: !!supabaseUrl,
        serviceRoleKeyExists: !!supabaseKey,
      },
    });
    console.log(`✅ [${requestId}] Check ${checkCount} completed`);

    // 4. Vérifier les tables de la base de données
    if (supabaseUrl && supabaseKey) {
      console.log(`📋 [${requestId}] Check ${++checkCount}: Database tables`);
      const supabase = createClient(supabaseUrl, supabaseKey);

      const tables = [
        "waitlist",
        "appointment_slot_offers",
        "slot_offer_invitations",
        "waitlist_notifications",
        "waitlist_settings",
      ];

      for (const table of tables) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);

          const { count, error } = await supabase
            .from(table)
            .select("*", { count: "exact", head: true })
            .abortSignal(controller.signal);

          clearTimeout(timeoutId);

          diagnostics.push({
            category: `Table: ${table}`,
            status: error ? "error" : "success",
            message: error
              ? `❌ Erreur d'accès à ${table}`
              : `✅ Table ${table} accessible (${count ?? 0} entrées)`,
            details: { count: count ?? 0, error: error?.message },
          });
        } catch (error) {
          console.error(`❌ [${requestId}] Table ${table} check failed:`, error.message);
          diagnostics.push({
            category: `Table: ${table}`,
            status: "error",
            message: `❌ Exception lors de l'accès à ${table}`,
            details: { error: error.message, name: error.name },
          });
        }
      }
      console.log(`✅ [${requestId}] Check ${checkCount} completed`);

      // 5. Vérifier les logs du trigger
      console.log(`📋 [${requestId}] Check ${++checkCount}: Trigger logs`);
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const { data: triggerLogs, error: logError } = await supabase
          .from("waitlist_trigger_logs")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(1)
          .abortSignal(controller.signal);

        clearTimeout(timeoutId);

        diagnostics.push({
          category: "Trigger Database",
          status: logError ? "warning" : "success",
          message: logError
            ? "⚠️ Impossible de vérifier les logs du trigger"
            : triggerLogs && triggerLogs.length > 0
            ? `✅ Trigger actif - Dernier log: ${triggerLogs[0].status}`
            : "ℹ️ Trigger configuré (aucune activité récente)",
          details: {
            latest_log: triggerLogs?.[0] || null,
            error: logError?.message || null,
          },
        });
        console.log(`✅ [${requestId}] Check ${checkCount} completed`);
      } catch (error) {
        console.error(`⚠️ [${requestId}] Trigger logs check failed:`, error.message);
        diagnostics.push({
          category: "Trigger Database",
          status: "warning",
          message: "⚠️ Impossible de vérifier les logs du trigger",
          details: { error: error.message, name: error.name },
        });
      }

      // 6. Vérifier les invitations récentes
      console.log(`📋 [${requestId}] Check ${++checkCount}: Recent invitations`);
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const { data: recentInvitations, error: invError } = await supabase
          .from("slot_offer_invitations")
          .select("*")
          .order("sent_at", { ascending: false })
          .limit(5)
          .abortSignal(controller.signal);

        clearTimeout(timeoutId);

        const safeInvitations = recentInvitations?.map((inv) => ({
          id: inv.id,
          status: inv.status,
          sent_at: inv.sent_at,
        })) || [];

        diagnostics.push({
          category: "Invitations Récentes",
          status: invError ? "error" : "success",
          message: invError
            ? "❌ Erreur lors de la récupération des invitations"
            : `✅ ${recentInvitations?.length || 0} invitations trouvées`,
          details: {
            count: recentInvitations?.length || 0,
            invitations: safeInvitations,
          },
        });
        console.log(`✅ [${requestId}] Check ${checkCount} completed`);
      } catch (error) {
        console.error(`❌ [${requestId}] Invitations check failed:`, error.message);
        diagnostics.push({
          category: "Invitations Récentes",
          status: "error",
          message: "❌ Exception lors de la récupération des invitations",
          details: { error: error.message, name: error.name },
        });
      }

      // 7. Vérifier les notifications envoyées
      console.log(`📋 [${requestId}] Check ${++checkCount}: Notifications`);
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const { data: notifications, error: notifError } = await supabase
          .from("waitlist_notifications")
          .select("*")
          .order("sent_at", { ascending: false })
          .limit(5)
          .abortSignal(controller.signal);

        clearTimeout(timeoutId);

        const safeNotifications = notifications?.slice(0, 3).map((n) => ({
          id: n.id,
          status: n.status,
          sent_at: n.sent_at,
        })) || [];

        diagnostics.push({
          category: "Notifications Envoyées",
          status: notifError ? "error" : "success",
          message: notifError
            ? "❌ Erreur lors de la récupération des notifications"
            : `✅ ${notifications?.length || 0} notifications trouvées`,
          details: {
            count: notifications?.length || 0,
            recent: safeNotifications,
          },
        });
        console.log(`✅ [${requestId}] Check ${checkCount} completed`);
      } catch (error) {
        console.error(`❌ [${requestId}] Notifications check failed:`, error.message);
        diagnostics.push({
          category: "Notifications Envoyées",
          status: "error",
          message: "❌ Exception lors de la récupération des notifications",
          details: { error: error.message, name: error.name },
        });
      }
    }

    // 8. Résumé et recommandations
    console.log(`📋 [${requestId}] Preparing summary...`);
    const errors = diagnostics.filter((d) => d.status === "error").length;
    const warnings = diagnostics.filter((d) => d.status === "warning").length;
    const successes = diagnostics.filter((d) => d.status === "success").length;

    const recommendations: string[] = [];

    if (!resendApiKey) {
      recommendations.push(
        "🔧 CRITIQUE: Ajoutez RESEND_API_KEY dans Supabase Dashboard > Project Settings > Edge Functions > Secrets"
      );
    }

    if (resendApiKey && !resendApiKey.startsWith("re_")) {
      recommendations.push(
        "⚠️ WARNING: Votre RESEND_API_KEY ne commence pas par 're_'. Vérifiez que c'est la bonne clé."
      );
    }

    if (!resendDomain || resendDomain === "example.com") {
      recommendations.push(
        "🔧 IMPORTANT: Configurez RESEND_DOMAIN avec votre domaine vérifié (ex: janiechiro.com)",
        "⚠️ Sans domaine vérifié, les emails iront à delivered@resend.dev (inbox de test Resend)"
      );
    }

    if (!appDomain) {
      recommendations.push(
        "🔧 Configurez APP_DOMAIN pour les URLs d'invitation dans les emails"
      );
    }

    const domainNotVerified = diagnostics.find(
      d => d.category === "Configuration Domaine" && d.status === "error"
    );
    if (domainNotVerified) {
      recommendations.push(
        "🚨 CRITIQUE: Votre domaine n'est pas vérifié dans Resend!",
        "📧 Tous les emails vont actuellement à delivered@resend.dev au lieu de vos patients",
        "✅ Action requise: Allez sur resend.com/domains et vérifiez votre domaine",
        "📖 Consultez RESEND_SETUP_GUIDE.md pour les instructions détaillées"
      );
    }

    const summary = {
      request_id: requestId,
      timestamp: new Date().toISOString(),
      overall_status:
        errors === 0 ? (warnings === 0 ? "healthy" : "degraded") : "critical",
      diagnostics_run: diagnostics.length,
      results: {
        successes,
        warnings,
        errors,
      },
      diagnostics,
      recommendations,
      next_steps:
        errors === 0
          ? [
              "✅ Système opérationnel",
              "📧 Testez l'envoi d'email via /test-email",
              "📊 Simulez une annulation pour tester le flux complet",
            ]
          : [
              "🔧 Corrigez les erreurs critiques ci-dessus",
              "📖 Consultez DEPLOYMENT_CHECKLIST.md",
              "💬 Contactez le support si nécessaire",
            ],
    };

    console.log(`✅ [${requestId}] Diagnostic completed: ${successes} success, ${warnings} warnings, ${errors} errors`);
    return createSafeResponse(summary, errors === 0 ? 200 : 500);
  } catch (error) {
    console.error(`❌ [${requestId}] Fatal diagnostic error:`, error);
    const errorResponse = {
      request_id: requestId,
      error: "Erreur lors du diagnostic",
      message: error.message || "Unknown error",
      name: error.name || "Error",
      timestamp: new Date().toISOString(),
    };
    return createSafeResponse(errorResponse, 500);
  }
});