import dotenv from 'dotenv';

dotenv.config();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

export async function chatCompletion(prompt: string, systemPrompt?: string) {
  const messages: Array<{ role: string; content: string }> = [];

  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  messages.push({ role: 'user', content: prompt });

  const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://lunchbox-app.com',
      'X-Title': 'LunchBox',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      max_tokens: 2048,
      messages,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenRouter API error: ${response.status}`);
  }

  const data: any = await response.json();
  return data.choices[0].message.content;
}

export async function analyzeImageFallback(base64Image: string, prompt: string) {
  // Strip data URI prefix if present
  const data = base64Image.replace(/^data:image\/\w+;base64,/, '');
  const mimeType = base64Image.startsWith('data:')
    ? base64Image.match(/^data:(image\/\w+);/)?.[1] || 'image/jpeg'
    : 'image/jpeg';

  const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://lunchbox-app.com',
      'X-Title': 'LunchBox',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: `data:${mimeType};base64,${data}` } },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenRouter vision API error: ${response.status} — ${errText}`);
  }

  const result: any = await response.json();
  const text = result.choices[0].message.content;
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    throw new Error(`Failed to parse OpenRouter response: ${cleaned.substring(0, 200)}`);
  }
}

export async function generateRecipesFallback(items: string[]) {
  const prompt = `Generate 3 recipes using these items that are about to expire: ${items.join(', ')}.
Focus on minimizing food waste. Return ONLY valid JSON array:
[{"title":"...","description":"...","ingredients":["..."],"steps":["..."],"carbon_savings":"...","prep_time":"..."}]`;

  const result = await chatCompletion(prompt, 'You are a sustainable cooking expert. Always respond with valid JSON only.');
  const cleaned = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleaned);
}
