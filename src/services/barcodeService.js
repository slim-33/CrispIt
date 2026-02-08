import axios from 'axios';
import { OPENROUTER_API_KEY } from '@env';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'google/gemini-2.5-flash-lite';

/**
 * Analyze a barcode/packaged item image
 * @param {string} base64Image - Base64 encoded image
 * @returns {Promise<Object>} Analysis result
 */
export const analyzeBarcodeItem = async (base64Image) => {
  if (!OPENROUTER_API_KEY || OPENROUTER_API_KEY === 'your_openrouter_api_key_here') {
    throw new Error('API_KEY_MISSING');
  }

  try {
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
                text: `You are a packaged food item analyzer. Carefully examine this image.

CRITICAL RULES:
1. First, check if this image contains a PACKAGED/PROCESSED item (canned goods, boxed items, bottles, bags, items with barcodes or product labels)
2. If this is NOT a packaged item (e.g., it's fresh produce, raw ingredients, or not food), respond with: {"isPackaged":false,"message":"This appears to be fresh produce or not a packaged item"}
3. If it IS a packaged item, extract the product name from packaging/label
4. Provide storage instructions based on packaging type
5. Calculate carbon footprint in kg CO2e (estimate based on packaging, processing, transport)
6. Suggest sustainable alternatives (less packaging, local options, etc.)
7. Provide nutrition information if visible on packaging
8. This is a PACKAGED item - it has NO freshness score and NO shelf life days (it's already preserved)

Respond with ONLY this JSON (no markdown, no extra text):
If NOT packaged: {"isPackaged":false,"message":"This appears to be fresh produce or not a packaged item"}
If IS packaged: {"isPackaged":true,"name":"specific product name","carbonFootprint":X.XX,"sustainableAlternative":"lower carbon/less packaging alternative","storageTip":"specific storage advice for this packaged item","nutritionInfo":"brief nutrition summary if visible, or 'Check packaging for details'","packageType":"can/bottle/box/bag/etc"}`
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
        max_tokens: 300,
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

    const content = response.data?.choices?.[0]?.message?.content;
    
    if (content) {
      let jsonText = content;
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      
      const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          
          // Check if it's not a packaged item
          if (parsed.isPackaged === false) {
            return {
              success: false,
              notPackaged: true,
              message: parsed.message || "This appears to be fresh produce or not a packaged item"
            };
          }
          
          return {
            success: true,
            data: {
              ...parsed,
              isPackaged: true,
              freshnessScore: null, // No freshness for packaged items
              freshnessLevel: null,
              shelfLifeDays: null,
            }
          };
        } catch (parseError) {
          console.error('JSON parse error:', parseError);
          throw new Error('Invalid JSON in response');
        }
      }
      
      throw new Error('Invalid response format');
    } else {
      throw new Error('No response from AI');
    }
  } catch (error) {
    console.error('Barcode Analysis Error:', error);
    
    if (error.message === 'API_KEY_MISSING') {
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
