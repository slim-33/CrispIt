import React, { useState, useRef } from 'react';
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
import { scanImage, lookupBarcode } from '@/lib/api';

export default function ScanScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState(false);
  const [scanMode, setScanMode] = useState<'freshness' | 'barcode'>('freshness');
  const cameraRef = useRef<any>(null);

  if (!permission) {
    return <View style={styles.container} />;
  }

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

  async function takePicture() {
    if (!cameraRef.current || isScanning) return;
    setIsScanning(true);

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
    } catch (error) {
      Alert.alert('Scan Failed', 'Could not analyze the image. Please try again.');
      console.error('Scan error:', error);
    } finally {
      setIsScanning(false);
    }
  }

  async function pickImage() {
    if (isScanning) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets[0]?.base64) {
      setIsScanning(true);
      try {
        const scanResult = await scanImage(result.assets[0].base64);
        router.push({
          pathname: '/scan-result',
          params: { data: JSON.stringify(scanResult) },
        });
      } catch (error) {
        Alert.alert('Scan Failed', 'Could not analyze the image. Please try again.');
      } finally {
        setIsScanning(false);
      }
    }
  }

  async function handleBarcodeScan(data: { data: string }) {
    if (isScanning) return;
    setIsScanning(true);

    try {
      const product = await lookupBarcode(data.data);
      router.push({
        pathname: '/scan-result',
        params: { barcode: JSON.stringify(product) },
      });
    } catch {
      Alert.alert('Not Found', 'Product not found in database.');
    } finally {
      setIsScanning(false);
    }
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
            {scanMode === 'freshness' ? 'Freshness Scanner' : 'Barcode Scanner'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {scanMode === 'freshness'
              ? 'Point at produce to analyze freshness'
              : 'Point at a barcode to scan'}
          </Text>
        </View>

        {/* Scan frame overlay */}
        <View style={styles.scanFrame}>
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
        </View>

        {/* Loading overlay */}
        {isScanning && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text style={styles.loadingText}>
              {scanMode === 'freshness' ? 'Analyzing freshness...' : 'Looking up product...'}
            </Text>
          </View>
        )}

        {/* Bottom controls */}
        <View style={styles.controls}>
          {/* Mode toggle */}
          <View style={styles.modeToggle}>
            <TouchableOpacity
              style={[
                styles.modeButton,
                scanMode === 'freshness' && styles.modeButtonActive,
              ]}
              onPress={() => setScanMode('freshness')}>
              <FontAwesome name="leaf" size={16} color={scanMode === 'freshness' ? '#FFF' : '#9CA3AF'} />
              <Text style={[styles.modeText, scanMode === 'freshness' && styles.modeTextActive]}>
                Freshness
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modeButton,
                scanMode === 'barcode' && styles.modeButtonActive,
              ]}
              onPress={() => setScanMode('barcode')}>
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

            {scanMode === 'freshness' && (
              <TouchableOpacity
                style={[styles.captureButton, isScanning && styles.captureButtonDisabled]}
                onPress={takePicture}
                disabled={isScanning}>
                <View style={styles.captureInner} />
              </TouchableOpacity>
            )}

            <View style={styles.secondaryButton}>
              <FontAwesome name="flash" size={24} color="#FFFFFF" />
            </View>
          </View>
        </View>
      </ExpoCameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  centered: { justifyContent: 'center', alignItems: 'center', padding: 32 },
  camera: { flex: 1 },
  headerOverlay: {
    paddingTop: 60,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#D8F3DC',
    marginTop: 4,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  scanFrame: {
    flex: 1,
    margin: 40,
    marginTop: 20,
    marginBottom: 20,
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#52B788',
    borderWidth: 3,
  },
  topLeft: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  topRight: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  bottomLeft: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  bottomRight: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: { color: '#FFFFFF', fontSize: 16, marginTop: 12, fontWeight: '600' },
  controls: {
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    paddingHorizontal: 20,
  },
  modeToggle: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
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
    gap: 32,
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
    width: 48,
    height: 48,
    borderRadius: 24,
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
