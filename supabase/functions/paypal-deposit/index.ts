import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PAYPAL_CLIENT_ID = Deno.env.get("PAYPAL_CLIENT_ID")!;
const PAYPAL_CLIENT_SECRET = Deno.env.get("PAYPAL_CLIENT_SECRET")!;
const PAYPAL_API_URL = "https://api-m.sandbox.paypal.com"; // Use "https://api-m.paypal.com" for production

const DEPOSIT_AMOUNT = "100.00"; // $100 refundable deposit

async function getPayPalAccessToken(): Promise<string> {
  const auth = btoa(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`);
  
  const response = await fetch(`${PAYPAL_API_URL}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Failed to get PayPal access token:", error);
    throw new Error("Failed to authenticate with PayPal");
  }

  const data = await response.json();
  return data.access_token;
}

async function createPayPalOrder(accessToken: string): Promise<{ id: string; approveUrl: string }> {
  const response = await fetch(`${PAYPAL_API_URL}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: "USD",
            value: DEPOSIT_AMOUNT,
          },
          description: "Crown Auctions - Refundable Bidding Deposit",
        },
      ],
      application_context: {
        brand_name: "Crown Auctions",
        landing_page: "NO_PREFERENCE",
        user_action: "PAY_NOW",
        return_url: `${Deno.env.get("SUPABASE_URL")?.replace("supabase.co", "lovable.app") || "https://localhost:3000"}/deposit-success`,
        cancel_url: `${Deno.env.get("SUPABASE_URL")?.replace("supabase.co", "lovable.app") || "https://localhost:3000"}/deposit-cancel`,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Failed to create PayPal order:", error);
    throw new Error("Failed to create PayPal order");
  }

  const data = await response.json();
  const approveUrl = data.links.find((link: { rel: string; href: string }) => link.rel === "approve")?.href;
  
  console.log("PayPal order created:", data.id);
  return { id: data.id, approveUrl };
}

async function capturePayPalOrder(accessToken: string, orderId: string): Promise<{ captureId: string; status: string }> {
  const response = await fetch(`${PAYPAL_API_URL}/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Failed to capture PayPal order:", error);
    throw new Error("Failed to capture payment");
  }

  const data = await response.json();
  const captureId = data.purchase_units[0]?.payments?.captures[0]?.id;
  
  console.log("PayPal order captured:", captureId);
  return { captureId, status: data.status };
}

async function refundPayPalPayment(accessToken: string, captureId: string, amount: string): Promise<{ refundId: string; status: string }> {
  console.log(`Processing refund for capture: ${captureId}, amount: ${amount}`);
  
  const response = await fetch(`${PAYPAL_API_URL}/v2/payments/captures/${captureId}/refund`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: {
        value: amount,
        currency_code: "USD",
      },
      note_to_payer: "Crown Auctions - Bidding Deposit Refund",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Failed to refund PayPal payment:", error);
    throw new Error(`Failed to process refund: ${error}`);
  }

  const data = await response.json();
  console.log("PayPal refund processed:", data.id, "Status:", data.status);
  return { refundId: data.id, status: data.status };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { action, orderId } = await req.json();
    console.log(`PayPal deposit action: ${action} for user: ${user.id}`);

    const accessToken = await getPayPalAccessToken();

    if (action === "create-order") {
      // Check if user already has a deposit
      const { data: existingDeposit } = await supabase
        .from("user_deposits")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "completed")
        .single();

      if (existingDeposit) {
        return new Response(JSON.stringify({ error: "Deposit already exists" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      const { id, approveUrl } = await createPayPalOrder(accessToken);
      
      // Store pending deposit
      const { data: depositData, error: insertError } = await supabase
        .from("user_deposits")
        .upsert({
          user_id: user.id,
          amount: parseFloat(DEPOSIT_AMOUNT),
          currency: "USD",
          paypal_order_id: id,
          status: "pending",
        }, { onConflict: "user_id" })
        .select()
        .single();

      if (insertError) {
        console.error("Failed to store deposit:", insertError);
        throw new Error("Failed to store deposit record");
      }

      // Log transaction
      if (depositData) {
        await supabase.from("deposit_transactions").insert({
          deposit_id: depositData.id,
          user_id: user.id,
          transaction_type: "deposit_created",
          amount: parseFloat(DEPOSIT_AMOUNT),
          currency: "USD",
          description: "Deposit order created via PayPal",
        });
      }

      return new Response(JSON.stringify({ orderId: id, approveUrl }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (action === "capture-order") {
      if (!orderId) {
        return new Response(JSON.stringify({ error: "Order ID required" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      const { captureId, status } = await capturePayPalOrder(accessToken, orderId);

      if (status === "COMPLETED") {
        // Update deposit status and get deposit data
        const { data: depositData, error: updateError } = await supabase
          .from("user_deposits")
          .update({
            status: "completed",
            paypal_capture_id: captureId,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id)
          .eq("paypal_order_id", orderId)
          .select()
          .single();

        if (updateError) {
          console.error("Failed to update deposit:", updateError);
        }

        // Log transaction
        if (depositData) {
          await supabase.from("deposit_transactions").insert({
            deposit_id: depositData.id,
            user_id: user.id,
            transaction_type: "deposit_completed",
            amount: depositData.amount,
            currency: depositData.currency,
            description: "Deposit payment completed via PayPal",
          });
        }

        return new Response(JSON.stringify({ success: true, captureId }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      return new Response(JSON.stringify({ error: "Payment not completed" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (action === "check-deposit") {
      const { data: deposit } = await supabase
        .from("user_deposits")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "completed")
        .single();

      return new Response(JSON.stringify({ hasDeposit: !!deposit, deposit }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (action === "process-refund") {
      const { depositId } = await req.json().catch(() => ({}));
      
      // Check if user is admin using service role
      const serviceSupabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      const { data: adminRole } = await serviceSupabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .single();

      if (!adminRole) {
        return new Response(JSON.stringify({ error: "Admin access required" }), {
          status: 403,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      // Get deposit details
      const { data: deposit, error: depositError } = await serviceSupabase
        .from("user_deposits")
        .select("*")
        .eq("id", depositId)
        .single();

      if (depositError || !deposit) {
        console.error("Deposit not found:", depositError);
        return new Response(JSON.stringify({ error: "Deposit not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      if (deposit.status !== "refund_requested") {
        return new Response(JSON.stringify({ error: "Deposit is not in refund_requested status" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      if (!deposit.paypal_capture_id) {
        return new Response(JSON.stringify({ error: "No PayPal capture ID found" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      // Process refund via PayPal
      const { refundId, status } = await refundPayPalPayment(
        accessToken,
        deposit.paypal_capture_id,
        deposit.amount.toString()
      );

      if (status === "COMPLETED" || status === "PENDING") {
        // Update deposit status
        const { error: updateError } = await serviceSupabase
          .from("user_deposits")
          .update({
            status: "refunded",
            refunded_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", depositId);

        if (updateError) {
          console.error("Failed to update deposit status:", updateError);
        }

        // Log refund transaction
        await serviceSupabase.from("deposit_transactions").insert({
          deposit_id: depositId,
          user_id: deposit.user_id,
          transaction_type: "refund_approved",
          amount: deposit.amount,
          currency: deposit.currency,
          description: `Refund processed via PayPal (Refund ID: ${refundId})`,
        });

        console.log(`Refund successful for deposit ${depositId}, refund ID: ${refundId}`);
        return new Response(JSON.stringify({ success: true, refundId, status }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      return new Response(JSON.stringify({ error: "Refund failed", status }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("PayPal deposit error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
