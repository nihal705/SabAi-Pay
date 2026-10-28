// backend/services/pendingIntentService.js
// Enhanced slot-filling state machine with default flow contracts

class PendingIntentService {
  constructor() {
    this.store = new Map(); // userId -> { flow, slots, requiredSlots, isComplete, updatedAt }
    this.defaultContracts = {
      recharge: ["mobileNumber", "amount"],
      send_money: ["recipient", "amount"],
      pay_bill: ["billType", "amount"],
      order: ["merchant"],
      schedule: ["action", "datetime"],
    };
  }

  get(userId) {
    return this.store.get(String(userId)) || null;
  }

  set(userId, intent) {
    if (!intent) {
      this.clear(userId);
      return;
    }
    const flow = intent.flow;
    const requiredSlots = intent.requiredSlots || this.defaultContracts[flow] || [];
    const isComplete = this.checkCompletion(intent.slots || {}, requiredSlots);
    this.store.set(String(userId), {
      ...intent,
      requiredSlots,
      isComplete,
      updatedAt: Date.now(),
      userId: String(userId),
    });
  }

  createFlow(userId, flow, slots = {}, customRequiredSlots = null) {
    const requiredSlots = customRequiredSlots || this.defaultContracts[flow] || [];
    const isComplete = this.checkCompletion(slots, requiredSlots);
    const intent = {
      flow,
      slots: { ...slots },
      requiredSlots,
      isComplete,
      userId: String(userId),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    this.store.set(String(userId), intent);
    return intent;
  }

  update(userId, updates) {
    const intent = this.get(userId);
    if (!intent) return null;
    const slots = { ...(intent.slots || {}), ...(updates.slots || {}) };
    const requiredSlots = updates.requiredSlots || intent.requiredSlots;
    const isComplete = this.checkCompletion(slots, requiredSlots);

    const newIntent = {
      ...intent,
      ...updates,
      slots,
      requiredSlots,
      isComplete,
      updatedAt: Date.now(),
    };
    this.store.set(String(userId), newIntent);
    return newIntent;
  }

  updateSlot(userId, slotName, slotValue) {
    const intent = this.get(userId);
    if (!intent) return null;
    intent.slots[slotName] = slotValue;
    intent.isComplete = this.checkCompletion(intent.slots, intent.requiredSlots);
    intent.updatedAt = Date.now();
    this.store.set(String(userId), intent);
    return intent;
  }

  checkCompletion(slots, requiredSlots) {
    if (!requiredSlots || requiredSlots.length === 0) return true;
    return requiredSlots.every(
      (slot) => slots[slot] !== undefined && slots[slot] !== null && String(slots[slot]).trim() !== ""
    );
  }

  isComplete(userId) {
    const intent = this.get(userId);
    if (!intent) return false;
    return this.checkCompletion(intent.slots, intent.requiredSlots);
  }

  getMissingSlots(userId) {
    const intent = this.get(userId);
    if (!intent) return [];
    return intent.requiredSlots.filter(
      (slot) => intent.slots[slot] === undefined || intent.slots[slot] === null || String(intent.slots[slot]).trim() === ""
    );
  }

  clear(userId) {
    this.store.delete(String(userId));
  }

  getStats() {
    return {
      total: this.store.size,
      active: Array.from(this.store.keys()),
    };
  }
}

module.exports = new PendingIntentService();
