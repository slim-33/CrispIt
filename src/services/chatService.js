import axios from 'axios';
import { OPENROUTER_API_KEY } from '@env';
import { getPokedex, getFridge } from './storageService';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'google/gemini-2.5-flash-lite';

/**
 * Send a chat message to AI with context about user's collection and fridge
 * @param {string} message - User's message
 * @param {Array} conversationHistory - Previous messages
 * @returns {Promise<Object>} AI response
 */
export const sendChatMessage = async (message, conversationHistory = []) => {
  if (!OPENROUTER_API_KEY || OPENROUTER_API_KEY === 'your_openrouter_api_key_here') {
    throw new Error('API_KEY_MISSING');
  }

  try {
    // Get user's data for context
    const collection = await getPokedex();
    const fridge = await getFridge();

    // Build context about user's data
    const collectionNames = collection.map(item => item.name).join(', ');
    const fridgeItems = fridge.map(item => {
      const addedDate = new Date(item.addedAt);
      const daysElapsed = Math.floor((new Date() - addedDate) / (1000 * 60 * 60 * 24));
      const remainingDays = Math.max(0, item.shelfLifeDays - daysElapsed);
      return `${item.name} (${remainingDays} days left)`;
    }).join(', ');

    const systemContext = `You are FreshPick AI, a helpful assistant for a produce freshness tracking app.

USER'S DATA:
- Collection (unique produce discovered): ${collectionNames || 'None yet'}
- Fridge (current items): ${fridgeItems || 'Empty'}

Your role:
- Answer questions about their collection and fridge items
- Suggest recipes based on what they have
- Recommend new produce to try based on their collection
- Provide tips on produce selection, storage, and usage
- Be friendly, concise, and practical

Keep responses under 200 words unless asked for more detail.`;

    // Build messages array with history
    const messages = [
      {
        role: 'system',
        content: systemContext
      },
      ...conversationHistory,
      {
        role: 'user',
        content: message
      }
    ];

    const response = await axios.post(
      OPENROUTER_API_URL,
      {
        model: MODEL,
        messages: messages,
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
      return {
        success: true,
        message: content.trim(),
        role: 'assistant'
      };
    } else {
      throw new Error('No response from AI');
    }
  } catch (error) {
    console.error('Chat error:', error);
    
    if (error.message === 'API_KEY_MISSING') {
      throw error;
    }
    
    if (error.response?.status === 429) {
      throw new Error('RATE_LIMIT');
    } else if (error.response?.status === 401 || error.response?.status === 403) {
      throw new Error('INVALID_API_KEY');
    } else if (error.code === 'ECONNABORTED') {
      throw new Error('TIMEOUT');
    } else if (error.message.includes('Network Error')) {
      throw new Error('NETWORK_ERROR');
    }
    
    throw new Error('CHAT_FAILED');
  }
};

/**
 * Get suggested starter questions based on user's data
 * @returns {Promise<Array<string>>} Suggested questions
 */
export const getSuggestedQuestions = async () => {
  const collection = await getPokedex();
  const fridge = await getFridge();

  const questions = [];

  if (fridge.length > 0) {
    questions.push("What recipes can I make with what's in my fridge?");
    questions.push("What should I use first from my fridge?");
  }

  if (collection.length > 0) {
    questions.push("What new produce should I try based on my collection?");
    questions.push("Tell me about the health benefits of items in my collection");
  }

  if (fridge.length === 0 && collection.length === 0) {
    questions.push("What are the best fruits to start with?");
    questions.push("How do I know if produce is fresh?");
    questions.push("What vegetables are easiest to store?");
  }

  // Always include these
  questions.push("Give me tips for reducing food waste");
  questions.push("What's in season right now?");

  return questions.slice(0, 5); // Return top 5
};
