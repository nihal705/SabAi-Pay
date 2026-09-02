// frontend/src/context/BalanceContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import { getCoinBalance, getBankBalances } from '../services/storageService';

const BalanceContext = createContext();

export const useBalance = () => useContext(BalanceContext);

export const BalanceProvider = ({ children }) => {
    const [gems, setGems] = useState(0);
    const [bankBalances, setBankBalances] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const { isConnected, lastMessage } = useWebSocket();

    useEffect(() => {
        loadBalances();
    }, []);

    useEffect(() => {
        if (lastMessage?.type === 'balance_update') {
            const { gems, bankBalances } = lastMessage.data;
            setGems(gems);
            setBankBalances(bankBalances);
        }
    }, [lastMessage]);

    const loadBalances = async () => {
        try {
            const [gemsBalance, banks] = await Promise.all([
                getCoinBalance(),
                getBankBalances()
            ]);
            setGems(gemsBalance);
            setBankBalances(banks);
        } catch (error) {
            console.error('Failed to load balances:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const refreshBalances = async () => {
        await loadBalances();
    };

    return (
        <BalanceContext.Provider value={{
            gems,
            bankBalances,
            isLoading,
            isConnected,
            refreshBalances
        }}>
            {children}
        </BalanceContext.Provider>
    );
};