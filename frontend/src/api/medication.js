import axios from 'axios';

const MEDICATION_API = 'http://localhost:8000/api/medication_log';

export async function logMedication(data) {
  try {
    const response = await axios.post(`${MEDICATION_API}/test`, data, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    const message = error.response?.data?.error || error.response?.data?.message || 'medication.js: POST request failed.';
    throw new Error(message);
  }
}