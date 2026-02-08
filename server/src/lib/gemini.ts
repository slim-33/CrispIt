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

export async function analyzeImageLive(base64Image: string) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-preview-05-20' });

  const prompt = `You are a produce detection system. Detect ONLY fresh produce items (fruits and vegetables) visible in this image. Ignore all non-produce items (packaged foods, drinks, cans, boxes, utensils, etc).

For each produce item found, provide a tight bounding box and freshness assessment.
Bounding box coordinates must be [y_min, x_min, y_max, x_max] where each value is 0-1000 (normalized to image dimensions).

Return ONLY valid JSON (no markdown, no code fences):
{
  "detections": [
    {
      "item_name": "Tomato",
      "category": "vegetable",
      "freshness_score": 8,
      "freshness_description": "Bright red, firm, very fresh",
      "estimated_days_remaining": 5,
      "box": [200, 300, 600, 700]
    }
  ]
}

Rules:
- ONLY detect fruits and vegetables (fresh produce). No packaged or processed food.
- freshness_score is 1-10 (10 = perfectly fresh)
- If no produce items are visible, return {"detections": []}
- Be accurate with bounding box positions — they should tightly wrap each individual item
- Detect up to 5 produce items maximum
- Keep freshness_description very short (under 10 words)
- item_name should be the specific produce name (e.g. "Red Apple", "Banana", "Broccoli")`;

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
