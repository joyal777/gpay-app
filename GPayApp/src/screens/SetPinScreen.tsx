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
import { useAuth } from '../context/AuthContext';

export default function SetPinScreen({ navigation }: any) {
  const { user } = useAuth();
  const hasExistingPin = user?.upi_pin ? true : false;
  
  const [step, setStep] = useState<'old' | 'create' | 'confirm'>(
    hasExistingPin ? 'old' : 'create'
  );
  const [oldPin, setOldPin] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);

  const currentPin = step === 'old' ? oldPin : step === 'create' ? pin : confirmPin;

  const handlePinPress = (num: string) => {
    if (currentPin.length < 4) {
      const newPin = currentPin + num;
      
      if (step === 'old') {
        setOldPin(newPin);
        if (newPin.length === 4) {
          verifyOldPin(newPin);
        }
      } else if (step === 'create') {
        setPin(newPin);
        if (newPin.length === 4) {
          setTimeout(() => setStep('confirm'), 300);
        }
      } else {
        setConfirmPin(newPin);
        if (newPin.length === 4) {
          verifyAndSetPin(pin, newPin);
        }
      }
    }
  };

  const handleDelete = () => {
    if (step === 'old') setOldPin(oldPin.slice(0, -1));
    else if (step === 'create') setPin(pin.slice(0, -1));
    else setConfirmPin(confirmPin.slice(0, -1));
  };

  const verifyOldPin = async (enteredPin: string) => {
    setLoading(true);
    try {
      const response = await api.post('/profile/verify-pin', {
        upi_pin: enteredPin,
      });

      if (response.data.status) {
        setOldPin('');
        setStep('create');
      } else {
        Alert.alert('Error', 'Invalid PIN');
        setOldPin('');
      }
    } catch (error: any) {
      Alert.alert('Error', 'Invalid PIN');
      setOldPin('');
    } finally {
      setLoading(false);
    }
  };

  const verifyAndSetPin = async (newPin: string, confirmedPin: string) => {
    if (newPin !== confirmedPin) {
      Alert.alert('Error', 'PINs do not match. Try again.');
      setPin('');
      setConfirmPin('');
      setStep('create');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/profile/upi-pin', {
        upi_pin: newPin,
      });

      if (response.data.status) {
        Alert.alert('Success', 
          hasExistingPin ? 'UPI PIN changed successfully!' : 'UPI PIN set successfully!', 
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to set PIN');
      setPin('');
      setConfirmPin('');
      setStep(hasExistingPin ? 'old' : 'create');
    } finally {
      setLoading(false);
    }
  };

  const getStepTitle = () => {
    if (step === 'old') return 'Enter Current UPI PIN';
    if (step === 'create') return hasExistingPin ? 'Create New UPI PIN' : 'Create your UPI PIN';
    return 'Confirm your UPI PIN';
  };

  const getStepSubtitle = () => {
    if (step === 'old') return 'Enter your current 4-digit PIN to continue';
    if (step === 'create') return 'Enter a new 4-digit PIN for payments';
    return 'Re-enter your PIN to confirm';
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {hasExistingPin ? 'Change UPI PIN' : 'Set UPI PIN'}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <View style={[styles.iconContainer, 
          step === 'old' ? { backgroundColor: '#fff3e0' } : { backgroundColor: '#e8f0fe' }
        ]}>
          <Ionicons 
            name={step === 'old' ? "lock-closed" : "key"} 
            size={50} 
            color={step === 'old' ? "#e65100" : "#1a73e8"} 
          />
        </View>
        
        <Text style={styles.title}>{getStepTitle()}</Text>
        <Text style={styles.subtitle}>{getStepSubtitle()}</Text>

        {/* PIN Dots */}
        <View style={styles.pinDots}>
          {[0, 1, 2, 3].map((i) => (
            <View 
              key={i} 
              style={[styles.dot, currentPin.length > i && styles.dotFilled]} 
            />
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

        {loading && <ActivityIndicator size="large" color="#1a73e8" style={{ marginTop: 20 }} />}
        
        {/* Back button for confirm step */}
        {step === 'confirm' && (
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => {
              setPin('');
              setConfirmPin('');
              setStep(hasExistingPin ? 'old' : 'create');
            }}
          >
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  iconContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 25,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#999',
    marginBottom: 30,
  },
  pinDots: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 40,
  },
  dot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#ddd',
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
    gap: 12,
  },
  keyButton: {
    width: 75,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 15,
    backgroundColor: '#f5f5f5',
  },
  keyText: {
    fontSize: 26,
    fontWeight: '500',
    color: '#333',
  },
  backButton: {
    marginTop: 30,
  },
  backText: {
    color: '#1a73e8',
    fontSize: 14,
    fontWeight: '500',
  },
});