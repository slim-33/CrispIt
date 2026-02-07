import { Router, Request, Response } from 'express';
import { generateRecipes } from '../lib/gemini';
import { generateRecipesFallback } from '../lib/openrouter';

const router = Router();

// POST /api/recipes — generate recipes from expiring items
router.post('/', async (req: Request, res: Response) => {
  try {
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Please provide an array of items' });
    }

    let recipes;
    try {
      recipes = await generateRecipes(items);
    } catch (geminiError) {
      console.log('Gemini failed, falling back to OpenRouter:', (geminiError as Error).message);
      recipes = await generateRecipesFallback(items);
    }

    res.json(recipes);
  } catch (error) {
    console.error('Recipe generation error:', error);
    res.status(500).json({ error: 'Failed to generate recipes' });
  }
});

export default router;
