import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
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

    // Get authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Not authenticated");
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error("Not authenticated");

    const { orderId, message } = await req.json();
    if (!orderId || !message) throw new Error("Order ID and message are required");

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Verify the order belongs to this user
    const { data: order, error: orderError } = await serviceClient
      .from("orders")
      .select("id, email")
      .eq("id", orderId)
      .eq("user_id", user.id)
      .single();

    if (orderError || !order) throw new Error("Order not found or access denied");

    // Get admin emails
    const { data: adminRoles } = await serviceClient
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");

    const adminEmails: string[] = [];
    if (adminRoles) {
      for (const role of adminRoles) {
        const { data: { user: adminUser } } = await serviceClient.auth.admin.getUserById(role.user_id);
        if (adminUser?.email) adminEmails.push(adminUser.email);
      }
    }

    // Log the query (in production you'd send actual emails)
    console.log("Support query received:", {
      from: user.email,
      orderId,
      message,
      adminEmails,
    });

    return new Response(
      JSON.stringify({ success: true, message: "Query sent to admin team" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("Contact admin error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
