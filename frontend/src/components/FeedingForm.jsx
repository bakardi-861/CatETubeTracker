import React, { useState, useEffect } from 'react';
import { logFeeding } from '../api/feeding';
import { logMedication } from '../api/medication';
import { getTodayTracker, createOrUpdateTodayTracker, resetTracker } from '../api/tracker';

export default function FeedingForm() {
  const [amount, setAmount] = useState('');
  const [medicationAmount, setMedicationAmount] = useState('');
  const [medicationName, setMedicationName] = useState('');
  const [medicationDosage, setMedicationDosage] = useState('');
  const [medicationRoute, setMedicationRoute] = useState('E-tube');
  const [medicationNotes, setMedicationNotes] = useState('');
  const [includeMedication, setIncludeMedication] = useState(false);
  const [dailyTarget, setDailyTarget] = useState('210');
  const [tracker, setTracker] = useState(null);
  const [loading, setLoading] = useState(false);

  // Load today's tracker on component mount
  useEffect(() => {
    loadTodayTracker();
  }, []);

  const loadTodayTracker = async () => {
    try {
      const trackerData = await getTodayTracker();
      setTracker(trackerData);
      setDailyTarget(trackerData.daily_target_ml.toString());
    } catch (err) {
      console.log('No tracker found, will create one when setting target:',err);
    }
  };

  const handleSetDailyTarget = async () => {
    try {
      setLoading(true);
      const targetValue = parseFloat(dailyTarget);
      if (targetValue <= 0) {
        alert('Daily target must be greater than 0');
        return;
      }
      
      const response = await createOrUpdateTodayTracker(targetValue);
      setTracker(response.tracker);
      alert(response.message);
    } catch (error) {
      alert(`Error setting daily target: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleResetProgress = async () => {
    try {
      if (!confirm('Are you sure you want to reset today\'s progress? This will clear all feeding data for today.')) {
        return;
      }
      
      setLoading(true);
      const targetValue = parseFloat(dailyTarget);
      const response = await resetTracker(targetValue > 0 ? targetValue : 210);
      setTracker(response.tracker);
      
      // Show detailed reset message
      const deletedCount = response.deleted_feedings || 0;
      const message = `${response.message}\n\nProgress Reset:\n• Daily target: ${response.tracker.daily_target_ml}mL\n• Feeding records deleted: ${deletedCount}\n• Total fed: ${response.tracker.total_fed_ml}mL\n• Remaining: ${response.tracker.remaining_ml}mL`;
      alert(message);
    } catch (error) {
      alert(`Error resetting tracker: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const feedingResponse = await logFeeding({
        amount_ml: parseFloat(amount),
        flushed_before: true,
        flushed_after: true,
      });
      
      if (includeMedication && medicationName && medicationDosage && medicationAmount) {
        await logMedication({
          medication_name: medicationName,
          dosage: medicationDosage,
          amount_ml: parseFloat(medicationAmount),
          route: medicationRoute,
          notes: medicationNotes,
          flushed_before: true,
          flushed_after: true,
        });
      }
      
      // Use the message from the backend response, or fallback to default
      const backendMessage = feedingResponse.message || 'Feeding logged!';
      const baseMessage = includeMedication && medicationName && medicationDosage && medicationAmount ? `${backendMessage} + Medication logged!` : backendMessage;
      
      // Show feeding details if available
      let detailsMsg = '';
      if (feedingResponse.data) {
        detailsMsg = `\n\nDetails:\n• Amount: ${feedingResponse.data.amount_ml}mL\n• Time: ${new Date(feedingResponse.data.time_given).toLocaleTimeString()}\n• ID: ${feedingResponse.data.id}`;
      }
      
      // Show tracker info if available
      if (feedingResponse.tracker) {
        const tracker = feedingResponse.tracker;
        const trackerMsg = `\n\nDaily Progress:\n• ${tracker.total_fed_ml}mL / ${tracker.daily_target_ml}mL (${Math.round(tracker.progress_percentage)}%)\n• ${tracker.remaining_ml}mL remaining\n• ${tracker.feeding_count} feedings today`;
        alert(baseMessage + detailsMsg + trackerMsg);
      } else {
        alert(baseMessage + detailsMsg);
      }
      
      // Refresh tracker data after feeding
      await loadTodayTracker();
      
      setAmount('');
      setMedicationAmount('');
      setMedicationName('');
      setMedicationDosage('');
      setMedicationRoute('E-tube');
      setMedicationNotes('');
      setIncludeMedication(false);
    } catch (error) {
      console.error('Error caught:', error);
      if (error instanceof Error) {
        alert(`FeedingForm.jsx: ${error.message}`);
      } else {
        alert('FeedingForm.jsx: Failed to log feeding.');
      }
      console.error(error);
    }
  };

  return (
    <div>
      <h1>Cat E-Tube Feeding Tracker</h1>
      
      {/* Daily Target Section */}
      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '5px' }}>
        <h3>Daily Target</h3>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <input
            type="number"
            placeholder="Daily Target (mL)"
            value={dailyTarget}
            onChange={(e) => setDailyTarget(e.target.value)}
            style={{ width: '150px' }}
          />
          <button 
            type="button" 
            onClick={handleSetDailyTarget}
            disabled={loading}
            style={{ padding: '5px 10px' }}
          >
            {loading ? 'Setting...' : 'Set Target'}
          </button>
        </div>
      </div>

      {/* Progress Display */}
      {tracker && (
        <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '5px', backgroundColor: '#f9f9f9', color: '#333' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h3 style={{ margin: 0, color: '#333' }}>Today's Progress</h3>
            <button 
              onClick={handleResetProgress}
              disabled={loading}
              style={{ 
                padding: '5px 10px', 
                backgroundColor: '#ff5722', 
                color: 'white', 
                border: 'none', 
                borderRadius: '3px', 
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              {loading ? 'Resetting...' : 'Reset Progress'}
            </button>
          </div>
          
          <div>
            <strong>{tracker.total_fed_ml}mL / {tracker.daily_target_ml}mL</strong> 
            ({Math.round(tracker.progress_percentage)}%)
            {tracker.total_fed_ml > tracker.daily_target_ml && (
              <span style={{ color: '#ff5722', fontWeight: 'bold' }}> - OVER TARGET!</span>
            )}
          </div>
          
          <div>
            {tracker.remaining_ml >= 0 ? (
              <span>Remaining: <strong>{tracker.remaining_ml}mL</strong></span>
            ) : (
              <span style={{ color: '#ff5722' }}>
                Over by: <strong>{Math.abs(tracker.remaining_ml)}mL</strong>
              </span>
            )}
          </div>
          
          <div>Feedings: <strong>{tracker.feeding_count}</strong></div>
          
          <div style={{ width: '100%', backgroundColor: '#e0e0e0', borderRadius: '10px', height: '20px', marginTop: '10px' }}>
            <div 
              style={{ 
                width: `${Math.min(100, tracker.progress_percentage)}%`, 
                backgroundColor: tracker.total_fed_ml > tracker.daily_target_ml ? '#ff5722' : tracker.is_completed ? '#4caf50' : '#2196f3', 
                height: '100%', 
                borderRadius: '10px',
                transition: 'width 0.3s ease'
              }}
            ></div>
          </div>
        </div>
      )}

      {/* Feeding Form */}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <input
            type="number"
            placeholder="Feeding Amount (mL)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            style={{ width: '200px', padding: '8px' }}
          />
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <label>
            <input
              type="checkbox"
              checked={includeMedication}
              onChange={(e) => setIncludeMedication(e.target.checked)}
            />
            Include Medication
          </label>
        </div>
        
        {includeMedication && (
          <div style={{ marginBottom: '15px', padding: '15px', border: '1px solid #ddd', borderRadius: '5px', backgroundColor: '#f5f5f5' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>Medication Information</h4>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
              <input
                type="text"
                placeholder="Medication Name *"
                value={medicationName}
                onChange={(e) => setMedicationName(e.target.value)}
                required
                style={{ padding: '8px', borderRadius: '3px', border: '1px solid #ccc' }}
              />
              <input
                type="text"
                placeholder="Dosage (e.g., 10mg, 1 tablet) *"
                value={medicationDosage}
                onChange={(e) => setMedicationDosage(e.target.value)}
                required
                style={{ padding: '8px', borderRadius: '3px', border: '1px solid #ccc' }}
              />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
              <input
                type="number"
                placeholder="Liquid Amount (mL) *"
                value={medicationAmount}
                onChange={(e) => setMedicationAmount(e.target.value)}
                required
                style={{ padding: '8px', borderRadius: '3px', border: '1px solid #ccc' }}
              />
              <select
                value={medicationRoute}
                onChange={(e) => setMedicationRoute(e.target.value)}
                style={{ padding: '8px', borderRadius: '3px', border: '1px solid #ccc' }}
              >
                <option value="E-tube">E-tube</option>
                <option value="Oral">Oral</option>
                <option value="Injection">Injection</option>
                <option value="Topical">Topical</option>
              </select>
            </div>
            
            <div>
              <textarea
                placeholder="Notes (optional)"
                value={medicationNotes}
                onChange={(e) => setMedicationNotes(e.target.value)}
                rows={2}
                style={{ width: '100%', padding: '8px', borderRadius: '3px', border: '1px solid #ccc', resize: 'vertical' }}
              />
            </div>
            
            <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
              * Required fields. Liquid amount used for administration (does not count towards feeding total).
            </div>
          </div>
        )}
        
        <button 
          type="submit"
          style={{ padding: '10px 20px', backgroundColor: '#4caf50', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
        >
          Log Feeding
        </button>
      </form>
    </div>
  );
}