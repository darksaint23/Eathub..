
const express = require("express");
const helmet = require("helmet");
const { createClient } = require("@supabase/supabase-js");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(express.json({ limit: "1mb" }));

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

app.get("/", (req, res) => {
  res.type("html").send(`
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>EatHub</title>
      </head>
      <body style="font-family:system-ui;max-width:700px;margin:50px auto;padding:20px">
        <h1>EatHub</h1>
        <p>Restaurant menus, connected in one place.</p>
        <p>Scan a restaurant's QR code to view its menu.</p>
      </body>
    </html>
  `);
});

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    app: "EatHub",
    databaseConfigured: Boolean(supabase)
  });
});

app.get("/api/restaurants/:restaurantId/menu", async (req, res) => {
  if (!supabase) {
    return res.status(503).json({
      error: "Database configuration is not complete."
    });
  }

  const { restaurantId } = req.params;

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(restaurantId)) {
    return res.status(400).json({ error: "Invalid restaurant ID." });
  }

  try {
    const { data: restaurant, error: restaurantError } =
      await supabase
        .from("restaurants")
        .select("id, name")
        .eq("id", restaurantId)
        .maybeSingle();

    if (restaurantError) throw restaurantError;

    if (!restaurant) {
      return res.status(404).json({ error: "Restaurant not found." });
    }

    const { data: dishes, error: dishesError } =
      await supabase
        .from("dishes")
        .select("id, name, description, price, image_url, is_available")
        .eq("restaurant_id", restaurantId)
        .eq("is_available", true)
        .order("name");

    if (dishesError) throw dishesError;

    return res.json({ restaurant, dishes: dishes || [] });
  } catch (error) {
    console.error("Menu request failed:", error.message);
    return res.status(500).json({ error: "Unable to load this menu." });
  }
});

app.use((req, res) => {
  res.status(404).json({ error: "Endpoint not found." });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`EatHub server listening on port ${PORT}`);
});
