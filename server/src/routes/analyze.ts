import { Router, Request, Response } from 'express';
import { callOpenRouter } from '../lib/openrouter';

const router = Router();

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB base64

function parseJsonFromAI(text: string): any {
  let cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '');
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) return null;
  return JSON.parse(match[0]);
}

// POST /api/analyze/freshness
router.post('/freshness', async (req: Request, res: Response) => {
  try {
    const { base64Image } = req.body;
    if (!base64Image || typeof base64Image !== 'string' || base64Image.length > MAX_IMAGE_SIZE) {
      return res.status(400).json({ error: 'Invalid or oversized image' });
    }

    const prompt = `You are a food freshness analyzer. Carefully examine this image.

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
{"isProduce":true,"name":"specific item name","freshnessScore":0-100,"freshnessLevel":"Excellent/Good/Fair/Poor","shelfLifeDays":X,"carbonFootprint":X.XX,"sustainableAlternative":"lower carbon alternative suggestion","indicators":["detailed observation 1","detailed observation 2","detailed observation 3"],"storageTip":"specific storage advice","bestUse":"specific usage suggestion","freshnessVerificationTips":["how to check ripeness","what to look for","how to test freshness"]}`;

    const messages = [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64Image}` } },
        ],
      },
    ];

    const content = await callOpenRouter(messages, 400, 0.1);
    const parsed = parseJsonFromAI(content);

    if (!parsed) {
      return res.status(500).json({ success: false, error: 'Invalid response format' });
    }

    if (parsed.isProduce === false) {
      return res.json({ success: false, notProduce: true, message: parsed.message || "This doesn't appear to be fresh produce" });
    }

    res.json({ success: true, data: parsed });
  } catch (error) {
    console.error('Freshness analysis error:', error);
    res.status(500).json({ success: false, error: 'Analysis failed' });
  }
});

// POST /api/analyze/barcode
router.post('/barcode', async (req: Request, res: Response) => {
  try {
    const { base64Image } = req.body;
    if (!base64Image || typeof base64Image !== 'string' || base64Image.length > MAX_IMAGE_SIZE) {
      return res.status(400).json({ error: 'Invalid or oversized image' });
    }

    const prompt = `You are a packaged food item analyzer. Carefully examine this image.

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
If IS packaged: {"isPackaged":true,"name":"specific product name","carbonFootprint":X.XX,"sustainableAlternative":"lower carbon/less packaging alternative","storageTip":"specific storage advice for this packaged item","nutritionInfo":"brief nutrition summary if visible, or 'Check packaging for details'","packageType":"can/bottle/box/bag/etc"}`;

    const messages = [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64Image}` } },
        ],
      },
    ];

    const content = await callOpenRouter(messages, 300, 0.1);
    const parsed = parseJsonFromAI(content);

    if (!parsed) {
      return res.status(500).json({ success: false, error: 'Invalid response format' });
    }

    if (parsed.isPackaged === false) {
      return res.json({ success: false, notPackaged: true, message: parsed.message || 'This appears to be fresh produce or not a packaged item' });
    }

    res.json({
      success: true,
      data: {
        ...parsed,
        isPackaged: true,
        freshnessScore: null,
        freshnessLevel: null,
        shelfLifeDays: null,
      },
    });
  } catch (error) {
    console.error('Barcode analysis error:', error);
    res.status(500).json({ success: false, error: 'Analysis failed' });
  }
});

// POST /api/analyze/recipe
router.post('/recipe', async (req: Request, res: Response) => {
  try {
    const { ingredients } = req.body;
    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return res.status(400).json({ error: 'Please provide an array of ingredients' });
    }

    const limited = ingredients.slice(0, 20);
    const prompt = `Create a simple, delicious recipe using these ingredients that are about to expire: ${limited.join(', ')}.

Requirements:
- Keep it simple and practical
- 30 minutes or less to prepare
- Include basic cooking instructions
- Format: Recipe name, ingredients list, brief steps

Keep the response under 300 words.`;

    const messages = [{ role: 'user', content: prompt }];
    const recipe = await callOpenRouter(messages, 500, 0.7);

    res.json({ recipe });
  } catch (error) {
    console.error('Recipe generation error:', error);
    res.status(500).json({ error: 'Failed to generate recipe' });
  }
});

export default router;
