import axios from 'axios';

const REPORT_API = 'http://localhost:5000/api/report';
const CORS = 'https://cors-anywhere.herokuapp.com';

export async function generateFeedingReport(options = {}) {
  try {
    const response = await axios.post(`${CORS}/${REPORT_API}/feeding`, options, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    const message = error.response?.data?.error || 'Failed to start feeding report generation';
    throw new Error(message);
  }
}

export async function generateMedicationReport(options = {}) {
  try {
    const response = await axios.post(`${CORS}/${REPORT_API}/medication`, options, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    const message = error.response?.data?.error || 'Failed to start medication report generation';
    throw new Error(message);
  }
}

export async function generateCombinedReport(options = {}) {
  try {
    const response = await axios.post(`${CORS}/${REPORT_API}/combined`, options, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    const message = error.response?.data?.error || 'Failed to start combined report generation';
    throw new Error(message);
  }
}

export async function getReportStatus(reportId) {
  try {
    const response = await axios.get(`${CORS}/${REPORT_API}/status/${reportId}`);
    return response.data;
  } catch (error) {
    const message = error.response?.data?.error || 'Failed to get report status';
    throw new Error(message);
  }
}

export async function downloadReport(reportId) {
  try {
    const response = await axios.get(`${CORS}/${REPORT_API}/download/${reportId}`, {
      responseType: 'blob',
    });
    
    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    
    // Extract filename from Content-Disposition header or use default
    const contentDisposition = response.headers['content-disposition'];
    let filename = 'report.csv';
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="(.+)"/);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    }
    
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    
    return { success: true, filename };
  } catch (error) {
    const message = error.response?.data?.error || 'Failed to download report';
    throw new Error(message);
  }
}

export async function cleanupReport(reportId) {
  try {
    const response = await axios.delete(`${CORS}/${REPORT_API}/cleanup/${reportId}`);
    return response.data;
  } catch (error) {
    const message = error.response?.data?.error || 'Failed to cleanup report';
    throw new Error(message);
  }
}

export async function getActiveReports() {
  try {
    const response = await axios.get(`${CORS}/${REPORT_API}/active`);
    return response.data;
  } catch (error) {
    const message = error.response?.data?.error || 'Failed to get active reports';
    throw new Error(message);
  }
}