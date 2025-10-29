import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface TokenizeRequest {
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  cardholderName: string;
  billingAddress: {
    line1: string;
    line2?: string;
    city: string;
    province: string;
    postalCode: string;
    country: string;
  };
  patientId: string;
  cardNickname?: string;
  setPrimary?: boolean;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const requestData: TokenizeRequest = await req.json();

    const {
      cardNumber,
      expiryMonth,
      expiryYear,
      cvv,
      cardholderName,
      billingAddress,
      patientId,
      cardNickname,
      setPrimary = false,
    } = requestData;

    const lastFourDigits = cardNumber.slice(-4);
    const cardBrand = detectCardBrand(cardNumber);

    const mockToken = `tok_${crypto.randomUUID().replace(/-/g, '')}`;

    const response = {
      success: true,
      token: mockToken,
      cardBrand,
      lastFourDigits,
      message: "Payment method tokenized successfully",
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error: any) {
    console.error("Error tokenizing payment method:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to tokenize payment method",
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

function detectCardBrand(cardNumber: string): string {
  const cleaned = cardNumber.replace(/\s/g, "");

  if (/^4/.test(cleaned)) return "Visa";
  if (/^5[1-5]/.test(cleaned)) return "Mastercard";
  if (/^3[47]/.test(cleaned)) return "American Express";
  if (/^6(?:011|5)/.test(cleaned)) return "Discover";

  return "Unknown";
}
