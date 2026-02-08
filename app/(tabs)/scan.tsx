import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { CameraView as ExpoCameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { scanImage, scanImageLive, lookupBarcode } from '@/lib/api';
import type { DetectedItem } from '@/lib/types';

export default function ScanScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const [permission, requestPermission] = useCameraPermissions();
  const [scanMode, setScanMode] = useState<'freshness' | 'barcode'>('freshness');
  const [detections, setDetections] = useState<DetectedItem[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [liveError, setLiveError] = useState(false);
  const cameraRef = useRef<any>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const initTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);
  const isAnalyzingRef = useRef(false);
  const liveErrorCountRef = useRef(0);

  // Auto-capture loop for freshness mode
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      stopLiveScanning();
    };
  }, []);

  useEffect(() => {
    if (scanMode === 'freshness' && permission?.granted && !isPaused) {
      startLiveScanning();
    } else {
      stopLiveScanning();
    }
    return () => stopLiveScanning();
  }, [scanMode, permission?.granted, isPaused]);

  function startLiveScanning() {
    stopLiveScanning();
    liveErrorCountRef.current = 0;
    setLiveError(false);
    // Initial scan after a short delay for camera to initialize
    initTimeoutRef.current = setTimeout(() => {
      if (isMountedRef.current) captureAndAnalyze();
    }, 2000);

    intervalRef.current = setInterval(() => {
      if (isMountedRef.current && !isAnalyzingRef.current) {
        captureAndAnalyze();
      }
    }, 4000);
  }

  function stopLiveScanning() {
    if (initTimeoutRef.current) {
      clearTimeout(initTimeoutRef.current);
      initTimeoutRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }

  async function captureAndAnalyze() {
    if (!cameraRef.current || isAnalyzingRef.current) return;
    isAnalyzingRef.current = true;
    setIsAnalyzing(true);

    try {
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.4,
        skipProcessing: Platform.OS === 'ios',
      });

      if (photo?.base64 && isMountedRef.current) {
        const result = await scanImageLive(photo.base64);
        if (isMountedRef.current) {
          setDetections(result.detections || []);
          liveErrorCountRef.current = 0;
          setLiveError(false);
        }
      }
    } catch (error: any) {
      const msg = error?.message || String(error);
      console.warn(`[Live scan] Error (${liveErrorCountRef.current + 1}): ${msg}`);
      liveErrorCountRef.current += 1;
      // After 2 consecutive failures, show error state (was 3, lowered for faster feedback)
      if (liveErrorCountRef.current >= 2 && isMountedRef.current) {
        setLiveError(true);
      }
    } finally {
      isAnalyzingRef.current = false;
      if (isMountedRef.current) setIsAnalyzing(false);
    }
  }

  async function handleManualCapture() {
    if (!cameraRef.current || isCapturing) return;
    setIsCapturing(true);
    setIsPaused(true);

    try {
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.7,
      });

      if (photo?.base64) {
        const result = await scanImage(photo.base64);
        router.push({
          pathname: '/scan-result',
          params: { data: JSON.stringify(result) },
        });
      }
    } catch (error: any) {
      const msg = error?.message || String(error);
      console.error('Manual scan error:', msg);
      Alert.alert('Scan Failed', `Could not analyze the image.\n\n${msg}`);
    } finally {
      setIsCapturing(false);
      setIsPaused(false);
    }
  }

  async function handleDetailScan(item: DetectedItem) {
    // Pause live scanning, take a high-quality photo, do full analysis
    setIsPaused(true);
    setIsCapturing(true);

    try {
      const photo = await cameraRef.current?.takePictureAsync({
        base64: true,
        quality: 0.7,
      });

      if (photo?.base64) {
        const result = await scanImage(photo.base64);
        router.push({
          pathname: '/scan-result',
          params: { data: JSON.stringify(result) },
        });
      }
    } catch {
      Alert.alert('Scan Failed', 'Could not get full analysis. Try again.');
    } finally {
      setIsPaused(false);
      setIsCapturing(false);
    }
  }

  async function pickImage() {
    setIsPaused(true);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets[0]?.base64) {
      setIsCapturing(true);
      try {
        const scanResult = await scanImage(result.assets[0].base64);
        router.push({
          pathname: '/scan-result',
          params: { data: JSON.stringify(scanResult) },
        });
      } catch {
        Alert.alert('Scan Failed', 'Could not analyze the image.');
      } finally {
        setIsCapturing(false);
      }
    }
    setIsPaused(false);
  }

  async function handleBarcodeScan(data: { data: string }) {
    if (isAnalyzing) return;
    setIsAnalyzing(true);

    try {
      const product = await lookupBarcode(data.data);
      router.push({
        pathname: '/scan-result',
        params: { barcode: JSON.stringify(product) },
      });
    } catch {
      Alert.alert('Not Found', 'Product not found in database.');
    } finally {
      setIsAnalyzing(false);
    }
  }

  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.background }]}>
        <FontAwesome name="camera" size={64} color={theme.primary} />
        <Text style={[styles.permissionTitle, { color: theme.text }]}>
          Camera Access Needed
        </Text>
        <Text style={[styles.permissionText, { color: theme.textSecondary }]}>
          LunchBox needs camera access to scan produce freshness and barcodes
        </Text>
        <TouchableOpacity
          style={[styles.permissionButton, { backgroundColor: theme.primary }]}
          onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Access</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ExpoCameraView
        ref={cameraRef}
        style={styles.camera}
        facing="back"
        onBarcodeScanned={scanMode === 'barcode' ? handleBarcodeScan : undefined}
        barcodeScannerSettings={
          scanMode === 'barcode'
            ? { barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'] }
            : undefined
        }>
        {/* Header overlay */}
        <View style={styles.headerOverlay}>
          <Text style={styles.headerTitle}>
            {scanMode === 'freshness' ? 'Produce Scanner' : 'Barcode Scanner'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {scanMode === 'freshness'
              ? 'Point at produce and tap the shutter button'
              : 'Point at a barcode to scan'}
          </Text>
          {scanMode === 'freshness' && isAnalyzing && !isCapturing && (
            <View style={styles.analyzingBadge}>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text style={styles.analyzingText}>Detecting...</Text>
            </View>
          )}
          {scanMode === 'freshness' && liveError && !isAnalyzing && (
            <View style={[styles.analyzingBadge, { backgroundColor: 'rgba(239, 68, 68, 0.8)' }]}>
              <FontAwesome name="exclamation-triangle" size={12} color="#FFFFFF" />
              <Text style={styles.analyzingText}>Server unreachable — use capture button</Text>
            </View>
          )}
        </View>

        {/* Full-screen loading overlay when doing full scan */}
        {isCapturing && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text style={styles.loadingText}>Analyzing freshness...</Text>
          </View>
        )}

        {/* Bounding box overlays for freshness mode */}
        {scanMode === 'freshness' && !isCapturing && detections.map((det, i) => (
          <BoundingBox
            key={`${det.item_name}-${i}`}
            detection={det}
            onPress={() => handleDetailScan(det)}
          />
        ))}

        {/* Empty state hint */}
        {scanMode === 'freshness' && detections.length === 0 && !isAnalyzing && !isCapturing && !liveError && (
          <View style={styles.hintContainer}>
            <View style={styles.hintBox}>
              <FontAwesome name="search" size={24} color="#D8F3DC" />
              <Text style={styles.hintText}>Point camera at fruits or vegetables</Text>
            </View>
          </View>
        )}

        {/* Bottom controls */}
        <View style={styles.controls}>
          {/* Mode toggle */}
          <View style={styles.modeToggle}>
            <TouchableOpacity
              style={[styles.modeButton, scanMode === 'freshness' && styles.modeButtonActive]}
              onPress={() => { setScanMode('freshness'); setDetections([]); }}>
              <FontAwesome name="leaf" size={16} color={scanMode === 'freshness' ? '#FFF' : '#9CA3AF'} />
              <Text style={[styles.modeText, scanMode === 'freshness' && styles.modeTextActive]}>
                Freshness
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeButton, scanMode === 'barcode' && styles.modeButtonActive]}
              onPress={() => { setScanMode('barcode'); setDetections([]); }}>
              <FontAwesome name="barcode" size={16} color={scanMode === 'barcode' ? '#FFF' : '#9CA3AF'} />
              <Text style={[styles.modeText, scanMode === 'barcode' && styles.modeTextActive]}>
                Barcode
              </Text>
            </TouchableOpacity>
          </View>

          {/* Action buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.secondaryButton} onPress={pickImage}>
              <FontAwesome name="image" size={24} color="#FFFFFF" />
            </TouchableOpacity>

            {/* Main capture button */}
            {scanMode === 'freshness' && (
              <TouchableOpacity
                style={[styles.captureButton, isCapturing && styles.captureButtonDisabled]}
                onPress={handleManualCapture}
                disabled={isCapturing}>
                <View style={styles.captureInner} />
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => setIsPaused(p => !p)}>
              <FontAwesome
                name={isPaused ? 'play' : 'pause'}
                size={24}
                color="#FFFFFF"
              />
            </TouchableOpacity>
          </View>
        </View>
      </ExpoCameraView>
    </View>
  );
}

/** Bounding box overlay for a detected item */
function BoundingBox({
  detection,
  onPress,
}: {
  detection: DetectedItem;
  onPress: () => void;
}) {
  const [box_y_min, box_x_min, box_y_max, box_x_max] = detection.box;

  // Convert 0-1000 normalized coords to screen percentages
  const top = `${box_y_min / 10}%`;
  const left = `${box_x_min / 10}%`;
  const width = `${(box_x_max - box_x_min) / 10}%`;
  const height = `${(box_y_max - box_y_min) / 10}%`;

  const color = getFreshnessColor(detection.freshness_score);

  return (
    <TouchableOpacity
      style={[
        styles.boundingBox,
        {
          top: top as any,
          left: left as any,
          width: width as any,
          height: height as any,
          borderColor: color,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}>
      {/* Label above the box */}
      <View style={[styles.boxLabel, { backgroundColor: color }]}>
        <Text style={styles.boxLabelText}>
          {detection.item_name}
        </Text>
        <View style={styles.boxScoreBadge}>
          <Text style={styles.boxScoreText}>{detection.freshness_score}/10</Text>
        </View>
      </View>
      {/* Bottom info */}
      <View style={styles.boxBottomRow}>
        <View style={[styles.boxBottomBadge, { backgroundColor: color }]}>
          <Text style={styles.boxBottomText}>
            {detection.freshness_description}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function getFreshnessColor(score: number): string {
  if (score >= 8) return '#22C55E';
  if (score >= 6) return '#84CC16';
  if (score >= 4) return '#F59E0B';
  if (score >= 2) return '#EF4444';
  return '#DC2626';
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  centered: { justifyContent: 'center', alignItems: 'center', padding: 32 },
  camera: { flex: 1 },
  headerOverlay: {
    paddingTop: 60,
    paddingHorizontal: 20,
    alignItems: 'center',
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#D8F3DC',
    marginTop: 4,
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  analyzingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    backgroundColor: 'rgba(45, 106, 79, 0.8)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  analyzingText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  hintContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hintBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(216, 243, 220, 0.3)',
  },
  hintText: {
    color: '#D8F3DC',
    fontSize: 14,
    fontWeight: '600',
  },
  // Bounding box styles
  boundingBox: {
    position: 'absolute',
    borderWidth: 2.5,
    borderRadius: 8,
    zIndex: 5,
  },
  boxLabel: {
    position: 'absolute',
    top: -30,
    left: -2,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 6,
  },
  boxLabelText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'capitalize',
  },
  boxScoreBadge: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
  },
  boxScoreText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  boxBottomRow: {
    position: 'absolute',
    bottom: -24,
    left: -2,
  },
  boxBottomBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  boxBottomText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  // Loading overlay for full scan
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 12,
    fontWeight: '600',
  },
  // Controls
  controls: {
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    paddingHorizontal: 20,
    zIndex: 10,
  },
  modeToggle: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 8,
  },
  modeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    gap: 8,
  },
  modeButtonActive: { backgroundColor: '#2D6A4F' },
  modeText: { color: '#9CA3AF', fontWeight: '600', fontSize: 14 },
  modeTextActive: { color: '#FFFFFF' },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
  },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButtonDisabled: { opacity: 0.5 },
  captureInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
  },
  secondaryButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionTitle: { fontSize: 24, fontWeight: '700', marginTop: 20 },
  permissionText: { fontSize: 16, textAlign: 'center', marginTop: 8, lineHeight: 24 },
  permissionButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 30,
    marginTop: 24,
  },
  permissionButtonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
