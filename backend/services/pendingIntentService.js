// backend/services/pendingIntentService.js
// Manages pending intent state per user with TTL

class PendingIntentService {
  constructor() {
    this.store = new Map(); // userId -> { state, timestamp }
    this.TTL = 30 * 60 * 1000; // 30 minutes
    this.cleanupInterval = 5 * 60 * 1000; // 5 minutes

    // Start cleanup interval
    setInterval(() => this.cleanup(), this.cleanupInterval);
    console.log("✅ PendingIntentService initialized");
  }

  /**
   * Get pending intent state for a user
   */
  get(userId) {
    const userIdStr = String(userId);
    const entry = this.store.get(userIdStr);

    if (!entry) return null;

    // Check if expired
    if (Date.now() - entry.timestamp > this.TTL) {
      this.store.delete(userIdStr);
      return null;
    }

    return entry.state;
  }

  /**
   * Set pending intent state for a user
   */
  set(userId, state) {
    const userIdStr = String(userId);
    this.store.set(userIdStr, {
      state: state,
      timestamp: Date.now(),
    });
    console.log(`📝 Pending intent set for user ${userIdStr}:`, state);
    return state;
  }

  /**
   * Update specific fields in pending intent state
   */
  update(userId, updates) {
    const userIdStr = String(userId);
    const current = this.get(userIdStr);

    if (!current) {
      // If no state exists, create one
      return this.set(userIdStr, updates);
    }

    const updated = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    return this.set(userIdStr, updated);
  }

  /**
   * Clear pending intent state for a user
   */
  clear(userId) {
    const userIdStr = String(userId);
    this.store.delete(userIdStr);
    console.log(`🗑️ Pending intent cleared for user ${userIdStr}`);
    return null;
  }

  /**
   * Check if a user has an active pending intent
   */
  has(userId) {
    return this.get(userId) !== null;
  }

  /**
   * Get the flow type for a user
   */
  getFlow(userId) {
    const state = this.get(userId);
    return state?.flow || null;
  }

  /**
   * Get all slots for a user
   */
  getSlots(userId) {
    const state = this.get(userId);
    return state?.slots || {};
  }

  /**
   * Check if all required slots are filled
   */
  isComplete(userId) {
    const state = this.get(userId);
    if (!state) return false;

    const requiredSlots = state.requiredSlots || [];
    const slots = state.slots || {};

    return requiredSlots.every(
      (slot) =>
        slots[slot] !== undefined && slots[slot] !== null && slots[slot] !== "",
    );
  }

  /**
   * Get missing slots
   */
  getMissingSlots(userId) {
    const state = this.get(userId);
    if (!state) return [];

    const requiredSlots = state.requiredSlots || [];
    const slots = state.slots || {};

    return requiredSlots.filter(
      (slot) =>
        slots[slot] === undefined || slots[slot] === null || slots[slot] === "",
    );
  }

  /**
   * Cleanup expired entries
   */
  cleanup() {
    const now = Date.now();
    let expiredCount = 0;

    for (const [key, entry] of this.store) {
      if (now - entry.timestamp > this.TTL) {
        this.store.delete(key);
        expiredCount++;
      }
    }

    if (expiredCount > 0) {
      console.log(`🧹 Cleaned up ${expiredCount} expired pending intents`);
    }
  }

  /**
   * Get stats about the store
   */
  getStats() {
    return {
      totalEntries: this.store.size,
      ttl: this.TTL,
      cleanupInterval: this.cleanupInterval,
    };
  }

  /**
   * Clear all entries (for testing)
   */
  clearAll() {
    this.store.clear();
    console.log("🗑️ All pending intents cleared");
  }

  /**
   * Create a new pending intent with default structure
   */
  createFlow(userId, flow, initialSlots = {}, requiredSlots = []) {
    const state = {
      flow: flow,
      slots: initialSlots,
      requiredSlots: requiredSlots,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      step: "collecting_info",
      attempts: 0,
      maxAttempts: 3,
      context: {},
    };

    return this.set(userId, state);
  }

  /**
   * Update a slot value
   */
  updateSlot(userId, slotKey, value) {
    const state = this.get(userId);
    if (!state) return null;

    state.slots = state.slots || {};
    state.slots[slotKey] = value;
    state.updatedAt = new Date().toISOString();

    return this.set(userId, state);
  }

  /**
   * Check if a slot exists and has value
   */
  hasSlot(userId, slotKey) {
    const state = this.get(userId);
    if (!state) return false;
    const value = state.slots[slotKey];
    return value !== undefined && value !== null && value !== "";
  }

  /**
   * Get a specific slot value
   */
  getSlot(userId, slotKey) {
    const state = this.get(userId);
    if (!state) return null;
    return state.slots[slotKey] || null;
  }

  /**
   * Increment attempts counter
   */
  incrementAttempts(userId) {
    const state = this.get(userId);
    if (!state) return null;

    state.attempts = (state.attempts || 0) + 1;
    state.updatedAt = new Date().toISOString();

    return this.set(userId, state);
  }

  /**
   * Check if max attempts exceeded
   */
  isMaxAttemptsExceeded(userId) {
    const state = this.get(userId);
    if (!state) return false;
    return (state.attempts || 0) >= (state.maxAttempts || 3);
  }

  /**
   * Reset attempts counter
   */
  resetAttempts(userId) {
    const state = this.get(userId);
    if (!state) return null;

    state.attempts = 0;
    state.updatedAt = new Date().toISOString();

    return this.set(userId, state);
  }

  /**
   * Add context data
   */
  addContext(userId, key, value) {
    const state = this.get(userId);
    if (!state) return null;

    state.context = state.context || {};
    state.context[key] = value;
    state.updatedAt = new Date().toISOString();

    return this.set(userId, state);
  }

  /**
   * Get context data
   */
  getContext(userId, key = null) {
    const state = this.get(userId);
    if (!state) return null;

    if (key) {
      return state.context?.[key] || null;
    }

    return state.context || {};
  }
}

module.exports = new PendingIntentService();
