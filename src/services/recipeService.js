import axios from 'axios';
import { OPENROUTER_API_KEY } from '@env';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'google/gemini-2.5-flash-lite';

/**
 * Generate a recipe using expiring produce
 * @param {Array<string>} ingredients - List of produce names
 * @returns {Promise<string>} Recipe suggestion
 */
export const generateRecipe = async (ingredients) => {
  if (!OPENROUTER_API_KEY || OPENROUTER_API_KEY === 'your_openrouter_api_key_here') {
    throw new Error('API_KEY_MISSING');
  }

  if (!ingredients || ingredients.length === 0) {
    throw new Error('No ingredients provided');
  }

  try {
    const response = await axios.post(
      OPENROUTER_API_URL,
      {
        model: MODEL,
        messages: [
          {
            role: 'user',
            content: `Create a simple, delicious recipe using these ingredients that are about to expire: ${ingredients.join(', ')}.

Requirements:
- Keep it simple and practical
- 30 minutes or less to prepare
- Include basic cooking instructions
- Format: Recipe name, ingredients list, brief steps

Keep the response under 300 words.`
          }
        ],
        max_tokens: 500,
        temperature: 0.7,
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
      return content.trim();
    } else {
      throw new Error('No response from AI');
    }
  } catch (error) {
    console.error('Recipe generation error:', error);
    
    if (error.message === 'API_KEY_MISSING') {
      throw error;
    }
    
    if (error.response?.status === 429) {
      throw new Error('Rate limit reached. Please try again in a moment.');
    } else if (error.response?.status === 401 || error.response?.status === 403) {
      throw new Error('Invalid API key');
    } else if (error.code === 'ECONNABORTED') {
      throw new Error('Request timed out');
    } else if (error.message.includes('Network Error')) {
      throw new Error('Network error. Check your connection.');
    }
    
    throw new Error('Failed to generate recipe');
  }
};
