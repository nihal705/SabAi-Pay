// frontend/src/hooks/useWebSocket.js
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

export const useWebSocket = () => {
    const { token } = useAuth();
    const [isConnected, setIsConnected] = useState(false);
    const [lastMessage, setLastMessage] = useState(null);
    const ws = useRef(null);
    const reconnectAttempts = useRef(0);
    const reconnectTimeout = useRef(null);

    const connect = useCallback(() => {
        if (!token) return;

        const wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:5000';
        ws.current = new WebSocket(`${wsUrl}?token=${token}`);

        ws.current.onopen = () => {
            console.log('WebSocket connected');
            setIsConnected(true);
            reconnectAttempts.current = 0;
        };

        ws.current.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                setLastMessage(data);
                
                // Handle specific message types
                switch (data.type) {
                    case 'balance_update':
                        // Dispatch balance update event
                        window.dispatchEvent(new CustomEvent('balanceUpdate', { detail: data.data }));
                        break;
                    case 'notification':
                        // Dispatch notification event
                        window.dispatchEvent(new CustomEvent('newNotification', { detail: data.data }));
                        break;
                    case 'transaction_update':
                        // Dispatch transaction update event
                        window.dispatchEvent(new CustomEvent('transactionUpdate', { detail: data.data }));
                        break;
                    default:
                        break;
                }
            } catch (error) {
                console.error('WebSocket message error:', error);
            }
        };

        ws.current.onclose = () => {
            setIsConnected(false);
            // Attempt reconnection
            if (reconnectAttempts.current < 5) {
                reconnectTimeout.current = setTimeout(() => {
                    reconnectAttempts.current++;
                    connect();
                }, 3000 * reconnectAttempts.current);
            }
        };

        ws.current.onerror = (error) => {
            console.error('WebSocket error:', error);
        };
    }, [token]);

    const disconnect = useCallback(() => {
        if (reconnectTimeout.current) {
            clearTimeout(reconnectTimeout.current);
        }
        if (ws.current) {
            ws.current.close();
            ws.current = null;
        }
        setIsConnected(false);
    }, []);

    const sendMessage = useCallback((data) => {
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify(data));
        } else {
            console.warn('WebSocket not connected');
        }
    }, []);

    useEffect(() => {
        connect();
        return () => disconnect();
    }, [connect, disconnect]);

    return { isConnected, sendMessage, lastMessage, disconnect };
};