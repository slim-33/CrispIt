import { Router, Request, Response } from 'express';
import { callOpenRouter } from '../lib/openrouter';

const router = Router();

const MAX_TEXT_LENGTH = 2000;
const MAX_HISTORY_LENGTH = 20;

// POST /api/chat
router.post('/', async (req: Request, res: Response) => {
  try {
    const { message, conversationHistory = [], context = {} } = req.body;

    if (!message || typeof message !== 'string' || message.length > MAX_TEXT_LENGTH) {
      return res.status(400).json({ error: 'Message must be a string under 2000 characters' });
    }

    if (!Array.isArray(conversationHistory) || conversationHistory.length > MAX_HISTORY_LENGTH) {
      return res.status(400).json({ error: 'Invalid or oversized conversation history' });
    }

    const { collectionNames = '', fridgeItems = '' } = context;

    const systemContext = `You are FreshPick AI, a helpful assistant for a produce freshness tracking app.

USER'S DATA:
- Collection (unique produce discovered): ${collectionNames || 'None yet'}
- Fridge (current items): ${fridgeItems || 'Empty'}

Your role:
- Answer questions about their collection and fridge items
- Suggest recipes based on what they have
- Recommend new produce to try based on their collection
- Provide tips on produce selection, storage, and usage
- Be friendly, concise, and practical

Keep responses under 200 words unless asked for more detail.`;

    const messages = [
      { role: 'system', content: systemContext },
      ...conversationHistory,
      { role: 'user', content: message },
    ];

    const content = await callOpenRouter(messages, 500, 0.7);

    res.json({ success: true, message: content });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ success: false, error: 'Chat failed' });
  }
});

export default router;
