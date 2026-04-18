import React, { createContext, useState, useContext, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext';

// Create context
const PaymentContext = createContext();

// Custom hook to use payment context
export const usePayment = () => {
  const context = useContext(PaymentContext);
  if (!context) {
    throw new Error('usePayment must be used within a PaymentProvider');
  }
  return context;
};

// Provider component
export const PaymentProvider = ({ children }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState({
    monthly_limit: 5000,
    current_spent: 0,
    remaining: 5000,
    used_percentage: 0
  });

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

  const sendMoney = useCallback(async (paymentData) => {
    setLoading(true);
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/upi/send`, paymentData);
      
      if (response.data.success) {
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

  const value = {
    balance,
    loading,
    fetchBalance,
    sendMoney
  };

  return (
    <PaymentContext.Provider value={value}>
      {children}
    </PaymentContext.Provider>
  );
};

export default PaymentContext;