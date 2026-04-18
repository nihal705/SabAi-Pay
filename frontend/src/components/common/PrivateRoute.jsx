// frontend/src/components/common/PrivateRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const PrivateRoute = ({ children }) => {
    const { user, loading } = useAuth();
    
    // Check both token and user
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (loading) {
        return <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>;
    }
    
    // If no token or no user, redirect to login
    if (!token || !storedUser) {
        return <Navigate to="/login" replace />;
    }
    
    return children;
};

export default PrivateRoute;