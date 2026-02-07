import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function analyzeImage(base64Image: string) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-preview-05-20' });

  const prompt = `Analyze this grocery/produce image. You are a food freshness expert.
Identify the item and assess its freshness based on visual cues (color, texture, spots, firmness appearance, etc.).

Return ONLY valid JSON (no markdown, no code fences):
{
  "item_name": "name of the item",
  "category": "fruit|vegetable|meat|seafood|dairy|grain|pantry|beverage|other",
  "freshness_score": 7,
  "freshness_description": "Brief description of freshness assessment",
  "estimated_days_remaining": 5,
  "storage_tips": ["tip 1", "tip 2", "tip 3"],
  "visual_indicators": ["what you observed about freshness"],
  "sustainable_alternative": {
    "name": "a more sustainable alternative item",
    "reason": "why this alternative is more sustainable",
    "carbon_savings_percent": 30
  }
}

freshness_score is 1-10 where 10 is perfectly fresh.
estimated_days_remaining is how many days until the item is no longer good to eat.
Be specific about visual indicators you see.`;

  const result = await model.generateContent([
    prompt,
    {
      inlineData: {
        mimeType: 'image/jpeg',
        data: base64Image,
      },
    },
  ]);

  const text = result.response.text();
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleaned);
}

export async function generateRecipes(items: string[]) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-preview-05-20' });

  const prompt = `You are a sustainable cooking expert. Generate 3 recipes using these items that are about to expire: ${items.join(', ')}.

Focus on minimizing food waste. Return ONLY valid JSON (no markdown, no code fences):
[
  {
    "title": "Recipe Name",
    "description": "Brief description",
    "ingredients": ["ingredient 1 with amount", "ingredient 2 with amount"],
    "steps": ["step 1", "step 2", "step 3"],
    "carbon_savings": "Estimated CO2 saved by using these items instead of wasting them",
    "prep_time": "20 minutes"
  }
]`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleaned);
}
