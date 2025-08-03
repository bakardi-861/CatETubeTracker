import axios from 'axios';

const FEEDING_API = 'http://localhost:8000/api/feeding/';

// Configure axios to include credentials for session management
axios.defaults.withCredentials = true;

export async function logFeeding(data) {
  try {
    const response = await axios.post(FEEDING_API, data, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    const message = error.response?.data?.error || 'Failed to log feeding';
    throw new Error(message);
  }
}

export async function getFeedingHistory(page = 1, perPage = 50) {
  try {
    const response = await axios.get(`${FEEDING_API}?page=${page}&per_page=${perPage}`);
    return response.data;
  } catch (error) {
    const message = error.response?.data?.error || 'Failed to get feeding history';
    throw new Error(message);
  }
}
