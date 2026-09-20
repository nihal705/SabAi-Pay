// backend/services/pendingIntentService.js

class PendingIntentService {
  constructor() {
    this.store = new Map(); // userId -> { flow, slots, requiredSlots, isComplete }
  }

  get(userId) {
    return this.store.get(userId) || null;
  }

  set(userId, intent) {
    this.store.set(userId, intent);
  }

  createFlow(userId, flow, slots = {}, requiredSlots = []) {
    const intent = {
      flow,
      slots,
      requiredSlots,
      isComplete: false,
      userId,
    };
    this.store.set(userId, intent);
    return intent;
  }

  update(userId, updates) {
    const intent = this.get(userId);
    if (!intent) return null;
    const newIntent = { ...intent, ...updates };
    if (updates.slots) {
      newIntent.slots = { ...intent.slots, ...updates.slots };
    }
    newIntent.isComplete = this.isComplete(userId);
    this.store.set(userId, newIntent);
    return newIntent;
  }

  updateSlot(userId, slotName, slotValue) {
    const intent = this.get(userId);
    if (!intent) return null;
    intent.slots[slotName] = slotValue;
    intent.isComplete = this.isComplete(userId);
    this.store.set(userId, intent);
    return intent;
  }

  isComplete(userId) {
    const intent = this.get(userId);
    if (!intent) return false;
    return intent.requiredSlots.every(slot => intent.slots[slot] !== undefined && intent.slots[slot] !== null);
  }

  getMissingSlots(userId) {
    const intent = this.get(userId);
    if (!intent) return [];
    return intent.requiredSlots.filter(slot => intent.slots[slot] === undefined || intent.slots[slot] === null);
  }

  clear(userId) {
    this.store.delete(userId);
  }

  getStats() {
    return {
      total: this.store.size,
      active: Array.from(this.store.keys()),
    };
  }
}

module.exports = new PendingIntentService();