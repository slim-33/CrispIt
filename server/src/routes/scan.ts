import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { analyzeImage, analyzeImageLive } from '../lib/gemini';
import Scan from '../models/Scan';
import User from '../models/User';
import carbonData from '../../../data/carbon-footprints.json';

const router = Router();

function findCarbonData(itemName: string) {
  const normalized = itemName.toLowerCase().trim();
  const entry = carbonData.find(
    (c: any) => normalized.includes(c.item) || c.item.includes(normalized)
  );
  if (!entry) return null;

  const co2e = entry.co2e_per_kg;
  const drivingKm = +(co2e * 6.2).toFixed(1); // ~6.2 km per kg CO2 for average car

  return {
    item: entry.item,
    co2e_per_kg: co2e,
    category: entry.category,
    comparison: co2e < 1
      ? `Low impact — equivalent to charging your phone ${Math.round(co2e * 130)} times`
      : co2e < 5
        ? `Medium impact — equivalent to driving ${drivingKm} km`
        : `High impact — equivalent to driving ${drivingKm} km`,
    driving_equivalent_km: drivingKm,
  };
}

// POST /api/scan — analyze a produce image
router.post('/', async (req: Request, res: Response) => {
  try {
    const { image } = req.body;
    if (!image) {
      console.log('[POST /api/scan] No image in request body');
      return res.status(400).json({ error: 'No image provided' });
    }
    if (typeof image !== 'string' || image.length < 100) {
      console.log(`[POST /api/scan] Invalid image data: type=${typeof image}, length=${image?.length}`);
      return res.status(400).json({ error: 'Invalid image data' });
    }

    console.log(`[POST /api/scan] Received image, length: ${image.length}`);
    const analysis = await analyzeImage(image);
    console.log(`[POST /api/scan] Analysis result: ${analysis.item_name} (score: ${analysis.freshness_score})`);
    const carbon = findCarbonData(analysis.item_name);

    const scanResult = {
      ...analysis,
      carbon_footprint: carbon,
    };

    // Save to MongoDB
    try {
      const scan = new Scan(scanResult);
      await scan.save();
      scanResult._id = scan._id;

      // Update user stats
      const user = await User.findOne() || new User();
      user.total_scans += 1;
      if (carbon) {
        user.total_carbon_saved += carbon.co2e_per_kg * 0.1;
      }
      const now = new Date();
      const lastScan = user.last_scan_date;
      if (lastScan) {
        const daysSince = Math.floor((now.getTime() - lastScan.getTime()) / 86400000);
        if (daysSince <= 1) {
          user.current_streak += 1;
        } else {
          user.current_streak = 1;
        }
      } else {
        user.current_streak = 1;
      }
      if (user.current_streak > user.best_streak) {
        user.best_streak = user.current_streak;
      }
      user.last_scan_date = now;
      user.sustainability_score = Math.min(100, 50 + user.total_scans * 2 + user.current_streak * 3);
      await user.save();
    } catch (dbErr) {
      console.log('DB save skipped (no connection):', (dbErr as Error).message);
    }

    res.json(scanResult);
  } catch (error) {
    console.error('Scan error:', error);
    res.status(500).json({ error: 'Failed to analyze image' });
  }
});

// POST /api/scan/live — lightweight real-time detection with bounding boxes
router.post('/live', async (req: Request, res: Response) => {
  try {
    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ detections: [] });
    }

    console.log(`[POST /api/scan/live] Received image, length: ${image.length}`);
    const result = await analyzeImageLive(image);
    console.log(`[POST /api/scan/live] Detections: ${result.detections?.length ?? 0}`);
    res.json(result);
  } catch (error) {
    console.error('[POST /api/scan/live] Error:', error);
    res.json({ detections: [] });
  }
});

// GET /api/scan/test — test scanner with a built-in image (for debugging)
router.get('/test', async (_req: Request, res: Response) => {
  try {
    // Use a small red square as a minimal test image (1x1 red pixel JPEG)
    // For a real test, you can place a test.jpg in the server directory
    const testImagePath = path.join(__dirname, '..', '..', 'test.jpg');
    if (fs.existsSync(testImagePath)) {
      const imageBuffer = fs.readFileSync(testImagePath);
      const base64 = imageBuffer.toString('base64');
      console.log(`[GET /api/scan/test] Using test.jpg (${base64.length} chars)`);
      const analysis = await analyzeImage(base64);
      const carbon = findCarbonData(analysis.item_name);
      res.json({ status: 'ok', analysis, carbon });
    } else {
      res.json({
        status: 'no_test_image',
        message: 'Place a test.jpg in the server/ directory to test the scanner pipeline',
        gemini_key_set: !!process.env.GEMINI_API_KEY,
        gemini_key_prefix: process.env.GEMINI_API_KEY?.substring(0, 10) + '...',
      });
    }
  } catch (error) {
    console.error('[GET /api/scan/test] Error:', error);
    res.status(500).json({ status: 'error', error: String(error) });
  }
});

// Dummy scan history for when DB is empty or unavailable
const DUMMY_SCANS = [
  {
    item_name: 'Red Apple', category: 'fruit', freshness_score: 8,
    freshness_description: 'Very fresh with vibrant red coloring.',
    estimated_days_remaining: 7,
    storage_tips: ['Store in refrigerator crisper drawer'],
    visual_indicators: ['Vibrant red color', 'Firm skin'],
    sustainable_alternative: { name: 'Local Seasonal Pear', reason: '40% lower transport emissions', carbon_savings_percent: 40 },
    carbon_footprint: { item: 'apple', co2e_per_kg: 0.4, category: 'fruit', comparison: 'Low impact', driving_equivalent_km: 2.5 },
  },
  {
    item_name: 'Banana', category: 'fruit', freshness_score: 6,
    freshness_description: 'Ripe with some brown spots.',
    estimated_days_remaining: 3,
    storage_tips: ['Keep at room temperature'],
    visual_indicators: ['Yellow with brown spots'],
    sustainable_alternative: { name: 'Local Berries', reason: 'Shorter transport chain', carbon_savings_percent: 35 },
    carbon_footprint: { item: 'banana', co2e_per_kg: 0.7, category: 'fruit', comparison: 'Low impact', driving_equivalent_km: 4.3 },
  },
  {
    item_name: 'Broccoli', category: 'vegetable', freshness_score: 9,
    freshness_description: 'Deep green florets, very fresh.',
    estimated_days_remaining: 5,
    storage_tips: ['Store unwashed in loose bag in fridge'],
    visual_indicators: ['Deep green color', 'Tight florets'],
    sustainable_alternative: { name: 'Cabbage', reason: 'Lower water footprint', carbon_savings_percent: 25 },
    carbon_footprint: { item: 'broccoli', co2e_per_kg: 0.9, category: 'vegetable', comparison: 'Low impact', driving_equivalent_km: 5.6 },
  },
  {
    item_name: 'Chicken Breast', category: 'meat', freshness_score: 7,
    freshness_description: 'Fresh, pink color, no odor.',
    estimated_days_remaining: 2,
    storage_tips: ['Keep refrigerated below 4°C'],
    visual_indicators: ['Pink color', 'No discoloration'],
    sustainable_alternative: { name: 'Tofu', reason: '80% lower carbon footprint', carbon_savings_percent: 80 },
    carbon_footprint: { item: 'chicken', co2e_per_kg: 6.9, category: 'meat', comparison: 'Medium-high impact', driving_equivalent_km: 42.9 },
  },
  {
    item_name: 'Avocado', category: 'fruit', freshness_score: 5,
    freshness_description: 'Ripe, consume within 1-2 days.',
    estimated_days_remaining: 2,
    storage_tips: ['Refrigerate to slow ripening'],
    visual_indicators: ['Dark green-brown skin', 'Yields to pressure'],
    sustainable_alternative: { name: 'Hummus', reason: '70% lower water and carbon footprint', carbon_savings_percent: 70 },
    carbon_footprint: { item: 'avocado', co2e_per_kg: 2.5, category: 'fruit', comparison: 'Medium impact', driving_equivalent_km: 15.5 },
  },
];

// GET /api/scans — get scan history
router.get('/', async (_req: Request, res: Response) => {
  try {
    const scans = await Scan.find().sort({ created_at: -1 }).limit(50);
    res.json(scans.length > 0 ? scans : DUMMY_SCANS);
  } catch {
    res.json(DUMMY_SCANS);
  }
});

export default router;
