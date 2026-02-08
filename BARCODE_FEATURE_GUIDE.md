# Barcode & Packaged Items Feature Guide

## Overview

FreshPick now supports scanning both **fresh produce** and **packaged/barcoded items**, providing comprehensive tracking for your entire food inventory.

## Features

### 🌱 Fresh Produce Scanning
- Point camera at fruits, vegetables, dairy, meat, bread
- Get freshness score (0-100)
- Receive shelf life estimates
- Track expiration dates
- Get freshness verification tips
- Receive storage recommendations

### 📦 Packaged Items Scanning
- Scan barcodes or product packaging
- Get product identification
- View nutrition information (if visible)
- Track carbon footprint
- Get sustainable alternatives
- Receive storage tips for packaged goods
- **No freshness scoring** (packaged items are already preserved)

## How to Use

### Scanning Methods

#### 1. Scan Produce Button
```
Tap "Scan Produce" → Point camera at fresh item → Capture
```
- Use for: Fruits, vegetables, fresh dairy, meat, bread
- Returns: Freshness score, shelf life, quality indicators

#### 2. Scan Barcode Button
```
Tap "Scan Barcode" → Point camera at package/barcode → Capture
```
- Use for: Canned goods, boxed items, bottles, bags, packaged foods
- Returns: Product name, nutrition info, storage tips, carbon footprint

#### 3. Choose Photo
```
Tap "Choose Photo" → Select from gallery
```
- Works for both produce and packaged items
- AI automatically determines item type

## Data Tracked

### Fresh Produce Items
```javascript
{
  name: "Apple",
  freshnessScore: 85,
  freshnessLevel: "Good",
  shelfLifeDays: 7,
  carbonFootprint: 0.5,
  sustainableAlternative: "Choose local apples...",
  storageTip: "Store in refrigerator...",
  bestUse: "Eat fresh or use in pies...",
  indicators: ["Firm texture", "Bright color"]
}
```

### Packaged Items
```javascript
{
  name: "Canned Tomatoes",
  isPackaged: true,
  carbonFootprint: 1.2,
  nutritionInfo: "Check label for details",
  packageType: "can",
  sustainableAlternative: "Buy fresh tomatoes...",
  storageTip: "Store in cool, dry place...",
  // No freshness score or shelf life
}
```

## Fridge Organization

### Three Sections

1. **Expiring Soon** (Fresh items, <3 days)
   - Red/orange theme
   - Shows countdown timer
   - Recipe generation available

2. **Still Fresh** (Fresh items, ≥3 days)
   - Green theme
   - Shows days remaining
   - Freshness maintained

3. **Packaged Items** (All packaged goods)
   - Blue/primary theme
   - No expiration tracking
   - Storage tips provided

## Carbon Footprint Tracking

### Carbon Receipt
- View total carbon footprint from all fridge items
- Includes both fresh and packaged items
- See breakdown by item
- Get sustainable alternatives for each item

**Access**: Impact Tab → Tap "Carbon Awareness" card

## Statistics & Analytics

### What's Tracked
- Total scans (produce + packaged)
- Unique items collected
- Average freshness (produce only, excludes packaged)
- Total carbon footprint (all items)

### Average Freshness Calculation
```javascript
// Packaged items are excluded from average
averageFreshness = sum(freshnessScores) / count(fresh_items_only)
```

## Best Practices

### When to Use Scan Produce
✅ Fresh fruits and vegetables  
✅ Fresh dairy (milk, cheese, yogurt)  
✅ Fresh meat and seafood  
✅ Fresh bread and baked goods  
✅ Any perishable food item  

### When to Use Scan Barcode
✅ Canned goods  
✅ Boxed items (cereal, pasta, etc.)  
✅ Bottled products  
✅ Packaged snacks  
✅ Processed foods  
✅ Items with visible barcodes  

## Technical Details

### AI Analysis

#### Produce Analysis
- Model: Google Gemini 2.5 Flash Lite
- Analyzes: Color, texture, firmness, visual quality
- Output: Freshness score, shelf life, storage tips
- Accuracy: Strict scoring standards

#### Packaged Item Analysis
- Model: Google Gemini 2.5 Flash Lite
- Analyzes: Package labels, nutrition facts, barcodes
- Output: Product name, nutrition info, storage advice
- Focus: Sustainability and carbon impact

### Data Storage

```
AsyncStorage Keys:
- @freshpick_fridge     // All fridge items
- @freshpick_pokedex    // Unique items collection
- @freshpick_stats      // App statistics
- @freshpick_chat       // AI chat history
```

### File Structure
```
src/
├── services/
│   ├── aiService.js        // Fresh produce analysis
│   ├── barcodeService.js   // Packaged item analysis (NEW)
│   └── storageService.js   // Enhanced data handling
└── screens/
    ├── ScannerScreen.js    // Dual-mode scanning
    ├── FridgeScreen.js     // 3-section layout
    └── DashboardScreen.js  // Updated stats
```

## FAQ

### Q: Why don't packaged items have freshness scores?
**A**: Packaged items are already preserved through canning, bottling, or packaging. They have long shelf lives and don't spoil in the same way fresh produce does. Instead, we focus on nutrition info, storage tips, and sustainability.

### Q: Can I scan both types in one session?
**A**: Yes! Scan produce for fresh items, scan barcodes for packaged items, all in the same app session. They'll be organized appropriately in your fridge.

### Q: Do packaged items affect my average freshness?
**A**: No. Average freshness only includes fresh produce items to give you an accurate picture of your fresh food quality.

### Q: Are packaged items included in carbon tracking?
**A**: Yes! Both fresh and packaged items contribute to your total carbon footprint. This gives you a complete view of your environmental impact.

### Q: Can I add packaged items to the fridge?
**A**: Absolutely! Packaged items can be added to your fridge and will appear in the "Packaged Items" section. They'll also be included in the carbon receipt.

### Q: What if the barcode scan doesn't recognize my item?
**A**: The AI analyzes the package visually. Make sure the product name/label is clearly visible in the photo. If needed, try the "Choose Photo" option for better lighting/angle.

## Tips for Best Results

### For Fresh Produce
- 📸 Good lighting helps accuracy
- 🍎 Capture multiple angles if possible
- 🔍 Get close enough to see details
- ⚡ Use flash in low light

### For Packaged Items
- 📦 Include the product label in frame
- 🔤 Ensure text is readable
- 📊 Capture nutrition facts if available
- 🎯 Center the package in frame

## Support

If you encounter issues:
1. Check your internet connection
2. Ensure camera permissions are granted
3. Verify API key is configured in `.env`
4. Try different lighting conditions
5. Use "Choose Photo" as alternative to camera

---

**Feature Version**: 6.0.0  
**Last Updated**: February 8, 2026  
**Compatibility**: iOS & Android via Expo
