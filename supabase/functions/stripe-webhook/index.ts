import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

serve(async (req) => {
  const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
    apiVersion: "2025-08-27.basil",
  });

  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!webhookSecret) {
    console.error("Missing STRIPE_WEBHOOK_SECRET");
    return new Response("Server configuration error", { status: 500 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return new Response("No signature", { status: 400 });
  }

  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret,
      undefined,
      Stripe.createSubtleCryptoProvider()
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return new Response("Invalid signature", { status: 400 });
  }

  console.log("Processing event:", event.type);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    // Update order status from pending to paid
    const { data: order, error } = await supabase
      .from("orders")
      .update({
        order_status: "paid",
        updated_at: new Date().toISOString(),
      })
      .eq("stripe_payment_id", session.id)
      .select("id, total_price")
      .single();

    if (error) {
      console.error("Failed to update order:", error);
      return new Response("Database error", { status: 500 });
    }

    // Retrieve payment intent details from Stripe
    let paymentIntentId = session.payment_intent as string | null;
    let chargeId: string | null = null;
    let paymentMethod: string | null = null;

    if (paymentIntentId) {
      try {
        const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
        paymentMethod = pi.payment_method as string | null;
        if (pi.latest_charge) {
          chargeId = pi.latest_charge as string;
        }
      } catch (e) {
        console.error("Failed to retrieve payment intent details:", e.message);
      }
    }

    // Insert payment record
    const { error: paymentError } = await supabase
      .from("payments")
      .insert({
        order_id: order.id,
        stripe_payment_intent_id: paymentIntentId,
        stripe_charge_id: chargeId,
        amount: order.total_price,
        currency: session.currency || "usd",
        payment_status: "succeeded",
        payment_method: paymentMethod,
      });

    if (paymentError) {
      console.error("Failed to insert payment:", paymentError);
    }

    console.log("Order updated to paid and payment recorded for session:", session.id);
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
});
