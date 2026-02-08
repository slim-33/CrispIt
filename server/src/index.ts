import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import assistantRouter from './routes/assistant';
import { textToSpeech } from './lib/elevenlabs';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api/assistant', assistantRouter);

// POST /api/speak — standalone TTS endpoint used by VoicePlayer component
app.post('/api/speak', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || typeof text !== 'string' || text.length > 1000) {
      return res.status(400).json({ error: 'Text is required and must be under 1000 characters' });
    }

    const audioBuffer = await textToSpeech(text);
    res.set('Content-Type', 'audio/mpeg');
    res.send(audioBuffer);
  } catch (error) {
    console.error('TTS error:', error);
    res.status(500).json({ error: 'Text-to-speech failed' });
  }
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`CrispIt server running on port ${PORT}`);
});
