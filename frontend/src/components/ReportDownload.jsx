import React, { useState, useEffect, useRef } from 'react';
import {
  generateFeedingReport,
  generateMedicationReport,
  generateCombinedReport,
  getReportStatus,
  downloadReport,
  cleanupReport,
  getActiveReports
} from '../api/report';

export default function ReportDownload() {
  const [reportType, setReportType] = useState('feeding');
  const [format, setFormat] = useState('csv');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activeReports, setActiveReports] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const progressIntervals = useRef({});

  useEffect(() => {
    loadActiveReports();
    return () => {
      // Cleanup intervals on unmount
      Object.values(progressIntervals.current).forEach(clearInterval);
    };
  }, []);

  const loadActiveReports = async () => {
    try {
      const response = await getActiveReports();
      setActiveReports(response.active_reports || []);
    } catch (error) {
      console.error('Failed to load active reports:', error);
    }
  };

  const startProgressTracking = (reportId) => {
    const interval = setInterval(async () => {
      try {
        const status = await getReportStatus(reportId);
        
        setActiveReports(prev => prev.map(report => 
          report.report_id === reportId 
            ? { ...report, ...status }
            : report
        ));

        if (status.status === 'completed') {
          clearInterval(progressIntervals.current[reportId]);
          delete progressIntervals.current[reportId];
        } else if (status.status === 'error') {
          clearInterval(progressIntervals.current[reportId]);
          delete progressIntervals.current[reportId];
          alert(`Report generation failed: ${status.error}`);
        }
      } catch (error) {
        console.error('Failed to check report status:', error);
        clearInterval(progressIntervals.current[reportId]);
        delete progressIntervals.current[reportId];
      }
    }, 1000);

    progressIntervals.current[reportId] = interval;
  };

  const handleGenerateReport = async () => {
    if (isGenerating) return;

    setIsGenerating(true);
    try {
      const options = {
        format,
        ...(startDate && { start_date: new Date(startDate).toISOString() }),
        ...(endDate && { end_date: new Date(endDate).toISOString() })
      };

      let response;
      switch (reportType) {
        case 'feeding':
          response = await generateFeedingReport(options);
          break;
        case 'medication':
          response = await generateMedicationReport(options);
          break;
        case 'combined':
          response = await generateCombinedReport(options);
          break;
        default:
          throw new Error('Invalid report type');
      }

      const newReport = {
        report_id: response.report_id,
        status: 'processing',
        progress: 0,
        type: reportType,
        format: format
      };

      setActiveReports(prev => [...prev, newReport]);
      startProgressTracking(response.report_id);

      alert(`${reportType} report generation started!`);
    } catch (error) {
      console.error('Failed to generate report:', error);
      alert(`Failed to generate report: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async (reportId) => {
    try {
      const result = await downloadReport(reportId);
      alert(`Report downloaded: ${result.filename}`);
      
      // Remove from active reports after successful download
      setActiveReports(prev => prev.filter(report => report.report_id !== reportId));
    } catch (error) {
      console.error('Failed to download report:', error);
      alert(`Failed to download report: ${error.message}`);
    }
  };

  const handleCleanup = async (reportId) => {
    try {
      await cleanupReport(reportId);
      setActiveReports(prev => prev.filter(report => report.report_id !== reportId));
      
      // Clear progress tracking if exists
      if (progressIntervals.current[reportId]) {
        clearInterval(progressIntervals.current[reportId]);
        delete progressIntervals.current[reportId];
      }
    } catch (error) {
      console.error('Failed to cleanup report:', error);
      alert(`Failed to cleanup report: ${error.message}`);
    }
  };

  const getProgressBarColor = (status) => {
    switch (status) {
      case 'completed': return '#4CAF50';
      case 'error': return '#f44336';
      case 'processing': return '#2196F3';
      default: return '#9E9E9E';
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>Report Download</h2>
      
      {/* Report Generation Form */}
      <div style={{ 
        border: '1px solid #ddd', 
        padding: '20px', 
        marginBottom: '20px',
        borderRadius: '8px',
        backgroundColor: '#f9f9f9'
      }}>
        <h3>Generate New Report</h3>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Report Type:</label>
          <select 
            value={reportType} 
            onChange={(e) => setReportType(e.target.value)}
            style={{ padding: '8px', width: '200px' }}
          >
            <option value="feeding">Feeding Data</option>
            <option value="medication">Medication Data</option>
            <option value="combined">Combined Report</option>
          </select>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Format:</label>
          <select 
            value={format} 
            onChange={(e) => setFormat(e.target.value)}
            style={{ padding: '8px', width: '200px' }}
          >
            <option value="csv">CSV</option>
            <option value="json">JSON</option>
            <option value="excel">Excel</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px' }}>Start Date (optional):</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{ padding: '8px' }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '5px' }}>End Date (optional):</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{ padding: '8px' }}
            />
          </div>
        </div>

        <button
          onClick={handleGenerateReport}
          disabled={isGenerating}
          style={{
            padding: '10px 20px',
            backgroundColor: isGenerating ? '#ccc' : '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isGenerating ? 'not-allowed' : 'pointer'
          }}
        >
          {isGenerating ? 'Generating...' : 'Generate Report'}
        </button>
      </div>

      {/* Active Reports */}
      <div>
        <h3>Active Reports</h3>
        {activeReports.length === 0 ? (
          <p style={{ color: '#666', fontStyle: 'italic' }}>No active reports</p>
        ) : (
          <div>
            {activeReports.map((report) => (
              <div 
                key={report.report_id}
                style={{
                  border: '1px solid #ddd',
                  padding: '15px',
                  marginBottom: '10px',
                  borderRadius: '6px',
                  backgroundColor: '#fff'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong>{report.type || 'Unknown'} Report</strong>
                    <span style={{ marginLeft: '10px', color: '#666' }}>
                      ({report.format || 'csv'})
                    </span>
                    <div style={{ fontSize: '0.9em', color: '#666', marginTop: '5px' }}>
                      ID: {report.report_id}
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    {report.status === 'completed' && (
                      <button
                        onClick={() => handleDownload(report.report_id)}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#4CAF50',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        Download
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleCleanup(report.report_id)}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#f44336',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div style={{ marginTop: '10px' }}>
                  <div style={{ fontSize: '0.9em', marginBottom: '5px' }}>
                    Status: {report.status} {report.progress ? `(${report.progress}%)` : ''}
                  </div>
                  <div style={{
                    width: '100%',
                    height: '8px',
                    backgroundColor: '#e0e0e0',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${report.progress || 0}%`,
                      height: '100%',
                      backgroundColor: getProgressBarColor(report.status),
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                </div>
                
                {report.status === 'error' && report.error && (
                  <div style={{ 
                    marginTop: '10px', 
                    color: '#f44336', 
                    fontSize: '0.9em',
                    backgroundColor: '#ffebee',
                    padding: '8px',
                    borderRadius: '4px'
                  }}>
                    Error: {report.error}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        
        {activeReports.length > 0 && (
          <button
            onClick={loadActiveReports}
            style={{
              padding: '8px 16px',
              backgroundColor: '#666',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginTop: '10px'
            }}
          >
            Refresh
          </button>
        )}
      </div>
    </div>
  );
}