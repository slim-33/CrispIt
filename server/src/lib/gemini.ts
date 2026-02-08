import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

interface VoiceChatInput {
  audio?: string;
  mimeType?: string;
  text?: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const SYSTEM_PROMPT = `You are Chris, a friendly and knowledgeable grocery shopping assistant for the CrispIt app. You help people pick the freshest produce, store food properly, and reduce food waste. Keep responses concise (under 150 words) and conversational — you're being read aloud via text-to-speech.`;

/**
 * Voice chat: transcribe audio (if provided) and generate a conversational response.
 * Optionally detects a wake word in the transcript.
 */
export async function voiceChat(
  input: VoiceChatInput,
  history: ChatMessage[],
  wakeWord?: string
): Promise<{ transcript: string; response: string; wakeWordDetected?: boolean }> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  let transcript = '';

  // If audio is provided, transcribe it first
  if (input.audio && input.mimeType) {
    const transcriptionResult = await model.generateContent([
      { text: 'Transcribe this audio exactly. Return only the transcription, nothing else.' },
      {
        inlineData: {
          mimeType: input.mimeType,
          data: input.audio,
        },
      },
    ]);
    transcript = transcriptionResult.response.text().trim();
  } else if (input.text) {
    transcript = input.text;
  }

  if (!transcript) {
    return { transcript: '', response: "I didn't catch that. Could you try again?", wakeWordDetected: false };
  }

  // Wake word detection
  if (wakeWord) {
    const lower = transcript.toLowerCase();
    if (!lower.includes(wakeWord.toLowerCase())) {
      return { transcript, response: '', wakeWordDetected: false };
    }
  }

  // Build conversation for the model
  const conversationParts = [SYSTEM_PROMPT];
  for (const msg of history.slice(-10)) {
    const role = msg.role === 'user' ? 'User' : 'Chris';
    conversationParts.push(`${role}: ${msg.content}`);
  }
  conversationParts.push(`User: ${transcript}`);
  conversationParts.push('Chris:');

  const chatResult = await model.generateContent(conversationParts.join('\n'));
  const response = chatResult.response.text().trim();

  return {
    transcript,
    response,
    wakeWordDetected: wakeWord ? true : undefined,
  };
}

/**
 * Generate shopping guidance for a list of produce items.
 */
export async function generateShoppingGuidance(items: string[]) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const prompt = `You are a produce freshness expert. For each item below, provide:
1. How to pick the freshest one (2-3 key tips)
2. What to avoid
3. Expected shelf life when stored properly

Items: ${items.join(', ')}

Respond in JSON format:
{
  "items": [
    {
      "name": "item name",
      "tips": ["tip1", "tip2"],
      "avoid": "what to avoid",
      "shelfLife": "X days"
    }
  ]
}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();

  // Extract JSON from response
  const jsonMatch = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }

  return { items: items.map(name => ({ name, tips: ['Check for firmness and color'], avoid: 'Bruises or soft spots', shelfLife: '3-7 days' })) };
}
