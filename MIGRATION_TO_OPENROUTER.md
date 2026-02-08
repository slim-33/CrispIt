# Migrating from Gemini to OpenRouter

## Why We Switched

If you were using the Gemini API directly, you may have noticed:
- 404 errors (Gemini 1.5 models retired April 2025)
- 400 errors (API authentication issues)
- 429 rate limit errors (free tier cut to 20 requests/day in Dec 2025)

**OpenRouter solves all of these problems** and gives you more flexibility.

## Quick Comparison

| Feature | Direct Gemini API | OpenRouter |
|---------|------------------|------------|
| Free tier | 20 requests/day | $1 credit (~200-500 requests) |
| Setup complexity | Medium (endpoint/auth issues) | Easy (standard OpenAI format) |
| Model options | Gemini only | Gemini, Claude, GPT-4, Llama, etc. |
| Free models | None | Llama 3.2 Vision (unlimited) |
| Pricing after free | Confusing token counts | Simple per-request pricing |

## Migration Steps

### 1. Get OpenRouter Key
1. Go to [OpenRouter.ai](https://openrouter.ai/)
2. Sign up (free, can use Google/GitHub)
3. Navigate to "Keys" → "Create Key"
4. Copy your new key (starts with `sk-or-v1-`)

### 2. Update Your .env File
**Old:**
```
GEMINI_API_KEY=AIzaSy...
```

**New:**
```
OPENROUTER_API_KEY=sk-or-v1-...
```

### 3. That's It!
The new version already has OpenRouter integration. Just:
- Delete your old `node_modules` if you have issues
- Run `npm install`
- Run `npx expo start`

## What Changed in the Code

If you're curious about what changed:

### Old (Direct Gemini):
```javascript
// geminiService.js
const response = await axios.post(
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
  { /* Gemini-specific format */ },
  { headers: { 'x-goog-api-key': GEMINI_API_KEY } }
);
```

### New (OpenRouter):
```javascript
// aiService.js
const response = await axios.post(
  'https://openrouter.ai/api/v1/chat/completions',
  { /* Standard OpenAI format */ },
  { headers: { 'Authorization': `Bearer ${OPENROUTER_API_KEY}` } }
);
```

## Benefits You Get

### 1. Better Free Tier
- **Before:** 20 requests/day
- **After:** $1 credit = 200-500 requests
- **Option:** Switch to Llama 3.2 Vision = unlimited free requests

### 2. Easy Model Switching
Want to try different AI models? Just change one line in `src/services/aiService.js`:

```javascript
// Try Gemini 2.5 Flash Lite (current default - fast & cheap)
const MODEL = 'google/gemini-2.5-flash-lite';

// Try Gemini 2.5 Flash (better quality, reasoning)
const MODEL = 'google/gemini-2.5-flash';

// Try completely free Llama
const MODEL = 'meta-llama/llama-3.2-11b-vision-instruct:free';

// Try Claude
const MODEL = 'anthropic/claude-3-haiku';
```

### 3. No More Token Math
- Gemini API: Had to worry about "thinking tokens" that you couldn't control
- OpenRouter: Simple per-request pricing, no surprises

### 4. Better Error Messages
OpenRouter returns clearer error messages and has better documentation.

## Still Want to Use Gemini Directly?

If you really want to keep using the direct Gemini API, you can:

1. Keep the old code (check git history)
2. Use `gemini-2.0-flash-lite` (1000 req/day free)
3. But honestly, OpenRouter is just easier 😊

## Questions?

- **Q: Do I lose money if I don't use my $1 credit?**
  A: No, credits don't expire.

- **Q: Can I still use Gemini models?**
  A: Yes! OpenRouter gives you access to Gemini models, just through a better API.

- **Q: Is this more expensive?**
  A: No. After your free $1, Gemini Flash costs ~$0.001-0.002 per request. Or use Llama 3.2 Vision for completely free.

- **Q: Why not just use the free Llama model?**
  A: You can! It works great. We default to Gemini Flash because it's slightly more accurate, but Llama is totally viable.

## Support

- See [OPENROUTER_SETUP.md](OPENROUTER_SETUP.md) for full setup guide
- OpenRouter docs: https://openrouter.ai/docs
- Issues? Check the console logs - they're way more helpful now!
