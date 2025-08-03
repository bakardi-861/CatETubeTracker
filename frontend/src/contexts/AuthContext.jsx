import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api/auth';

/**
 * Authentication Context
 * Provides authentication state and methods throughout the application
 */

const AuthContext = createContext();

/**
 * Custom hook to use authentication context
 * @returns {Object} Authentication state and methods
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/**
 * Authentication Provider Component
 * Wraps the app and provides authentication state
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Check if user is authenticated on app load
   */
  useEffect(() => {
    checkAuthStatus();
  }, []);

  /**
   * Check current authentication status
   */
  const checkAuthStatus = async () => {
    try {
      setLoading(true);
      const response = await authAPI.getCurrentUser();
      setUser(response.user);
      setError(null);
    } catch (error) {
      setUser(null);
      // Don't set error for initial auth check - user might just not be logged in
      console.log('User not authenticated');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Login user
   * @param {Object} credentials - Email and password
   */
  const login = async (credentials) => {
    try {
      setLoading(true);
      setError(null);
      const response = await authAPI.login(credentials);
      setUser(response.user);
      return response;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Register new user
   * @param {Object} userData - Registration data
   */
  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await authAPI.register(userData);
      setUser(response.user);
      return response;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Logout user
   */
  const logout = async () => {
    try {
      setLoading(true);
      await authAPI.logout();
      setUser(null);
      setError(null);
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout API fails, clear local state
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Update user profile
   * @param {Object} profileData - Updated profile data
   */
  const updateProfile = async (profileData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await authAPI.updateProfile(profileData);
      setUser(response.user);
      return response;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Change user password
   * @param {Object} passwordData - Current and new passwords
   */
  const changePassword = async (passwordData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await authAPI.changePassword(passwordData);
      return response;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Clear any authentication errors
   */
  const clearError = () => {
    setError(null);
  };

  /**
   * Check if user is authenticated
   */
  const isAuthenticated = !!user;

  /**
   * Get user's display name
   */
  const getUserDisplayName = () => {
    if (!user) return 'Guest';
    return user.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : user.email;
  };

  const value = {
    // State
    user,
    loading,
    error,
    isAuthenticated,
    
    // Methods
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    checkAuthStatus,
    clearError,
    getUserDisplayName,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Higher-order component for protecting routes
 * Redirects to login if user is not authenticated
 */
export const withAuth = (Component) => {
  return function AuthenticatedComponent(props) {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
      return (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh' 
        }}>
          <div>Loading...</div>
        </div>
      );
    }

    if (!isAuthenticated) {
      return <LoginForm />;
    }

    return <Component {...props} />;
  };
};

// Import LoginForm component (we'll create this next)
import LoginForm from '../components/LoginForm';