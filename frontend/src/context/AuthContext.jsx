// frontend/src/context/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../services/apiService';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const navigate = useNavigate();

    // Load user from localStorage on mount
    useEffect(() => {
        const loadUser = async () => {
            const storedToken = localStorage.getItem('token');
            const storedUser = localStorage.getItem('user');
            
            if (storedToken && storedUser) {
                try {
                    const userData = JSON.parse(storedUser);
                    setUser(userData);
                    setToken(storedToken);
                    
                    // Verify token with backend
                    try {
                        const response = await authAPI.getProfile();
                        if (response.data.success) {
                            const mergedUser = {
                                ...response.data.data,
                                profile_pic: userData.profile_pic || response.data.data.profile_pic,
                                gender: userData.gender || response.data.data.gender,
                                date_of_birth: userData.date_of_birth || response.data.data.date_of_birth
                            };
                            setUser(mergedUser);
                            localStorage.setItem('user', JSON.stringify(mergedUser));
                        }
                    } catch (error) {
                        console.log('Using cached user data');
                    }
                } catch (e) {
                    console.error('Failed to parse stored user');
                    localStorage.removeItem('user');
                }
            }
            setLoading(false);
        };
        
        loadUser();
    }, []);

    // Send OTP
    const sendOTP = async (phoneNumber, purpose = 'register') => {
        try {
            const response = await authAPI.sendOTP(phoneNumber, purpose);
            if (response.data.success) {
                toast.success(`OTP sent to ${phoneNumber}`);
                if (response.data.dev_otp) {
                    console.log(`Dev OTP: ${response.data.dev_otp}`);
                }
                return { success: true, dev_otp: response.data.dev_otp };
            }
        } catch (error) {
            console.error('Send OTP error:', error);
            toast.error(error.response?.data?.message || 'Failed to send OTP');
            return { success: false };
        }
    };

    // Verify OTP
    const verifyOTP = async (phoneNumber, otp, purpose = 'register') => {
        try {
            const response = await authAPI.verifyOTP(phoneNumber, otp, purpose);
            if (response.data.success) {
                toast.success('OTP verified successfully');
                return { success: true };
            }
        } catch (error) {
            console.error('Verify OTP error:', error);
            toast.error(error.response?.data?.message || 'Invalid OTP');
            return { success: false };
        }
    };

    // Login
    const login = async (phoneNumber, password) => {
        try {
            const response = await authAPI.login(phoneNumber, password);
            
            if (response.data.success) {
                const { token, user } = response.data.data;
                
                const completeUser = {
                    ...user,
                    gender: user.gender || '',
                    date_of_birth: user.date_of_birth || '',
                    profile_pic: user.profile_pic || null
                };
                
                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(completeUser));
                
                setToken(token);
                setUser(completeUser);
                
                toast.success('Login successful!');
                navigate('/dashboard');
                return { success: true };
            }
        } catch (error) {
            console.error('Login error:', error);
            toast.error(error.response?.data?.message || 'Login failed');
            return { success: false };
        }
    };

    // Register
    const register = async (userData) => {
        try {
            const response = await authAPI.register(userData);
            
            if (response.data.success) {
                const { token, user } = response.data.data;
                
                const completeUser = {
                    ...user,
                    gender: user.gender || userData.gender || '',
                    date_of_birth: user.date_of_birth || userData.date_of_birth || '',
                    profile_pic: user.profile_pic || null
                };
                
                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(completeUser));
                
                setToken(token);
                setUser(completeUser);
                
                toast.success('Registration successful!');
                navigate('/dashboard');
                return { success: true };
            }
        } catch (error) {
            console.error('Register error:', error);
            toast.error(error.response?.data?.message || 'Registration failed');
            return { success: false };
        }
    };

    // Logout
    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        setToken(null);
        setUser(null);
        
        toast.success('Logged out successfully');
        navigate('/login');
    };

    // Update user profile
    const updateUser = async (userData) => {
        try {
            const response = await authAPI.updateProfile(userData);
            
            if (response.data.success) {
                const updatedUser = {
                    ...user,
                    ...response.data.data,
                    gender: response.data.data.gender || user?.gender || '',
                    date_of_birth: response.data.data.date_of_birth || user?.date_of_birth || '',
                    profile_pic: response.data.data.profile_pic || user?.profile_pic || null
                };
                
                localStorage.setItem('user', JSON.stringify(updatedUser));
                setUser(updatedUser);
                
                toast.success('Profile updated successfully!');
                return { success: true, user: updatedUser };
            }
        } catch (error) {
            console.error('Update user error:', error);
            toast.error(error.response?.data?.message || 'Failed to update profile');
            throw new Error('Failed to update profile');
        }
    };

    const value = {
        user,
        loading,
        sendOTP,
        verifyOTP,
        login,
        register,
        logout,
        updateUser,
        isAuthenticated: !!user && !!token
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;