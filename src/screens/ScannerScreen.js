import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  Alert,
  Platform,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { analyzeFreshness } from '../services/aiService';
import { analyzeBarcodeItem } from '../services/barcodeService';
import { saveToPokedex, saveToFridge } from '../services/storageService';
import { Button } from '../components/Button';
import { FreshnessIndicator } from '../components/FreshnessIndicator';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS, SHADOWS } from '../constants/theme';

export default function ScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedImage, setCapturedImage] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [scanMode, setScanMode] = useState('produce'); // 'produce' or 'barcode'
  const cameraRef = useRef(null);

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <View style={styles.permissionIcon}>
            <Ionicons name="camera-outline" size={64} color={COLORS.primary} />
          </View>
          <Text style={styles.permissionTitle}>Camera Access Required</Text>
          <Text style={styles.permissionText}>
            FreshPick needs camera access to scan and analyze produce freshness
          </Text>
          <Button title="Enable Camera" onPress={requestPermission} />
        </View>
      </SafeAreaView>
    );
  }

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        const photo = await cameraRef.current.takePictureAsync({
          base64: true,
          quality: 0.8,
        });
        setCapturedImage(photo);
        setShowCamera(false);
        setFlashEnabled(false);
        analyzeImage(photo.base64, photo.uri);
      } catch (error) {
        Alert.alert('Error', 'Failed to take picture');
      }
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled) {
        setCapturedImage(result.assets[0]);
        analyzeImage(result.assets[0].base64, result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const analyzeImage = async (base64Image, imageUri) => {
    setAnalyzing(true);
    setResult(null);

    try {
      let response;
      
      // Use different analysis based on scan mode
      if (scanMode === 'barcode') {
        response = await analyzeBarcodeItem(base64Image);
        
        // If barcode scan detects fresh produce, redirect to produce scanning
        if (!response.success && response.notPackaged) {
          Alert.alert(
            'Not a Packaged Item',
            'This appears to be fresh produce. Switching to produce scanning mode...',
            [{ text: 'OK', style: 'default' }]
          );
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          
          // Switch mode and re-analyze as produce
          setScanMode('produce');
          response = await analyzeFreshness(base64Image);
        }
      } else {
        // First try produce scanning
        response = await analyzeFreshness(base64Image);
        
        // If produce scan detects a barcode/packaged item, redirect to barcode scanning
        if (!response.success && response.notProduce) {
          Alert.alert(
            'Packaged Item Detected',
            'This appears to be a packaged item with a barcode. Switching to barcode scanning mode...',
            [{ text: 'OK', style: 'default' }]
          );
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          
          // Switch mode and re-analyze as barcode
          setScanMode('barcode');
          response = await analyzeBarcodeItem(base64Image);
          
          // Handle if it's still not packaged after redirect
          if (!response.success && response.notPackaged) {
            Alert.alert(
              'Unable to Analyze',
              'Could not identify this item as fresh produce or packaged goods. Please try again with better lighting or a clearer image.',
              [{ text: 'OK', style: 'default' }]
            );
            setCapturedImage(null);
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            return;
          }
        }
      }
      
      if (response.success) {
        const enrichedResult = {
          ...response.data,
          imageUri,
        };
        
        setResult(enrichedResult);
        
        // Save to Pokedex
        const saveResult = await saveToPokedex(enrichedResult);
        
        // Show notification and ask about adding to fridge
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        const itemType = enrichedResult.isPackaged ? 'item' : 'produce';
        
        if (saveResult.isNew) {
          Alert.alert(
            enrichedResult.isPackaged ? '📦 New Item!' : '✨ New Produce!',
            `${enrichedResult.name} has been added to your collection!\n\nWould you like to add it to your fridge for tracking?`,
            [
              { text: 'Not Now', style: 'cancel' },
              {
                text: 'Add to Fridge',
                style: 'default',
                onPress: async () => {
                  await saveToFridge(enrichedResult);
                  Alert.alert('Success', `${enrichedResult.name} added to your fridge!`);
                },
              },
            ]
          );
        } else {
          Alert.alert(
            'Scanned!',
            `${enrichedResult.name} analyzed.\n\nWould you like to add it to your fridge for tracking?`,
            [
              { text: 'Not Now', style: 'cancel' },
              {
                text: 'Add to Fridge',
                style: 'default',
                onPress: async () => {
                  await saveToFridge(enrichedResult);
                  Alert.alert('Success', `${enrichedResult.name} added to your fridge!`);
                },
              },
            ]
          );
        }
      }
    } catch (error) {
      let errorMessage = 'Failed to analyze. ';
      let errorTitle = 'Analysis Error';
      
      if (error.message === 'API_KEY_MISSING') {
        errorMessage = '⚠️ Please add your OpenRouter API key to the .env file';
      } else if (error.message === 'RATE_LIMIT') {
        errorTitle = 'Rate Limit Reached';
        const waitTime = error.waitTime || 'a few';
        errorMessage = `Please wait ${waitTime} seconds before scanning again.\n\nTip: The app limits 15 scans per minute.`;
      } else if (error.message === 'RATE_LIMIT_API') {
        errorTitle = 'API Rate Limit';
        const waitTime = error.waitTime || 60;
        errorMessage = `OpenRouter rate limit reached. Please wait ${waitTime} seconds.`;
      } else if (error.message === 'INVALID_API_KEY') {
        errorMessage = 'Invalid API key. Please check your .env file.';
      } else if (error.message === 'TIMEOUT') {
        errorMessage = 'Request timed out. Please try again.';
      } else if (error.message === 'NETWORK_ERROR') {
        errorMessage = 'Network error. Check your connection.';
      }
      
      Alert.alert(errorTitle, errorMessage);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setAnalyzing(false);
    }
  };

  const reset = () => {
    setCapturedImage(null);
    setResult(null);
  };

  const toggleFlash = () => {
    setFlashEnabled(!flashEnabled);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  if (showCamera) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <CameraView
          style={styles.camera}
          ref={cameraRef}
          facing="back"
          enableTorch={flashEnabled}
        >
          <SafeAreaView style={styles.cameraContainer}>
            <View style={styles.cameraHeader}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => {
                  setShowCamera(false);
                  setFlashEnabled(false);
                }}
              >
                <Ionicons name="close" size={28} color={COLORS.white} />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.flashButton, flashEnabled && styles.flashButtonActive]}
                onPress={toggleFlash}
              >
                <Ionicons 
                  name={flashEnabled ? "flash" : "flash-off"} 
                  size={24} 
                  color={flashEnabled ? COLORS.textPrimary : COLORS.white} 
                />
              </TouchableOpacity>
            </View>

            <View style={styles.cameraControls}>
              <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
                <View style={styles.captureButtonInner} />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </CameraView>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Smart Scan</Text>
        <Text style={styles.headerSubtitle}>Scan produce or barcoded items for instant insights</Text>
      </View>
      
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {capturedImage && (
          <View style={styles.imageContainer}>
            <Image source={{ uri: capturedImage.uri }} style={styles.image} resizeMode="cover" />
          </View>
        )}

        {analyzing && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Analyzing freshness...</Text>
            <Text style={styles.loadingSubtext}>This may take a few seconds</Text>
          </View>
        )}

        {result && !analyzing && (
          <View style={styles.resultContainer}>
            <View style={styles.resultHeader}>
              <Text style={styles.produceName}>{result.name}</Text>
              {result.isPackaged && (
                <View style={styles.packageBadge}>
                  <Ionicons name="cube" size={16} color={COLORS.white} />
                  <Text style={styles.packageBadgeText}>Packaged</Text>
                </View>
              )}
            </View>
            
            {/* Only show freshness for non-packaged items */}
            {!result.isPackaged && (
              <>
                <FreshnessIndicator 
                  score={result.freshnessScore} 
                  level={result.freshnessLevel}
                />

                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="search" size={20} color={COLORS.primary} />
                    <Text style={styles.sectionTitle}>Freshness Indicators</Text>
                  </View>
                  {result.indicators?.map((indicator, index) => (
                    <View key={index} style={styles.indicatorItem}>
                      <View style={styles.indicatorDot} />
                      <Text style={styles.indicatorText}>{indicator}</Text>
                    </View>
                  ))}
                </View>

                {result.freshnessVerificationTips && result.freshnessVerificationTips.length > 0 && (
                  <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <Ionicons name="checkmark-circle-outline" size={20} color={COLORS.primary} />
                      <Text style={styles.sectionTitle}>How to Verify Freshness</Text>
                    </View>
                    {result.freshnessVerificationTips.map((tip, index) => (
                      <View key={index} style={styles.indicatorItem}>
                        <View style={styles.indicatorDot} />
                        <Text style={styles.indicatorText}>{tip}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </>
            )}

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="cube-outline" size={20} color={COLORS.primary} />
                <Text style={styles.sectionTitle}>Storage Tip</Text>
              </View>
              <Text style={styles.sectionContent}>{result.storageTip}</Text>
            </View>

            {/* Nutrition info for packaged items */}
            {result.isPackaged && result.nutritionInfo && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="nutrition-outline" size={20} color={COLORS.primary} />
                  <Text style={styles.sectionTitle}>Nutrition Information</Text>
                </View>
                <Text style={styles.sectionContent}>{result.nutritionInfo}</Text>
              </View>
            )}

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="leaf" size={20} color={COLORS.primary} />
                <Text style={styles.sectionTitle}>Carbon Footprint</Text>
              </View>
              <View style={styles.carbonInfo}>
                <Text style={styles.carbonValue}>
                  {result.carbonFootprint ? result.carbonFootprint.toFixed(2) : '0.00'} kg CO₂e
                </Text>
                {result.sustainableAlternative && (
                  <View style={styles.alternativeContainer}>
                    <Text style={styles.alternativeLabel}>💡 Sustainable Alternative:</Text>
                    <Text style={styles.alternativeText}>{result.sustainableAlternative}</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Only show Best Use for non-packaged items */}
            {!result.isPackaged && result.bestUse && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="restaurant-outline" size={20} color={COLORS.primary} />
                  <Text style={styles.sectionTitle}>Best Use</Text>
                </View>
                <Text style={styles.sectionContent}>{result.bestUse}</Text>
              </View>
            )}
          </View>
        )}

        {!capturedImage && !analyzing && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="scan-outline" size={80} color={COLORS.primary} />
            </View>
            <Text style={styles.emptyTitle}>Ready to Scan</Text>
            <Text style={styles.emptyText}>
              Point your camera at produce or barcodes to get instant freshness assessment and sustainability insights
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        {capturedImage ? (
          <Button 
            title="Scan another item" 
            onPress={reset} 
            variant="primary" 
          />
        ) : (
          <View style={styles.buttonGroup}>
            <View style={styles.splitButtonContainer}>
              <Button
                title="Scan Produce"
                onPress={() => {
                  setScanMode('produce');
                  setShowCamera(true);
                }}
                variant="primary"
                style={styles.splitButton}
              />
              <Button
                title="Scan Barcode"
                onPress={() => {
                  setScanMode('barcode');
                  setShowCamera(true);
                }}
                variant="secondary"
                style={styles.splitButton}
              />
            </View>
            <Button
              title="Choose Photo"
              onPress={pickImage}
              variant="outline"
              style={styles.secondaryAction}
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: Platform.OS === 'android' ? SPACING.xl : SPACING.md,
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.background,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHTS.regular,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  permissionIcon: {
    width: 120,
    height: 120,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: `${COLORS.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  permissionTitle: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
    marginBottom: SPACING.sm,
    textAlign: 'center',
    color: COLORS.textPrimary,
  },
  permissionText: {
    fontSize: FONT_SIZES.md,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    color: COLORS.textSecondary,
    lineHeight: 22,
    paddingHorizontal: SPACING.lg,
  },
  imageContainer: {
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    marginBottom: SPACING.lg,
    ...SHADOWS.md,
  },
  image: {
    width: '100%',
    height: 280,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl * 2,
  },
  loadingText: {
    marginTop: SPACING.lg,
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.textPrimary,
  },
  loadingSubtext: {
    marginTop: SPACING.xs,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  resultContainer: {
    marginBottom: SPACING.lg,
  },
  resultHeader: {
    marginBottom: SPACING.lg,
  },
  produceName: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
  },
  packageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.sm,
    alignSelf: 'flex-start',
    gap: SPACING.xs,
  },
  packageBadgeText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.white,
  },
  section: {
    backgroundColor: COLORS.card,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.textPrimary,
    marginLeft: SPACING.sm,
  },
  sectionContent: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  indicatorItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  indicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
    marginTop: 7,
    marginRight: SPACING.sm,
  },
  indicatorText: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  carbonInfo: {
    marginTop: SPACING.xs,
  },
  carbonValue: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.primary,
    marginBottom: SPACING.sm,
  },
  alternativeContainer: {
    backgroundColor: `${COLORS.primary}10`,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  alternativeLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  alternativeText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xxl * 2,
  },
  emptyIcon: {
    width: 160,
    height: 160,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: `${COLORS.primary}10`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
    marginBottom: SPACING.sm,
    color: COLORS.textPrimary,
  },
  emptyText: {
    fontSize: FONT_SIZES.md,
    textAlign: 'center',
    color: COLORS.textSecondary,
    paddingHorizontal: SPACING.xl,
    lineHeight: 22,
  },
  footer: {
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    ...SHADOWS.md,
  },
  buttonGroup: {
    gap: SPACING.sm,
  },
  splitButtonContainer: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  splitButton: {
    flex: 1,
  },
  primaryAction: {
    marginBottom: SPACING.sm,
  },
  secondaryAction: {
    // Already handled by Button component
  },
  camera: {
    flex: 1,
  },
  cameraContainer: {
    flex: 1,
  },
  cameraHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: SPACING.lg,
    paddingTop: Platform.OS === 'ios' ? SPACING.xl : SPACING.lg,
  },
  closeButton: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  flashButton: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  flashButtonActive: {
    backgroundColor: COLORS.white,
  },
  cameraControls: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: SPACING.xxl + SPACING.lg,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.lg,
  },
  captureButtonInner: {
    width: 68,
    height: 68,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.primary,
  },
});
