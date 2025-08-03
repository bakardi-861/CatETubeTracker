import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

/**
 * Navigation Component
 * Provides user navigation, profile info, and logout functionality
 */
const Navigation = () => {
  const { user, logout, getUserDisplayName } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <nav style={{
      backgroundColor: '#2196f3',
      color: 'white',
      padding: '1rem 2rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      {/* Logo/Brand */}
      <div style={{
        fontSize: '1.5rem',
        fontWeight: 'bold'
      }}>
        CatETube Tracker
      </div>

      {/* User Menu */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setShowUserMenu(!showUserMenu)}
          style={{
            backgroundColor: 'rgba(255,255,255,0.1)',
            color: 'white',
            border: 'none',
            padding: '0.5rem 1rem',
            borderRadius: '20px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.9rem'
          }}
        >
          <div style={{
            width: '32px',
            height: '32px',
            backgroundColor: 'rgba(255,255,255,0.2)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold'
          }}>
            {getUserDisplayName().charAt(0).toUpperCase()}
          </div>
          {getUserDisplayName()}
          <span style={{ fontSize: '0.7rem' }}>▼</span>
        </button>

        {showUserMenu && (
          <div style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            backgroundColor: 'white',
            color: '#333',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            minWidth: '200px',
            zIndex: 1000,
            marginTop: '0.5rem'
          }}>
            <div style={{ padding: '1rem' }}>
              <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>
                Signed in as
              </div>
              <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
                {user?.email}
              </div>
              {user?.cat_name && (
                <div style={{ fontSize: '0.8rem', color: '#666' }}>
                  Cat: {user.cat_name}
                </div>
              )}
            </div>

            <div style={{ borderTop: '1px solid #eee' }}>
              <button
                onClick={() => {
                  setShowUserMenu(false);
                  // Add profile editing functionality here
                }}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  backgroundColor: 'transparent',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  color: '#333'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
              >
                Profile Settings
              </button>

              <button
                onClick={() => {
                  setShowUserMenu(false);
                  handleLogout();
                }}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  backgroundColor: 'transparent',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  color: '#f44336',
                  borderTop: '1px solid #eee'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#ffebee'}
                onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
              >
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Click outside to close menu */}
      {showUserMenu && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 999
          }}
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </nav>
  );
};

export default Navigation;