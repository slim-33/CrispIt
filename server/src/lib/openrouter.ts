const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'google/gemini-2.5-flash-lite';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function callOpenRouter(messages: Array<{ role: string; content: any }>, maxTokens = 500, temperature = 0.7): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY not set');

  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://crispit.app',
      'X-Title': 'CrispIt Server',
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      max_tokens: maxTokens,
      temperature,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenRouter API error: ${response.status}`);
  }

  const data = await response.json() as any;
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error('No response from OpenRouter');
  return content.trim();
}

/**
 * Fallback voice chat using OpenRouter (text-only, no audio transcription).
 */
export async function voiceChatFallback(
  text: string,
  history: ChatMessage[]
): Promise<{ transcript: string; response: string; wakeWordDetected?: boolean }> {
  const systemPrompt = `You are Chris, a friendly grocery shopping assistant for the CrispIt app. You help people pick the freshest produce, store food properly, and reduce food waste. Keep responses concise (under 150 words) and conversational.`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.slice(-10).map(msg => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content,
    })),
    { role: 'user', content: text },
  ];

  const response = await callOpenRouter(messages);

  return {
    transcript: text,
    response,
  };
}

/**
 * Fallback shopping guidance using OpenRouter.
 */
export async function generateShoppingGuidanceFallback(items: string[]) {
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

  const messages = [{ role: 'user', content: prompt }];
  const text = await callOpenRouter(messages);

  const jsonMatch = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }

  return { items: items.map(name => ({ name, tips: ['Check for firmness and color'], avoid: 'Bruises or soft spots', shelfLife: '3-7 days' })) };
}
