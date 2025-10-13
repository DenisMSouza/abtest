const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const persistExperimentVariaton = async (
  experiment: string,
  variation: string,
  userId?: string,
  sessionId?: string
) => {
  try {
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId);
    if (sessionId) params.append('sessionId', sessionId);

    const response = await fetch(`${API_BASE_URL}/experiments/${experiment}/variation?${params}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ experimentId: experiment, variation }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error persisting experiment variation:', error);
    throw error;
  }
};

export const getExperimentVariation = async (
  experiment: string,
  userId?: string,
  sessionId?: string
) => {
  try {
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId);
    if (sessionId) params.append('sessionId', sessionId);

    const response = await fetch(`${API_BASE_URL}/experiments/${experiment}/variation?${params}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting experiment variation:', error);
    throw error;
  }
};

export const getExperiments = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/experiments`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting experiments:', error);
    throw error;
  }
};

export const createExperiment = async (experimentData: any) => {
  try {
    const response = await fetch(`${API_BASE_URL}/experiments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(experimentData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating experiment:', error);
    throw error;
  }
};

export const updateExperiment = async (experimentId: string, experimentData: any) => {
  try {
    const response = await fetch(`${API_BASE_URL}/experiments/${experimentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(experimentData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating experiment:', error);
    throw error;
  }
};

export const getExperimentStats = async (experimentId: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/experiments/${experimentId}/stats`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting experiment stats:', error);
    throw error;
  }
};

export const trackSuccess = async (
  experimentId: string,
  userId: string,
  event: string,
  value?: number
) => {
  try {
    const response = await fetch(`${API_BASE_URL}/experiments/${experimentId}/success`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, event, value }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error tracking success event:', error);
    throw error;
  }
};