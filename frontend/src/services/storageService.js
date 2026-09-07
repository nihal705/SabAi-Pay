// frontend/src/services/storageService.js
import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_URL || "/api";

// Helper to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Helper to handle API responses
const handleResponse = async (apiCall) => {
  try {
    const response = await apiCall();
    if (response.data && response.data.success) {
      return response.data.data;
    }
    throw new Error(response?.data?.message || "Request failed");
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};

export const getBankLogoUrl = (bankName) => {
  const bankLogoMap = {
    "State Bank of India": "sbi.png",
    SBI: "sbi.png",
    "HDFC Bank": "hdfc.png",
    HDFC: "hdfc.png",
    "ICICI Bank": "icici.png",
    ICICI: "icici.png",
    "Axis Bank": "axis.png",
    Axis: "axis.png",
    "Bank of Baroda": "bob.png",
    BOB: "bob.png",
    "Punjab National Bank": "pnb.png",
    PNB: "pnb.png",
    "Canara Bank": "canara.png",
    Canara: "canara.png",
    "Union Bank of India": "union.png",
    "Union Bank": "union.png",
    "Kotak Mahindra Bank": "kotak.png",
    Kotak: "kotak.png",
    "IndusInd Bank": "indusind.png",
    IndusInd: "indusind.png",
    "Yes Bank": "yesbank.png",
    Yes: "yesbank.png",
    "IDFC First Bank": "idfc.png",
    IDFC: "idfc.png",
    "Karnataka Bank": "karnataka.png",
    "Indian Bank": "indianbank.png",
    "Indian Overseas Bank": "iob.png",
    IOB: "iob.png",
    "Federal Bank": "federal.png",
    "South Indian Bank": "sib.png",
    SIB: "sib.png",
  };
  const fileName = bankLogoMap[bankName];
  if (fileName) return `/images/banks/${fileName}`;
  return null;
};

// Helper to get contact color
const getContactColor = (name) => {
  const colors = [
    "#4f46e5",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#ec4899",
    "#8b5cf6",
    "#06b6d4",
    "#84cc16",
    "#f97316",
    "#d946ef",
    "#3b82f6",
    "#14b8a6",
    "#a855f7",
    "#e11d48",
    "#f43f5e",
  ];
  let hash = 0;
  for (let i = 0; i < name?.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  return colors[Math.abs(hash) % colors.length];
};

// ============ USER ID MANAGEMENT ============
let currentUserId = null;

export const setCurrentUserId = (userId) => {
  currentUserId = userId;
  if (userId) {
    localStorage.setItem("currentUserId", userId);
  }
};

export const getCurrentUserId = () => {
  if (currentUserId) return currentUserId;
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  return user.id || null;
};

export const refreshCurrentUserId = () => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  if (user.id) {
    currentUserId = user.id;
  }
  return currentUserId;
};

export const clearUserCache = () => {
  const cacheKeys = [
    "cached_bankAccounts",
    "cached_bankBalances",
    "cached_coinBalance",
    "cached_transactions",
    "cached_bills",
    "cached_reserveLimits",
    "cached_autoPayOrders",
    "cached_contacts",
    "cached_connectedMerchants",
  ];
  cacheKeys.forEach((key) => localStorage.removeItem(key));
  clearPinCache();
};

// ============ PIN CACHE MANAGEMENT ============
let pinStatusCache = new Map();
let pinCacheTimestamp = new Map();
const PIN_CACHE_TTL = 5000;

export const clearPinCache = (accountId) => {
  if (accountId) {
    pinStatusCache.delete(accountId);
    pinCacheTimestamp.delete(accountId);
  } else {
    pinStatusCache.clear();
    pinCacheTimestamp.clear();
  }
};

// ============ BANK ACCOUNTS ============

export const getBankAccounts = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/bank/accounts`, {
      headers: getAuthHeaders(),
    });
    if (response.data.success) {
      return response.data.data;
    }
    return [];
  } catch (error) {
    console.error("Failed to get bank accounts:", error);
    throw error;
  }
};

export const addBankAccount = async (accountData) => {
  return handleResponse(() =>
    axios.post(`${API_BASE_URL}/bank/accounts`, accountData, {
      headers: getAuthHeaders(),
    }),
  );
};

export const deleteBankAccount = async (accountId) => {
  await axios.delete(`${API_BASE_URL}/bank/accounts/${accountId}`, {
    headers: getAuthHeaders(),
  });
  localStorage.removeItem("cached_bankAccounts");
  clearPinCache(accountId);
  return true;
};

export const setPrimaryBankAccount = async (accountId) => {
  await axios.put(
    `${API_BASE_URL}/bank/accounts/${accountId}/primary`,
    {},
    { headers: getAuthHeaders() },
  );
  localStorage.removeItem("cached_bankAccounts");
  return true;
};

// ============ BANK BALANCES ============

export const getBankBalances = async () => {
  try {
    const accounts = await getBankAccounts();
    const balances = {};
    for (const account of accounts) {
      const response = await axios.get(
        `${API_BASE_URL}/bank/balance/${account.id}`,
        { headers: getAuthHeaders() },
      );
      if (response.data.success) {
        balances[account.id] = response.data.data.balance;
      }
    }
    return balances;
  } catch (error) {
    console.error("Failed to get bank balances:", error);
    throw error;
  }
};

export const updateBankBalance = async (
  accountId,
  amount,
  isDeposit = true,
) => {
  try {
    const endpoint = isDeposit
      ? `${API_BASE_URL}/bank/deposit`
      : `${API_BASE_URL}/bank/withdraw`;
    const response = await axios.post(
      endpoint,
      { accountId, amount },
      { headers: getAuthHeaders() },
    );
    if (response.data && response.data.success) {
      return response.data.data.balance;
    }
    throw new Error(response.data?.message || "Transaction failed");
  } catch (error) {
    console.error("Update bank balance error:", error);
    if (error.response?.status === 401) {
      return null;
    }
    throw error;
  }
};

// ============ BANK UPI PINS ============

export const setBankUpiPin = async (bankAccountId, pin) => {
  return handleResponse(() =>
    axios.post(
      `${API_BASE_URL}/bank/accounts/${bankAccountId}/pin`,
      { pin },
      { headers: getAuthHeaders() },
    ),
  );
};

export const verifyBankPin = async (bankAccountId, pin) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/bank/verify-pin`,
      { accountId: bankAccountId, pin },
      { headers: getAuthHeaders() },
    );
    return response.data.success;
  } catch (error) {
    console.error(
      "PIN verification error:",
      error.response?.data || error.message,
    );
    return false;
  }
};

export const hasUpiPin = async (bankAccountId) => {
  const cached = pinStatusCache.get(bankAccountId);
  const timestamp = pinCacheTimestamp.get(bankAccountId);

  if (
    cached !== undefined &&
    timestamp &&
    Date.now() - timestamp < PIN_CACHE_TTL
  ) {
    return cached;
  }

  try {
    const response = await axios.get(
      `${API_BASE_URL}/bank/accounts/${bankAccountId}/has-pin`,
      { headers: getAuthHeaders() },
    );
    const hasPin = response.data.data?.hasPin || false;
    pinStatusCache.set(bankAccountId, hasPin);
    pinCacheTimestamp.set(bankAccountId, Date.now());
    return hasPin;
  } catch (error) {
    console.error("Failed to check PIN:", error);
    return false;
  }
};

// ============ SABAI COINS ============

export const getLifetimeEarned = async () => {
  try {
    const transactions = await getTransactions();
    const successfulTransactions = (transactions || []).filter(
      (t) => t.status === "success",
    );

    let totalEarned = 0;
    successfulTransactions.forEach((t) => {
      if (t.type === "send" || t.type === "sent") return;
      if (t.type === "self_transfer") return;
      if (t.type === "receive" || t.type === "received") return;

      const isEarningType =
        t.type === "bill_payment" ||
        t.type === "bill" ||
        t.type === "recharge" ||
        t.type === "auto_pay_execution" ||
        t.type === "reserve_pay" ||
        t.type === "spending" ||
        t.type === "merchant_order" ||
        t.type === "challenge_reward";

      const gemsUsed =
        (t.payment_breakdown && t.payment_breakdown.gemsAmount > 0) ||
        t.gems_used === true ||
        t.gems_used > 0;

      if (t.type === "challenge_reward") {
        totalEarned += t.cashback_earned || t.amount || 0;
      } else if (isEarningType && !gemsUsed) {
        let gemsEarned = t.cashback_earned || 0;
        if (gemsEarned === 0 && t.amount) {
          gemsEarned = Math.floor(parseFloat(t.amount) * 0.05);
          gemsEarned = Math.min(gemsEarned, 100);
        }
        totalEarned += gemsEarned;
      }
    });

    localStorage.setItem("cached_lifetimeEarned", totalEarned.toString());
    return totalEarned;
  } catch (error) {
    console.error("Failed to get lifetime earned:", error);
    const cached = localStorage.getItem("cached_lifetimeEarned");
    return cached ? parseInt(cached) : 0;
  }
};

export const getCoinBalance = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/coins/balance`, {
      headers: getAuthHeaders(),
    });
    if (!response.data.success)
      throw new Error(response.data?.message || "Failed to load SabAI Gems");
    return Number(response.data.data.balance || 0);
  } catch (error) {
    console.error("Failed to get coin balance:", error);
    throw error;
  }
};

export const updateCoinBalance = async (amount, isEarning = true) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/bank/coins/update`,
      { amount, isEarning },
      { headers: getAuthHeaders() },
    );

    if (response.data && response.data.success) {
      localStorage.removeItem("cached_coinBalance");
      localStorage.removeItem("cached_lifetimeEarned");

      return response.data.data.newBalance;
    }
    throw new Error(response.data?.message || "Failed to update coin balance");
  } catch (error) {
    console.error("Update coin balance error:", error);
    const currentBalance = await getCoinBalance();
    const newBalance = isEarning
      ? currentBalance + amount
      : currentBalance - amount;
    localStorage.setItem(
      "cached_coinBalance",
      Math.max(0, newBalance).toString(),
    );
    return Math.max(0, newBalance);
  }
};

export const updateContactAfterTransaction = async (
  receiverVpa,
  receiverName,
  amount,
  isReceived = false,
) => {
  try {
    const contact = {
      name: receiverName || receiverVpa.split("@")[0],
      vpa: receiverVpa,
      amount: amount,
      is_received: isReceived,
    };
    const response = await axios.post(`${API_BASE_URL}/contacts`, contact, {
      headers: getAuthHeaders(),
    });
    if (response.data.success) {
      localStorage.removeItem("cached_contacts");
      return true;
    }
    return false;
  } catch (error) {
    console.error("Failed to update contact:", error);
    return false;
  }
};

// ============ TRANSACTIONS ============

export const getTransactions = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/transactions`, {
      headers: getAuthHeaders(),
    });
    if (response.data.success) {
      const transactions = response.data.data.transactions || [];
      localStorage.setItem("cached_transactions", JSON.stringify(transactions));
      return transactions;
    }
    return [];
  } catch (error) {
    console.error("Failed to get transactions:", error);
    throw error;
  }
};

export const addTransaction = async (transaction) => {
  try {
    const transactionData = {
      transaction_id:
        transaction.transactionId ||
        transaction.transaction_id ||
        `TXN${Date.now()}`,
      user_id: getCurrentUserId(),
      type: transaction.type || "other",
      amount: parseFloat(transaction.amount) || 0,
      status: transaction.status || "success",
      description: transaction.description || "",
      cashback_earned: transaction.cashback_earned || transaction.cashback || 0,
      gems_used: transaction.gems_used || 0,
      reserve_used: transaction.reserve_used || 0,
      bank_used: transaction.bank_used || 0,
      sender_vpa: transaction.sender_vpa || null,
      receiver_vpa: transaction.receiver_vpa || null,
      receiver_name: transaction.receiver_name || null,
      bank_name: transaction.bank_name || null,
      bank_account_id:
        transaction.bank_id || transaction.bank_account_id || null,
      bill_type: transaction.bill_type || null,
      customer_id: transaction.customer_id || null,
      provider: transaction.provider || null,
      mobile_number:
        transaction.mobileNumber || transaction.mobile_number || null,
      operator: transaction.operator || null,
      circle: transaction.circle || null,
      failure_reason: transaction.failure_reason || null,
      payment_method_display: transaction.payment_method_display || null,
    };

    Object.keys(transactionData).forEach((key) => {
      if (transactionData[key] === undefined) {
        delete transactionData[key];
      }
    });

    const response = await axios.post(
      `${API_BASE_URL}/transactions`,
      transactionData,
      {
        headers: getAuthHeaders(),
      },
    );

    if (response.data && response.data.success) {
      localStorage.removeItem("cached_transactions");
      localStorage.removeItem("cached_coinBalance");
      localStorage.removeItem("cached_lifetimeEarned");

      return {
        ...transaction,
        id: response.data.data?.id || Date.now(),
        created_at: new Date().toISOString(),
        date: new Date().toISOString(),
      };
    }
    throw new Error(response.data?.message || "Failed to save transaction");
  } catch (error) {
    console.error("Failed to save transaction:", error);
    console.error("Error response:", error.response?.data);
    throw error;
  }
};

// ============ BILLS ============

export const getBills = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/bills`, {
      headers: getAuthHeaders(),
    });
    if (response.data.success) {
      const bills = response.data.data.pending || [];
      localStorage.setItem("cached_bills", JSON.stringify(bills));
      return bills;
    }
    return [];
  } catch (error) {
    console.error("Failed to get bills:", error);
    throw error;
  }
};

export const addBill = async (billData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/bills`, billData, {
      headers: getAuthHeaders(),
    });

    if (response.data && response.data.success) {
      localStorage.removeItem("cached_bills");
      return response.data.data;
    }
    throw new Error(response.data?.message || "Failed to add bill");
  } catch (error) {
    console.error("Failed to add bill:", error);
    console.error("Error response:", error.response?.data);
    throw error;
  }
};

export const updateBill = async (billId, updates) => {
  await axios.put(`${API_BASE_URL}/bills/${billId}`, updates, {
    headers: getAuthHeaders(),
  });
  localStorage.removeItem("cached_bills");
  return true;
};

export const deleteBill = async (billId) => {
  try {
    const autoPayOrders = await getAutoPayOrders();
    const associatedOrders = autoPayOrders.filter(
      (order) => order.bill_id === billId,
    );

    for (const order of associatedOrders) {
      try {
        await axios.delete(`${API_BASE_URL}/auto-pay/orders/${order.id}`, {
          headers: getAuthHeaders(),
        });
      } catch (orderError) {
        console.error(
          `Failed to delete auto-pay order ${order.id}:`,
          orderError,
        );
      }
    }

    await axios.delete(`${API_BASE_URL}/bills/${billId}`, {
      headers: getAuthHeaders(),
    });

    localStorage.removeItem("cached_bills");
    localStorage.removeItem("cached_autoPayOrders");

    return true;
  } catch (error) {
    console.error("Failed to delete bill:", error);
    throw error;
  }
};

export const markBillAsPaid = async (billId, paymentData) => {
  await axios.post(`${API_BASE_URL}/bills/${billId}/pay`, paymentData, {
    headers: getAuthHeaders(),
  });
  localStorage.removeItem("cached_bills");
  return true;
};

export const getPaidBills = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/bills?paid=true`, {
      headers: getAuthHeaders(),
    });
    if (response.data.success) {
      return response.data.data.paid || [];
    }
    return [];
  } catch (error) {
    console.error("Failed to get paid bills:", error);
    return [];
  }
};

// ============ RESERVE LIMITS ============

export const getReserveLimits = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/reserve/limits`, {
      headers: getAuthHeaders(),
    });
    if (response.data.success) {
      const limits = response.data.data || [];
      localStorage.setItem("cached_reserveLimits", JSON.stringify(limits));
      return limits;
    }
    return [];
  } catch (error) {
    console.error("Failed to get reserve limits:", error);
    throw error;
  }
};

export const setReserveLimits = async (limits) => {
  try {
    console.log(
      "Saving reserve limits with contributions:",
      limits.map((l) => ({
        merchant: l.merchant,
        monthly_limit: l.monthly_limit,
        contributionsCount: l.contributions?.length || 0,
      })),
    );

    const existingLimits = await getReserveLimits();
    const existingMerchants = existingLimits.map((l) => l.merchant);
    const newMerchants = limits.map((l) => l.merchant);

    const merchantsToDelete = existingMerchants.filter(
      (m) => !newMerchants.includes(m),
    );

    for (const merchant of merchantsToDelete) {
      try {
        await axios.delete(`${API_BASE_URL}/reserve/limits/${merchant}`, {
          headers: getAuthHeaders(),
        });
      } catch (error) {
        console.error("Failed to delete limit:", merchant, error);
      }
    }

    for (const limit of limits) {
      const limitData = {
        merchant: limit.merchant,
        merchant_name: limit.merchant_name,
        merchant_category: limit.merchant_category,
        monthly_limit: Number(limit.monthly_limit),
        per_transaction_limit: limit.per_transaction_limit
          ? Number(limit.per_transaction_limit)
          : null,
        requires_approval: limit.requires_approval || false,
        is_active: limit.is_active !== false,
        contributions: limit.contributions || [],
      };

      await axios.post(`${API_BASE_URL}/reserve/limits`, limitData, {
        headers: getAuthHeaders(),
      });
    }

    localStorage.removeItem("cached_reserveLimits");

    return true;
  } catch (error) {
    console.error("Failed to set reserve limits:", error);
    throw error;
  }
};

// ============ AUTO PAY ORDERS ============

export const getAutoPayOrders = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/auto-pay/orders`, {
      headers: getAuthHeaders(),
    });
    if (response.data.success) {
      const orders = response.data.data || [];
      const mappedOrders = orders.map((order) => ({
        id: order.id,
        orderId: order.order_id,
        type: order.type,
        merchant: order.merchant,
        merchantName: order.merchant_name,
        merchantCategory: order.merchant_category,
        amount: order.amount,
        schedule: order.schedule,
        dateValue: order.date_value,
        monthValue: order.month_value,
        time: order.time_value,
        oneTimeDate: order.one_time_date,
        paymentMethod: order.payment_method,
        bankAccountId: order.bank_account_id,
        bankName: order.bank_name,
        bankAccountLast4: order.bank_account_last4,
        nextExecution: order.next_execution,
        reminderDays: order.reminder_days,
        status: order.status,
        isBillPayment: order.is_bill_payment === 1,
        isRecharge: order.is_recharge === 1,
        billId: order.bill_id,
        customerId: order.customer_id,
        billType: order.bill_type,
        provider: order.provider,
        mobileNumber: order.mobile_number,
        operator: order.operator,
        circle: order.circle,
        createdAt: order.created_at,
        updatedAt: order.updated_at,
        executionHistory: order.execution_history
          ? JSON.parse(order.execution_history)
          : [],
      }));
      localStorage.setItem(
        "cached_autoPayOrders",
        JSON.stringify(mappedOrders),
      );
      return mappedOrders;
    }
    return [];
  } catch (error) {
    console.error("Failed to get auto-pay orders:", error);
    throw error;
  }
};

export const addAutoPayOrder = async (orderData) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/auto-pay/orders`,
      orderData,
      {
        headers: getAuthHeaders(),
      },
    );

    if (response.data && response.data.success) {
      localStorage.removeItem("cached_autoPayOrders");

      const createdOrder = {
        ...orderData,
        id: response.data.data?.orderId || orderData.orderId,
      };
      return createdOrder;
    }
    throw new Error(response.data?.message || "Failed to add auto-pay order");
  } catch (error) {
    console.error("Failed to add auto-pay order:", error);
    throw error;
  }
};

export const deleteAutoPayOrder = async (orderId) => {
  try {
    const response = await axios.delete(
      `${API_BASE_URL}/auto-pay/orders/${orderId}`,
      {
        headers: getAuthHeaders(),
      },
    );
    if (response.data.success) {
      localStorage.removeItem("cached_autoPayOrders");

      return true;
    }
    throw new Error(
      response.data?.message || "Failed to delete auto-pay order",
    );
  } catch (error) {
    console.error("Failed to delete auto-pay order:", error);
    throw error;
  }
};

// ============ CONTACTS ============

export const getContacts = async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      const saved = localStorage.getItem("contacts");
      return saved ? JSON.parse(saved) : [];
    }

    const response = await axios.get(`${API_BASE_URL}/contacts`, {
      headers: getAuthHeaders(),
    });
    if (response.data.success) {
      const contacts = response.data.data || [];
      const mappedContacts = contacts.map((c) => ({
        id: c.id,
        name: c.name,
        vpa: c.vpa,
        phone: c.phone,
        color: c.color || getContactColor(c.name),
        avatar: c.avatar || c.name?.charAt(0)?.toUpperCase() || "U",
        total_sent: c.total_sent || 0,
        total_received: c.total_received || 0,
        sent_count: c.sent_count || 0,
        received_count: c.received_count || 0,
        last_transaction_at: c.last_transaction_at,
        favorite: c.favorite || false,
        created_at: c.created_at,
      }));
      localStorage.setItem("contacts", JSON.stringify(mappedContacts));
      localStorage.setItem("cached_contacts", JSON.stringify(mappedContacts));
      return mappedContacts;
    }
    return [];
  } catch (error) {
    console.error("Failed to get contacts:", error);
    const saved = localStorage.getItem("contacts");
    return saved ? JSON.parse(saved) : [];
  }
};

export const addContact = async (contact) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/contacts`,
      {
        name: contact.name,
        vpa: contact.vpa,
        phone: contact.phone,
        amount: contact.amount || 0,
        is_received: contact.is_received || false,
      },
      { headers: getAuthHeaders() },
    );

    if (response.data.success) {
      localStorage.removeItem("cached_contacts");
      return true;
    }
    return false;
  } catch (error) {
    console.error("Failed to add contact:", error);
    return false;
  }
};

// ============ MONEY REQUESTS ============

export const getMoneyRequests = async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      const saved = localStorage.getItem("moneyRequests");
      return saved ? JSON.parse(saved) : [];
    }

    const response = await axios.get(`${API_BASE_URL}/money-requests`, {
      headers: getAuthHeaders(),
    });
    if (response.data && response.data.success) {
      const data = response.data.data || [];
      localStorage.setItem("moneyRequests", JSON.stringify(data));
      return data;
    }
    return [];
  } catch (error) {
    console.error("Failed to get money requests:", error);
    const saved = localStorage.getItem("moneyRequests");
    return saved ? JSON.parse(saved) : [];
  }
};

export const setMoneyRequests = async (requests) => {
  try {
    const token = localStorage.getItem("token");
    if (token) {
      const response = await axios.put(
        `${API_BASE_URL}/money-requests`,
        { requests },
        {
          headers: getAuthHeaders(),
        },
      );
      if (response.data && response.data.success) {
        return response.data.data;
      }
    }
    localStorage.setItem("moneyRequests", JSON.stringify(requests));
    return requests;
  } catch (error) {
    console.error("Failed to set money requests:", error);
    localStorage.setItem("moneyRequests", JSON.stringify(requests));
    return requests;
  }
};

export const addMoneyRequest = async (requestData) => {
  try {
    const token = localStorage.getItem("token");
    const response = await axios.post(
      `${API_BASE_URL}/money-requests`,
      requestData,
      {
        headers: getAuthHeaders(),
      },
    );
    if (response.data && response.data.success) {
      return response.data.data || requestData;
    }
    const saved = localStorage.getItem("moneyRequests");
    const requests = saved ? JSON.parse(saved) : [];
    const newRequest = {
      ...requestData,
      id: requestData.id || Date.now(),
      requestId: requestData.requestId || `REQ${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    requests.push(newRequest);
    localStorage.setItem("moneyRequests", JSON.stringify(requests));
    return newRequest;
  } catch (error) {
    console.error("Failed to add money request:", error);
    throw error;
  }
};

// ============ RECHARGES ============

export const getRecentRecharges = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/recharge/recent`, {
      headers: getAuthHeaders(),
    });
    if (response.data.success) {
      return response.data.data || [];
    }
    return [];
  } catch (error) {
    console.error("Failed to get recent recharges:", error);
    return [];
  }
};

export const addRecentRecharge = async (rechargeData) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/recharge`,
      {
        mobile_number: rechargeData.mobile_number,
        operator: rechargeData.operator,
        operator_id: rechargeData.operator_id,
        amount: rechargeData.amount,
        circle: rechargeData.circle,
        transaction_id: rechargeData.transaction_id,
        cashback_earned: rechargeData.cashback_earned || 0,
        payment_method: rechargeData.payment_method,
      },
      { headers: getAuthHeaders() },
    );
    return response.data.success;
  } catch (error) {
    console.error("Failed to add recent recharge:", error);
    return false;
  }
};

// ============ MERCHANT CONNECTIONS ============

export const getConnectedMerchants = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/merchant/connections`, {
      headers: getAuthHeaders(),
    });
    if (response.data.success) {
      const merchants = response.data.data || [];

      const normalizedMerchants = merchants.map((m) => ({
        merchantId: m.merchantId || m.merchant_id,
        merchant_id: m.merchantId || m.merchant_id,
        name: m.name || m.merchant_name,
        merchant_name: m.name || m.merchant_name,
        logoUrl: m.logoUrl,
        color: m.color,
        connectedAt:
          m.connectedAt || m.connected_at || new Date().toISOString(),
        connected_at: m.connectedAt || m.connected_at,
      }));

      localStorage.setItem(
        "cached_connectedMerchants",
        JSON.stringify(normalizedMerchants),
      );
      return normalizedMerchants;
    }
    return [];
  } catch (error) {
    console.error("Failed to get connected merchants:", error);
    const cached = localStorage.getItem("cached_connectedMerchants");
    return cached ? JSON.parse(cached) : [];
  }
};

export const connectMerchant = async (
  merchantId,
  connectionData,
  location = null,
) => {
  const response = await axios.post(
    `${API_BASE_URL}/merchant/connect`,
    { merchantId, connectionData, location },
    { headers: getAuthHeaders() },
  );
  return response.data;
};

export const disconnectMerchant = async (merchantId) => {
  const response = await axios.post(
    `${API_BASE_URL}/merchant/disconnect`,
    { merchantId },
    { headers: getAuthHeaders() },
  );
  return response.data;
};

// ============ WEEKLY CHALLENGES ============

export const getClaimedChallenges = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/challenges/claimed`, {
      headers: getAuthHeaders(),
    });
    if (response.data.success) {
      return response.data.data || [];
    }
    return [];
  } catch (error) {
    console.error("Failed to get claimed challenges:", error);
    return [];
  }
};

export const claimChallenge = async (challengeId) => {
  const response = await axios.post(
    `${API_BASE_URL}/challenges/${challengeId}/claim`,
    {},
    { headers: getAuthHeaders() },
  );
  return response.data.success;
};

// ============ BANK UPI PINS - GET ALL ============

export const getBankUpiPins = async () => {
  try {
    const accounts = await getBankAccounts();
    const pinStatus = {};
    for (const account of accounts) {
      const hasPin = await hasUpiPin(account.id);
      pinStatus[account.id] = hasPin;
    }
    return pinStatus;
  } catch (error) {
    console.error("Failed to get bank UPI pins:", error);
    return {};
  }
};

// Also add sync version
export const getBankUpiPinsSync = () => {
  const cached = localStorage.getItem("cached_bankUpiPins");
  return cached ? JSON.parse(cached) : {};
};

// ============ COMPATIBILITY & SYNC FUNCTIONS ============

export const hasUpiPinHelper = hasUpiPin;
export const verifyBankPinHelper = verifyBankPin;
export const updateBankBalanceHelper = updateBankBalance;
export const updateCoinBalanceHelper = updateCoinBalance;

// Sync versions for components that haven't been updated yet
export const getBankAccountsSync = () => {
  const cached = localStorage.getItem("cached_bankAccounts");
  return cached ? JSON.parse(cached) : [];
};

export const getBankBalancesSync = () => {
  const cached = localStorage.getItem("cached_bankBalances");
  return cached ? JSON.parse(cached) : {};
};

export const getCoinBalanceSync = () => {
  const cached = localStorage.getItem("cached_coinBalance");
  return cached ? parseInt(cached) : 0;
};

export const getTransactionsSync = () => {
  const cached = localStorage.getItem("cached_transactions");
  return cached ? JSON.parse(cached) : [];
};

export const getBillsSync = () => {
  const cached = localStorage.getItem("cached_bills");
  return cached ? JSON.parse(cached) : [];
};

export const getReserveLimitsSync = () => {
  const cached = localStorage.getItem("cached_reserveLimits");
  return cached ? JSON.parse(cached) : [];
};

export const getAutoPayOrdersSync = () => {
  const cached = localStorage.getItem("cached_autoPayOrders");
  return cached ? JSON.parse(cached) : [];
};

export const getContactsSync = () => {
  const cached = localStorage.getItem("cached_contacts");
  return cached ? JSON.parse(cached) : [];
};

// ============ AGENT CHAT ============

export const getAgentConversations = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/agent/conversations`, {
      headers: getAuthHeaders(),
    });
    if (response.data.success) {
      return response.data.data || [];
    }
    return [];
  } catch (error) {
    console.error("Failed to get conversations:", error);
    return [];
  }
};

export const getAgentMessages = async (conversationId) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/agent/conversations/${conversationId}`,
      { headers: getAuthHeaders() },
    );
    if (response.data.success) {
      return response.data.data || [];
    }
    return [];
  } catch (error) {
    console.error("Failed to get messages:", error);
    return [];
  }
};

export const saveAgentMessage = async (
  conversationId,
  role,
  content,
  sessionId = null,
  cart = null,
  total = null,
  requiresAction = false,
  merchant = null,
) => {
  await axios.post(
    `${API_BASE_URL}/agent/messages`,
    {
      conversationId,
      role,
      content,
      sessionId,
      cart,
      total,
      requiresAction,
      merchant,
    },
    { headers: getAuthHeaders() },
  );
  return true;
};

export const deleteAgentConversation = async (conversationId) => {
  await axios.delete(`${API_BASE_URL}/agent/conversations/${conversationId}`, {
    headers: getAuthHeaders(),
  });
  return true;
};

// ============ AGENT ORDERS ============

export const getAgentOrders = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/agent/order/orders`, {
      headers: getAuthHeaders(),
    });
    if (response.data.success) {
      return response.data.data || [];
    }
    return [];
  } catch (error) {
    console.error("Failed to get agent orders:", error);
    return [];
  }
};

// ============ DEFAULT EXPORT ============

const storageService = {
  getCurrentUserId,
  setCurrentUserId,
  refreshCurrentUserId,
  clearUserCache,
  clearPinCache,
  getBankAccounts,
  addBankAccount,
  deleteBankAccount,
  setPrimaryBankAccount,
  getBankBalances,
  updateBankBalance,
  setBankUpiPin,
  verifyBankPin,
  hasUpiPin,
  hasUpiPinHelper,
  verifyBankPinHelper,
  updateBankBalanceHelper,
  updateCoinBalanceHelper,
  getTransactions,
  addTransaction,
  getLifetimeEarned,
  getCoinBalance,
  updateCoinBalance,
  getBills,
  addBill,
  updateBill,
  deleteBill,
  markBillAsPaid,
  getPaidBills,
  getReserveLimits,
  setReserveLimits,
  getAutoPayOrders,
  addAutoPayOrder,
  deleteAutoPayOrder,
  getContacts,
  addContact,
  getMoneyRequests,
  setMoneyRequests,
  addMoneyRequest,
  getRecentRecharges,
  addRecentRecharge,
  getAgentConversations,
  getAgentMessages,
  saveAgentMessage,
  deleteAgentConversation,
  getAgentOrders,
  getConnectedMerchants,
  connectMerchant,
  disconnectMerchant,
  getClaimedChallenges,
  claimChallenge,
  // Sync versions
  getBankAccountsSync,
  getBankBalancesSync,
  getCoinBalanceSync,
  getTransactionsSync,
  getBillsSync,
  getReserveLimitsSync,
  getAutoPayOrdersSync,
  getContactsSync,
};

export default storageService;
