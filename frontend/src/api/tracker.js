import axios from 'axios';

const TRACKER_API = 'http://localhost:8000/api/tracker';

export async function getTodayTracker() {
  try {
    const response = await axios.get(`${TRACKER_API}/test/today`);
    return response.data;
  } catch (error) {
    const message = error.response?.data?.error || 'Failed to get today\'s tracker';
    throw new Error(message);
  }
}

export async function createOrUpdateTodayTracker(dailyTarget) {
  try {
    const response = await axios.post(`${TRACKER_API}/test/today`, {
      daily_target_ml: dailyTarget
    }, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    const message = error.response?.data?.error || 'Failed to create/update tracker';
    throw new Error(message);
  }
}

export async function addFeedingToTracker(amountMl) {
  try {
    const response = await axios.post(`${TRACKER_API}/add-feeding`, {
      amount_ml: amountMl
    }, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    const message = error.response?.data?.error || 'Failed to add feeding to tracker';
    throw new Error(message);
  }
}

export async function resetTracker(newDailyTarget = null) {
  try {
    const payload = newDailyTarget ? { daily_target_ml: newDailyTarget } : {};
    const response = await axios.post(`${TRACKER_API}/test/reset`, payload, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    const message = error.response?.data?.error || 'Failed to reset tracker';
    throw new Error(message);
  }
}

export async function getTrackerHistory(days = 7) {
  try {
    const response = await axios.get(`${TRACKER_API}/history?days=${days}`);
    return response.data;
  } catch (error) {
    const message = error.response?.data?.error || 'Failed to get tracker history';
    throw new Error(message);
  }
}

export async function getTrackerStats() {
  try {
    const response = await axios.get(`${TRACKER_API}/stats`);
    return response.data;
  } catch (error) {
    const message = error.response?.data?.error || 'Failed to get tracker stats';
    throw new Error(message);
  }
}

export async function cleanupOldTrackers(daysToKeep = 30) {
  try {
    const response = await axios.delete(`${TRACKER_API}/cleanup-old?days=${daysToKeep}`);
    return response.data;
  } catch (error) {
    const message = error.response?.data?.error || 'Failed to cleanup old trackers';
    throw new Error(message);
  }
}