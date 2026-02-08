# FreshPick Installation & Upgrade Guide

## 🆕 For New Users

### Prerequisites
- Node.js 18 or higher
- npm or yarn
- Expo Go app on your phone ([iOS](https://apps.apple.com/app/expo-go/id982107779) | [Android](https://play.google.com/store/apps/details?id=host.exp.exponent))
- Gemini API key (free from [Google AI Studio](https://aistudio.google.com/app/apikey))

### Installation Steps

1. **Extract the project**
   ```bash
   unzip freshpick-complete-v1.1.0.zip
   cd freshpick
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure API key**
   
   Edit `.env` file:
   ```
   GEMINI_API_KEY=your_actual_gemini_api_key_here
   ```

4. **Start the development server**
   ```bash
   npx expo start
   ```

5. **Run on your device**
   - Open Expo Go app on your phone
   - Scan the QR code shown in terminal
   - Grant camera permissions when prompted

### Troubleshooting New Installation

**Issue**: Package warnings during install
```bash
# Solution: These are peer dependency warnings and can be safely ignored
npm install --legacy-peer-deps
```

**Issue**: Metro bundler won't start
```bash
# Solution: Clear cache and restart
npx expo start -c
```

**Issue**: "Gemini API Key Missing"
```bash
# Solution: Make sure .env file has your actual API key
# Not: GEMINI_API_KEY=your_gemini_api_key_here
# But: GEMINI_API_KEY=AIzaSy... (your actual key)
```

---

## 🔄 For Existing Users (Upgrading from v1.0.0)

### Quick Upgrade

1. **Backup your current version** (optional but recommended)
   ```bash
   cp -r freshpick freshpick-backup
   ```

2. **Replace files**
   - Extract new version
   - Copy your `.env` file to the new directory
   - Delete old `node_modules` and `package-lock.json`

3. **Install updated dependencies**
   ```bash
   npm install
   ```

4. **Clear cache and restart**
   ```bash
   npx expo start -c
   ```

### What's Changed

#### Package Updates
All packages now match Expo 54 requirements:
- `react-native-screens`: 4.6.0 → 4.16.0
- `react-native-safe-area-context`: 5.1.0 → 5.6.0  
- `@expo/vector-icons`: 14.1.0 → 15.0.3
- `expo-haptics`: 14.0.1 → 15.0.8
- `expo-linear-gradient`: 14.0.2 → 15.0.8
- `@react-native-async-storage/async-storage`: 2.1.2 → 2.2.0

#### Rate Limiting Improvements
- Client-side rate limiting (15 requests/minute)
- 2-second minimum between scans
- Better error messages with wait times
- No breaking changes to existing functionality

### Data Migration

**Good news**: Your data is automatically preserved!
- All scans stored in AsyncStorage remain intact
- No database changes required
- App recognizes existing data on first launch

### Verification Checklist

After upgrading, verify:
- [ ] No package version warnings
- [ ] App starts without errors
- [ ] Camera still works
- [ ] Previous scans still visible in Collection tab
- [ ] Stats preserved in Impact tab
- [ ] Scanning new produce works
- [ ] Rate limiting messages appear when scanning quickly

---

## 🔧 Common Issues

### Expo Version Mismatch

**Symptom**: 
```
The following packages should be updated for best compatibility...
```

**Solution**:
This is what v1.1.0 fixes! Just run:
```bash
npm install
```

### Rate Limit Errors

**Symptom**:
```
Rate Limit Reached
Please wait X seconds before scanning again
```

**Solution**:
This is expected behavior. The app now:
- Prevents you from exceeding API limits
- Shows exactly how long to wait
- Protects your API quota

To avoid rate limits:
- Wait 2-3 seconds between scans
- Don't rapid-fire scan 15+ items
- Consider upgrading your Gemini API plan

### Metro Bundler Issues

**Symptom**:
```
Unable to resolve module...
```

**Solution**:
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
npx expo start -c
```

### Android/iOS Specific Issues

**Android Camera**:
```bash
# Grant permissions in Settings > Apps > Expo Go > Permissions
# Enable Camera
```

**iOS Camera**:
```bash
# Settings > Expo Go > Camera > Allow
```

---

## 📱 Platform-Specific Notes

### iOS
- Minimum iOS version: 13.4+
- Camera permission required on first use
- Haptic feedback works best on iPhone 7+

### Android  
- Minimum Android version: 5.0 (API 21)
- Some Android devices may need storage permission
- Haptics may vary by device

### Web (Experimental)
- Camera may not work on all browsers
- Best experience on Chrome/Edge
- Some features limited on web

---

## 🧪 Testing Your Installation

### Quick Test Checklist

1. **Start app** ✓
   ```bash
   npx expo start
   ```

2. **Scan QR code** ✓
   - Use Expo Go app
   - Grant permissions

3. **Test camera** ✓
   - Tap "Open Camera"
   - Toggle flash
   - Take photo

4. **Test scanner** ✓
   - Scan a fruit/vegetable
   - Wait for analysis
   - Check results

5. **Test collection** ✓
   - Go to Collection tab
   - See your scanned items

6. **Test rate limiting** ✓
   - Scan 15+ items quickly
   - Should see rate limit message

### Advanced Testing

**Test Rate Limiting**:
```javascript
// In developer console (if needed)
import { getRateLimitStatus } from './src/services/geminiService';
console.log(getRateLimitStatus());
```

**Test Error Handling**:
1. Disconnect from internet → Scan → Should see "Network error"
2. Set wrong API key → Scan → Should see "Invalid API key"
3. Scan 16 items rapidly → Should see "Rate limit" with wait time

---

## 🎯 Performance Optimization

### For Best Performance

1. **Image Quality**:
   - Use good lighting
   - Fill frame with produce
   - Avoid blurry images

2. **Network**:
   - Use WiFi when possible
   - 4G/LTE also works well
   - Avoid very slow connections

3. **Rate Limiting**:
   - Wait 2-3 seconds between scans
   - Don't exceed 15 scans/minute
   - Be patient with loading

### Expected Timings
- Photo capture: < 1 second
- AI analysis: 2-5 seconds (depending on network)
- Result display: < 1 second
- Total time per scan: 3-7 seconds

---

## 🔐 API Key Best Practices

### Getting Your Key
1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with Google account
3. Click "Create API Key"
4. Copy the key (starts with `AIza...`)

### Securing Your Key
- ✅ Keep `.env` file local (never commit to git)
- ✅ Don't share screenshots with your key visible
- ✅ Rotate key if accidentally exposed
- ✅ Monitor usage in Google Cloud Console

### Usage Limits
- **Free tier**: 15 requests/minute, 1500/day
- **Paid tier**: Higher limits available
- Monitor at: [Google Cloud Console](https://console.cloud.google.com/)

---

## 📊 Monitoring Usage

### Check Rate Limit Status

The app now tracks your usage:
- Requests used in last minute
- Requests remaining
- When you can scan again

### Google Cloud Console
Monitor your API usage:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to APIs & Services > Dashboard
4. View Gemini API usage

---

## 🆘 Getting Help

### Resources
- **README.md** - Full app documentation
- **CHANGES.md** - Detailed change log
- **GitHub Issues** - Report bugs or request features

### Common Questions

**Q: Do I need a backend server?**  
A: No! The app uses Google's Gemini API directly. No backend needed.

**Q: Where is my data stored?**  
A: Locally on your device using AsyncStorage. Nothing is sent to external servers except images to Gemini API.

**Q: Can I use this offline?**  
A: Camera and collection work offline. AI analysis requires internet.

**Q: Is my API key safe?**  
A: Yes, it's stored locally in `.env` and only sent to Google's API.

---

## 📈 Next Steps

After successful installation:
1. Start scanning produce
2. Build your collection
3. Track your environmental impact
4. Learn about freshness indicators
5. Make sustainable shopping choices

---

**Version**: 1.1.0  
**Last Updated**: February 7, 2026  
**Expo SDK**: 54.0+
