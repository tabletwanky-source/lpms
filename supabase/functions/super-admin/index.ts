import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPER_ADMIN_EMAIL = "wankyacademy@gmail.com";

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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !user || user.email !== SUPER_ADMIN_EMAIL) {
      return new Response(JSON.stringify({ error: "Access denied. Super admin only." }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const path = url.pathname.replace(/^\/super-admin/, "");

    // GET /stats
    if (req.method === "GET" && path === "/stats") {
      const { data: { users } } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
      const { count: invoiceCount } = await supabaseAdmin.from("invoices").select("*", { count: "exact", head: true });
      const { data: revenueData } = await supabaseAdmin.from("invoices").select("total");
      const totalRevenue = (revenueData ?? []).reduce((sum: number, inv: any) => sum + (Number(inv.total) || 0), 0);
      const { count: promoCount } = await supabaseAdmin.from("promo_codes").select("*", { count: "exact", head: true });
      const { count: bookingCount } = await supabaseAdmin.from("public_bookings").select("*", { count: "exact", head: true });

      return new Response(JSON.stringify({
        totalUsers: users?.length ?? 0,
        totalRevenue,
        totalInvoices: invoiceCount ?? 0,
        totalPromos: promoCount ?? 0,
        totalBookings: bookingCount ?? 0,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // GET /users
    if (req.method === "GET" && path === "/users") {
      const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
      if (error) throw error;
      const sanitized = (users ?? []).map((u: any) => ({
        id: u.id,
        email: u.email,
        hotelName: u.user_metadata?.hotel_name || "—",
        managerName: u.user_metadata?.manager_name || "—",
        plan: u.user_metadata?.admin_plan || "Free",
        status: u.user_metadata?.status || "active",
        createdAt: u.created_at,
        lastSignIn: u.last_sign_in_at,
        phone: u.user_metadata?.phone || "",
      }));
      return new Response(JSON.stringify({ users: sanitized }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // POST /users/:id/plan
    if (req.method === "POST" && path.startsWith("/users/") && path.endsWith("/plan")) {
      const userId = path.split("/")[2];
      const { plan } = await req.json();
      const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: { admin_plan: plan },
      });
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // POST /users/:id/status
    if (req.method === "POST" && path.startsWith("/users/") && path.endsWith("/status")) {
      const userId = path.split("/")[2];
      const { status } = await req.json();
      const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: { status },
      });
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // GET /analytics
    if (req.method === "GET" && path === "/analytics") {
      const { data: { users } } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
      const { data: invoices } = await supabaseAdmin.from("invoices").select("total, created_at");

      const last30Days: { date: string; users: number; revenue: number }[] = [];
      for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split("T")[0];
        const dayUsers = (users ?? []).filter((u: any) => u.created_at?.startsWith(dateStr)).length;
        const dayRevenue = (invoices ?? [])
          .filter((inv: any) => inv.created_at?.startsWith(dateStr))
          .reduce((sum: number, inv: any) => sum + (Number(inv.total) || 0), 0);
        last30Days.push({ date: dateStr, users: dayUsers, revenue: dayRevenue });
      }

      return new Response(JSON.stringify({ last30Days }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // POST /promo-codes
    if (req.method === "POST" && path === "/promo-codes") {
      const body = await req.json();
      const { data, error } = await supabaseAdmin.from("promo_codes").insert({
        code: body.code.toUpperCase().trim(),
        discount: Number(body.discount),
        type: body.type,
        expires_at: body.expires_at || null,
        max_uses: Number(body.max_uses) || 0,
      }).select().single();
      if (error) throw error;
      return new Response(JSON.stringify({ promo: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // DELETE /promo-codes/:id
    if (req.method === "DELETE" && path.startsWith("/promo-codes/")) {
      const promoId = path.split("/")[2];
      const { error } = await supabaseAdmin.from("promo_codes").delete().eq("id", promoId);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // PATCH /promo-codes/:id
    if (req.method === "PATCH" && path.startsWith("/promo-codes/")) {
      const promoId = path.split("/")[2];
      const body = await req.json();
      const { error } = await supabaseAdmin.from("promo_codes").update(body).eq("id", promoId);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // POST /notifications
    if (req.method === "POST" && path === "/notifications") {
      const { title, message } = await req.json();
      const { data, error } = await supabaseAdmin.from("global_notifications").insert({ title, message }).select().single();
      if (error) throw error;
      return new Response(JSON.stringify({ notification: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // GET /settings
    if (req.method === "GET" && path === "/settings") {
      const { data } = await supabaseAdmin.from("system_settings").select("*");
      const settings: Record<string, string> = {};
      (data ?? []).forEach((row: any) => { settings[row.key] = row.value; });
      return new Response(JSON.stringify({ settings }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // PATCH /settings
    if (req.method === "PATCH" && path === "/settings") {
      const updates = await req.json();
      for (const [key, value] of Object.entries(updates)) {
        await supabaseAdmin.from("system_settings").upsert({ key, value: String(value), updated_at: new Date().toISOString() });
      }
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
