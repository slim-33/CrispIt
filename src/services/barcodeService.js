import { API_URL } from '../../lib/constants';

/**
 * Analyze a barcode/packaged item image via server
 */
export const analyzeBarcodeItem = async (base64Image) => {
  if (!base64Image || base64Image.length > 5 * 1024 * 1024) {
    throw new Error('Image is too large. Please use a smaller image.');
  }

  try {
    const response = await fetch(`${API_URL}/api/analyze/barcode`, {
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

    return await response.json();
  } catch (error) {
    if (error.message === 'RATE_LIMIT_API') {
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
