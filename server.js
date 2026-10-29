
const express = require("express");
const helmet = require("helmet");
const path = require("path");
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

// Serve website files.
app.use(express.static(path.join(__dirname, "public")));

// Health check.
app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    app: "EatHub",
    databaseConfigured: Boolean(supabase)
  });
});

// List restaurants.
app.get("/api/restaurants", async (req, res) => {
  if (!supabase) {
    return res.status(503).json({
      error: "Database configuration is incomplete."
    });
  }

  try {
    const { data, error } = await supabase
      .from("restaurants")
      .select("id, name, description, logo_url, currency, status")
      .order("name", { ascending: true });

    if (error) {
      console.error("Restaurants query failed:", error.message);
      return res.status(500).json({
        error: "Unable to load restaurants."
      });
    }

    return res.json({ restaurants: data || [] });
  } catch (error) {
    console.error("Restaurants endpoint failed:", error.message);
    return res.status(500).json({
      error: "An unexpected error occurred."
    });
  }
});

// Load one approved restaurant's menu by UUID.
app.get("/api/restaurants/:restaurantId/menu", async (req, res) => {
  if (!supabase) {
    return res.status(503).json({
      error: "Database configuration is incomplete."
    });
  }

  const restaurantId = req.params.restaurantId;
  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (!uuidPattern.test(restaurantId)) {
    return res.status(400).json({
      error: "Invalid restaurant ID."
    });
  }

  try {
    const { data: restaurant, error: restaurantError } = await supabase
      .from("restaurants")
      .select("id, name, description, logo_url, currency")
      .eq("id", restaurantId)
      .eq("status", "approved")
      .maybeSingle();

    if (restaurantError) throw restaurantError;

    if (!restaurant) {
      return res.status(404).json({
        error: "Approved restaurant not found."
      });
    }

    const { data: dishes, error: dishesError } = await supabase
      .from("dishes")
      .select("id, name, description, price, image_url, is_available")
      .eq("restaurant_id", restaurantId)
      .eq("is_available", true)
      .order("name");

    if (dishesError) throw dishesError;

    return res.json({
      restaurant,
      dishes: dishes || []
    });
  } catch (error) {
    console.error("Menu API error:", error.message);
    return res.status(500).json({
      error: "Unable to load the menu."
    });
  }
});

// JSON response for unknown API endpoints.
app.use("/api", (req, res) => {
  res.status(404).json({
    error: "API endpoint not found."
  });
});

// Website 404 page.
app.use((req, res) => {
  res.status(404).sendFile(
    path.join(__dirname, "public", "404.html"),
    (error) => {
      if (error && !res.headersSent) {
        res.status(404).send("Page not found.");
      }
    }
  );
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`EatHub listening on port ${PORT}`);
});

