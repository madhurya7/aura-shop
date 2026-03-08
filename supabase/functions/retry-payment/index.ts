import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Not authenticated");

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error("Not authenticated");

    const { orderId } = await req.json();
    if (!orderId) throw new Error("Order ID is required");

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Fetch the pending order belonging to this user
    const { data: order, error: orderError } = await serviceClient
      .from("orders")
      .select("*, order_items(*, products:product_id(name, price))")
      .eq("id", orderId)
      .eq("user_id", user.id)
      .eq("order_status", "pending")
      .single();

    if (orderError || !order) throw new Error("Order not found or not eligible for retry");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Check/create Stripe customer
    const customers = await stripe.customers.list({ email: order.email, limit: 1 });
    let customerId: string | undefined;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    // Build line items from order_items
    const lineItems = order.order_items.map((item: any) => ({
      price_data: {
        currency: "usd",
        product_data: { name: item.products?.name || "Product" },
        unit_amount: Math.round(Number(item.price_at_purchase) * 100),
      },
      quantity: item.quantity,
    }));

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : order.email,
      line_items: lineItems,
      mode: "payment",
      success_url: `${req.headers.get("origin")}/order-confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/orders`,
      metadata: {
        user_id: user.id,
        shipping_address: JSON.stringify(order.shipping_address),
        items: JSON.stringify(order.order_items.map((i: any) => ({
          productId: i.product_id,
          quantity: i.quantity,
          price: i.price_at_purchase,
        }))),
      },
    });

    // Update the order with the new stripe session ID
    await serviceClient
      .from("orders")
      .update({ stripe_payment_id: session.id, updated_at: new Date().toISOString() })
      .eq("id", orderId);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Retry payment error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
