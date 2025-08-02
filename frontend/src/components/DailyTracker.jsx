import React, { useState, useEffect } from 'react';
import { getTodayTracker, createOrUpdateTodayTracker, resetTracker, getTrackerStats } from '../api/tracker';

export default function DailyTracker() {
  const [tracker, setTracker] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dailyTarget, setDailyTarget] = useState(210);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    loadTracker();
    loadStats();
    
    // Refresh tracker every 30 seconds
    const interval = setInterval(loadTracker, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadTracker = async () => {
    try {
      const data = await getTodayTracker();
      setTracker(data);
      setDailyTarget(data.daily_target_ml);
      setError('');
    } catch (err) {
      setError(`Failed to load tracker: ${err.message}`);
      console.error('Tracker load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await getTrackerStats();
      setStats(data);
    } catch (err) {
      console.error('Stats load error:', err);
    }
  };

  const handleUpdateTarget = async () => {
    try {
      setLoading(true);
      const response = await createOrUpdateTodayTracker(dailyTarget);
      setTracker(response.tracker);
      setShowSettings(false);
      alert(response.message);
    } catch (err) {
      setError(`Failed to update target: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('Are you sure you want to reset today\'s tracker? This will clear all feeding progress.')) {
      return;
    }

    try {
      setLoading(true);
      const response = await resetTracker(dailyTarget);
      setTracker(response.tracker);
      alert('Tracker reset successfully!');
    } catch (err) {
      setError(`Failed to reset tracker: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 100) return '#4CAF50'; // Green
    if (percentage >= 75) return '#8BC34A';  // Light green
    if (percentage >= 50) return '#FF9800';  // Orange
    if (percentage >= 25) return '#FF5722';  // Red orange
    return '#f44336'; // Red
  };

  const getStatusMessage = () => {
    if (!tracker) return '';
    
    if (tracker.is_completed) {
      return '🎉 Daily target reached!';
    } else if (tracker.remaining_ml <= 70) {
      return '⚡ Almost done!';
    } else if (tracker.progress_percentage >= 50) {
      return '👍 Good progress!';
    } else {
      return '🍽️ Keep going!';
    }
  };

  if (loading && !tracker) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>Loading tracker...</p>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '20px', 
      maxWidth: '600px', 
      margin: '0 auto',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h2 style={{ margin: 0, color: '#333' }}>Daily Feeding Tracker</h2>
        <button
          onClick={() => setShowSettings(!showSettings)}
          style={{
            padding: '8px 16px',
            backgroundColor: '#666',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          ⚙️ Settings
        </button>
      </div>

      {error && (
        <div style={{
          backgroundColor: '#ffebee',
          color: '#c62828',
          padding: '12px',
          borderRadius: '4px',
          marginBottom: '20px',
          border: '1px solid #ef9a9a'
        }}>
          {error}
        </div>
      )}

      {showSettings && (
        <div style={{
          backgroundColor: '#f5f5f5',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px',
          border: '1px solid #ddd'
        }}>
          <h3 style={{ marginTop: 0 }}>Settings</h3>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>
              Daily Target (mL):
            </label>
            <input
              type="number"
              value={dailyTarget}
              onChange={(e) => setDailyTarget(Number(e.target.value))}
              style={{
                padding: '8px',
                width: '120px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
              min="1"
              max="1000"
            />
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleUpdateTarget}
              disabled={loading}
              style={{
                padding: '8px 16px',
                backgroundColor: '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              Update Target
            </button>
            <button
              onClick={handleReset}
              disabled={loading}
              style={{
                padding: '8px 16px',
                backgroundColor: '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              Reset Today
            </button>
            <button
              onClick={() => setShowSettings(false)}
              style={{
                padding: '8px 16px',
                backgroundColor: '#999',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {tracker && (
        <div>
          {/* Main Tracker Display */}
          <div style={{
            backgroundColor: '#fff',
            border: '2px solid #e0e0e0',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <h3 style={{ 
                margin: '0 0 8px 0',
                fontSize: '1.4em',
                color: '#333'
              }}>
                Today's Progress
              </h3>
              <p style={{ 
                margin: 0, 
                fontSize: '1.1em',
                color: getProgressColor(tracker.progress_percentage),
                fontWeight: 'bold'
              }}>
                {getStatusMessage()}
              </p>
            </div>

            {/* Progress Circle */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              marginBottom: '20px' 
            }}>
              <div style={{
                position: 'relative',
                width: '120px',
                height: '120px'
              }}>
                <svg width="120" height="120" style={{ transform: 'rotate(-90deg)' }}>
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    fill="none"
                    stroke="#e0e0e0"
                    strokeWidth="10"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    fill="none"
                    stroke={getProgressColor(tracker.progress_percentage)}
                    strokeWidth="10"
                    strokeDasharray={`${(tracker.progress_percentage / 100) * 314} 314`}
                    style={{ transition: 'stroke-dasharray 0.5s ease' }}
                  />
                </svg>
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center'
                }}>
                  <div style={{ 
                    fontSize: '1.2em', 
                    fontWeight: 'bold',
                    color: '#333'
                  }}>
                    {Math.round(tracker.progress_percentage)}%
                  </div>
                  <div style={{ 
                    fontSize: '0.8em', 
                    color: '#666'
                  }}>
                    Complete
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '16px',
              marginBottom: '16px'
            }}>
              <div style={{
                backgroundColor: '#f8f9fa',
                padding: '12px',
                borderRadius: '6px',
                textAlign: 'center'
              }}>
                <div style={{ 
                  fontSize: '1.4em', 
                  fontWeight: 'bold',
                  color: '#2196F3'
                }}>
                  {tracker.remaining_ml}mL
                </div>
                <div style={{ fontSize: '0.9em', color: '#666' }}>
                  Remaining
                </div>
              </div>

              <div style={{
                backgroundColor: '#f8f9fa',
                padding: '12px',
                borderRadius: '6px',
                textAlign: 'center'
              }}>
                <div style={{ 
                  fontSize: '1.4em', 
                  fontWeight: 'bold',
                  color: '#4CAF50'
                }}>
                  {tracker.total_fed_ml}mL
                </div>
                <div style={{ fontSize: '0.9em', color: '#666' }}>
                  Fed Today
                </div>
              </div>

              <div style={{
                backgroundColor: '#f8f9fa',
                padding: '12px',
                borderRadius: '6px',
                textAlign: 'center'
              }}>
                <div style={{ 
                  fontSize: '1.4em', 
                  fontWeight: 'bold',
                  color: '#FF9800'
                }}>
                  {tracker.feeding_count}
                </div>
                <div style={{ fontSize: '0.9em', color: '#666' }}>
                  Feedings
                </div>
              </div>

              <div style={{
                backgroundColor: '#f8f9fa',
                padding: '12px',
                borderRadius: '6px',
                textAlign: 'center'
              }}>
                <div style={{ 
                  fontSize: '1.4em', 
                  fontWeight: 'bold',
                  color: '#9C27B0'
                }}>
                  {tracker.daily_target_ml}mL
                </div>
                <div style={{ fontSize: '0.9em', color: '#666' }}>
                  Daily Target
                </div>
              </div>
            </div>

            <div style={{ 
              fontSize: '0.8em', 
              color: '#999',
              textAlign: 'center'
            }}>
              Last updated: {new Date(tracker.last_updated).toLocaleTimeString()}
            </div>
          </div>

          {/* Quick Stats */}
          {stats && (
            <div style={{
              backgroundColor: '#fff',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              padding: '16px'
            }}>
              <h4 style={{ margin: '0 0 12px 0', color: '#333' }}>
                Recent Performance
              </h4>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                gap: '12px',
                fontSize: '0.9em'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontWeight: 'bold', color: '#4CAF50' }}>
                    {stats.completion_rate}%
                  </div>
                  <div style={{ color: '#666' }}>Completion Rate</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontWeight: 'bold', color: '#2196F3' }}>
                    {stats.average_daily_intake}mL
                  </div>
                  <div style={{ color: '#666' }}>Avg Daily</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontWeight: 'bold', color: '#FF9800' }}>
                    {stats.average_feedings_per_day}
                  </div>
                  <div style={{ color: '#666' }}>Avg Feedings</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}