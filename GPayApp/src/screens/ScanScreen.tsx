import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function ScanScreen({ navigation }: any) {
  const { user } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [amount, setAmount] = useState('');
  const [showAmountInput, setShowAmountInput] = useState(false);
  const [scannedUpiId, setScannedUpiId] = useState('');
  const [scannedName, setScannedName] = useState('');
  const [loading, setLoading] = useState(false);

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Scan QR Code</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.permissionContainer}>
          <Ionicons name="camera" size={64} color="#ccc" />
          <Text style={styles.permissionText}>Camera permission needed</Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleBarCodeScanned = ({ data }: any) => {
    if (scanned) return;
    setScanned(true);
    
    // UPI QR format: upi://pay?pa=USER@okaxis&pn=NAME
    try {
      if (data.includes('upi://') || data.includes('@')) {
        // Extract UPI ID
        let upiId = data;
        let name = 'User';
        
        if (data.includes('pa=')) {
          const urlParams = new URLSearchParams(data.split('?')[1]);
          upiId = urlParams.get('pa') || data;
          name = urlParams.get('pn') || 'User';
        }
        
        setScannedUpiId(upiId);
        setScannedName(name);
        setShowAmountInput(true);
      } else {
        Alert.alert('Invalid QR', 'This is not a valid UPI QR code', [
          { text: 'OK', onPress: () => setScanned(false) }
        ]);
      }
    } catch (error) {
      Alert.alert('Error', 'Could not read QR code', [
        { text: 'OK', onPress: () => setScanned(false) }
      ]);
    }
  };

  const handleSendMoney = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Enter a valid amount');
      return;
    }

    navigation.navigate('Pin', {
      amount: amount,
      receiverName: scannedName,
      onSuccess: async (pin: string) => {
        setLoading(true);
        try {
          await api.post('/wallet/send-money', {
            upi_id: scannedUpiId,
            amount: parseFloat(amount),
            upi_pin: pin,
          });
          
          Alert.alert('Success', `₹${amount} sent to ${scannedName}`, [
            { text: 'OK', onPress: () => navigation.goBack() }
          ]);
        } catch (error: any) {
          Alert.alert('Error', error.response?.data?.message || 'Payment failed');
        } finally {
          setLoading(false);
        }
      },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scan QR Code</Text>
        <View style={{ width: 24 }} />
      </View>

      {!showAmountInput ? (
        <>
          {/* Camera */}
          <View style={styles.cameraContainer}>
            <CameraView
              style={styles.camera}
              facing="back"
              onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            />
            {/* Scan overlay */}
            <View style={styles.overlay}>
              <View style={styles.scanFrame}>
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />
              </View>
              <Text style={styles.scanText}>
                Point camera at QR code
              </Text>
            </View>
          </View>

          {scanned && (
            <TouchableOpacity 
              style={styles.rescanButton}
              onPress={() => setScanned(false)}
            >
              <Text style={styles.rescanText}>Tap to Scan Again</Text>
            </TouchableOpacity>
          )}
        </>
      ) : (
        /* Amount Input */
        <View style={styles.amountContainer}>
          <View style={styles.recipientCard}>
            <View style={styles.recipientAvatar}>
              <Text style={styles.recipientAvatarText}>
                {scannedName?.charAt(0)}
              </Text>
            </View>
            <Text style={styles.recipientName}>{scannedName}</Text>
            <Text style={styles.recipientUpi}>{scannedUpiId}</Text>
          </View>

          <Text style={styles.amountLabel}>Enter Amount</Text>
          <View style={styles.amountInputContainer}>
            <Text style={styles.currencySymbol}>₹</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="0"
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              placeholderTextColor="#ccc"
              autoFocus
            />
          </View>

          <TouchableOpacity 
            style={[styles.sendButton, !amount && styles.sendButtonDisabled]}
            onPress={handleSendMoney}
            disabled={!amount || loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.sendButtonText}>Send Money</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={() => {
              setShowAmountInput(false);
              setAmount('');
              setScanned(false);
            }}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    zIndex: 10,
  },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#333' },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    gap: 15,
  },
  permissionText: { fontSize: 16, color: '#666' },
  permissionButton: {
    backgroundColor: '#1a73e8',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  permissionButtonText: { color: '#fff', fontWeight: '600' },
  cameraContainer: { flex: 1, position: 'relative' },
  camera: { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#1a73e8',
  },
  topLeft: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3 },
  topRight: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3 },
  bottomLeft: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3 },
  bottomRight: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3 },
  scanText: {
    color: '#fff',
    marginTop: 20,
    fontSize: 14,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  rescanButton: {
    padding: 15,
    backgroundColor: '#1a73e8',
    alignItems: 'center',
  },
  rescanText: { color: '#fff', fontWeight: '600' },
  amountContainer: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  recipientCard: {
    alignItems: 'center',
    padding: 20,
    marginBottom: 30,
  },
  recipientAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#1a73e8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  recipientAvatarText: { color: '#fff', fontSize: 28, fontWeight: 'bold' },
  recipientName: { fontSize: 18, fontWeight: '600', color: '#333' },
  recipientUpi: { fontSize: 14, color: '#666', marginTop: 5 },
  amountLabel: { fontSize: 14, color: '#666', marginBottom: 10 },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#1a73e8',
    paddingBottom: 10,
    marginBottom: 30,
  },
  currencySymbol: { fontSize: 28, fontWeight: 'bold', color: '#333', marginRight: 5 },
  amountInput: { flex: 1, fontSize: 28, color: '#333' },
  sendButton: {
    backgroundColor: '#1a73e8',
    padding: 16,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 15,
  },
  sendButtonDisabled: { backgroundColor: '#93c5fd' },
  sendButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  cancelButton: { alignItems: 'center' },
  cancelText: { color: '#999', fontSize: 14 },
});