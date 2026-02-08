# 🥬 FreshPick - AI-Powered Produce Freshness Scanner

A complete React Native mobile app that helps grocery shoppers select the freshest produce using AI-powered camera technology, while tracking environmental impact and gamifying the shopping experience.

**Built with Expo SDK 54**

## ✨ Recent Updates (v1.1.0)

### 🔄 Package Updates
- ✅ Updated all packages to match Expo 54 requirements
- ✅ Fixed compatibility warnings for:
  - `react-native-screens` (4.6.0 → 4.16.0)
  - `react-native-safe-area-context` (5.1.0 → 5.6.0)
  - `@expo/vector-icons` (14.1.0 → 15.0.3)
  - `expo-haptics` (14.0.1 → 15.0.8)
  - `expo-linear-gradient` (14.0.2 → 15.0.8)
  - `@react-native-async-storage/async-storage` (2.1.2 → 2.2.0)

### ⚡ Performance Optimizations
- ✅ Implemented intelligent client-side rate limiting
  - Prevents hitting API limits before requests are made
  - 15 requests per minute tracking with 2-second minimum intervals
  - Clear error messages with wait times when limits are reached
- ✅ Reduced API response time
  - `maxOutputTokens`: 500 → 400 (faster AI responses)
  - `timeout`: 30s → 25s (quicker timeout detection)
- ✅ Better error handling with specific wait time feedback
- ✅ Added rate limit status tracking function

## ✨ Features

### 🔍 Core Features
- **AI-Powered Freshness Scanner**: Camera-based image recognition to analyze produce and provide instant freshness ratings
- **Freshness Verification Guidance**: Contextual tips for manually checking freshness (texture, smell, color, firmness)
- **Carbon Footprint Tracker**: Real-time calculation and display of environmental impact for scanned items
- **Smart Swap Recommendations**: Personalized suggestions for lower-carbon alternatives
- **Food Discovery Pokedex**: Gamified collection system that tracks all produce explored
- **Shopping Impact Dashboard**: Cumulative tracking of carbon savings and freshness-based improvements

### 📱 Technical Features
- Cross-platform (iOS & Android via Expo Go)
- Camera with flash toggle
- Gallery image picker
- Offline data storage
- Haptic feedback
- Beautiful UI with custom components
- **NEW**: Smart rate limiting with user feedback

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+**
- **Expo CLI 54** (check with `npx expo --version`)
- **Expo Go app** on your phone:
  - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)
  - [Android Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)
- **Gemini API key** (free from Google)

### Installation

1. **Install dependencies**
```bash
npm install
```

2. **Get your Gemini API key**
- Visit: https://aistudio.google.com/app/apikey
- Sign in with Google
- Click "Create API Key"
- Copy the key

3. **Add your API key**

Edit `.env` file:
```
GEMINI_API_KEY=your_actual_api_key_here
```

4. **Start the app**
```bash
npx expo start
```

5. **Run on your phone**
- Open Expo Go app
- Scan the QR code
- Grant camera permissions when prompted

## 📱 How to Use

### Scanner Tab 📸
1. Tap "Open Camera" or "Choose from Gallery"
2. Point camera at produce (toggle flash ⚡ if needed)
3. Take photo
4. Get instant AI analysis:
   - Freshness score (0-100)
   - Freshness indicators
   - Storage tips
   - Best use suggestions
   - Carbon footprint
   - Sustainable alternatives

### Collection Tab 📚
- View all scanned produce items
- See total scans and unique items discovered
- Review past freshness scores and carbon data
- Build your produce knowledge library

### Impact Tab 📊
- Track total scans
- Monitor carbon footprint awareness
- View average freshness scores
- Get sustainability tips
- See your progress over time

## 🛠️ Tech Stack

- **Expo SDK 54.0**
- **React 19.1.0**
- **React Native 0.81.5**
- **React Navigation 7** (Bottom Tabs)
- **Gemini 1.5 Flash API** (AI Vision)
- **AsyncStorage** (Local data persistence)
- **Expo Camera 17** (Camera with flash)
- **Expo Image Picker 17** (Gallery access)
- **Axios** (HTTP requests)

## 📂 Project Structure

```
freshpick/
├── App.js                          # Main app with navigation
├── src/
│   ├── screens/
│   │   ├── ScannerScreen.js        # Camera & AI analysis
│   │   ├── PokedexScreen.js        # Collection display
│   │   └── DashboardScreen.js      # Stats & impact
│   ├── components/
│   │   ├── Button.js               # Reusable button
│   │   ├── FreshnessIndicator.js   # Score display
│   │   └── CarbonFootprint.js      # Carbon data display
│   ├── services/
│   │   ├── geminiService.js        # AI API integration (with rate limiting)
│   │   └── storageService.js       # Data persistence
│   └── constants/
│       ├── theme.js                # Colors & styling
│       └── produceData.js          # Carbon footprint data
├── .env                            # API keys (add yours!)
├── package.json                    # Updated dependencies
├── app.json
└── babel.config.js
```

**Note**: This is a standard Expo/React Native app structure. There is no separate `/server` folder because:
- The backend is Google's Gemini API (serverless)
- All data is stored locally using AsyncStorage
- The app runs entirely from the root directory
- This architecture keeps the app simple and doesn't require backend infrastructure

## 🎨 Key Components

### FreshnessIndicator
Displays freshness score with visual progress bar and color coding:
- 🌟 Excellent (80-100)
- ✅ Good (60-79)
- ⚠️ Fair (40-59)
- ❌ Poor (0-39)

### CarbonFootprint
Shows environmental impact with:
- CO₂e value in kg
- Impact level (Low/Medium/High)
- Sustainable alternatives
- Carbon savings potential

### Pokedex System
Gamified collection that:
- Saves each scanned item
- Tracks unique produce count
- Stores images and data
- Shows discovery dates

## 🌍 Carbon Footprint Data

Includes data for common produce:
- Fruits: Apple, Banana, Orange, Strawberry
- Vegetables: Tomato, Lettuce, Carrot, Broccoli, Potato

Each item has:
- Carbon footprint (kg CO₂e per kg)
- Seasonal months
- Freshness check guidelines

## 📊 Rate Limiting & API Usage

### Free Tier Limits
- **15 requests per minute** (Gemini API free tier)
- App enforces **2-second minimum** between scans
- Client-side tracking prevents unnecessary API errors

### Rate Limit Features
- **Smart prevention**: Checks limits before making requests
- **Clear feedback**: Shows exact wait time when limit reached
- **Request tracking**: Monitors usage in 60-second windows
- **Graceful degradation**: Handles both client and API limits

### Tips for Optimal Usage
- Wait 2-3 seconds between scans
- If you hit limits, wait the suggested time
- Consider upgrading API plan for heavy usage
- Monitor your usage on Google Cloud Console

## 🔧 Troubleshooting

### "API key not found"
Make sure you edited `.env` with your actual Gemini API key

### Camera not working
- Grant camera permission when prompted
- Restart the app if needed

### npm install warnings
Safe to ignore - they're in dev tools, not your app

### App won't load
```bash
npx expo start -c
```

### Network errors
- Check internet connection
- Verify API key is correct
- Check API rate limits (15/min free tier)

### "Rate Limit Reached" errors
- This is normal if scanning quickly
- Wait the suggested time (usually 2-60 seconds)
- The app now prevents most rate limit errors automatically
- Consider spacing out scans or upgrading your API plan

## 🎯 Future Enhancements

From the executive summary:
- ✅ AI-Powered Freshness Scanner
- ✅ Carbon Footprint Tracker
- ✅ Food Discovery Pokedex
- ✅ Shopping Impact Dashboard
- ✅ Smart Rate Limiting
- 🔄 MongoDB integration (currently using AsyncStorage)
- 🔄 Expanded produce database
- 🔄 Educational content library
- 🔄 Achievement badges system
- 🔄 Offline AI model option

## 📄 License

MIT

## 🤝 Credits

- Built with Expo & React Native
- AI powered by Google Gemini
- Carbon data from sustainability research

---

**Start scanning and make every grocery trip more sustainable! 🌱**

## 🔄 Changelog

### v1.1.0 (2026-02-07)
- Updated all packages to Expo 54 compatible versions
- Implemented intelligent client-side rate limiting
- Reduced API timeout and token limits for faster responses
- Enhanced error messages with specific wait times
- Added rate limit status tracking function

### v1.0.0 (Initial Release)
- Core scanning functionality
- AI-powered freshness analysis
- Carbon footprint tracking
- Pokedex collection system
- Impact dashboard
