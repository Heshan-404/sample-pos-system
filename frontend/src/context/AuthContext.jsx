import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (token) {
            fetchCurrentUser();
        } else {
            setLoading(false);
        }
    }, [token]);

    const fetchCurrentUser = async () => {
        try {
            const response = await authAPI.getCurrentUser();
            if (response.data.success) {
                setUser(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching user:', error);
            logout();
        } finally {
            setLoading(false);
        }
    };

    const login = async (credentials) => {
        try {
            const response = await authAPI.login(credentials);
            if (response.data.success) {
                const { token, user } = response.data.data;
                localStorage.setItem('token', token);
                setToken(token);
                setUser(user);
                return { success: true };
            }
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Login failed'
            };
        }
    };

    const pinLogin = async (pin) => {
        try {
            const response = await authAPI.pinLogin(pin);
            if (response.data.success) {
                const { token, user } = response.data.data;
                localStorage.setItem('token', token);
                setToken(token);
                setUser(user);
                return { success: true };
            }
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Invalid PIN'
            };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
    };

    const value = {
        user,
        token,
        loading,
        login,
        pinLogin,
        logout,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        isCashier: user?.role === 'cashier',
        isWaiter: user?.role === 'waiter'
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
