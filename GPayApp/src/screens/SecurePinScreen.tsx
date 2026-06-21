import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';

export default function SecurePinScreen({ navigation, route }: any) {
  const { 
    accountId, 
    bankName, 
    accNumber, 
    amount, 
    receiverName,
    onSuccess 
  } = route.params || {};
  
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePinPress = (num: string) => {
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      
      if (newPin.length === 4) {
        verifyPin(newPin);
      }
    }
  };

  const handleDelete = () => {
    setPin(pin.slice(0, -1));
  };

  const verifyPin = async (enteredPin: string) => {
    setLoading(true);
    try {
      const response = await api.post(`/bank/account/${accountId}/verify-pin`, {
        account_pin: enteredPin,
      });

      if (response.data.status) {
        // PIN verified - pass back
        if (onSuccess) {
          onSuccess(enteredPin);
        }
        navigation.goBack();
      } else {
        Alert.alert('Invalid PIN', 'Please try again', [
          { text: 'OK', onPress: () => setPin('') }
        ]);
      }
    } catch (error) {
      Alert.alert('Error', 'Verification failed', [
        { text: 'OK', onPress: () => setPin('') }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Enter PIN</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        {/* Lock Icon */}
        <View style={styles.iconContainer}>
          <Ionicons name="lock-closed" size={48} color="#1a73e8" />
        </View>

        {/* Bank Info */}
        <View style={styles.bankInfo}>
          <Text style={styles.bankName}>{bankName || 'Bank'}</Text>
          <Text style={styles.accNumber}>****{accNumber?.slice(-4) || '----'}</Text>
        </View>

        {/* Amount */}
        {amount && (
          <View style={styles.amountContainer}>
            <Text style={styles.amountLabel}>Paying</Text>
            <Text style={styles.amountDisplay}>₹{amount}</Text>
            {receiverName && (
              <Text style={styles.receiverText}>to {receiverName}</Text>
            )}
          </View>
        )}

        {/* PIN Dots */}
        <View style={styles.pinDots}>
          {[0, 1, 2, 3].map((i) => (
            <View 
              key={i} 
              style={[
                styles.dot, 
                pin.length > i && styles.dotFilled,
                loading && styles.dotDisabled
              ]} 
            />
          ))}
        </View>

        {loading && (
          <ActivityIndicator size="small" color="#1a73e8" style={{ marginBottom: 20 }} />
        )}

        {/* Keypad */}
        <View style={styles.keypad}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, '⌫'].map((num, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.keyButton, loading && styles.keyDisabled]}
              onPress={() => {
                if (num === '⌫') handleDelete();
                else if (num !== '') handlePinPress(num.toString());
              }}
              disabled={loading}
            >
              {num === '⌫' ? (
                <Ionicons name="backspace-outline" size={26} color="#333" />
              ) : num !== '' ? (
                <Text style={styles.keyText}>{num}</Text>
              ) : null}
            </TouchableOpacity>
          ))}
        </View>

        {/* Forgot PIN */}
        <TouchableOpacity style={styles.forgotButton}>
          <Text style={styles.forgotText}>Forgot PIN?</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', padding: 16,
    borderBottomWidth: 1, borderBottomColor: '#eee',
  },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#333' },
  content: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 30,
  },
  iconContainer: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#e8f0fe',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 20,
  },
  bankInfo: {
    alignItems: 'center', marginBottom: 20,
  },
  bankName: { fontSize: 16, fontWeight: '600', color: '#333' },
  accNumber: { fontSize: 13, color: '#666', marginTop: 4 },
  amountContainer: {
    backgroundColor: '#f8f9fa', paddingHorizontal: 24, paddingVertical: 12,
    borderRadius: 12, marginBottom: 30, alignItems: 'center',
  },
  amountLabel: { fontSize: 12, color: '#999' },
  amountDisplay: { fontSize: 28, fontWeight: 'bold', color: '#333' },
  receiverText: { fontSize: 14, color: '#666', marginTop: 2 },
  pinDots: { flexDirection: 'row', gap: 20, marginBottom: 30 },
  dot: {
    width: 16, height: 16, borderRadius: 8,
    borderWidth: 2, borderColor: '#ddd',
  },
  dotFilled: {
    backgroundColor: '#1a73e8', borderColor: '#1a73e8',
  },
  dotDisabled: { opacity: 0.5 },
  keypad: {
    flexDirection: 'row', flexWrap: 'wrap',
    justifyContent: 'center', width: 300, gap: 12,
  },
  keyButton: {
    width: 80, height: 65, justifyContent: 'center', alignItems: 'center',
    borderRadius: 16, backgroundColor: '#f5f5f5',
  },
  keyDisabled: { opacity: 0.5 },
  keyText: { fontSize: 28, fontWeight: '500', color: '#333' },
  forgotButton: { marginTop: 30 },
  forgotText: { color: '#1a73e8', fontSize: 14, fontWeight: '500' },
});