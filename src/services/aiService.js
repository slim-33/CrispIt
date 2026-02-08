import { API_URL } from '../../lib/constants';

// Rate limiting configuration
const RATE_LIMIT = {
  maxRequests: 15,
  timeWindowMs: 60000,
  minRequestInterval: 2000,
};

let requestTimes = [];
let lastRequestTime = 0;

const checkRateLimit = () => {
  const now = Date.now();
  requestTimes = requestTimes.filter(time => now - time < RATE_LIMIT.timeWindowMs);

  if (requestTimes.length >= RATE_LIMIT.maxRequests) {
    const oldestRequest = requestTimes[0];
    const waitTime = RATE_LIMIT.timeWindowMs - (now - oldestRequest);
    return { canRequest: false, waitTime: Math.ceil(waitTime / 1000) };
  }

  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < RATE_LIMIT.minRequestInterval) {
    const waitTime = RATE_LIMIT.minRequestInterval - timeSinceLastRequest;
    return { canRequest: false, waitTime: Math.ceil(waitTime / 1000) };
  }

  return { canRequest: true, waitTime: 0 };
};

const recordRequest = () => {
  const now = Date.now();
  requestTimes.push(now);
  lastRequestTime = now;
};

/**
 * Analyze produce freshness from base64 image via server
 */
export const analyzeFreshness = async (base64Image) => {
  if (!base64Image || base64Image.length > 5 * 1024 * 1024) {
    throw new Error('Image is too large. Please use a smaller image.');
  }

  const rateCheck = checkRateLimit();
  if (!rateCheck.canRequest) {
    const error = new Error('RATE_LIMIT');
    error.waitTime = rateCheck.waitTime;
    throw error;
  }

  try {
    recordRequest();

    const response = await fetch(`${API_URL}/api/analyze/freshness`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ base64Image }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        const rateLimitError = new Error('RATE_LIMIT_API');
        rateLimitError.waitTime = 60;
        throw rateLimitError;
      }
      throw new Error('ANALYSIS_FAILED');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error.message === 'RATE_LIMIT' || error.message === 'RATE_LIMIT_API') {
      throw error;
    }
    if (error.message === 'ANALYSIS_FAILED') {
      throw error;
    }
    if (error.name === 'AbortError' || error.message.includes('timeout')) {
      throw new Error('TIMEOUT');
    }
    if (error.message.includes('Network') || error.message === 'Failed to fetch') {
      throw new Error('NETWORK_ERROR');
    }
    throw new Error('ANALYSIS_FAILED');
  }
};

/**
 * Get current rate limit status
 */
export const getRateLimitStatus = () => {
  const now = Date.now();
  requestTimes = requestTimes.filter(time => now - time < RATE_LIMIT.timeWindowMs);

  return {
    requestsUsed: requestTimes.length,
    requestsRemaining: RATE_LIMIT.maxRequests - requestTimes.length,
    maxRequests: RATE_LIMIT.maxRequests,
    timeWindowSeconds: RATE_LIMIT.timeWindowMs / 1000,
  };
};
