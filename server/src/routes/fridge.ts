import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import FridgeItem from '../models/FridgeItem';

const router = Router();

// In-memory fallback when MongoDB is unavailable
interface MemFridgeItem {
  _id: string;
  [key: string]: any;
}
const memoryStore: MemFridgeItem[] = [];
let memIdCounter = 1;

function isDbConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

function isValidObjectId(id: string): boolean {
  return mongoose.Types.ObjectId.isValid(id) && /^[a-f\d]{24}$/i.test(id);
}

// GET /api/fridge — get all fridge items
router.get('/', async (_req: Request, res: Response) => {
  let dbItems: any[] = [];
  if (isDbConnected()) {
    try {
      dbItems = await FridgeItem.find().sort({ expiry_date: 1 });
    } catch {
      // DB query failed, fall through to memory
    }
  }
  // Merge DB items with any in-memory items
  const all = [...dbItems, ...memoryStore];
  all.sort((a, b) => new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime());
  res.json(all);
});

// POST /api/fridge — add item to fridge
router.post('/', async (req: Request, res: Response) => {
  if (!isDbConnected()) {
    const item: MemFridgeItem = { _id: `mem-${memIdCounter++}`, ...req.body };
    memoryStore.push(item);
    return res.status(201).json(item);
  }
  try {
    const item = new FridgeItem(req.body);
    await item.save();
    res.status(201).json(item);
  } catch (error) {
    // Fallback to memory if DB save fails
    console.error('Fridge DB add error, using memory fallback:', (error as Error).message);
    const item: MemFridgeItem = { _id: `mem-${memIdCounter++}`, ...req.body };
    memoryStore.push(item);
    res.status(201).json(item);
  }
});

// DELETE /api/fridge/:id — remove item from fridge
router.delete('/:id', async (req: Request, res: Response) => {
  const id = req.params.id as string;

  // Check memory store first (works regardless of DB state)
  const memIdx = memoryStore.findIndex(i => i._id === id);
  if (memIdx !== -1) {
    memoryStore.splice(memIdx, 1);
    return res.json({ success: true });
  }

  // Only attempt MongoDB delete if id is a valid ObjectId
  if (isDbConnected() && isValidObjectId(id)) {
    try {
      await FridgeItem.findByIdAndDelete(id);
    } catch (error) {
      console.error('Fridge delete error:', error);
      return res.status(500).json({ error: 'Failed to remove item' });
    }
  }

  res.json({ success: true });
});

export default router;
