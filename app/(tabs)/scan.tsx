import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  Image,
} from 'react-native';
import { CameraView as ExpoCameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { scanImage, lookupBarcode } from '@/lib/api';
import { DEMO_BARCODE } from '@/lib/demo';

export default function ScanScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const [permission, requestPermission] = useCameraPermissions();
  const [scanMode, setScanMode] = useState<'freshness' | 'barcode'>('freshness');
  const [isCapturing, setIsCapturing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const cameraRef = useRef<any>(null);

  async function handleCapture() {
    if (!cameraRef.current || isCapturing) return;
    setIsCapturing(true);

    try {
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.5,
        mirror: false,
      });

      if (photo?.base64) {
        // Freeze the captured image on screen
        setCapturedUri(photo.uri);

        const result = await scanImage(photo.base64);
        router.push({
          pathname: '/scan-result',
          params: { data: JSON.stringify(result) },
        });
        // Clear after navigating
        setCapturedUri(null);
      }
    } catch (error: any) {
      const msg = error?.message || String(error);
      console.error('Scan error:', msg);
      Alert.alert('Scan Failed', `Could not analyze the image.\n\n${msg}`);
      setCapturedUri(null);
    } finally {
      setIsCapturing(false);
    }
  }

  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0]?.base64) {
      // Show the picked image on screen
      setCapturedUri(result.assets[0].uri);
      setIsCapturing(true);
      try {
        const scanResult = await scanImage(result.assets[0].base64);
        router.push({
          pathname: '/scan-result',
          params: { data: JSON.stringify(scanResult) },
        });
        setCapturedUri(null);
      } catch (error: any) {
        const msg = error?.message || String(error);
        Alert.alert('Scan Failed', `Could not analyze the image.\n\n${msg}`);
        setCapturedUri(null);
      } finally {
        setIsCapturing(false);
      }
    }
  }

  function handleRetake() {
    setCapturedUri(null);
    setIsCapturing(false);
  }

  function handleDemoBarcode() {
    router.push({
      pathname: '/scan-result',
      params: { barcode: JSON.stringify(DEMO_BARCODE) },
    });
  }

  async function handleBarcodeScan(data: { data: string; type?: string }) {
    if (isAnalyzing) return;
    setIsAnalyzing(true);

    console.log(`[Barcode] Detected: ${data.data} (type: ${data.type || 'unknown'})`);

    try {
      const product = await lookupBarcode(data.data);
      router.push({
        pathname: '/scan-result',
        params: { barcode: JSON.stringify(product) },
      });
    } catch {
      Alert.alert('Not Found', `Barcode "${data.data}" not found in database.`);
    } finally {
      // Small delay to prevent rapid re-scanning
      setTimeout(() => setIsAnalyzing(false), 2000);
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
          CrispIt needs camera access to scan produce freshness and barcodes
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
      {/* Camera feed (always mounted to keep layout stable) */}
      <ExpoCameraView
        ref={cameraRef}
        style={styles.camera}
        facing="back"
        mirror={false}
        onBarcodeScanned={scanMode === 'barcode' && !capturedUri ? handleBarcodeScan : undefined}
        barcodeScannerSettings={
          scanMode === 'barcode'
            ? { barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39', 'qr'] }
            : undefined
        }
      />

      {/* Frozen captured image overlaid on top of camera */}
      {capturedUri && (
        <Image source={{ uri: capturedUri }} style={styles.frozenImage} resizeMode="cover" />
      )}

      {/* Header overlay */}
      <View style={styles.headerOverlay}>
        <Text style={styles.headerTitle}>
          {capturedUri
            ? 'Analyzing...'
            : scanMode === 'freshness'
              ? 'Produce Scanner'
              : 'Barcode Scanner'}
        </Text>
        <Text style={styles.headerSubtitle}>
          {capturedUri
            ? 'Sending image to AI for freshness analysis'
            : scanMode === 'freshness'
              ? 'Take a photo of your produce to check freshness'
              : 'Point at a barcode to scan'}
        </Text>
      </View>

      {/* Loading spinner over frozen image */}
      {isCapturing && (
        <View style={styles.loadingBadge}>
          <ActivityIndicator size="small" color="#FFFFFF" />
          <Text style={styles.loadingBadgeText}>Analyzing freshness...</Text>
        </View>
      )}

      {/* Center hint when idle in freshness mode */}
      {scanMode === 'freshness' && !isCapturing && !capturedUri && (
        <View style={styles.hintContainer}>
          <View style={styles.hintBox}>
            <FontAwesome name="camera" size={24} color="#D8F3DC" />
            <Text style={styles.hintText}>Tap the shutter to scan</Text>
          </View>
        </View>
      )}

      {/* Bottom controls — always in the same position */}
      <View style={styles.controls}>
        {/* Mode toggle */}
        <View style={styles.modeToggle}>
          <TouchableOpacity
            style={[styles.modeButton, scanMode === 'freshness' && styles.modeButtonActive]}
            onPress={() => { if (!isCapturing) setScanMode('freshness'); }}>
            <FontAwesome name="leaf" size={16} color={scanMode === 'freshness' ? '#FFF' : '#9CA3AF'} />
            <Text style={[styles.modeText, scanMode === 'freshness' && styles.modeTextActive]}>
              Freshness
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeButton, scanMode === 'barcode' && styles.modeButtonActive]}
            onPress={() => { if (!isCapturing) setScanMode('barcode'); }}>
            <FontAwesome name="barcode" size={16} color={scanMode === 'barcode' ? '#FFF' : '#9CA3AF'} />
            <Text style={[styles.modeText, scanMode === 'barcode' && styles.modeTextActive]}>
              Barcode
            </Text>
          </TouchableOpacity>
        </View>

        {/* Action buttons */}
        <View style={styles.actionRow}>
          {/* Gallery picker (left) */}
          <TouchableOpacity
            style={[styles.secondaryButton, isCapturing && styles.buttonDisabled]}
            onPress={pickImage}
            disabled={isCapturing}>
            <FontAwesome name="image" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Main capture / retake button (center) */}
          {scanMode === 'freshness' && (
            capturedUri && !isCapturing ? (
              <TouchableOpacity style={styles.captureButton} onPress={handleRetake}>
                <FontAwesome name="refresh" size={28} color="#FFFFFF" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.captureButton, isCapturing && styles.captureButtonDisabled]}
                onPress={handleCapture}
                disabled={isCapturing}>
                <View style={styles.captureInner} />
              </TouchableOpacity>
            )
          )}

          {/* Demo barcode button (center) in barcode mode */}
          {scanMode === 'barcode' && (
            <TouchableOpacity
              style={styles.demoButton}
              onPress={handleDemoBarcode}>
              <FontAwesome name="flask" size={20} color="#FFFFFF" />
              <Text style={styles.demoButtonText}>Demo</Text>
            </TouchableOpacity>
          )}
          <View style={{ width: 52 }} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  centered: { justifyContent: 'center', alignItems: 'center', padding: 32 },
  camera: { ...StyleSheet.absoluteFillObject },
  frozenImage: { ...StyleSheet.absoluteFillObject, zIndex: 2 },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
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
  hintContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
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
  loadingBadge: {
    position: 'absolute',
    top: '45%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(45, 106, 79, 0.9)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    zIndex: 15,
  },
  loadingBadgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  controls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
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
  buttonDisabled: { opacity: 0.4 },
  permissionTitle: { fontSize: 24, fontWeight: '700', marginTop: 20 },
  permissionText: { fontSize: 16, textAlign: 'center', marginTop: 8, lineHeight: 24 },
  permissionButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 30,
    marginTop: 24,
  },
  permissionButtonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  demoButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(45, 106, 79, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  demoButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
});
