import axios from 'axios';
import { OPENROUTER_API_KEY } from '@env';

// OpenRouter API endpoint
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Using Google's Gemini 2.5 Flash Lite via OpenRouter
// Free tier: $1 credit (~200-500 requests)
// Alternative models you can try:
// - 'google/gemini-2.5-flash-lite' (recommended - fastest, cheapest, good quality)
// - 'google/gemini-2.5-flash' (better quality, costs more)
// - 'google/gemini-3-flash-preview' (newest, best reasoning)
// - 'meta-llama/llama-3.2-11b-vision-instruct:free' (completely free!)
const MODEL = 'google/gemini-2.5-flash-lite';

// Rate limiting configuration
const RATE_LIMIT = {
  maxRequests: 15,           // Max requests per time window
  timeWindowMs: 60000,       // Time window in ms (1 minute)
  minRequestInterval: 2000,  // Minimum 2 seconds between requests
};

// Request tracking
let requestTimes = [];
let lastRequestTime = 0;

/**
 * Check if we can make a request based on rate limits
 * @returns {Object} { canRequest: boolean, waitTime: number }
 */
const checkRateLimit = () => {
  const now = Date.now();
  
  // Remove requests outside the time window
  requestTimes = requestTimes.filter(time => now - time < RATE_LIMIT.timeWindowMs);
  
  // Check if we've hit the max requests in the window
  if (requestTimes.length >= RATE_LIMIT.maxRequests) {
    const oldestRequest = requestTimes[0];
    const waitTime = RATE_LIMIT.timeWindowMs - (now - oldestRequest);
    return { canRequest: false, waitTime: Math.ceil(waitTime / 1000) };
  }
  
  // Check minimum interval between requests
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < RATE_LIMIT.minRequestInterval) {
    const waitTime = RATE_LIMIT.minRequestInterval - timeSinceLastRequest;
    return { canRequest: false, waitTime: Math.ceil(waitTime / 1000) };
  }
  
  return { canRequest: true, waitTime: 0 };
};

/**
 * Record a request in our rate limit tracking
 */
const recordRequest = () => {
  const now = Date.now();
  requestTimes.push(now);
  lastRequestTime = now;
};

/**
 * Analyze produce freshness from base64 image
 * @param {string} base64Image - Base64 encoded image
 * @returns {Promise<Object>} Analysis result
 */
export const analyzeFreshness = async (base64Image) => {
  if (!OPENROUTER_API_KEY || OPENROUTER_API_KEY === 'your_openrouter_api_key_here') {
    throw new Error('API_KEY_MISSING');
  }

  // Reject oversized images (5 MB base64 ~ 3.75 MB raw)
  if (!base64Image || base64Image.length > 5 * 1024 * 1024) {
    throw new Error('Image is too large. Please use a smaller image.');
  }

  // Check rate limit before making request
  const rateCheck = checkRateLimit();
  if (!rateCheck.canRequest) {
    const error = new Error('RATE_LIMIT');
    error.waitTime = rateCheck.waitTime;
    throw error;
  }

  try {
    // Record this request
    recordRequest();

    const response = await axios.post(
      OPENROUTER_API_URL,
      {
        model: MODEL,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `You are a food freshness analyzer. Carefully examine this image.

CRITICAL RULES:
1. FIRST check if this image shows a BARCODE or PACKAGED/PROCESSED item (cans, boxes, bottles, bags with labels/barcodes)
2. If you see a BARCODE as the main subject or a PACKAGED item, respond: {"isProduce":false,"message":"This appears to be a packaged item with a barcode"}
3. If it's PERISHABLE food (fruits, vegetables, dairy, meat, bread, etc.), be extremely accurate with the item name
4. Calculate carbon footprint in kg CO2e (estimate based on typical production/transport)
5. Be HARSH with freshness scoring - use strict standards:
   - 90-100: Perfect condition, just harvested/produced, no flaws
   - 75-89: Very good, minor imperfections, will last well
   - 55-74: Acceptable quality, some visible issues, use soon
   - 35-54: Poor quality, significant issues, use immediately
   - 0-34: Should not be consumed, spoiled
6. Calculate realistic shelf life in days based on current freshness
7. Provide detailed freshness observations
8. For sustainable alternatives, suggest lower carbon options

If this is a BARCODE or PACKAGED item, respond: {"isProduce":false,"message":"This appears to be a packaged item with a barcode"}
If this IS a perishable item, respond with ONLY this JSON (no markdown, no extra text):
{"isProduce":true,"name":"specific item name","freshnessScore":0-100,"freshnessLevel":"Excellent/Good/Fair/Poor","shelfLifeDays":X,"carbonFootprint":X.XX,"sustainableAlternative":"lower carbon alternative suggestion","indicators":["detailed observation 1","detailed observation 2","detailed observation 3"],"storageTip":"specific storage advice","bestUse":"specific usage suggestion","freshnessVerificationTips":["how to check ripeness","what to look for","how to test freshness"]}`
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`
                }
              }
            ]
          }
        ],
        max_tokens: 400,
        temperature: 0.1,
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://freshpick.app',
          'X-Title': 'FreshPick App',
        },
        timeout: 30000
      }
    );

    console.log('OpenRouter API Response:', JSON.stringify(response.data, null, 2));

    const content = response.data?.choices?.[0]?.message?.content;
    
    if (content) {
      console.log('Raw AI response text:', content);
      
      // Try to extract JSON from the response
      let jsonText = content;
      
      // Remove markdown code blocks if present
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      
      // Extract JSON object
      const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          
          // Check if the image contains produce
          if (parsed.isProduce === false) {
            return {
              success: false,
              notProduce: true,
              message: parsed.message || "This doesn't appear to be fresh produce"
            };
          }
          
          return {
            success: true,
            data: parsed
          };
        } catch (parseError) {
          if (parseError.message === 'NOT_PRODUCE') {
            throw parseError;
          }
          console.error('JSON parse error:', parseError);
          console.error('Attempted to parse:', jsonMatch[0]);
          throw new Error('Invalid JSON in response');
        }
      }
      
      console.error('No JSON found in response:', content);
      throw new Error('Invalid response format');
    } else {
      console.error('Unexpected response structure:', response.data);
      throw new Error('No response from AI');
    }
  } catch (error) {
    console.error('OpenRouter API Error:', error);
    
    if (error.message === 'API_KEY_MISSING') {
      throw error;
    }
    
    if (error.message === 'RATE_LIMIT') {
      throw error;
    }
    
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'];
      const waitTime = retryAfter ? parseInt(retryAfter) : 60;
      const rateLimitError = new Error('RATE_LIMIT_API');
      rateLimitError.waitTime = waitTime;
      throw rateLimitError;
    } else if (error.response?.status === 401 || error.response?.status === 403) {
      throw new Error('INVALID_API_KEY');
    } else if (error.code === 'ECONNABORTED') {
      throw new Error('TIMEOUT');
    } else if (error.message.includes('Network Error')) {
      throw new Error('NETWORK_ERROR');
    }
    
    throw new Error('ANALYSIS_FAILED');
  }
};

/**
 * Get current rate limit status
 * @returns {Object} Rate limit information
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
