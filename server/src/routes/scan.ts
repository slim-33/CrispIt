import { Router, Request, Response } from 'express';
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
      return res.status(400).json({ error: 'No image provided' });
    }

    const analysis = await analyzeImage(image);
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

    const result = await analyzeImageLive(image);
    res.json(result);
  } catch (error) {
    console.error('Live scan error:', error);
    res.json({ detections: [] });
  }
});

// GET /api/scans — get scan history
router.get('/', async (_req: Request, res: Response) => {
  try {
    const scans = await Scan.find().sort({ created_at: -1 }).limit(50);
    res.json(scans);
  } catch {
    res.json([]);
  }
});

export default router;
