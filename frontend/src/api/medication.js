import axios from 'axios';

const MEDICATION_API = 'http://localhost:8000/api/medication_log/';

// Configure axios to include credentials for session management
axios.defaults.withCredentials = true;

export async function logMedication(data) {
  try {
    const response = await axios.post(MEDICATION_API, data, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    const message = error.response?.data?.error || 'Failed to log medication';
    throw new Error(message);
  }
}

export async function getMedicationHistory() {
  try {
    const response = await axios.get(MEDICATION_API);
    return response.data;
  } catch (error) {
    const message = error.response?.data?.error || 'Failed to get medication history';
    throw new Error(message);
  }
}