import { API_URL } from '../../lib/constants';
import { getPokedex, getFridge } from './storageService';

/**
 * Send a chat message to AI via server
 */
export const sendChatMessage = async (message, conversationHistory = []) => {
  if (!message || typeof message !== 'string' || message.length > 2000) {
    throw new Error('Message must be a string under 2000 characters');
  }

  try {
    // Gather context from local storage
    const collection = await getPokedex();
    const fridge = await getFridge();

    const collectionNames = collection.map(item => item.name).join(', ');
    const fridgeItems = fridge.map(item => {
      const addedDate = new Date(item.addedAt);
      const daysElapsed = Math.floor((new Date() - addedDate) / (1000 * 60 * 60 * 24));
      const remainingDays = Math.max(0, item.shelfLifeDays - daysElapsed);
      return `${item.name} (${remainingDays} days left)`;
    }).join(', ');

    const response = await fetch(`${API_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        conversationHistory,
        context: { collectionNames, fridgeItems },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('RATE_LIMIT');
      }
      throw new Error('CHAT_FAILED');
    }

    const data = await response.json();
    return { success: true, message: data.message, role: 'assistant' };
  } catch (error) {
    if (error.message === 'RATE_LIMIT') {
      throw error;
    }
    if (error.message === 'CHAT_FAILED') {
      throw error;
    }
    if (error.name === 'AbortError' || error.message.includes('timeout')) {
      throw new Error('TIMEOUT');
    }
    if (error.message.includes('Network') || error.message === 'Failed to fetch') {
      throw new Error('NETWORK_ERROR');
    }
    throw new Error('CHAT_FAILED');
  }
};

/**
 * Get suggested starter questions based on user's data (local only)
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

  questions.push("Give me tips for reducing food waste");
  questions.push("What's in season right now?");

  return questions.slice(0, 5);
};
