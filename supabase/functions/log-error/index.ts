import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ErrorLog {
  id: string;
  timestamp: string;
  errorCode: string;
  message: string;
  stack?: string;
  userId?: string;
  context?: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const errorLog: ErrorLog = await req.json();

    console.error(`[${errorLog.severity.toUpperCase()}] ${errorLog.errorCode}:`, {
      id: errorLog.id,
      message: errorLog.message,
      userId: errorLog.userId,
      context: errorLog.context,
      timestamp: errorLog.timestamp,
    });

    if (errorLog.stack) {
      console.error('Stack trace:', errorLog.stack);
    }

    return new Response(
      JSON.stringify({
        success: true,
        logged: true,
        errorId: errorLog.id,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error logging error:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to log error",
        message: error instanceof Error ? error.message : "Unknown error",
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
