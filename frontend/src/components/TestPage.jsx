import React, { useState } from 'react';
import FeedingForm from './FeedingForm';
import DailyTracker from './DailyTracker';
import ReportDownload from './ReportDownload';

export default function TestPage() {
  const [activeTab, setActiveTab] = useState('tracker');

  const tabs = [
    { id: 'tracker', label: '📊 Daily Tracker', component: DailyTracker },
    { id: 'feeding', label: '🍽️ Feeding Form', component: FeedingForm },
    { id: 'reports', label: '📋 Reports', component: ReportDownload },
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      {/* Header */}
      <div style={{
        backgroundColor: '#2196F3',
        color: 'white',
        padding: '20px',
        textAlign: 'center',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ margin: 0, fontSize: '2em' }}>🐱 CatETube Tracker</h1>
        <p style={{ margin: '8px 0 0 0', opacity: 0.9 }}>
          Testing All Features - Your Cat's Daily 210mL Goal
        </p>
      </div>

      {/* Navigation Tabs */}
      <div style={{
        backgroundColor: 'white',
        borderBottom: '1px solid #e0e0e0',
        display: 'flex',
        justifyContent: 'center',
        padding: '0 20px'
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '15px 25px',
              border: 'none',
              backgroundColor: 'transparent',
              borderBottom: activeTab === tab.id ? '3px solid #2196F3' : '3px solid transparent',
              color: activeTab === tab.id ? '#2196F3' : '#666',
              fontWeight: activeTab === tab.id ? 'bold' : 'normal',
              cursor: 'pointer',
              fontSize: '16px',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              if (activeTab !== tab.id) {
                e.target.style.backgroundColor = '#f5f5f5';
              }
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = 'transparent';
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Quick Testing Info */}
        <div style={{
          backgroundColor: '#e3f2fd',
          border: '1px solid #2196F3',
          borderRadius: '8px',
          padding: '15px',
          marginBottom: '20px'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#1976d2' }}>
            🧪 Testing Mode Active
          </h3>
          <div style={{ fontSize: '14px', color: '#555' }}>
            <strong>Current Tab:</strong> {tabs.find(tab => tab.id === activeTab)?.label}
            <br />
            <strong>Quick Tests:</strong>
            {activeTab === 'tracker' && ' View progress, change target (⚙️), reset tracker'}
            {activeTab === 'feeding' && ' Log 70mL feeding, test with/without medication'}
            {activeTab === 'reports' && ' Generate CSV/JSON/Excel reports with date filters'}
          </div>
        </div>

        {/* Test Shortcuts */}
        {activeTab === 'feeding' && (
          <div style={{
            backgroundColor: '#fff3e0',
            border: '1px solid #ff9800',
            borderRadius: '8px',
            padding: '15px',
            marginBottom: '20px'
          }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#f57c00' }}>
              🚀 Quick Test Scenarios
            </h4>
            <div style={{ fontSize: '14px' }}>
              <p><strong>Scenario 1:</strong> Log 70mL feeding (typical 1/3 daily amount)</p>
              <p><strong>Scenario 2:</strong> Log 70mL + 5mL medication</p>
              <p><strong>Scenario 3:</strong> Log three 70mL feedings to complete daily goal</p>
            </div>
          </div>
        )}

        {activeTab === 'tracker' && (
          <div style={{
            backgroundColor: '#f3e5f5',
            border: '1px solid #9c27b0',
            borderRadius: '8px',
            padding: '15px',
            marginBottom: '20px'
          }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#7b1fa2' }}>
              🎯 Tracker Testing Tips
            </h4>
            <div style={{ fontSize: '14px' }}>
              <p><strong>Auto-refresh:</strong> Tracker updates every 30 seconds</p>
              <p><strong>Progress circle:</strong> Should show real-time completion %</p>
              <p><strong>Settings:</strong> Change daily target and see immediate updates</p>
              <p><strong>Reset:</strong> Clears progress for testing new scenarios</p>
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div style={{
            backgroundColor: '#e8f5e8',
            border: '1px solid #4caf50',
            borderRadius: '8px',
            padding: '15px',
            marginBottom: '20px'
          }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#388e3c' }}>
              📊 Report Testing Guide
            </h4>
            <div style={{ fontSize: '14px' }}>
              <p><strong>Formats:</strong> CSV (spreadsheet), JSON (data), Excel (formatted)</p>
              <p><strong>Types:</strong> Feeding only, Medication only, or Combined</p>
              <p><strong>Filters:</strong> Leave dates empty for all data, or set range</p>
              <p><strong>Progress:</strong> Watch real-time progress bars during generation</p>
            </div>
          </div>
        )}

        {/* Component Content */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          overflow: 'hidden'
        }}>
          {ActiveComponent && <ActiveComponent />}
        </div>
      </div>

      {/* Footer with Backend Status */}
      <div style={{
        backgroundColor: '#333',
        color: 'white',
        padding: '20px',
        textAlign: 'center',
        marginTop: '40px'
      }}>
        <p style={{ margin: '0 0 10px 0', fontSize: '14px' }}>
          🔧 <strong>Backend:</strong> http://localhost:5000 &nbsp;|&nbsp;
          🌐 <strong>Frontend:</strong> http://localhost:5173
        </p>
        <p style={{ margin: 0, fontSize: '12px', opacity: 0.7 }}>
          Make sure both servers are running. Check browser console for API errors.
        </p>
      </div>
    </div>
  );
}