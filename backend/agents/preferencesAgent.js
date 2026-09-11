// backend/agents/preferencesAgent.js
const dbService = require("../services/databaseService");
const orderAgent = require("./orderAgent");
const merchantDataService = require("../services/merchantDataService");

class PreferencesAgent {
  async getUsual(userId, mealSlot, merchant = null, paymentMethod = null, sessionId = null) {
    // 1. Get saved usual items
    const usual = await dbService.getUsualOrder(userId, mealSlot);
    let items = [];

    if (usual && usual.items && usual.items.length > 0) {
      items = usual.items;
    } else {
      // Try to infer from history
      const inferred = await this.inferFromHistory(userId, mealSlot);
      if (inferred.length > 0) {
        items = inferred;
      }
    }

    if (!items || items.length === 0) {
      return {
        error: "No usual order found",
        message: `You don't have a saved ${mealSlot} order. Please create one first.`,
      };
    }

    // 2. If merchant is provided, search items and add to cart
    if (merchant) {
      // Get user location
      const connection = await dbService.getMerchantConnection(userId, merchant);
      const city = connection?.location_city || 'bangalore';

      // Search for each item
      const resolvedItems = [];
      let allItemsFound = true;

      for (const savedItem of items) {
        // Use searchItems method which returns menu items directly
        const searchResults = await merchantDataService.getMerchantData(
          merchant,
          city,
          null,
          savedItem.name,
          {}
        );

        let matchedItem = null;

        // Check search_results type (menu items from restaurants)
        if (searchResults.type === 'search_results' && searchResults.items?.length > 0) {
          matchedItem = searchResults.items.find(item =>
            item.name.toLowerCase() === savedItem.name.toLowerCase()
          ) || searchResults.items[0];
        }

        // If not found, try to get from products_grid
        if (!matchedItem && searchResults.type === 'products_grid' && searchResults.products?.length > 0) {
          matchedItem = searchResults.products.find(product =>
            product.name.toLowerCase() === savedItem.name.toLowerCase()
          ) || searchResults.products[0];
        }

        // If still not found, try a more flexible search
        if (!matchedItem) {
          // Try to find by partial match
          const searchLower = savedItem.name.toLowerCase();
          const allItems = searchResults.items || searchResults.products || [];
          matchedItem = allItems.find(item =>
            item.name.toLowerCase().includes(searchLower) ||
            searchLower.includes(item.name.toLowerCase())
          );
        }

        if (matchedItem) {
          resolvedItems.push({
            id: matchedItem.id || `item_${Date.now()}_${Math.random()}`,
            name: matchedItem.name,
            price: matchedItem.price || 0,
            quantity: savedItem.quantity || 1,
            imageUrl: matchedItem.imageUrl || matchedItem.image || '/images/items/default.png',
            category: matchedItem.category || 'Main',
            restaurantName: matchedItem.restaurantName || '',
            restaurantId: matchedItem.restaurantId || '',
            isVeg: matchedItem.isVeg || false
          });
        } else {
          allItemsFound = false;
          return {
            error: "Item not found",
            message: `Could not find "${savedItem.name}" on ${merchant}. Please check the item name or specify a different item.`,
          };
        }
      }

      // Create or use existing session
      if (!sessionId) {
        sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await dbService.saveOrderSession({
          session_id: sessionId,
          user_id: userId,
          merchant: merchant,
          cart: JSON.stringify([]),
          subtotal: 0,
          tax: 0,
          total: 0,
          step: 'init'
        });
      }

      // Add items to cart
      const addResult = await orderAgent.addToCart(userId, sessionId, resolvedItems);
      if (!addResult.success) {
        return { error: "Failed to add items", message: addResult.error };
      }

      // Return order_summary so frontend handles payment
      return {
        type: "order_summary",
        merchant,
        items: addResult.cart,
        subtotal: addResult.subtotal,
        tax: addResult.tax,
        total: addResult.total,
        sessionId: sessionId,
        message: `Your usual ${mealSlot} order is ready! Total: ₹${addResult.total}`,
        requiresAction: true,
        paymentOptions: {
          upi: true,
          reserve: true,
          gems: true,
        },
      };
    }

    // 3. No merchant – return list
    return {
      type: "usual_order",
      mealSlot,
      items,
      message: `Your usual ${mealSlot} order: ${items.map(i => `${i.quantity}x ${i.name}`).join(', ')}. Would you like to order it? Specify a merchant.`,
      requiresAction: true,
    };
  }

  async saveUsual(userId, mealSlot, items, merchant = null) {
    const cleanedItems = items.map(item => ({
      name: item.name,
      quantity: item.quantity || 1,
      price: item.price || null,
      merchant: merchant || null,
    }));
    await dbService.saveUsualOrder(userId, mealSlot, cleanedItems);
    let message = `✅ Saved your ${mealSlot} order!`;
    if (merchant) message += ` (from ${merchant})`;
    return { success: true, mealSlot, items: cleanedItems, merchant, message };
  }

  async inferFromHistory(userId, mealSlot) {
    try {
      const orders = await dbService.getUserOrders(userId, 20);
      const itemCounts = {};
      orders.forEach(order => {
        (order.items || []).forEach(item => {
          const name = item.name;
          if (!itemCounts[name]) itemCounts[name] = { ...item, count: 0 };
          itemCounts[name].count += 1;
        });
      });
      return Object.values(itemCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
        .map(({ name, quantity }) => ({ name, quantity: quantity || 1 }));
    } catch (error) {
      console.error("Inference error:", error);
      return [];
    }
  }
}

module.exports = new PreferencesAgent();