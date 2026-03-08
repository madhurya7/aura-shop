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
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Try to get authenticated user (optional for guest checkout)
    let user = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data } = await supabase.auth.getUser(token);
      user = data.user;
    }

    const { items, email, shippingAddress } = await req.json();

    if (!items?.length) throw new Error("No items provided");
    if (!email) throw new Error("Email is required");

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Validate stock availability before proceeding
    for (const item of items) {
      const { data: product, error } = await serviceClient
        .from("products")
        .select("stock_quantity, name")
        .eq("id", item.productId)
        .single();

      if (error || !product) throw new Error(`Product not found: ${item.productId}`);
      if (product.stock_quantity < item.quantity) {
        throw new Error(`Insufficient stock for "${product.name}": only ${product.stock_quantity} available`);
      }
    }

    // Check/create Stripe customer
    const customers = await stripe.customers.list({ email, limit: 1 });
    let customerId: string | undefined;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    // Create checkout session with price_data for dynamic cart items
    const lineItems = items.map((item: any) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: item.name,
        },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    }));

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      customer_email: customerId ? undefined : email,
      line_items: lineItems,
      mode: "payment",
      success_url: `${req.headers.get("origin")}/order-confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/checkout`,
      metadata: {
        user_id: user?.id || "",
        shipping_address: JSON.stringify(shippingAddress),
        items: JSON.stringify(items.map((i: any) => ({ productId: i.productId, quantity: i.quantity, price: i.price }))),
      },
    };

    const session = await stripe.checkout.sessions.create(sessionParams);

    const totalPrice = items.reduce((sum: number, i: any) => sum + i.price * i.quantity, 0);

    const { data: order, error: orderError } = await serviceClient
      .from("orders")
      .insert({
        email,
        user_id: user?.id || null,
        total_price: totalPrice,
        order_status: "pending",
        stripe_payment_id: session.id,
        shipping_address: shippingAddress,
      })
      .select()
      .single();

    if (orderError) {
      console.error("Order creation error:", orderError);
    } else if (order) {
      // Insert order items
      const orderItems = items.map((item: any) => ({
        order_id: order.id,
        product_id: item.productId,
        quantity: item.quantity,
        price_at_purchase: item.price,
      }));

      await serviceClient.from("order_items").insert(orderItems);

      // Decrement stock for each product
      for (const item of items) {
        await serviceClient.rpc("decrement_stock", {
          p_product_id: item.productId,
          p_quantity: item.quantity,
        });
      }
    }

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Checkout error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
