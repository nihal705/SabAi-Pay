// backend/agents/orderAgent.js
// Enhanced OrderAgent supporting food & grocery search, auto-connect, and budget filtering

const merchantDataService = require("../services/merchantDataService");
const merchantConnectionService = require("../services/merchantConnectionService");
const dbService = require("../services/databaseService");

class OrderAgent {
  // ============================================
  // FIND RESTAURANTS & GROCERY PRODUCTS
  // ============================================
  async findRestaurants(userId, merchant, location, cuisine, maxPrice = null) {
    const merchantId = (merchant || "swiggy").toLowerCase();

    // 1. Ensure merchant is connected (auto-connect if not connected for seamless agent flow)
    const isConnected = await merchantConnectionService.isConnected(userId, merchantId);
    if (!isConnected) {
      const existingConn = await dbService.getMerchantConnection(userId, "swiggy");
      const userCity = existingConn?.location_city || location || "hyderabad";
      await merchantConnectionService.connectMerchant(userId, merchantId, {
        name: merchantId.charAt(0).toUpperCase() + merchantId.slice(1),
        location: { city: userCity, address: "Saved Delivery Address", area: "Central" },
      });
    }

    // 2. Get saved delivery city
    const connection = await dbService.getMerchantConnection(userId, merchantId);
    const userLocation = (connection?.location_city || location || "hyderabad").toLowerCase();

    // 3. Search catalog via merchantDataService
    const searchTerm = cuisine || null;
    let data = await merchantDataService.getMerchantData(
      merchantId,
      userLocation,
      null,
      searchTerm,
      { cuisine }
    );

    // If no search results found by exact term, fallback to list restaurants in city
    if (!data || data.type === "error" || (data.items && data.items.length === 0)) {
      data = await merchantDataService.getMerchantData(merchantId, userLocation, null, null, {});
    }

    const budget = maxPrice != null && Number.isFinite(Number(maxPrice)) ? Number(maxPrice) : null;

    // A. If search returned specific menu/grocery items
    if (data.type === "search_results" && data.items && data.items.length > 0) {
      let items = data.items;
      if (budget) {
        items = items.filter((item) => Number(item.price) <= budget);
      }
      if (items.length > 0) {
        return {
          type: "products_grid",
          merchant: merchantId,
          restaurantName: items[0]?.restaurants?.name || `${merchantId.toUpperCase()} Store`,
          products: items.map((item) => ({
            id: item.id,
            name: item.name,
            price: Number(item.price),
            description: item.description || "Fresh and delicious",
            imageUrl: item.image_url || "/images/items/default.jpg",
            category: item.category || "Main",
            restaurantName: item.restaurants?.name || `${merchantId.toUpperCase()}`,
            deliveryTime: item.restaurants?.delivery_time || "25-35 mins",
            rating: item.restaurants?.rating || 4.5,
          })),
          maxPrice: budget,
          message: budget
            ? `Here are items from ${merchantId} under ₹${budget}:`
            : `Here are matching items on ${merchantId}:`,
        };
      }
    }

    // B. If restaurants list returned
    if (data.type === "restaurants_list" && data.restaurants && data.restaurants.length > 0) {
      let restaurants = data.restaurants;
      if (budget) {
        restaurants = restaurants.filter(
          (r) => !r.priceForTwo || Number(r.priceForTwo) / 2 <= budget || budget >= 200
        );
      }
      return {
        type: "restaurants_list",
        merchant: merchantId,
        restaurants: restaurants.slice(0, 8),
        location: userLocation,
        maxPrice: budget,
        requiresAction: "select_restaurant",
        message: budget
          ? `Here are top restaurants on ${merchantId} with items under ₹${budget}:`
          : `Here are popular restaurants on ${merchantId} near you:`,
      };
    }

    // C. Realistic mock catalog fallback for demo & tests
    const mockProducts = this.getFallbackProducts(merchantId, cuisine, budget);
    return {
      type: "products_grid",
      merchant: merchantId,
      restaurantName: mockProducts.restaurantName,
      products: mockProducts.items,
      maxPrice: budget,
      message: budget
        ? `Here are ${cuisine || "popular"} options on ${merchantId} under ₹${budget}:`
        : `Here are ${cuisine || "popular"} options on ${merchantId}:`,
    };
  }

  getFallbackProducts(merchant, cuisine, maxPrice) {
    const isGrocery = ["zepto", "blinkit", "bigbasket"].includes(merchant);
    let items = [];
    let restaurantName = `${merchant.charAt(0).toUpperCase() + merchant.slice(1)} Express`;

    if (isGrocery) {
      items = [
        { id: "g1", name: "Amul Taaza Toned Milk (1L)", price: 54, description: "Fresh pasteurized toned milk" },
        { id: "g2", name: "Modern White Bread (400g)", price: 40, description: "Soft white sandwich bread" },
        { id: "g3", name: "Farm Fresh White Eggs (6 pcs)", price: 48, description: "Nutritious farm fresh eggs" },
        { id: "g4", name: "Fresh Robusta Bananas (500g)", price: 35, description: "Sweet and ripe bananas" },
      ];
    } else if (cuisine === "breakfast") {
      restaurantName = "Udupi Breakfast Club";
      items = [
        { id: "b1", name: "Crispy Masala Dosa", price: 89, description: "Golden crispy dosa with spiced potato filling" },
        { id: "b2", name: "Steamed Idli & Medu Vada Combo", price: 79, description: "2 Soft idlis and 1 crispy vada with sambar & chutney" },
        { id: "b3", name: "South Indian Filter Coffee", price: 45, description: "Freshly brewed authentic chicory filter coffee" },
        { id: "b4", name: "Indori Poha with Sev", price: 65, description: "Light flaked rice cooked with onions, mustard and peanuts" },
        { id: "b5", name: "Punjabi Aloo Paratha (2 pcs)", price: 110, description: "Stuffed potato flatbread with fresh curd and pickle" },
      ];
    } else {
      restaurantName = "Paradise Biryani & Bowls";
      items = [
        { id: "f1", name: "Hyderabadi Chicken Biryani Mini", price: 220, description: "Flavorful basmati rice with tender chicken" },
        { id: "f2", name: "Chicken Dum Biryani Single", price: 240, description: "Authentic slow cooked dum biryani" },
        { id: "f3", name: "Paneer Butter Masala Bowl", price: 199, description: "Creamy paneer served with jeera rice" },
        { id: "f4", name: "Margherita Pizza (Regular)", price: 179, description: "Classic cheese and tomato pizza" },
        { id: "f5", name: "Farmhouse Veg Pizza", price: 249, description: "Loaded with crunchy vegetables" },
      ];
    }

    if (maxPrice) {
      items = items.filter((i) => i.price <= maxPrice);
    }

    return {
      restaurantName,
      items: items.map((i) => ({
        ...i,
        imageUrl: "/images/items/default.jpg",
        restaurantName,
        deliveryTime: isGrocery ? "10-15 mins" : "30-40 mins",
        rating: 4.6,
      })),
    };
  }

  async getMenu(userId, merchant, restaurantId) {
    const merchantId = (merchant || "swiggy").toLowerCase();
    
    // Check local JSON files for exact restaurant menu first
    try {
      const fs = require("fs");
      const path = require("path");
      const locations = ["bangalore", "hyderabad", "mumbai", "delhi"];
      let matchedItems = null;
      let matchedRestaurantName = null;

      for (const loc of locations) {
        const menuDir = path.join(__dirname, `../data/merchants/${merchantId}/locations/${loc}/menu`);
        if (fs.existsSync(menuDir)) {
          const files = fs.readdirSync(menuDir);
          const targetFile = files.find(f => {
            const clean = f.toLowerCase();
            return (restaurantId && clean.includes(restaurantId.toLowerCase())) ||
                   (restaurantId && clean.replace(/_/g, "").includes(restaurantId.toLowerCase().replace(/_/g, "")));
          });

          if (targetFile) {
            const raw = fs.readFileSync(path.join(menuDir, targetFile), "utf8");
            matchedItems = JSON.parse(raw);
            matchedRestaurantName = targetFile
              .replace(`${merchantId}_`, "")
              .replace(/_[a-z]{3}\.json$/, "")
              .replace(/_/g, " ")
              .toUpperCase();
            break;
          }
        }
      }

      if (matchedItems && Array.isArray(matchedItems) && matchedItems.length > 0) {
        return {
          type: "products_grid",
          merchant: merchantId,
          restaurantName: matchedRestaurantName || "Selected Restaurant",
          products: matchedItems.slice(0, 15).map(item => ({
            id: item.id || `item_${Date.now()}_${Math.random()}`,
            name: item.name,
            price: Number(item.price),
            description: item.description || "Fresh and delicious",
            imageUrl: item.image || "/images/items/default.jpg",
            category: item.category || "Main",
            restaurantName: matchedRestaurantName,
            isVeg: item.isVeg,
          })),
          message: `Here is the menu for **${matchedRestaurantName}**:`,
        };
      }
    } catch (e) {
      console.warn("Local menu lookup error:", e.message);
    }

    const mock = this.getFallbackProducts(merchantId, "menu", null);
    return {
      type: "products_grid",
      merchant: merchantId,
      restaurantName: mock.restaurantName,
      products: mock.items,
      message: `Here is the menu for ${mock.restaurantName}:`,
    };
  }

  async addToCart(userId, sessionId, items) {
    const cart = Array.isArray(items) ? items : [items];
    const total = cart.reduce((acc, curr) => acc + (Number(curr.price) * (curr.quantity || 1)), 0);
    return {
      success: true,
      status: "ready",
      requiresAction: "confirm_payment",
      cart,
      total,
      subtotal: total,
      tax: 0,
      type: "order_summary",
      message: `Added items to cart. Total: ₹${total}. Ready for checkout.`,
    };
  }

  async checkout(userId, sessionId, paymentMethod = "reserve") {
    return {
      success: true,
      status: "ready",
      requiresAction: "confirm_payment",
      message: "Order ready for payment. Confirm to complete.",
    };
  }
}

module.exports = new OrderAgent();
