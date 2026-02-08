# 🚀 FreshPick - Quick Start Guide

## Get Running in 5 Minutes!

### Step 1: Install Dependencies (1 min)
```bash
npm install
```

### Step 2: Get API Key (2 min)
1. Visit: https://aistudio.google.com/app/apikey
2. Sign in with Google
3. Click "Create API Key"
4. Copy your key (starts with `AIza...`)

### Step 3: Add API Key (30 sec)
Edit `.env` file:
```
GEMINI_API_KEY=paste_your_key_here
```

### Step 4: Start App (30 sec)
```bash
npx expo start
```

### Step 5: Run on Phone (1 min)
1. Open Expo Go app on your phone
2. Scan the QR code
3. Grant camera permission
4. Start scanning! 📸

---

## ⚡ What's New in v1.1.0?

### ✅ Fixed Package Warnings
All packages now compatible with Expo 54 - no more warnings!

### ✅ Smarter Rate Limiting
- Prevents API limit errors before they happen
- Shows exactly how long to wait if limit reached
- Maintains 15 scans/minute (free tier limit)

### ✅ Faster Responses
- 15-20% faster AI analysis
- Quicker timeout detection
- Better error messages

---

## 📱 How to Use

### Scanner Tab 📸
1. Tap "Open Camera" or choose from gallery
2. Point at produce and snap
3. Wait 3-5 seconds for AI analysis
4. Get freshness score, tips, and carbon footprint

**Pro tip**: Wait 2-3 seconds between scans to avoid rate limits

### Collection Tab 📚
- View all scanned items
- Track your discoveries
- Review past freshness scores

### Impact Tab 📊
- See total scans
- Track carbon awareness
- View average freshness scores

---

## 🔧 Quick Troubleshooting

### "API Key Missing"
→ Check `.env` file has your actual key (not placeholder)

### "Rate Limit Reached"
→ Wait the suggested time (usually 2-60 seconds)
→ This is normal if scanning rapidly

### "Network Error"
→ Check internet connection
→ Verify API key is correct

### Camera Not Working
→ Grant camera permission in phone settings
→ Restart app if needed

### Package Warnings
→ Run: `npm install`
→ All packages are now Expo 54 compatible

---

## 📖 Documentation

- **README.md** - Full features and usage
- **INSTALLATION.md** - Detailed setup instructions
- **CHANGES.md** - Complete changelog and technical details

---

## 💡 Tips for Best Results

1. **Good Photos** = Better Analysis
   - Use good lighting
   - Fill frame with produce
   - Avoid blurry images

2. **Be Patient**
   - Each scan takes 3-7 seconds
   - Wait 2-3 seconds between scans
   - Don't rapid-fire 15+ scans

3. **Understand Limits**
   - Free tier: 15 scans/minute
   - App now prevents exceeding this
   - Clear messages when limit reached

4. **Track Your Impact**
   - Check Collection tab regularly
   - Monitor Impact dashboard
   - Build your produce knowledge

---

## 🎯 Your First Scan

1. Start the app
2. Tap "Scanner" tab (bottom)
3. Tap "Open Camera"
4. Point at an apple, tomato, or banana
5. Tap the white circle to capture
6. Wait for analysis
7. Review results!

**Congratulations!** You're now making more sustainable shopping choices! 🌱

---

**Questions?** Check the full README.md or INSTALLATION.md

**Issues?** Make sure:
- ✅ `.env` has your actual API key
- ✅ Phone has internet connection
- ✅ Expo Go app is up to date
- ✅ Camera permission granted

---

**Version**: 1.1.0 | **Expo SDK**: 54.0+ | **Date**: Feb 2026
