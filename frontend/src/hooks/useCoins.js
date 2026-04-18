import { useState, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

export const useCoins = () => {
  const [loading, setLoading] = useState(false);
  const [coinBalance, setCoinBalance] = useState(0);
  const [coinHistory, setCoinHistory] = useState([]);
  const [coinStats, setCoinStats] = useState({
    totalEarned: 0,
    totalUsed: 0,
    totalExpired: 0,
    expiringSoon: []
  });
  const [redemptionHistory, setRedemptionHistory] = useState([]);

  // Fetch coin balance
  const fetchCoinBalance = useCallback(async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/coins/balance`);
      if (response.data.success) {
        setCoinBalance(response.data.data.balance);
        setCoinStats(response.data.data.stats);
        setCoinBalance(response.data.data.balance);
        return response.data.data;
      }
    } catch (error) {
      console.error('Error fetching coin balance:', error);
      toast.error('Failed to fetch coin balance');
    }
  }, []);

  // Fetch coin history
  const fetchCoinHistory = useCallback(async (page = 1, limit = 20) => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/coins/history?page=${page}&limit=${limit}`
      );
      
      if (response.data.success) {
        setCoinHistory(response.data.data.history);
        return response.data.data;
      }
    } catch (error) {
      console.error('Error fetching coin history:', error);
      toast.error('Failed to fetch coin history');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch redemption history
  const fetchRedemptionHistory = useCallback(async (page = 1, limit = 20) => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/coins/redemptions?page=${page}&limit=${limit}`
      );
      
      if (response.data.success) {
        setRedemptionHistory(response.data.data.history);
        return response.data.data;
      }
    } catch (error) {
      console.error('Error fetching redemption history:', error);
      toast.error('Failed to fetch redemption history');
    } finally {
      setLoading(false);
    }
  }, []);

  // Redeem coins
  const redeemCoins = useCallback(async (redeemData) => {
    setLoading(true);
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/coins/redeem`,
        redeemData
      );
      
      if (response.data.success) {
        toast.success(`₹${response.data.data.rupee_value} credited successfully!`);
        await fetchCoinBalance();
        await fetchRedemptionHistory();
        return { success: true, data: response.data.data };
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Redemption failed');
      return { success: false, error: error.response?.data?.message };
    } finally {
      setLoading(false);
    }
  }, [fetchCoinBalance, fetchRedemptionHistory]);

  // Get expiring coins
  const getExpiringCoins = useCallback(async (days = 7) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/coins/expiring?days=${days}`
      );
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      }
    } catch (error) {
      console.error('Error fetching expiring coins:', error);
      return { success: false };
    }
  }, []);

  // Get earning opportunities
  const getEarningOpportunities = useCallback(async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/coins/opportunities`
      );
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      }
    } catch (error) {
      console.error('Error fetching opportunities:', error);
      return { success: false };
    }
  }, []);

  // Get usage suggestions
  const getUsageSuggestions = useCallback(async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/coins/suggestions`
      );
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      return { success: false };
    }
  }, []);

  // Get dashboard summary
  const getDashboardSummary = useCallback(async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/coins/dashboard`
      );
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      }
    } catch (error) {
      console.error('Error fetching dashboard summary:', error);
      return { success: false };
    }
  }, []);

  // Add bonus coins (admin only - for testing)
  const addBonusCoins = useCallback(async (amount, reason) => {
    setLoading(true);
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/admin/coins/add`,
        { amount, reason }
      );
      
      if (response.data.success) {
        toast.success(`${amount} bonus coins added!`);
        await fetchCoinBalance();
        return { success: true };
      }
    } catch (error) {
      toast.error('Failed to add bonus coins');
      return { success: false };
    } finally {
      setLoading(false);
    }
  }, [fetchCoinBalance]);

  // Calculate coin value
  const calculateCoinValue = useCallback((coins) => {
    return (coins / 100).toFixed(2);
  }, []);

  // Format coins for display
  const formatCoins = useCallback((coins) => {
    return new Intl.NumberFormat('en-IN').format(coins);
  }, []);

  return {
    // State
    loading,
    coinBalance,
    coinHistory,
    coinStats,
    redemptionHistory,

    // Actions
    fetchCoinBalance,
    fetchCoinHistory,
    fetchRedemptionHistory,
    redeemCoins,
    getExpiringCoins,
    getEarningOpportunities,
    getUsageSuggestions,
    getDashboardSummary,
    addBonusCoins,

    // Utilities
    calculateCoinValue,
    formatCoins
  };
};

// Additional specialized hooks
export const useCoinBalance = () => {
  const { coinBalance, fetchCoinBalance } = useCoins();
  return { coinBalance, fetchCoinBalance };
};

export const useCoinHistory = () => {
  const { coinHistory, fetchCoinHistory, loading } = useCoins();
  return { coinHistory, fetchCoinHistory, loading };
};

export const useRedemption = () => {
  const { redeemCoins, loading } = useCoins();
  return { redeemCoins, redeeming: loading };
};

export const useCoinStats = () => {
  const { coinStats, getExpiringCoins } = useCoins();
  return { stats: coinStats, getExpiringCoins };
};

export default useCoins;