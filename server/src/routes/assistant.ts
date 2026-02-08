import { Router, Request, Response } from 'express';
import { generateShoppingGuidance, voiceChat } from '../lib/gemini';
import { generateShoppingGuidanceFallback, voiceChatFallback } from '../lib/openrouter';
import { textToSpeech } from '../lib/elevenlabs';

const router = Router();

// Limits
const MAX_AUDIO_SIZE = 5 * 1024 * 1024; // 5 MB base64
const MAX_TEXT_LENGTH = 2000;
const MAX_HISTORY_LENGTH = 20;

// POST /api/assistant/voice-chat — conversational voice assistant
router.post('/voice-chat', async (req: Request, res: Response) => {
  try {
    const { audio, mimeType, text, history = [], wakeWord } = req.body;

    if (!audio && !text) {
      return res.status(400).json({ error: 'Please provide audio or text input' });
    }

    if (audio && (typeof audio !== 'string' || audio.length > MAX_AUDIO_SIZE)) {
      return res.status(400).json({ error: 'Audio payload too large or invalid' });
    }

    if (text && (typeof text !== 'string' || text.length > MAX_TEXT_LENGTH)) {
      return res.status(400).json({ error: 'Text input too long or invalid' });
    }

    if (!Array.isArray(history) || history.length > MAX_HISTORY_LENGTH) {
      return res.status(400).json({ error: 'Invalid or oversized history' });
    }

    // Get AI response (transcription + reply, with optional wake word detection)
    let result: { transcript: string; response: string; wakeWordDetected?: boolean };
    try {
      result = await voiceChat({ audio, mimeType, text }, history, wakeWord || undefined);
    } catch (geminiError) {
      console.log('Gemini voice chat failed, trying fallback:', (geminiError as Error).message);
      if (text) {
        result = await voiceChatFallback(text, history);
      } else {
        throw geminiError;
      }
    }

    // If wake word mode and not detected, return immediately (no TTS needed)
    if (wakeWord && result.wakeWordDetected === false) {
      console.log('[voice-chat] wake word not detected, skipping');
      return res.json({ wakeWordDetected: false, transcript: '', response: '', audio: null });
    }

    console.log(`[voice-chat] transcript: "${result.transcript}" → response: "${result.response}"`);

    // Generate TTS audio for the response
    let responseAudio: string | null = null;
    try {
      const audioBuffer = await textToSpeech(result.response.substring(0, 500));
      responseAudio = audioBuffer.toString('base64');
    } catch (ttsErr) {
      console.warn('TTS failed, returning text only:', (ttsErr as Error).message);
    }

    res.json({
      wakeWordDetected: wakeWord ? true : undefined,
      transcript: result.transcript,
      response: result.response,
      audio: responseAudio,
    });
  } catch (error) {
    console.error('Voice chat error:', error);
    res.status(500).json({ error: 'Voice chat failed' });
  }
});

// POST /api/assistant/shopping — batch produce picking tips
router.post('/shopping', async (req: Request, res: Response) => {
  try {
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Please provide an array of items' });
    }

    if (!items.every((item: unknown) => typeof item === 'string' && item.length < 200)) {
      return res.status(400).json({ error: 'Each item must be a string under 200 characters' });
    }

    const limited = items.slice(0, 5);

    let guidance;
    try {
      guidance = await generateShoppingGuidance(limited);
    } catch (geminiError) {
      console.log('Gemini failed, falling back to OpenRouter:', (geminiError as Error).message);
      guidance = await generateShoppingGuidanceFallback(limited);
    }

    res.json(guidance);
  } catch (error) {
    console.error('Shopping guidance error:', error);
    res.status(500).json({ error: 'Failed to generate shopping guidance' });
  }
});

export default router;
