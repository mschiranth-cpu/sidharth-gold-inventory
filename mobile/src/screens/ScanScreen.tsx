import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Vibration } from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { Camera } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const DEPARTMENTS = ['Design', 'Casting', 'Polishing', 'Stone Setting', 'Quality Check', 'Packaging'];
const STATUSES = ['in_progress', 'completed', 'on_hold'];

export default function ScanScreen() {
  const { user } = useAuth();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [scannedData, setScannedData] = useState<any>(null);
  const [selectedStatus, setSelectedStatus] = useState('in_progress');
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
    Vibration.vibrate(100);
    setScanned(true);

    try {
      const parsed = JSON.parse(data);
      setScannedData(parsed);
    } catch {
      Alert.alert('Error', 'Invalid QR code format');
      setScanned(false);
    }
  };

  const takePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const submitUpdate = async () => {
    if (!scannedData) return;

    try {
      await api.scanQR(
        JSON.stringify(scannedData),
        selectedStatus,
        user?.department,
        `Updated by ${user?.name} via mobile app`,
        photoUri || undefined
      );

      Alert.alert('Success', `Order ${scannedData.orderNumber} updated!`);
      resetScan();
    } catch (error) {
      Alert.alert('Error', 'Failed to update order');
    }
  };

  const resetScan = () => {
    setScanned(false);
    setScannedData(null);
    setPhotoUri(null);
  };

  if (hasPermission === null) {
    return <View style={styles.container}><Text style={styles.text}>Requesting camera permission...</Text></View>;
  }
  if (hasPermission === false) {
    return <View style={styles.container}><Text style={styles.text}>No camera access</Text></View>;
  }

  if (scannedData) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Order Scanned</Text>
        <View style={styles.card}>
          <Text style={styles.orderNumber}>{scannedData.orderNumber}</Text>
          <Text style={styles.label}>Select New Status:</Text>
          <View style={styles.buttonRow}>
            {STATUSES.map(status => (
              <TouchableOpacity
                key={status}
                style={[styles.statusBtn, selectedStatus === status && styles.statusBtnActive]}
                onPress={() => setSelectedStatus(status)}
              >
                <Text style={styles.statusText}>{status.replace('_', ' ')}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={styles.photoBtn} onPress={takePhoto}>
            <Text style={styles.btnText}>{photoUri ? '📷 Photo Added' : '📷 Add Photo'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.submitBtn} onPress={submitUpdate}>
            <Text style={styles.submitText}>Update Order</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelBtn} onPress={resetScan}>
            <Text style={styles.cancelText}>Scan Another</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <BarCodeScanner
        onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.overlay}>
        <View style={styles.scanFrame} />
        <Text style={styles.scanText}>Point camera at order QR code</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a1a' },
  text: { color: '#fff', textAlign: 'center', marginTop: 50 },
  title: { fontSize: 24, color: '#D4AF37', textAlign: 'center', marginTop: 40 },
  card: { backgroundColor: '#2a2a2a', margin: 20, padding: 20, borderRadius: 12 },
  orderNumber: { fontSize: 28, color: '#D4AF37', textAlign: 'center', fontWeight: 'bold' },
  label: { color: '#ccc', marginTop: 20, marginBottom: 10 },
  buttonRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statusBtn: { padding: 10, backgroundColor: '#333', borderRadius: 8 },
  statusBtnActive: { backgroundColor: '#D4AF37' },
  statusText: { color: '#fff', textTransform: 'capitalize' },
  photoBtn: { backgroundColor: '#444', padding: 15, borderRadius: 8, marginTop: 15, alignItems: 'center' },
  btnText: { color: '#fff' },
  submitBtn: { backgroundColor: '#D4AF37', padding: 15, borderRadius: 8, marginTop: 15, alignItems: 'center' },
  submitText: { color: '#000', fontWeight: 'bold', fontSize: 16 },
  cancelBtn: { padding: 15, marginTop: 10, alignItems: 'center' },
  cancelText: { color: '#888' },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  scanFrame: { width: 250, height: 250, borderWidth: 2, borderColor: '#D4AF37', borderRadius: 12 },
  scanText: { color: '#fff', marginTop: 20 },
});
