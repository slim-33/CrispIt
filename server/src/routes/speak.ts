import { Router, Request, Response } from 'express';
import { textToSpeech } from '../lib/elevenlabs';

const router = Router();

// POST /api/speak — text to speech via ElevenLabs
router.post('/', async (req: Request, res: Response) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'No text provided' });
    }

    // Limit text length to conserve ElevenLabs quota
    const trimmedText = text.slice(0, 500);

    const audioBuffer = await textToSpeech(trimmedText);

    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': audioBuffer.length.toString(),
    });
    res.send(audioBuffer);
  } catch (error) {
    console.error('TTS error:', error);
    res.status(500).json({ error: 'Failed to generate speech' });
  }
});

export default router;
