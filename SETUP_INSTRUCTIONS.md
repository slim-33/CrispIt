# FreshPick Setup Instructions

# FreshPick Setup Instructions

## ⚠️ IMPORTANT: Now Using OpenRouter!

This app now uses **OpenRouter** instead of the direct Google Gemini API.

**Why the change?**
- Google slashed their free tier to only 20 requests/day (Dec 2025)
- OpenRouter gives you $1 free credit (~200-500 requests)
- Access to multiple AI models with one API key
- Option to use completely free models

## 📖 Full Setup Guide

**Please see [OPENROUTER_SETUP.md](OPENROUTER_SETUP.md) for complete setup instructions.**

## Quick Start

1. Get API key at [OpenRouter](https://openrouter.ai/) (free signup)
2. Add key to `.env` file:
   ```
   OPENROUTER_API_KEY=sk-or-v1-...your_key_here
   ```
3. Run `npm install`
4. Run `npx expo start`

That's it! See OPENROUTER_SETUP.md for troubleshooting, model options, and more details.

### 1. Get Your Gemini API Key
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click "Create API Key"
3. Copy your new API key

### 2. Add Your API Key
Open the `.env` file and replace `your_gemini_api_key_here` with your actual API key:

```
GEMINI_API_KEY=AIzaSy...your_actual_key_here
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Run the App
```bash
npx expo start
```

## What Was Fixed

### Issue 1: 404 Error - Model No Longer Exists!
**Root Cause**: The code was using `gemini-1.5-flash-latest`, but **all Gemini 1.5 models were retired on April 29, 2025**.

**Solution**: Updated to use `gemini-2.5-flash`, which is the current stable model:
```javascript
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
```

According to Google's documentation:
- Gemini 1.5 Pro and Flash → Retired April 29, 2025
- Current available models → Gemini 2.0, 2.5, and 3.x series
- Gemini 2.5 Flash → Stable, cost-effective, perfect for this app

### Issue 2: 400 Error (Invalid API Key) 
**Root Cause**: After fixing the 404, you were getting a 400 error because the API key was being sent incorrectly.

**Problem**: The code was sending the API key as a URL query parameter:
```javascript
axios.post(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, ...)
```

**Solution**: According to Google's official documentation, the API key must be sent in the **request header** as `x-goog-api-key`:
```javascript
axios.post(GEMINI_API_URL, ..., {
  headers: {
    'Content-Type': 'application/json',
    'x-goog-api-key': GEMINI_API_KEY,  // ← Key goes here!
  }
})
```

This is why even a freshly generated, valid API key was being rejected - it wasn't in the right place!

## Testing Your Setup

After adding your API key, test the app by:
1. Opening the Scanner screen
2. Taking a photo of produce
3. The AI should analyze it and return freshness information

If you still see errors, check:
- ✓ API key is correctly pasted in `.env` (no extra spaces)
- ✓ You've restarted the Expo server after updating `.env`
- ✓ Your API key is active in Google AI Studio

## Rate Limits
The app includes built-in rate limiting:
- Max 15 requests per minute
- 2 second minimum between requests

This helps avoid hitting Google's API limits.
