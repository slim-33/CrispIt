# FreshPick Troubleshooting Guide

## Common Errors and Solutions

### Error: ENOENT: no such file or directory, scandir 'assets/images'

**Full Error**:
```
Error: ENOENT: no such file or directory, scandir '.../freshpick-updated/assets/images'
    at Object.readdir (node:internal/fs/promises:958:18)
```

**Cause**: Metro bundler expects the `assets/images` directory to exist.

**Solution** ✅ (Already fixed in v1.1.0):
The updated package includes:
- `assets/images/` directory with `.gitkeep`
- `metro.config.js` for proper asset handling
- `.expo-shared/` directory structure

**If you still see this error**:
```bash
# Create the missing directory
mkdir -p assets/images
touch assets/images/.gitkeep

# Clear cache and restart
npx expo start -c
```

---

### Error: Metro bundler won't start

**Symptoms**:
- Stuck on "Starting Metro Bundler"
- Port already in use
- Cache issues

**Solutions**:

**1. Clear cache**:
```bash
npx expo start -c
```

**2. Kill existing Metro process**:
```bash
# On Mac/Linux
lsof -ti:8081 | xargs kill -9

# On Windows
netstat -ano | findstr :8081
taskkill /PID <PID> /F
```

**3. Clean install**:
```bash
rm -rf node_modules package-lock.json
npm install
npx expo start -c
```

---

### Error: Package compatibility warnings

**Symptoms**:
```
The following packages should be updated for best compatibility...
```

**Solution** ✅ (Already fixed in v1.1.0):
All packages are now Expo 54 compatible.

**If you still see warnings**:
```bash
# Ensure you're using the updated package.json
npm install

# If warnings persist, use legacy peer deps
npm install --legacy-peer-deps
```

---

### Error: "API_KEY_MISSING"

**Symptoms**:
- "Please add your Gemini API key to the .env file"
- App can't analyze images

**Solution**:
1. Open `.env` file in the project root
2. Replace placeholder with your actual key:
   ```
   GEMINI_API_KEY=AIzaSy...your-actual-key-here
   ```
3. Restart the app:
   ```bash
   npx expo start -c
   ```

**How to get API key**:
1. Visit: https://aistudio.google.com/app/apikey
2. Sign in with Google
3. Click "Create API Key"
4. Copy the key (starts with `AIza`)

---

### Error: "Rate Limit Reached"

**Symptoms**:
```
Rate Limit Reached
Please wait X seconds before scanning again.
```

**This is NORMAL behavior**, not an error!

**Why this happens**:
- Free tier: 15 requests per minute
- App enforces 2-second minimum between scans
- Protects your API quota

**Solution**:
- Wait the suggested time (usually 2-60 seconds)
- Space out your scans (2-3 seconds between)
- Consider upgrading API plan for heavy usage

---

### Error: Camera not working

**iOS Symptoms**:
- Black screen when opening camera
- Permission denied

**iOS Solution**:
1. Go to Settings > Expo Go
2. Enable Camera permission
3. Restart the app

**Android Symptoms**:
- Camera won't open
- Permission errors

**Android Solution**:
1. Settings > Apps > Expo Go > Permissions
2. Enable Camera
3. Enable Files and media (if needed)
4. Restart the app

---

### Error: Network errors during scanning

**Symptoms**:
- "Network error. Check your connection."
- Timeout errors
- Failed to analyze

**Solutions**:

**1. Check internet connection**:
- Ensure device has WiFi or cellular data
- Try opening a website in browser

**2. Check API key**:
- Verify `.env` has correct key
- No extra spaces or quotes
- Key starts with `AIza`

**3. Check Google API status**:
- Visit: https://status.cloud.google.com/
- Check Vertex AI status

**4. Firewall/VPN**:
- Disable VPN temporarily
- Check firewall settings
- Try different network

---

### Error: App crashes on startup

**Symptoms**:
- Red screen with error
- App closes immediately
- "Invariant Violation" errors

**Solutions**:

**1. Clear cache**:
```bash
npx expo start -c
```

**2. Reinstall dependencies**:
```bash
rm -rf node_modules package-lock.json
npm install
```

**3. Reset Expo Go**:
- Uninstall Expo Go app
- Reinstall from App Store/Play Store
- Reconnect

**4. Check Node version**:
```bash
node --version  # Should be 18+
```

---

### Error: Images not displaying

**Symptoms**:
- Scanned images show as blank
- Collection images missing
- Broken image icons

**Solutions**:

**1. Check permissions**:
- Grant photo library access
- Grant camera access

**2. Storage space**:
- Ensure device has available storage
- AsyncStorage may be full

**3. Clear app data**:
```javascript
// In the app, you can clear data
// This will reset all scans
```

---

### Error: Babel/Metro configuration issues

**Symptoms**:
- "Unable to resolve module @env"
- "react-native-dotenv not found"

**Solutions**:

**1. Verify babel.config.js**:
Should have:
```javascript
plugins: [
  [
    'module:react-native-dotenv',
    {
      moduleName: '@env',
      path: '.env',
    },
  ],
],
```

**2. Clear Metro cache**:
```bash
npx expo start -c
```

**3. Reinstall dependencies**:
```bash
npm install
```

---

### Error: iOS build issues

**Symptoms**:
- Can't build for iOS
- Xcode errors
- CocoaPods issues

**Note**: FreshPick runs via Expo Go - no build needed!

**If you want to build**:
```bash
npx expo prebuild
cd ios
pod install
cd ..
npx expo run:ios
```

---

### Error: Android build issues

**Symptoms**:
- Gradle errors
- Build failures
- SDK issues

**Note**: FreshPick runs via Expo Go - no build needed!

**If you want to build**:
```bash
npx expo prebuild
npx expo run:android
```

---

## Performance Issues

### Slow scanning/analysis

**Causes**:
- Slow internet connection
- Large image files
- API latency

**Solutions**:
1. Use WiFi instead of cellular
2. Ensure good network speed
3. Images are auto-compressed to 0.8 quality
4. Wait for each scan to complete

**Expected times**:
- Photo capture: < 1 second
- AI analysis: 2-5 seconds (network dependent)
- Total: 3-7 seconds per scan

---

### App feels sluggish

**Solutions**:

**1. Restart app**:
```bash
# Kill and restart
npx expo start -c
```

**2. Close other apps**:
- Free up device memory
- Close background apps

**3. Check device storage**:
- Ensure 1GB+ free space
- Clear old AsyncStorage data if needed

---

## Development Issues

### Hot reload not working

**Solutions**:
1. Shake device and select "Reload"
2. Press `r` in terminal to reload
3. Restart Metro bundler

### Changes not showing up

**Solutions**:
```bash
# Clear cache and restart
npx expo start -c
```

### TypeScript errors (if using TS)

**Note**: FreshPick uses JavaScript, not TypeScript

**If adding TypeScript**:
```bash
npm install --save-dev typescript @types/react @types/react-native
```

---

## Platform-Specific Issues

### iOS Specific

**Issue**: Haptics not working
- **Solution**: Haptics work on iPhone 7+, may not work on older devices or simulator

**Issue**: Face ID prompt
- **Solution**: This is normal for apps using camera, accept to continue

### Android Specific

**Issue**: Back button closes app
- **Solution**: This is default React Navigation behavior

**Issue**: Permissions dialog keeps showing
- **Solution**: Check "Don't ask again" and grant permanently

### Web Specific

**Issue**: Camera doesn't work on web
- **Solution**: Web camera support is limited, use mobile device

---

## Getting More Help

### Check Documentation
1. **QUICKSTART.md** - Quick setup
2. **README.md** - Full documentation
3. **INSTALLATION.md** - Detailed installation
4. **CHANGES.md** - Technical details

### Check Logs
```bash
# Expo logs
npx expo start

# Device logs (iOS)
npx react-native log-ios

# Device logs (Android)  
npx react-native log-android
```

### Reset Everything
```bash
# Nuclear option - fresh start
rm -rf node_modules package-lock.json .expo
npm install
npx expo start -c
```

---

## Prevention Tips

### To avoid common issues:
1. ✅ Always use `npx expo start -c` after updates
2. ✅ Keep Expo Go app updated
3. ✅ Maintain good internet connection
4. ✅ Space out scans (2-3 seconds)
5. ✅ Grant all permissions when prompted
6. ✅ Keep device storage >1GB free
7. ✅ Use official Expo Go app, not custom builds

---

## Still Having Issues?

1. Check error message carefully
2. Search this document for the error
3. Try the nuclear reset option
4. Check Expo documentation
5. Verify all files are present from the zip

**Common file checklist**:
- [ ] `.env` exists with API key
- [ ] `package.json` has updated versions
- [ ] `assets/` directory exists
- [ ] `assets/images/` directory exists
- [ ] `metro.config.js` exists
- [ ] `node_modules/` installed

---

**Last Updated**: February 7, 2026  
**Version**: 1.1.0
