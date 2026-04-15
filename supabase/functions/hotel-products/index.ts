import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function getAuthClient(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return null;
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const client = getAuthClient(req);
    if (!client) return json({ error: "Unauthorized" }, 401);

    const { data: { user }, error: authError } = await client.auth.getUser();
    if (authError || !user) return json({ error: "Unauthorized" }, 401);

    const hotelId = user.id;
    const url = new URL(req.url);
    const path = url.pathname.replace(/^\/hotel-products/, "");
    const segments = path.split("/").filter(Boolean);

    if (req.method === "GET" && path === "") {
      const category = url.searchParams.get("category");
      let query = client
        .from("products")
        .select("*")
        .eq("hotel_id", hotelId)
        .order("category")
        .order("name");
      if (category) query = query.eq("category", category);
      const { data, error } = await query;
      if (error) return json({ error: error.message }, 400);
      return json({ products: data });
    }

    if (req.method === "POST" && path === "/create") {
      const { name, price, category } = await req.json();
      if (!name || price === undefined) return json({ error: "name and price are required" }, 400);
      if (typeof price !== "number" || price < 0) return json({ error: "price must be >= 0" }, 400);

      const { data, error } = await client
        .from("products")
        .insert({ hotel_id: hotelId, name, price, category: category || "other" })
        .select()
        .maybeSingle();
      if (error) return json({ error: error.message }, 400);
      return json({ product: data }, 201);
    }

    if (req.method === "PUT" && segments[0]) {
      const { name, price, category } = await req.json();
      const updates: Record<string, unknown> = {};
      if (name !== undefined) updates.name = name;
      if (price !== undefined) updates.price = price;
      if (category !== undefined) updates.category = category;

      const { data, error } = await client
        .from("products")
        .update(updates)
        .eq("id", segments[0])
        .eq("hotel_id", hotelId)
        .select()
        .maybeSingle();
      if (error) return json({ error: error.message }, 400);
      if (!data) return json({ error: "Product not found" }, 404);
      return json({ product: data });
    }

    if (req.method === "DELETE" && segments[0]) {
      const { error } = await client
        .from("products")
        .delete()
        .eq("id", segments[0])
        .eq("hotel_id", hotelId);
      if (error) return json({ error: error.message }, 400);
      return json({ message: "Product deleted" });
    }

    if (req.method === "POST" && segments[0] === "reservation" && segments[2] === "add") {
      const reservationId = segments[1];
      const { productId, quantity } = await req.json();
      if (!productId || !quantity) return json({ error: "productId and quantity required" }, 400);

      const { data: product } = await client
        .from("products")
        .select("id, name, price, hotel_id")
        .eq("id", productId)
        .eq("hotel_id", hotelId)
        .maybeSingle();
      if (!product) return json({ error: "Product not found" }, 404);

      const { data, error } = await client
        .from("reservation_products")
        .insert({
          reservation_id: reservationId,
          hotel_id: hotelId,
          product_id: productId,
          product_name: product.name,
          unit_price: product.price,
          quantity,
        })
        .select()
        .maybeSingle();
      if (error) return json({ error: error.message }, 400);
      return json({ item: data }, 201);
    }

    if (req.method === "GET" && segments[0] === "reservation" && segments[1]) {
      const { data, error } = await client
        .from("reservation_products")
        .select("*")
        .eq("reservation_id", segments[1])
        .eq("hotel_id", hotelId)
        .order("created_at");
      if (error) return json({ error: error.message }, 400);
      return json({ items: data });
    }

    if (req.method === "DELETE" && segments[0] === "reservation-item" && segments[1]) {
      const { error } = await client
        .from("reservation_products")
        .delete()
        .eq("id", segments[1])
        .eq("hotel_id", hotelId);
      if (error) return json({ error: error.message }, 400);
      return json({ message: "Item removed" });
    }

    return json({ error: "Not found" }, 404);
  } catch (err) {
    console.error(err);
    return json({ error: "Internal server error" }, 500);
  }
});
