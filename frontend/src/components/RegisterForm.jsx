import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

/**
 * Registration Form Component
 * Handles new user registration with comprehensive validation
 */
const RegisterForm = ({ onBackToLogin }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    catName: '',
    catBreed: '',
    catAge: '',
    catWeight: '',
    dailyTargetMl: '210',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  });
  const [validationErrors, setValidationErrors] = useState({});
  const [showCatInfo, setShowCatInfo] = useState(false);

  const { register, loading, error, clearError } = useAuth();

  /**
   * Handle input changes
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
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
   * Validate password strength
   */
  const validatePassword = (password) => {
    const errors = [];
    if (password.length < 8) {
      errors.push('at least 8 characters');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('one lowercase letter');
    }
    if (!/\d/.test(password)) {
      errors.push('one number');
    }
    return errors;
  };

  /**
   * Validate form data
   */
  const validateForm = () => {
    const errors = {};

    // Email validation
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required';
    } else {
      const passwordErrors = validatePassword(formData.password);
      if (passwordErrors.length > 0) {
        errors.password = `Password must contain ${passwordErrors.join(', ')}`;
      }
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    // First name validation
    if (!formData.firstName) {
      errors.firstName = 'First name is required';
    }

    // Daily target validation
    if (formData.dailyTargetMl && (isNaN(formData.dailyTargetMl) || formData.dailyTargetMl <= 0)) {
      errors.dailyTargetMl = 'Daily target must be a positive number';
    }

    // Cat age validation (if provided)
    if (formData.catAge && (isNaN(formData.catAge) || formData.catAge < 0)) {
      errors.catAge = 'Cat age must be a positive number';
    }

    // Cat weight validation (if provided)
    if (formData.catWeight && (isNaN(formData.catWeight) || formData.catWeight <= 0)) {
      errors.catWeight = 'Cat weight must be a positive number';
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
      const userData = {
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        catName: formData.catName.trim(),
        catBreed: formData.catBreed.trim(),
        catAge: formData.catAge ? parseInt(formData.catAge) : null,
        catWeight: formData.catWeight ? parseFloat(formData.catWeight) : null,
        dailyTargetMl: parseFloat(formData.dailyTargetMl),
        timezone: formData.timezone
      };

      await register(userData);
      // Success - user will be redirected by auth context
    } catch (error) {
      console.error('Registration failed:', error.message);
      // Error is handled by auth context
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
      padding: '1rem'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
        width: '100%',
        maxWidth: '500px'
      }}>
        <h1 style={{
          textAlign: 'center',
          marginBottom: '1rem',
          color: '#333'
        }}>
          Create Your Account
        </h1>

        <p style={{
          textAlign: 'center',
          color: '#666',
          marginBottom: '1.5rem',
          fontSize: '0.9rem'
        }}>
          Join CatETube Tracker to monitor your cat's feeding progress
        </p>

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
          {/* Account Information */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ color: '#333', marginBottom: '1rem', fontSize: '1.1rem' }}>
              Account Information
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#333', fontSize: '0.9rem' }}>
                  First Name *
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: validationErrors.firstName ? '1px solid #f44336' : '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '1rem',
                    boxSizing: 'border-box'
                  }}
                  placeholder="First name"
                />
                {validationErrors.firstName && (
                  <div style={{ color: '#f44336', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                    {validationErrors.firstName}
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#333', fontSize: '0.9rem' }}>
                  Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '1rem',
                    boxSizing: 'border-box'
                  }}
                  placeholder="Last name"
                />
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#333', fontSize: '0.9rem' }}>
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#333', fontSize: '0.9rem' }}>
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
                  placeholder="Create password"
                />
                {validationErrors.password && (
                  <div style={{ color: '#f44336', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                    {validationErrors.password}
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#333', fontSize: '0.9rem' }}>
                  Confirm Password *
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: validationErrors.confirmPassword ? '1px solid #f44336' : '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '1rem',
                    boxSizing: 'border-box'
                  }}
                  placeholder="Confirm password"
                />
                {validationErrors.confirmPassword && (
                  <div style={{ color: '#f44336', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                    {validationErrors.confirmPassword}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Cat Information */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ color: '#333', fontSize: '1.1rem', margin: 0 }}>
                Cat Information
              </h3>
              <button
                type="button"
                onClick={() => setShowCatInfo(!showCatInfo)}
                style={{
                  marginLeft: '1rem',
                  backgroundColor: 'transparent',
                  color: '#2196f3',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  textDecoration: 'underline'
                }}
              >
                {showCatInfo ? 'Hide' : 'Optional'}
              </button>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#333', fontSize: '0.9rem' }}>
                Cat's Name
              </label>
              <input
                type="text"
                name="catName"
                value={formData.catName}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '1rem',
                  boxSizing: 'border-box'
                }}
                placeholder="Your cat's name"
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#333', fontSize: '0.9rem' }}>
                Daily Feeding Target (mL)
              </label>
              <input
                type="number"
                name="dailyTargetMl"
                value={formData.dailyTargetMl}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: validationErrors.dailyTargetMl ? '1px solid #f44336' : '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '1rem',
                  boxSizing: 'border-box'
                }}
                placeholder="210"
              />
              {validationErrors.dailyTargetMl && (
                <div style={{ color: '#f44336', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                  {validationErrors.dailyTargetMl}
                </div>
              )}
            </div>

            {showCatInfo && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: '#333', fontSize: '0.9rem' }}>
                    Breed
                  </label>
                  <input
                    type="text"
                    name="catBreed"
                    value={formData.catBreed}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '1rem',
                      boxSizing: 'border-box'
                    }}
                    placeholder="Breed"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: '#333', fontSize: '0.9rem' }}>
                    Age (years)
                  </label>
                  <input
                    type="number"
                    name="catAge"
                    value={formData.catAge}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: validationErrors.catAge ? '1px solid #f44336' : '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '1rem',
                      boxSizing: 'border-box'
                    }}
                    placeholder="Age"
                  />
                  {validationErrors.catAge && (
                    <div style={{ color: '#f44336', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                      {validationErrors.catAge}
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: '#333', fontSize: '0.9rem' }}>
                    Weight (lbs)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    name="catWeight"
                    value={formData.catWeight}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: validationErrors.catWeight ? '1px solid #f44336' : '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '1rem',
                      boxSizing: 'border-box'
                    }}
                    placeholder="Weight"
                  />
                  {validationErrors.catWeight && (
                    <div style={{ color: '#f44336', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                      {validationErrors.catWeight}
                    </div>
                  )}
                </div>
              </div>
            )}
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
              transition: 'background-color 0.3s',
              marginBottom: '1rem'
            }}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div style={{
          textAlign: 'center',
          paddingTop: '1rem',
          borderTop: '1px solid #eee'
        }}>
          <p style={{ color: '#666', fontSize: '0.9rem', margin: '0 0 0.5rem 0' }}>
            Already have an account?
          </p>
          <button
            onClick={onBackToLogin}
            style={{
              backgroundColor: 'transparent',
              color: '#2196f3',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.9rem',
              textDecoration: 'underline'
            }}
          >
            Sign in here
          </button>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;