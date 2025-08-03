import axios from 'axios';

const AUTH_API = 'http://localhost:8000/api/auth';

// Configure axios to include credentials for session management
axios.defaults.withCredentials = true;

/**
 * Authentication API Service
 * Handles all authentication-related API calls
 */

export const authAPI = {
  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Promise} Response with user data or error
   */
  async register(userData) {
    try {
      const response = await axios.post(`${AUTH_API}/register`, {
        email: userData.email,
        password: userData.password,
        first_name: userData.firstName,
        last_name: userData.lastName,
        cat_name: userData.catName,
        cat_breed: userData.catBreed,
        cat_age: userData.catAge,
        cat_weight: userData.catWeight,
        daily_target_ml: userData.dailyTargetMl || 210,
        timezone: userData.timezone || 'UTC'
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      const message = error.response?.data?.error || 'Registration failed';
      throw new Error(message);
    }
  },

  /**
   * Login user
   * @param {Object} credentials - Email and password
   * @returns {Promise} Response with user data or error
   */
  async login(credentials) {
    try {
      const response = await axios.post(`${AUTH_API}/login`, {
        email: credentials.email,
        password: credentials.password,
        remember_me: credentials.rememberMe || true
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      const message = error.response?.data?.error || 'Login failed';
      throw new Error(message);
    }
  },

  /**
   * Logout current user
   * @returns {Promise} Response confirmation
   */
  async logout() {
    try {
      const response = await axios.post(`${AUTH_API}/logout`);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.error || 'Logout failed';
      throw new Error(message);
    }
  },

  /**
   * Get current user info
   * @returns {Promise} Current user data
   */
  async getCurrentUser() {
    try {
      const response = await axios.get(`${AUTH_API}/me`);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to get user info';
      throw new Error(message);
    }
  },

  /**
   * Update user profile
   * @param {Object} profileData - Updated profile information
   * @returns {Promise} Response with updated user data
   */
  async updateProfile(profileData) {
    try {
      const response = await axios.put(`${AUTH_API}/profile`, profileData, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      const message = error.response?.data?.error || 'Profile update failed';
      throw new Error(message);
    }
  },

  /**
   * Change user password
   * @param {Object} passwordData - Current and new passwords
   * @returns {Promise} Response confirmation
   */
  async changePassword(passwordData) {
    try {
      const response = await axios.post(`${AUTH_API}/change-password`, {
        current_password: passwordData.currentPassword,
        new_password: passwordData.newPassword
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      const message = error.response?.data?.error || 'Password change failed';
      throw new Error(message);
    }
  },

  /**
   * Deactivate user account
   * @param {string} password - Password confirmation
   * @returns {Promise} Response confirmation
   */
  async deactivateAccount(password) {
    try {
      const response = await axios.post(`${AUTH_API}/deactivate`, {
        password: password
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      const message = error.response?.data?.error || 'Account deactivation failed';
      throw new Error(message);
    }
  }
};

/**
 * Axios interceptor to handle authentication errors
 * Automatically redirects to login on 401 errors
 */
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear any stored user state and redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);