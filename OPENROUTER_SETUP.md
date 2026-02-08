# FreshPick - OpenRouter Setup Guide

## Why OpenRouter?

OpenRouter is a better choice than direct Gemini API because:
- ✅ **Better free tier** - More generous limits than Google's recently gutted free tier
- ✅ **Multiple models** - Easy to switch between Gemini, Claude, GPT-4, Llama, etc.
- ✅ **Credits system** - Get $1 free credit to start (enough for ~200-500 requests)
- ✅ **Completely free models available** - Like Llama 3.2 Vision
- ✅ **Single API key** - Works across all models

## Setup Steps

### 1. Get Your OpenRouter API Key

1. Go to [OpenRouter](https://openrouter.ai/)
2. Sign up for a free account (you can use Google/GitHub)
3. Click on "Keys" in the sidebar
4. Click "Create Key" and give it a name (e.g., "FreshPick App")
5. Copy your API key (starts with `sk-or-v1-...`)

### 2. Add Your API Key

Open the `.env` file and replace `your_openrouter_api_key_here` with your actual API key:

```
OPENROUTER_API_KEY=sk-or-v1-...your_actual_key_here
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Run the App

```bash
npx expo start
```

## Free Credits & Pricing

**Free tier:**
- You get **$1 in free credits** when you sign up
- This is enough for approximately 200-500 image analysis requests
- Credits don't expire

**After free credits:**
- Gemini Flash 1.5: ~$0.001-0.002 per request
- You can add as little as $5 to your account
- Or switch to a completely free model (see below)

## Switching Models

The app is currently configured to use `google/gemini-2.5-flash-lite`. You can easily switch to other models by editing `src/services/aiService.js` and changing the `MODEL` constant:

### Recommended Models:

```javascript
// Current default (fastest, cheapest, great for this app)
const MODEL = 'google/gemini-2.5-flash-lite';

// Better quality Gemini (costs a bit more, has reasoning)
const MODEL = 'google/gemini-2.5-flash';

// Newest Gemini (best reasoning and multimodal)
const MODEL = 'google/gemini-3-flash-preview';

// Completely FREE option (works great for produce analysis!)
const MODEL = 'meta-llama/llama-3.2-11b-vision-instruct:free';

// Claude (different AI, excellent quality)
const MODEL = 'anthropic/claude-3-haiku';

// GPT-4 Vision (expensive but very accurate)
const MODEL = 'openai/gpt-4-vision-preview';
```

Just change that one line and restart the app!

## What Was Fixed

### Issue History:
1. ✅ **404 Error** - Gemini 1.5 models were retired in April 2025
2. ✅ **400 Error** - API key needed to be in header, not query param
3. ✅ **Invalid Response Format** - Response was truncated due to token limits
4. ✅ **429 Rate Limit** - Google slashed free tier to only 20 requests/day in Dec 2025

### Final Solution:
Switched to **OpenRouter** which provides:
- Better free tier ($1 credit = 200-500 requests)
- Access to multiple AI models
- Option to use completely free models
- More predictable pricing

## Testing Your Setup

After adding your API key:
1. Restart the Expo development server
2. Open the Scanner screen
3. Take a photo of produce
4. The AI should analyze it and return freshness information

## Troubleshooting

### "API_KEY_MISSING" Error
- Make sure you saved the `.env` file after adding your key
- Restart the Expo server (Ctrl+C and run `npx expo start` again)
- Check that there are no extra spaces in the `.env` file

### 401/403 Error
- Your API key is invalid
- Go to [OpenRouter Keys](https://openrouter.ai/keys) and create a new one

### Out of Credits
- Check your balance at [OpenRouter](https://openrouter.ai/)
- Add more credits, or switch to a free model (see "Switching Models" above)

### Still Getting Errors?
- Check the Metro console logs for detailed error messages
- The app now logs the full API response for debugging
- Make sure you have an internet connection

## Support

- OpenRouter Docs: https://openrouter.ai/docs
- Discord: https://discord.gg/openrouter
- Email: help@openrouter.ai
