import './App.css'
import React from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navigation from './components/Navigation';
import FeedingForm from './components/FeedingForm';
import LoginForm from './components/LoginForm';

/**
 * Main Application Content
 * Renders different components based on authentication status
 */
function AppContent() {
  const { isAuthenticated, loading } = useAuth();

  // Show loading spinner during authentication check
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#f5f5f5'
      }}>
        <div style={{
          textAlign: 'center',
          color: '#666'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #e0e0e0',
            borderTop: '4px solid #2196f3',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }}></div>
          Loading CatETube Tracker...
        </div>
      </div>
    );
  }

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return <LoginForm />;
  }

  // Show main application if authenticated
  return (
    <div className="App">
      <Navigation />
      <div style={{ padding: '2rem' }}>
        <FeedingForm />
      </div>
    </div>
  );
}

/**
 * Root App Component
 * Wraps the application with AuthProvider
 */
function App() {
  return (
    <AuthProvider>
      <AppContent />
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </AuthProvider>
  );
}

// function App() {
//   const [count, setCount] = useState(0)

//   return (
//     <>
//       <div>
//         <a href="https://vite.dev" target="_blank">
//           <img src={viteLogo} className="logo" alt="Vite logo" />
//         </a>
//         <a href="https://react.dev" target="_blank">
//           <img src={reactLogo} className="logo react" alt="React logo" />
//         </a>
//       </div>
//       <h1>Vite + React</h1>
//       <div className="card">
//         <button onClick={() => setCount((count) => count + 1)}>
//           count is {count}
//         </button>
//         <p>
//           Edit <code>src/App.jsx</code> and save to test HMR
//         </p>
//       </div>
//       <p className="read-the-docs">
//         Click on the Vite and React logos to learn more
//       </p>
//     </>
//   )
// }

export default App;
