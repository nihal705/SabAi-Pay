// Transaction Helper - Standardizes how transactions are saved across all pages

export const saveTransaction = (transactionData) => {
  // Get existing transactions
  const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
  
  // Generate transaction ID
  const transactionId = transactionData.transactionId || 
    `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`;
  
  // Create standardized transaction object
  const newTransaction = {
    id: Date.now(),
    transactionId: transactionId,
    type: transactionData.type, // 'send', 'receive', 'bill', 'recharge', 'qr', 'cashback', 'agent'
    amount: parseFloat(transactionData.amount),
    description: transactionData.description || '',
    merchant: transactionData.merchant || null,
    receiver_name: transactionData.receiver_name || null,
    receiver_vpa: transactionData.receiver_vpa || null,
    sender_name: transactionData.sender_name || null,
    sender_vpa: transactionData.sender_vpa || null,
    bank_name: transactionData.bank_name || null,
    bank_id: transactionData.bank_id || null,
    account_suffix: transactionData.account_suffix || null,
    category: transactionData.category || 'others',
    date: transactionData.date || new Date().toISOString(),
    status: transactionData.status || 'success',
    note: transactionData.note || null,
    razorpay_payment_id: transactionData.razorpay_payment_id || null,
    coins_earned: transactionData.coins_earned || 0,
    agent_intent: transactionData.agent_intent || null,
    agent_message: transactionData.agent_message || null
  };

  // Add to beginning of array (newest first)
  transactions.unshift(newTransaction);
  
  // Save back to localStorage
  localStorage.setItem('transactions', JSON.stringify(transactions));
  
  // Update bank balance if it's a money movement transaction
  if (transactionData.bank_id && (
      transactionData.type === 'send' || 
      transactionData.type === 'bill' || 
      transactionData.type === 'recharge' || 
      transactionData.type === 'qr' || 
      transactionData.type === 'agent')) {
    updateBankBalance(transactionData.bank_id, transactionData.amount, 'deduct');
  } else if (transactionData.bank_id && transactionData.type === 'receive') {
    updateBankBalance(transactionData.bank_id, transactionData.amount, 'add');
  }
  
  // Add coins if applicable (1 coin per ₹100 spent)
  if (transactionData.type === 'send' || transactionData.type === 'bill' || 
      transactionData.type === 'recharge' || transactionData.type === 'qr' || 
      transactionData.type === 'agent') {
    const coinsEarned = Math.floor(transactionData.amount / 100);
    if (coinsEarned > 0) {
      addCoins(transactionData.user_id, coinsEarned, transactionData);
    }
  }
  
  return newTransaction;
};

const updateBankBalance = (bankId, amount, operation) => {
  const balances = JSON.parse(localStorage.getItem('bankBalances') || '{}');
  const currentBalance = balances[bankId] || 25000;
  
  if (operation === 'deduct') {
    balances[bankId] = currentBalance - amount;
  } else if (operation === 'add') {
    balances[bankId] = currentBalance + amount;
  }
  
  localStorage.setItem('bankBalances', JSON.stringify(balances));
};

const addCoins = (userId, coins, transactionData) => {
  const coinTransactions = JSON.parse(localStorage.getItem('coinTransactions') || '[]');
  
  coinTransactions.unshift({
    id: Date.now(),
    userId,
    coins,
    type: 'earned',
    source: transactionData.type,
    description: `Earned from ${transactionData.type} payment`,
    transactionId: transactionData.transactionId,
    date: new Date().toISOString()
  });
  
  localStorage.setItem('coinTransactions', JSON.stringify(coinTransactions));
};

export const getTransactions = () => {
  return JSON.parse(localStorage.getItem('transactions') || '[]');
};

export const getTransactionsByBank = (bankId) => {
  const transactions = getTransactions();
  return transactions.filter(t => t.bank_id === bankId);
};

export const getTransactionsByType = (type) => {
  const transactions = getTransactions();
  return transactions.filter(t => t.type === type);
};

export const getTransactionsByDateRange = (startDate, endDate) => {
  const transactions = getTransactions();
  const start = new Date(startDate);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);
  
  return transactions.filter(t => {
    const txnDate = new Date(t.date);
    return txnDate >= start && txnDate <= end;
  });
};