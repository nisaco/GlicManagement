import axios from 'axios';

export const logActivity = async (action, category, description, meta = {}) => {
  try {
    await axios.post('/api/activity', { action, category, description, meta });
  } catch {
    // Fail silently — don't break the app if logging fails
  }
};