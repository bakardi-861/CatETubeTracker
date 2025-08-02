import axios from 'axios';

const FEEDING_API = 'http://localhost:8000/api/feeding/test';

// export const logFeeding = (feedingData) => {
//   return axios.post(`${API_BASE}`, feedingData);
// };

export async function logFeeding(data) {
  try {
    const response = await axios.post(FEEDING_API, data, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || 'feeding.js: POST request failed.';
    throw new Error(message);
  }
}
