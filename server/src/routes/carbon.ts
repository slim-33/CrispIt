import { Router, Request, Response } from 'express';
import carbonData from '../../../data/carbon-footprints.json';

const router = Router();

// GET /api/carbon/:item — lookup carbon footprint
router.get('/:item', (req: Request, res: Response) => {
  const itemName = (req.params.item as string).toLowerCase().trim();

  const entry = carbonData.find(
    (c: any) => c.item === itemName || itemName.includes(c.item) || c.item.includes(itemName)
  );

  if (!entry) {
    return res.status(404).json({
      error: 'Item not found in carbon database',
      suggestion: 'Try a more common item name',
    });
  }

  const co2e = entry.co2e_per_kg;
  const drivingKm = +(co2e * 6.2).toFixed(1);

  res.json({
    item: entry.item,
    co2e_per_kg: co2e,
    category: entry.category,
    comparison: co2e < 1
      ? `Low impact — equivalent to charging your phone ${Math.round(co2e * 130)} times`
      : co2e < 5
        ? `Medium impact — equivalent to driving ${drivingKm} km`
        : `High impact — equivalent to driving ${drivingKm} km`,
    driving_equivalent_km: drivingKm,
  });
});

// GET /api/carbon — list all items
router.get('/', (_req: Request, res: Response) => {
  res.json(carbonData);
});

export default router;
