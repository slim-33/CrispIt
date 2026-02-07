import { Router, Request, Response } from 'express';
import FridgeItem from '../models/FridgeItem';

const router = Router();

// GET /api/fridge — get all fridge items
router.get('/', async (_req: Request, res: Response) => {
  try {
    const items = await FridgeItem.find().sort({ expiry_date: 1 });
    res.json(items);
  } catch {
    res.json([]);
  }
});

// POST /api/fridge — add item to fridge
router.post('/', async (req: Request, res: Response) => {
  try {
    const item = new FridgeItem(req.body);
    await item.save();
    res.status(201).json(item);
  } catch (error) {
    console.error('Fridge add error:', error);
    res.status(500).json({ error: 'Failed to add item to fridge' });
  }
});

// DELETE /api/fridge/:id — remove item from fridge
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await FridgeItem.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Fridge delete error:', error);
    res.status(500).json({ error: 'Failed to remove item' });
  }
});

export default router;
