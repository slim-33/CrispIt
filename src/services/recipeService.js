import { API_URL } from '../../lib/constants';

/**
 * Generate a recipe using expiring produce via server
 */
export const generateRecipe = async (ingredients) => {
  if (!ingredients || ingredients.length === 0) {
    throw new Error('No ingredients provided');
  }

  try {
    const response = await fetch(`${API_URL}/api/analyze/recipe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ingredients }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('Rate limit reached. Please try again in a moment.');
      }
      throw new Error('Failed to generate recipe');
    }

    const data = await response.json();
    return data.recipe;
  } catch (error) {
    if (error.message.includes('Rate limit') || error.message.includes('Failed to generate')) {
      throw error;
    }
    if (error.name === 'AbortError' || error.message.includes('timeout')) {
      throw new Error('Request timed out');
    }
    if (error.message.includes('Network') || error.message === 'Failed to fetch') {
      throw new Error('Network error. Check your connection.');
    }
    throw new Error('Failed to generate recipe');
  }
};
