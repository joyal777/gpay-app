import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';

interface PinScreenProps {
  navigation: any;
  route: any;
}

export default function PinScreen({ navigation, route }: PinScreenProps) {
  const { onSuccess, amount, receiverName } = route.params || {};
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
      const response = await api.post('/profile/verify-pin', {
        upi_pin: enteredPin,
      });

      if (response.data.status) {
        if (onSuccess) {
            onSuccess(enteredPin);  // ← PASS THE PIN!
            }
        navigation.goBack();
      } else {
        Alert.alert('Error', 'Invalid PIN');
        setPin('');
      }
    } catch (error) {
      Alert.alert('Error', 'Invalid PIN');
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
        <Ionicons name="close" size={24} color="#333" />
      </TouchableOpacity>

      <View style={styles.content}>
        <Ionicons name="lock-closed" size={40} color="#1a73e8" />
        <Text style={styles.title}>Enter UPI PIN</Text>
        {amount && (
          <Text style={styles.amount}>₹{amount} to {receiverName}</Text>
        )}

        {/* PIN Dots */}
        <View style={styles.pinDots}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={[styles.dot, pin.length > i && styles.dotFilled]} />
          ))}
        </View>

        {/* Keypad */}
        <View style={styles.keypad}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, '⌫'].map((num, index) => (
            <TouchableOpacity
              key={index}
              style={styles.keyButton}
              onPress={() => {
                if (num === '⌫') handleDelete();
                else if (num !== '') handlePinPress(num.toString());
              }}
              disabled={loading}
            >
              {num === '⌫' ? (
                <Ionicons name="backspace-outline" size={24} color="#333" />
              ) : num !== '' ? (
                <Text style={styles.keyText}>{num}</Text>
              ) : null}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 15,
  },
  amount: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
  pinDots: {
    flexDirection: 'row',
    gap: 15,
    marginTop: 30,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  dotFilled: {
    backgroundColor: '#1a73e8',
    borderColor: '#1a73e8',
  },
  keypad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: 280,
    marginTop: 40,
    gap: 10,
  },
  keyButton: {
    width: 75,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
  },
  keyText: {
    fontSize: 24,
    fontWeight: '500',
    color: '#333',
  },
});