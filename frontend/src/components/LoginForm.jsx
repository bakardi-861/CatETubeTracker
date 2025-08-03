import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

/**
 * Login Form Component
 * Handles user authentication with email and password
 */
const LoginForm = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: true
  });
  const [showRegister, setShowRegister] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  const { login, loading, error, clearError } = useAuth();

  /**
   * Handle input changes
   */
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    
    // Clear general error
    if (error) {
      clearError();
    }
  };

  /**
   * Validate form data
   */
  const validateForm = () => {
    const errors = {};

    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await login({
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
        rememberMe: formData.rememberMe
      });
      // Success - user will be redirected by auth context
    } catch (error) {
      console.error('Login failed:', error.message);
      // Error is handled by auth context
    }
  };

  /**
   * Switch to registration view
   */
  const handleShowRegister = () => {
    setShowRegister(true);
    clearError();
    setValidationErrors({});
  };

  if (showRegister) {
    return <RegisterForm onBackToLogin={() => setShowRegister(false)} />;
  }

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: '#f5f5f5'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
        width: '100%',
        maxWidth: '400px'
      }}>
        <h1 style={{
          textAlign: 'center',
          marginBottom: '1.5rem',
          color: '#333'
        }}>
          CatETube Tracker
        </h1>

        <h2 style={{
          textAlign: 'center',
          marginBottom: '1.5rem',
          color: '#666',
          fontSize: '1.2rem'
        }}>
          Sign In
        </h2>

        {error && (
          <div style={{
            backgroundColor: '#ffebee',
            color: '#c62828',
            padding: '0.75rem',
            borderRadius: '4px',
            marginBottom: '1rem',
            fontSize: '0.9rem'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: '#333',
              fontSize: '0.9rem'
            }}>
              Email Address *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: validationErrors.email ? '1px solid #f44336' : '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '1rem',
                boxSizing: 'border-box'
              }}
              placeholder="Enter your email"
            />
            {validationErrors.email && (
              <div style={{ color: '#f44336', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                {validationErrors.email}
              </div>
            )}
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: '#333',
              fontSize: '0.9rem'
            }}>
              Password *
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: validationErrors.password ? '1px solid #f44336' : '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '1rem',
                boxSizing: 'border-box'
              }}
              placeholder="Enter your password"
            />
            {validationErrors.password && (
              <div style={{ color: '#f44336', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                {validationErrors.password}
              </div>
            )}
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              fontSize: '0.9rem',
              color: '#666'
            }}>
              <input
                type="checkbox"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleChange}
                style={{ marginRight: '0.5rem' }}
              />
              Remember me for 7 days
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: loading ? '#ccc' : '#4caf50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '1rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.3s'
            }}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div style={{
          textAlign: 'center',
          marginTop: '1.5rem',
          padding: '1rem 0',
          borderTop: '1px solid #eee'
        }}>
          <p style={{ color: '#666', fontSize: '0.9rem', margin: '0 0 0.5rem 0' }}>
            Don't have an account?
          </p>
          <button
            onClick={handleShowRegister}
            style={{
              backgroundColor: 'transparent',
              color: '#2196f3',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.9rem',
              textDecoration: 'underline'
            }}
          >
            Create an account
          </button>
        </div>
      </div>
    </div>
  );
};

// Import RegisterForm component (we'll create this next)
import RegisterForm from './RegisterForm';

export default LoginForm;