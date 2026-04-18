// frontend/src/utils/userStorage.js

export const getCurrentUserId = () => {
  return localStorage.getItem('userId') || localStorage.getItem('currentUserId') || 'guest';
};

export const getUserKey = (key) => {
  const userId = getCurrentUserId();
  return `${key}_${userId}`;
};

export const getUserData = (key, defaultValue = null) => {
  const userKey = getUserKey(key);
  const stored = localStorage.getItem(userKey);
  if (stored === null) return defaultValue;
  try {
    return JSON.parse(stored);
  } catch {
    return stored;
  }
};

export const setUserData = (key, value) => {
  const userKey = getUserKey(key);
  localStorage.setItem(userKey, JSON.stringify(value));
};

export const removeUserData = (key) => {
  const userKey = getUserKey(key);
  localStorage.removeItem(userKey);
};

// Migration function to convert old data to user-specific
export const migrateOldData = (userId) => {
  const keysToMigrate = [
    'reserveLimits', 'transactions', 'bankBalances', 'bankAccounts',
    'bills', 'paidBills', 'contacts', 'autoPayOrders', 'coinBalance',
    'coinRedemptions', 'claimedWeeklyChallenges'
  ];
  
  keysToMigrate.forEach(key => {
    const oldData = localStorage.getItem(key);
    if (oldData && !localStorage.getItem(`${key}_${userId}`)) {
      localStorage.setItem(`${key}_${userId}`, oldData);
      // Optionally keep old data for backward compatibility
    }
  });
};