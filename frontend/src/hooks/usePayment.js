import { useState, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from './useAuth';

export const usePayment = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState({
    monthly_limit: 5000,
    current_spent: 0,
    remaining: 5000,
    used_percentage: 0
  });
  const [transactions, setTransactions] = useState([]);
  const [recentPayments, setRecentPayments] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedMethod, setSelectedMethod] = useState(null);

  // Fetch user balance
  const fetchBalance = useCallback(async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/upi/balance`);
      if (response.data.success) {
        setBalance(response.data.data);
        return response.data.data;
      }
    } catch (error) {
      console.error('Error fetching balance:', error);
      toast.error('Failed to fetch balance');
    }
  }, []);

  // Send money
  const sendMoney = useCallback(async (paymentData) => {
    setLoading(true);
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/upi/send`, paymentData);
      
      if (response.data.success) {
        // Initialize Razorpay checkout
        const options = {
          key: process.env.REACT_APP_RAZORPAY_KEY_ID,
          amount: paymentData.amount * 100,
          currency: 'INR',
          name: 'SabAI Pay',
          description: `Payment to ${paymentData.receiver_vpa}`,
          order_id: response.data.data.order_id,
          handler: async (paymentResponse) => {
            try {
              const verifyResult = await axios.post(
                `${process.env.REACT_APP_API_URL}/upi/verify-payment`,
                {
                  razorpay_payment_id: paymentResponse.razorpay_payment_id,
                  razorpay_order_id: paymentResponse.razorpay_order_id,
                  razorpay_signature: paymentResponse.razorpay_signature,
                  transaction_id: response.data.data.transaction_id
                }
              );

              if (verifyResult.data.success) {
                toast.success('Payment successful!');
                await fetchBalance();
                await fetchRecentPayments();
                return { success: true, data: verifyResult.data.data };
              }
            } catch (error) {
              toast.error(error.response?.data?.message || 'Payment verification failed');
              return { success: false };
            }
          },
          prefill: {
            name: paymentData.receiver_name || '',
            email: user?.email || '',
            contact: paymentData.receiver_vpa || ''
          },
          theme: {
            color: '#667eea'
          }
        };

        const razorpay = new window.Razorpay(options);
        razorpay.open();
        
        return { success: true, data: response.data.data };
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Payment failed');
      return { success: false, error: error.response?.data?.message };
    } finally {
      setLoading(false);
    }
  }, [user, fetchBalance]);

  // Request money
  const requestMoney = useCallback(async (requestData) => {
    setLoading(true);
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/upi/request`,
        requestData
      );
      
      if (response.data.success) {
        toast.success('Money request sent!');
        return { success: true, data: response.data.data };
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Request failed');
      return { success: false, error: error.response?.data?.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch transactions
  const fetchTransactions = useCallback(async (filters = {}) => {
    setLoading(true);
    try {
      const params = new URLSearchParams(filters).toString();
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/transactions${params ? `?${params}` : ''}`
      );
      
      if (response.data.success) {
        setTransactions(response.data.data.transactions);
        return response.data.data;
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error('Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch recent payments
  const fetchRecentPayments = useCallback(async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/transactions?limit=5`
      );
      
      if (response.data.success) {
        setRecentPayments(response.data.data.transactions);
        return response.data.data.transactions;
      }
    } catch (error) {
      console.error('Error fetching recent payments:', error);
    }
  }, []);

  // Fetch payment methods
  const fetchPaymentMethods = useCallback(async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/upi/bank-accounts`
      );
      
      if (response.data.success) {
        setPaymentMethods(response.data.data);
        return response.data.data;
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error);
    }
  }, []);

  // Add payment method
  const addPaymentMethod = useCallback(async (methodData) => {
    setLoading(true);
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/upi/bank-accounts`,
        methodData
      );
      
      if (response.data.success) {
        toast.success('Bank account added successfully');
        await fetchPaymentMethods();
        return { success: true, data: response.data.data };
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add bank account');
      return { success: false, error: error.response?.data?.message };
    } finally {
      setLoading(false);
    }
  }, [fetchPaymentMethods]);

  // Remove payment method
  const removePaymentMethod = useCallback(async (accountId) => {
    setLoading(true);
    try {
      const response = await axios.delete(
        `${process.env.REACT_APP_API_URL}/upi/bank-accounts/${accountId}`
      );
      
      if (response.data.success) {
        toast.success('Bank account removed');
        await fetchPaymentMethods();
        return { success: true };
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to remove account');
      return { success: false, error: error.response?.data?.message };
    } finally {
      setLoading(false);
    }
  }, [fetchPaymentMethods]);

  // Set primary payment method
  const setPrimaryMethod = useCallback(async (accountId) => {
    setLoading(true);
    try {
      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/upi/bank-accounts/${accountId}/primary`
      );
      
      if (response.data.success) {
        toast.success('Primary account updated');
        await fetchPaymentMethods();
        return { success: true };
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update primary account');
      return { success: false, error: error.response?.data?.message };
    } finally {
      setLoading(false);
    }
  }, [fetchPaymentMethods]);

  // Pay bill
  const payBill = useCallback(async (billData) => {
    setLoading(true);
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/upi/pay-bill`,
        billData
      );
      
      if (response.data.success) {
        toast.success('Bill paid successfully!');
        await fetchBalance();
        await fetchRecentPayments();
        return { success: true, data: response.data.data };
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Payment failed');
      return { success: false, error: error.response?.data?.message };
    } finally {
      setLoading(false);
    }
  }, [fetchBalance, fetchRecentPayments]);

  // Mobile recharge
  const mobileRecharge = useCallback(async (rechargeData) => {
    setLoading(true);
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/upi/recharge`,
        rechargeData
      );
      
      if (response.data.success) {
        toast.success('Recharge successful!');
        await fetchBalance();
        await fetchRecentPayments();
        return { success: true, data: response.data.data };
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Recharge failed');
      return { success: false, error: error.response?.data?.message };
    } finally {
      setLoading(false);
    }
  }, [fetchBalance, fetchRecentPayments]);

  // Verify UPI ID
  const verifyUPIId = useCallback(async (vpa) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/upi/verify`,
        { vpa }
      );
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      }
    } catch (error) {
      return { success: false, error: error.response?.data?.message };
    }
  }, []);

  // Get transaction details
  const getTransactionDetails = useCallback(async (transactionId) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/transactions/${transactionId}`
      );
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      }
    } catch (error) {
      toast.error('Failed to fetch transaction details');
      return { success: false, error: error.response?.data?.message };
    }
  }, []);

  // Download receipt
  const downloadReceipt = useCallback(async (transactionId) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/transactions/${transactionId}/receipt`,
        { responseType: 'blob' }
      );
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `receipt-${transactionId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Receipt downloaded');
      return { success: true };
    } catch (error) {
      toast.error('Failed to download receipt');
      return { success: false };
    }
  }, []);

  // Get spending insights
  const getSpendingInsights = useCallback(async (period = 'month') => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/transactions/insights?period=${period}`
      );
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      }
    } catch (error) {
      console.error('Error fetching insights:', error);
      return { success: false };
    }
  }, []);

  return {
    // State
    loading,
    balance,
    transactions,
    recentPayments,
    paymentMethods,
    selectedMethod,

    // Actions
    fetchBalance,
    sendMoney,
    requestMoney,
    fetchTransactions,
    fetchRecentPayments,
    fetchPaymentMethods,
    addPaymentMethod,
    removePaymentMethod,
    setPrimaryMethod,
    payBill,
    mobileRecharge,
    verifyUPIId,
    getTransactionDetails,
    downloadReceipt,
    getSpendingInsights,
    setSelectedMethod
  };
};

// Additional specialized hooks
export const useBalance = () => {
  const { balance, fetchBalance } = usePayment();
  return { balance, fetchBalance };
};

export const useSendMoney = () => {
  const { sendMoney, loading } = usePayment();
  return { sendMoney, sending: loading };
};

export const useTransactions = () => {
  const { transactions, fetchTransactions, loading } = usePayment();
  return { transactions, fetchTransactions, loading };
};

export const useRecentPayments = () => {
  const { recentPayments, fetchRecentPayments } = usePayment();
  return { recentPayments, fetchRecentPayments };
};

export const usePaymentMethods = () => {
  const { paymentMethods, fetchPaymentMethods, addPaymentMethod, removePaymentMethod, setPrimaryMethod } = usePayment();
  return {
    paymentMethods,
    fetchPaymentMethods,
    addPaymentMethod,
    removePaymentMethod,
    setPrimaryMethod
  };
};

export default usePayment;