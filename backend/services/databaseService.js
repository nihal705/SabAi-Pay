const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const { getSupabase } = require("../config/supabase");

const numeric = (value, fallback = 0) => Number(value ?? fallback);
const present = (record) =>
  Object.fromEntries(
    Object.entries(record).filter(([, value]) => value !== undefined),
  );
const limit = (value, maximum = 100) =>
  Math.min(Math.max(Number(value) || 1, 1), maximum);

async function unwrap(query, operation) {
  const { data, error } = await query;
  if (error) throw new Error(`${operation}: ${error.message}`);
  return data;
}

class DatabaseService {
  get db() {
    return getSupabase();
  }

  async getUserById(id) {
    return unwrap(
      this.db.from("users").select("*").eq("id", id).maybeSingle(),
      "Get user",
    );
  }
  async getUserByPhone(phone) {
    return unwrap(
      this.db.from("users").select("*").eq("phone_number", phone).maybeSingle(),
      "Get user",
    );
  }
  async createUser(phone, name, email = null, passwordHash = null) {
    const user = await unwrap(
      this.db
        .from("users")
        .insert({
          phone_number: phone,
          name,
          email,
          password_hash: passwordHash,
          upi_id: `${phone}@sabai`,
          is_verified: true,
        })
        .select("*")
        .single(),
      "Create user",
    );
    await unwrap(
      this.db.from("sabai_coins").upsert({ user_id: user.id }),
      "Create coin wallet",
    );
    return user;
  }
  async updateLastLogin(id) {
    return unwrap(
      this.db
        .from("users")
        .update({ last_login: new Date().toISOString() })
        .eq("id", id),
      "Update login",
    );
  }
  async updateUserProfile(id, updates) {
    const fields = present({
      name: updates.name,
      email: updates.email,
      profile_pic: updates.profile_pic,
      date_of_birth: updates.date_of_birth,
      gender: updates.gender,
    });
    if (!Object.keys(fields).length) return this.getUserById(id);
    return unwrap(
      this.db.from("users").update(fields).eq("id", id).select("*").single(),
      "Update profile",
    );
  }
  async saveOTP(phone, otpHash, purpose = "register") {
    await unwrap(
      this.db
        .from("otp_verifications")
        .delete()
        .eq("phone_number", phone)
        .eq("purpose", purpose)
        .eq("is_verified", false),
      "Remove previous OTP",
    );
    return unwrap(
      this.db
        .from("otp_verifications")
        .insert({
          phone_number: phone,
          otp_hash: otpHash,
          purpose,
          expires_at: new Date(Date.now() + 600000).toISOString(),
        })
        .select("*")
        .single(),
      "Save OTP",
    );
  }
  async getLatestOTP(phone, purpose) {
    return unwrap(
      this.db
        .from("otp_verifications")
        .select("*")
        .eq("phone_number", phone)
        .eq("purpose", purpose)
        .eq("is_verified", false)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      "Get OTP",
    );
  }
  async hasVerifiedOTP(phone, purpose) {
    return Boolean(
      await unwrap(
        this.db
          .from("otp_verifications")
          .select("id")
          .eq("phone_number", phone)
          .eq("purpose", purpose)
          .eq("is_verified", true)
          .gt("expires_at", new Date().toISOString())
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        "Get verified OTP",
      ),
    );
  }
  async markOTPAttempt(id, verified) {
    if (verified)
      return unwrap(
        this.db
          .from("otp_verifications")
          .update({ is_verified: true })
          .eq("id", id),
        "Verify OTP",
      );
    return unwrap(
      this.db.rpc("increment_otp_attempt", { p_otp_id: id }),
      "Record OTP attempt",
    );
  }

  async getBankAccounts(userId) {
    const accounts = await unwrap(
      this.db
        .from("bank_accounts")
        .select("*, bank_balances(balance, updated_at)")
        .eq("user_id", userId)
        .order("is_primary", { ascending: false })
        .order("created_at"),
      "Get bank accounts",
    );
    return accounts.map((account) => ({
      ...account,
      balance: numeric(account.bank_balances?.balance),
      bank_balances: undefined,
    }));
  }
  async getBankAccountById(id, userId) {
    const account = await unwrap(
      this.db
        .from("bank_accounts")
        .select("*, bank_balances(balance, updated_at)")
        .eq("id", id)
        .eq("user_id", userId)
        .maybeSingle(),
      "Get bank account",
    );
    return (
      account && {
        ...account,
        balance: numeric(account.bank_balances?.balance),
        bank_balances: undefined,
      }
    );
  }
  async addBankAccount(userId, input) {
    const accounts = await this.getBankAccounts(userId);
    const primary = Boolean(input.is_primary) || !accounts.length;
    if (primary)
      await unwrap(
        this.db
          .from("bank_accounts")
          .update({ is_primary: false })
          .eq("user_id", userId),
        "Clear primary account",
      );
    const account = await unwrap(
      this.db
        .from("bank_accounts")
        .insert({
          user_id: userId,
          bank_name: input.bank_name,
          account_number: input.account_number,
          ifsc_code: input.ifsc_code,
          account_holder_name: input.account_holder_name,
          upi_id: input.upi_id || null,
          is_primary: primary,
        })
        .select("*")
        .single(),
      "Add bank account",
    );
    await unwrap(
      this.db
        .from("bank_balances")
        .insert({ user_id: userId, bank_account_id: account.id, balance: 0 }),
      "Create bank balance",
    );
    return { ...account, balance: 0 };
  }
  async deleteBankAccount(id, userId) {
    const account = await this.getBankAccountById(id, userId);
    if (!account) throw new Error("Bank account not found");
    const accounts = await this.getBankAccounts(userId);
    await unwrap(
      this.db.from("bank_accounts").delete().eq("id", id).eq("user_id", userId),
      "Delete bank account",
    );
    if (account.is_primary && accounts.length > 1)
      await this.setPrimaryBankAccount(
        accounts.find((item) => item.id !== id).id,
        userId,
      );
  }
  async setPrimaryBankAccount(id, userId) {
    if (!(await this.getBankAccountById(id, userId)))
      throw new Error("Bank account not found");
    await unwrap(
      this.db
        .from("bank_accounts")
        .update({ is_primary: false })
        .eq("user_id", userId),
      "Clear primary account",
    );
    return unwrap(
      this.db
        .from("bank_accounts")
        .update({ is_primary: true })
        .eq("id", id)
        .eq("user_id", userId)
        .select("*")
        .single(),
      "Set primary account",
    );
  }
  async updateBankBalance(id, amount, add = true) {
    const data = await unwrap(
      this.db.rpc("update_bank_balance", {
        p_account_id: id,
        p_delta: add ? numeric(amount) : -numeric(amount),
      }),
      "Update bank balance",
    );
    return numeric(Array.isArray(data) ? data[0] : data);
  }
  async hasUpiPin(id) {
    return Boolean(
      await unwrap(
        this.db
          .from("bank_upi_pins")
          .select("bank_account_id")
          .eq("bank_account_id", id)
          .maybeSingle(),
        "Get UPI PIN",
      ),
    );
  }
  async verifyUpiPin(id, pin) {
    const row = await unwrap(
      this.db
        .from("bank_upi_pins")
        .select("*")
        .eq("bank_account_id", id)
        .maybeSingle(),
      "Get UPI PIN",
    );
    if (!row || (row.locked_until && new Date(row.locked_until) > new Date()))
      return false;
    const valid = await bcrypt.compare(pin, row.pin_hash);
    const attempts = valid ? 0 : row.failed_attempts + 1;
    await unwrap(
      this.db
        .from("bank_upi_pins")
        .update({
          failed_attempts: attempts,
          locked_until:
            valid || attempts < 5
              ? null
              : new Date(Date.now() + 900000).toISOString(),
        })
        .eq("bank_account_id", id),
      "Update PIN attempts",
    );
    return valid;
  }
  async setUpiPin(id, pinHash) {
    return unwrap(
      this.db.from("bank_upi_pins").upsert({
        bank_account_id: id,
        pin_hash: pinHash,
        failed_attempts: 0,
        locked_until: null,
      }),
      "Set UPI PIN",
    );
  }

  async createTransaction(input) {
    const record = present({
      transaction_id: input.transaction_id || `TXN-${crypto.randomUUID()}`,
      user_id: input.user_id,
      type: input.type,
      amount: numeric(input.amount),
      status: input.status || "pending",
      sender_vpa: input.sender_vpa,
      receiver_vpa: input.receiver_vpa,
      receiver_name: input.receiver_name,
      bank_name: input.bank_name,
      bank_account_id: input.bank_account_id,
      description: input.description,
      merchant: input.merchant,
      category: input.category,
      gems_used: numeric(input.gems_used),
      reserve_used: numeric(input.reserve_used),
      bank_used: numeric(input.bank_used),
      cashback_earned: numeric(input.cashback_earned),
      bill_type: input.bill_type,
      customer_id: input.customer_id,
      provider: input.provider,
      mobile_number: input.mobile_number,
      operator: input.operator,
      circle: input.circle,
      payment_method_display: input.payment_method_display,
      razorpay_order_id: input.razorpay_order_id,
      razorpay_payment_id: input.razorpay_payment_id,
      failure_reason: input.failure_reason,
      created_at: input.created_at,
    });
    const row = await unwrap(
      this.db.from("transactions").insert(record).select("id").single(),
      "Create transaction",
    );
    return row.id;
  }
  async getTransactions(userId, pageSize = 100, offset = 0) {
    const start = Math.max(Number(offset) || 0, 0);
    return unwrap(
      this.db
        .from("transactions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .range(start, start + limit(pageSize) - 1),
      "Get transactions",
    );
  }
  async getTransactionById(transactionId, userId) {
    return unwrap(
      this.db
        .from("transactions")
        .select("*")
        .eq("transaction_id", transactionId)
        .eq("user_id", userId)
        .maybeSingle(),
      "Get transaction",
    );
  }
  async getTransactionStats(userId) {
    const rows = await unwrap(
      this.db
        .from("transactions")
        .select("amount,status,type,cashback_earned")
        .eq("user_id", userId),
      "Get transaction stats",
    );
    return rows.reduce(
      (out, row) => ({
        total: out.total + 1,
        successful: out.successful + Number(row.status === "success"),
        failed: out.failed + Number(row.status === "failed"),
        total_sent:
          out.total_sent +
          (row.status === "success" &&
          ["send", "bill", "recharge"].includes(row.type)
            ? numeric(row.amount)
            : 0),
        total_received:
          out.total_received +
          (row.status === "success" && row.type === "receive"
            ? numeric(row.amount)
            : 0),
        total_cashback: out.total_cashback + numeric(row.cashback_earned),
      }),
      {
        total: 0,
        successful: 0,
        failed: 0,
        total_sent: 0,
        total_received: 0,
        total_cashback: 0,
      },
    );
  }

  async getCoinBalance(userId) {
    let wallet = await unwrap(
      this.db
        .from("sabai_coins")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle(),
      "Get coin wallet",
    );
    if (!wallet)
      wallet = await unwrap(
        this.db
          .from("sabai_coins")
          .insert({ user_id: userId })
          .select("*")
          .single(),
        "Create coin wallet",
      );
    return wallet;
  }
  async updateCoinBalance(userId, amount, add = true) {
    const data = await unwrap(
      this.db.rpc("update_coin_balance", {
        p_user_id: userId,
        p_delta: (add ? 1 : -1) * Math.floor(numeric(amount)),
      }),
      "Update coin wallet",
    );
    return Array.isArray(data) ? data[0] : data;
  }
  async addCoinTransaction(
    userId,
    amount,
    type,
    sourceType,
    sourceId,
    description,
  ) {
    return unwrap(
      this.db.from("coin_transactions").insert({
        user_id: userId,
        amount: Math.floor(numeric(amount)),
        type,
        source_type: sourceType,
        source_id: sourceId,
        description,
      }),
      "Create coin transaction",
    );
  }
  async getCoinHistory(userId, count = 50) {
    return unwrap(
      this.db
        .from("coin_transactions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit(count)),
      "Get coin history",
    );
  }

  async getReserveLimits(userId) {
    return unwrap(
      this.db
        .from("reserve_limits")
        .select("*")
        .eq("user_id", userId)
        .order("created_at"),
      "Get reserve limits",
    );
  }
  async getReserveLimit(userId, merchant) {
    return unwrap(
      this.db
        .from("reserve_limits")
        .select("*")
        .eq("user_id", userId)
        .eq("merchant", merchant)
        .maybeSingle(),
      "Get reserve limit",
    );
  }
  async createOrUpdateReserveLimit(userId, merchant, data) {
    const record = {
      user_id: userId,
      merchant,
      merchant_name: data.merchant_name,
      merchant_category: data.merchant_category,
      monthly_limit: numeric(data.monthly_limit),
      per_transaction_limit:
        data.per_transaction_limit == null
          ? null
          : numeric(data.per_transaction_limit),
      requires_approval: Boolean(data.requires_approval),
      is_active: data.is_active !== false,
      contributions: data.contributions || [],
    };
    let candidate = { ...record };
    for (let attempt = 0; attempt < 8; attempt += 1) {
      try {
        return await unwrap(
          this.db
            .from("reserve_limits")
            .upsert(candidate, { onConflict: "user_id,merchant" })
            .select("*")
            .single(),
          "Save reserve limit",
        );
      } catch (error) {
        const match = error.message.match(/(?:the )?'([^']+)' column/i);
        const missingColumn = match?.[1];
        if (!missingColumn || !(missingColumn in candidate)) throw error;
        delete candidate[missingColumn];
        console.warn(
          `Reserve schema is missing ${missingColumn}; retrying without it`,
        );
      }
    }
    throw new Error(
      "Save reserve limit: deployed reserve_limits schema is incompatible",
    );
  }
  async deleteReserveLimit(userId, merchant) {
    return unwrap(
      this.db
        .from("reserve_limits")
        .delete()
        .eq("user_id", userId)
        .eq("merchant", merchant),
      "Delete reserve limit",
    );
  }
  async updateReserveLimitSpent(userId, merchant, amount) {
    const data = await unwrap(
      this.db.rpc("spend_reserve_limit", {
        p_user_id: userId,
        p_merchant: merchant,
        p_amount: numeric(amount),
      }),
      "Spend Reserve Pay",
    );
    return Array.isArray(data) ? data[0] : data;
  }

  async getBills(userId) {
    return unwrap(
      this.db.from("bills").select("*").eq("user_id", userId).order("due_date"),
      "Get bills",
    );
  }
  async createBill(userId, bill) {
    return unwrap(
      this.db
        .from("bills")
        .insert(
          present({
            user_id: userId,
            bill_type: bill.bill_type,
            provider: bill.provider,
            customer_id: bill.customer_id,
            amount: numeric(bill.amount),
            due_date: bill.due_date,
            auto_pay: Boolean(bill.auto_pay),
            reserve_pay_enabled: Boolean(bill.reserve_pay_enabled),
            reminder_days: bill.reminder_days,
            bank_account_id: bill.bank_account_id,
            bank_name: bill.bank_name,
            bank_account_last4: bill.bank_account_last4,
            metadata: bill.metadata || {},
          }),
        )
        .select("*")
        .single(),
      "Create bill",
    );
  }
  async updateBill(id, userId, updates) {
    return unwrap(
      this.db
        .from("bills")
        .update(
          present({
            auto_pay: updates.auto_pay,
            reserve_pay_enabled: updates.reserve_pay_enabled,
            reminder_days: updates.reminder_days,
            bank_account_id: updates.bank_account_id,
            bank_name: updates.bank_name,
            bank_account_last4: updates.bank_account_last4,
            amount:
              updates.amount === undefined
                ? undefined
                : numeric(updates.amount),
            due_date: updates.due_date,
          }),
        )
        .eq("id", id)
        .eq("user_id", userId)
        .select("*")
        .single(),
      "Update bill",
    );
  }
  async deleteBill(id, userId) {
    return unwrap(
      this.db.from("bills").delete().eq("id", id).eq("user_id", userId),
      "Delete bill",
    );
  }
  async markBillAsPaid(id, userId, data) {
    const bill = await unwrap(
      this.db
        .from("bills")
        .select("*")
        .eq("id", id)
        .eq("user_id", userId)
        .single(),
      "Get bill",
    );
    return unwrap(
      this.db
        .from("paid_bills")
        .insert({
          bill_id: bill.id,
          user_id: userId,
          amount: numeric(data.amount || bill.amount),
          payment_method: data.payment_method,
          payment_breakdown: data.payment_breakdown || {},
          cashback_earned: numeric(data.cashback_earned),
          transaction_id: data.transaction_id || null,
        })
        .select("*")
        .single(),
      "Mark bill paid",
    );
  }
  async getPaidBills(userId, count = 50) {
    return unwrap(
      this.db
        .from("paid_bills")
        .select("*,bills(*)")
        .eq("user_id", userId)
        .order("paid_at", { ascending: false })
        .limit(limit(count)),
      "Get paid bills",
    );
  }

  async addRecentRecharge(userId, data) {
    return unwrap(
      this.db.from("recent_recharges").insert({
        user_id: userId,
        mobile_number: data.mobileNumber,
        operator: data.operator,
        operator_id: data.operatorId,
        amount: numeric(data.amount),
        circle: data.circle,
        transaction_id: data.transactionId || null,
        cashback_earned: numeric(data.cashbackEarned),
        payment_method: data.paymentMethod,
      }),
      "Save recharge",
    );
  }
  async getRecentRecharges(userId, count = 10) {
    return unwrap(
      this.db
        .from("recent_recharges")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit(count, 50)),
      "Get recharges",
    );
  }
  async getContacts(userId) {
    return unwrap(
      this.db
        .from("contacts")
        .select("*")
        .eq("user_id", userId)
        .order("last_transaction_at", { ascending: false, nullsFirst: false }),
      "Get contacts",
    );
  }
  async createOrUpdateContact(
    userId,
    name,
    vpa,
    phone,
    amount,
    received = false,
  ) {
    const old = await unwrap(
      this.db
        .from("contacts")
        .select("*")
        .eq("user_id", userId)
        .eq("vpa", vpa)
        .maybeSingle(),
      "Get contact",
    );
    const value = numeric(amount);
    if (!old)
      return unwrap(
        this.db
          .from("contacts")
          .insert({
            user_id: userId,
            name,
            vpa,
            phone,
            sent_count: received ? 0 : 1,
            received_count: received ? 1 : 0,
            total_sent: received ? 0 : value,
            total_received: received ? value : 0,
            last_transaction_at: new Date().toISOString(),
          })
          .select("*")
          .single(),
        "Create contact",
      );
    return unwrap(
      this.db
        .from("contacts")
        .update({
          name: name || old.name,
          phone: phone || old.phone,
          sent_count: old.sent_count + Number(!received),
          received_count: old.received_count + Number(received),
          total_sent: numeric(old.total_sent) + (received ? 0 : value),
          total_received: numeric(old.total_received) + (received ? value : 0),
          last_transaction_at: new Date().toISOString(),
        })
        .eq("id", old.id)
        .select("*")
        .single(),
      "Update contact",
    );
  }

  async getConnectedMerchants(userId) {
    return unwrap(
      this.db
        .from("merchant_connections")
        .select("*")
        .eq("user_id", userId)
        .eq("is_connected", true),
      "Get merchant connections",
    );
  }
  async getMerchantConnection(userId, merchantId) {
    return unwrap(
      this.db
        .from("merchant_connections")
        .select("*")
        .eq("user_id", userId)
        .eq("merchant_id", merchantId)
        .maybeSingle(),
      "Get merchant connection",
    );
  }
  async isMerchantConnected(userId, merchantId) {
    return Boolean(
      (await this.getMerchantConnection(userId, merchantId))?.is_connected,
    );
  }
  async connectMerchant(userId, merchantId, merchantName) {
    return unwrap(
      this.db
        .from("merchant_connections")
        .upsert(
          {
            user_id: userId,
            merchant_id: merchantId,
            merchant_name: merchantName,
            is_connected: true,
          },
          { onConflict: "user_id,merchant_id" },
        )
        .select("*")
        .single(),
      "Connect merchant",
    );
  }
  async disconnectMerchant(userId, merchantId) {
    return unwrap(
      this.db
        .from("merchant_connections")
        .update({ is_connected: false })
        .eq("user_id", userId)
        .eq("merchant_id", merchantId),
      "Disconnect merchant",
    );
  }
  async updateMerchantLastUsed(userId, merchantId) {
    return unwrap(
      this.db
        .from("merchant_connections")
        .update({ last_used_at: new Date().toISOString() })
        .eq("user_id", userId)
        .eq("merchant_id", merchantId),
      "Update merchant",
    );
  }
  async updateMerchantLocation(userId, merchantId, location) {
    const connection = await this.getMerchantConnection(userId, merchantId);
    if (!connection || !connection.is_connected)
      throw new Error("Connect this merchant before saving a location");
    return unwrap(
      this.db
        .from("merchant_connections")
        .update(
          present({
            location_address: location.address,
            location_city: location.city,
            location_area: location.area,
            location_coordinates: location.coordinates || null,
          }),
        )
        .eq("user_id", userId)
        .eq("merchant_id", merchantId)
        .select("*")
        .single(),
      "Save merchant location",
    );
  }

  async transferBetweenBankAccounts(
    userId,
    fromAccountId,
    toAccountId,
    amount,
  ) {
    return unwrap(
      this.db.rpc("transfer_between_bank_accounts", {
        p_user_id: userId,
        p_from_account_id: fromAccountId,
        p_to_account_id: toAccountId,
        p_amount: numeric(amount),
      }),
      "Transfer between bank accounts",
    );
  }

  async saveOrderSession(session) {
    return unwrap(
      this.db
        .from("order_sessions")
        .upsert(
          {
            session_id: session.session_id,
            user_id: session.user_id,
            merchant: session.merchant,
            merchant_info: session.merchant_info || null,
            cart: session.cart || [],
            subtotal: numeric(session.subtotal),
            tax: numeric(session.tax),
            total: numeric(session.total),
            step: session.step || "init",
            preferences: session.preferences || null,
            is_scheduled: Boolean(session.is_scheduled),
            scheduled_time: session.scheduled_time || null,
          },
          { onConflict: "session_id" },
        )
        .select("*")
        .single(),
      "Save order session",
    );
  }
  async getOrderSession(sessionId) {
    return unwrap(
      this.db
        .from("order_sessions")
        .select("*")
        .eq("session_id", sessionId)
        .maybeSingle(),
      "Get order session",
    );
  }
  async deleteOrderSession(sessionId) {
    return unwrap(
      this.db.from("order_sessions").delete().eq("session_id", sessionId),
      "Delete order session",
    );
  }

  async createAutoPayOrder(userId, order) {
    return unwrap(
      this.db
        .from("auto_pay_orders")
        .insert(
          present({
            user_id: userId,
            order_id:
              order.orderId ||
              order.order_id ||
              `AUTOPAY-${crypto.randomUUID()}`,
            type: order.type,
            merchant: order.merchant,
            merchant_name: order.merchantName,
            amount: numeric(order.amount),
            schedule: order.schedule,
            date_value: order.dateValue,
            month_value: order.monthValue,
            time: order.time,
            one_time_date: order.oneTimeDate,
            payment_method: order.paymentMethod,
            bank_account_id: order.bankAccountId,
            bank_name: order.bankName,
            bank_account_last4: order.bankAccountLast4,
            payment_breakdown: order.paymentBreakdown || {},
            reminder_days: order.reminderDays ?? 3,
            customer_id: order.customer_id,
            bill_type: order.bill_type,
            provider: order.provider,
            mobile_number: order.mobile_number,
            operator: order.operator,
            circle: order.circle,
            bill_id: order.bill_id,
            status: order.status || "active",
            next_execution: order.nextExecution,
          }),
        )
        .select("*")
        .single(),
      "Create Auto Pay",
    );
  }
  async getAutoPayOrders(userId) {
    return unwrap(
      this.db
        .from("auto_pay_orders")
        .select("*")
        .eq("user_id", userId)
        .order("next_execution"),
      "Get Auto Pay",
    );
  }
  async updateAutoPayOrder(orderId, userId, updates) {
    return unwrap(
      this.db
        .from("auto_pay_orders")
        .update(present(updates))
        .eq("order_id", orderId)
        .eq("user_id", userId)
        .select("*")
        .single(),
      "Update Auto Pay",
    );
  }
  async updateAutoPayOrderStatus(orderId, status, userId) {
    let query = this.db
      .from("auto_pay_orders")
      .update({ status })
      .eq("order_id", orderId);
    if (userId) query = query.eq("user_id", userId);
    return unwrap(query.select("*").single(), "Update Auto Pay status");
  }
  async deleteAutoPayOrder(orderId, userId) {
    return unwrap(
      this.db
        .from("auto_pay_orders")
        .delete()
        .eq("order_id", orderId)
        .eq("user_id", userId),
      "Delete Auto Pay",
    );
  }

  async createConversation(userId, conversationId, title = null) {
    return unwrap(
      this.db
        .from("agent_conversations")
        .insert({ user_id: userId, conversation_id: conversationId, title })
        .select("*")
        .single(),
      "Create conversation",
    );
  }
  async getConversations(userId) {
    return unwrap(
      this.db
        .from("agent_conversations")
        .select("*")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false }),
      "Get conversations",
    );
  }
  async addMessage(
    conversationId,
    role,
    content,
    sessionId = null,
    cart = null,
    total = null,
    requiresAction = false,
    merchant = null,
  ) {
    return unwrap(
      this.db.from("agent_messages").insert({
        conversation_id: conversationId,
        role,
        content,
        session_id: sessionId,
        cart,
        total,
        requires_action: requiresAction,
        merchant,
      }),
      "Save message",
    );
  }
  async getMessages(conversationId) {
    return unwrap(
      this.db
        .from("agent_messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at"),
      "Get messages",
    );
  }
  async updateConversation(conversationId, updates) {
    return unwrap(
      this.db
        .from("agent_conversations")
        .update(present({ title: updates.title }))
        .eq("conversation_id", conversationId)
        .select("*")
        .single(),
      "Update conversation",
    );
  }
  async deleteConversation(conversationId, userId) {
    return unwrap(
      this.db
        .from("agent_conversations")
        .delete()
        .eq("conversation_id", conversationId)
        .eq("user_id", userId),
      "Delete conversation",
    );
  }

  async saveScheduledOrder(order) {
    return unwrap(
      this.db
        .from("scheduled_orders")
        .insert({
          user_id: order.userId,
          order_data: order.orderData || order.order_data,
          scheduled_time: order.scheduleTime || order.scheduled_time,
          status: order.status || "scheduled",
          payment_method: order.paymentMethod,
          payment_breakdown: order.paymentBreakdown || {},
          bank_account_id: order.bankAccountId || null,
        })
        .select("*")
        .single(),
      "Schedule order",
    );
  }
  async getScheduledOrders(userId) {
    return unwrap(
      this.db
        .from("scheduled_orders")
        .select("*")
        .eq("user_id", userId)
        .order("scheduled_time"),
      "Get scheduled orders",
    );
  }
  async getUserScheduledOrders(userId) {
    return this.getScheduledOrders(userId);
  }
  async updateScheduledOrder(id, updates, userId) {
    let query = this.db
      .from("scheduled_orders")
      .update(present(updates))
      .eq("id", id);
    if (userId) query = query.eq("user_id", userId);
    return unwrap(query.select("*").single(), "Update scheduled order");
  }
  async createAgentOrder(userId, order) {
    return unwrap(
      this.db
        .from("agent_orders")
        .insert({
          order_id:
            order.orderId || order.order_id || `ORDER-${crypto.randomUUID()}`,
          user_id: userId,
          merchant: order.merchant,
          merchant_name: order.merchantName,
          items: order.items || [],
          total_amount: numeric(order.totalAmount || order.total_amount),
          payment_method: order.paymentMethod,
          payment_id: order.paymentId,
          sabai_gems: numeric(order.sabaiGems),
          status: order.status || "confirmed",
          estimated_delivery: order.estimatedDelivery,
          tracking: order.tracking || null,
        })
        .select("*")
        .single(),
      "Create agent order",
    );
  }
  async getAgentOrders(userId) {
    return unwrap(
      this.db
        .from("agent_orders")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
      "Get agent orders",
    );
  }
  async getAgentOrder(orderId, userId) {
    let query = this.db
      .from("agent_orders")
      .select("*")
      .eq("order_id", orderId);
    if (userId) query = query.eq("user_id", userId);
    return unwrap(query.maybeSingle(), "Get agent order");
  }
  async updateAgentOrderStatus(orderId, status, tracking = null) {
    return unwrap(
      this.db
        .from("agent_orders")
        .update(present({ status, tracking }))
        .eq("order_id", orderId)
        .select("*")
        .single(),
      "Update agent order",
    );
  }

  async getMoneyRequests(userId, status) {
    let query = this.db
      .from("money_requests")
      .select("*")
      .eq("user_id", userId);
    if (status) query = query.eq("status", status);
    return unwrap(
      query.order("created_at", { ascending: false }),
      "Get money requests",
    );
  }
  async createMoneyRequest(userId, item) {
    return unwrap(
      this.db
        .from("money_requests")
        .insert({
          request_id: item.requestId,
          user_id: userId,
          amount: numeric(item.amount),
          requester_vpa: item.requester_vpa,
          requester_name: item.requester_name,
          recipient_vpa: item.recipient_vpa,
          recipient_name: item.recipient_name,
          description: item.description,
        })
        .select("*")
        .single(),
      "Create money request",
    );
  }
  async updateMoneyRequestStatus(id, status, userId) {
    let query = this.db
      .from("money_requests")
      .update({ status })
      .eq("request_id", id);
    if (userId) query = query.eq("user_id", userId);
    return unwrap(query.select("*").single(), "Update money request");
  }
  async getSplitRequests(userId) {
    return unwrap(
      this.db
        .from("split_requests")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
      "Get split requests",
    );
  }
  async createSplitRequest(userId, item) {
    return unwrap(
      this.db
        .from("split_requests")
        .insert({
          split_id: item.splitId,
          user_id: userId,
          total_amount: numeric(item.totalAmount),
          split_type: item.splitType,
          group_name: item.groupName,
          note: item.note,
          splits: item.splits,
        })
        .select("*")
        .single(),
      "Create split request",
    );
  }
  async updateSplitRequestStatus(id, status, userId) {
    let query = this.db
      .from("split_requests")
      .update({ status })
      .eq("split_id", id);
    if (userId) query = query.eq("user_id", userId);
    return unwrap(query.select("*").single(), "Update split request");
  }
  async deleteSplitRequest(id, userId) {
    return unwrap(
      this.db
        .from("split_requests")
        .delete()
        .eq("split_id", id)
        .eq("user_id", userId),
      "Delete split request",
    );
  }
  async getNotifications(userId, count = 20) {
    return unwrap(
      this.db
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit(count, 100)),
      "Get notifications",
    );
  }
  async getUnreadNotificationCount(userId) {
    const { count, error } = await this.db
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_read", false);
    if (error) throw new Error(error.message);
    return count || 0;
  }
  async markNotificationRead(id, userId) {
    return unwrap(
      this.db
        .from("notifications")
        .update({ is_read: true })
        .eq("id", id)
        .eq("user_id", userId)
        .select("*")
        .single(),
      "Mark notification read",
    );
  }
  async markAllNotificationsRead(userId) {
    return unwrap(
      this.db
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", userId)
        .eq("is_read", false),
      "Mark notifications read",
    );
  }
  async getWeeklyChallenges(userId) {
    return unwrap(
      this.db
        .from("weekly_challenges")
        .select("*")
        .eq("user_id", userId)
        .order("challenge_id"),
      "Get challenges",
    );
  }
  async updateChallengeProgress(
    userId,
    challengeId,
    progress,
    completed = false,
  ) {
    return unwrap(
      this.db
        .from("weekly_challenges")
        .upsert(
          {
            user_id: userId,
            challenge_id: challengeId,
            progress,
            completed,
            completed_at: completed ? new Date().toISOString() : null,
          },
          { onConflict: "user_id,challenge_id" },
        )
        .select("*")
        .single(),
      "Update challenge",
    );
  }
  async claimChallengeReward(userId, challengeId) {
    return unwrap(
      this.db
        .from("weekly_challenges")
        .update({ claimed: true, claimed_at: new Date().toISOString() })
        .eq("user_id", userId)
        .eq("challenge_id", challengeId)
        .eq("completed", true)
        .eq("claimed", false)
        .select("*")
        .single(),
      "Claim challenge",
    );
  }
  async saveNotification(userId, notification) {
    return unwrap(
      this.db.from("notifications").insert({
        user_id: userId,
        type: notification.type || "general",
        title: notification.title || "SabAI Pay",
        message: notification.message,
        priority: notification.priority || "normal",
        metadata: notification.metadata || {},
      }),
      "Create notification",
    );
  }
}

module.exports = new DatabaseService();
