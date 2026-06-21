import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import AccountSelector from '../components/AccountSelector';

export default function PaymentScreen({ navigation, route }: any) {
  const { user, refreshProfile } = useAuth();
  const { 
    amount: initialAmount,
    receiverName: initialReceiver,
    receiverUpi: initialUpi,
    receiverAccount: initialAccount,
    receiverIfsc: initialIfsc,
    note: initialNote,
    type = 'upi', // 'upi' | 'bank' | 'self'
    onComplete,
  } = route.params || {};

  const [amount, setAmount] = useState(initialAmount || '');
  const [note, setNote] = useState(initialNote || '');
  const [loading, setLoading] = useState(false);
  
  // Account selection
  const [savedAccounts, setSavedAccounts] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [showAccountSelector, setShowAccountSelector] = useState(false);

  // Receiver details
  const [receiverName, setReceiverName] = useState(initialReceiver || '');
  const [receiverUpi, setReceiverUpi] = useState(initialUpi || '');
  const [receiverAccount, setReceiverAccount] = useState(initialAccount || '');
  const [receiverIfsc, setReceiverIfsc] = useState(initialIfsc || '');

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      const res = await api.get('/bank/accounts');
      const accounts = res.data.accounts || [];
      setSavedAccounts(accounts);
      const defaultAcc = accounts.find((a: any) => a.is_default);
      if (defaultAcc) setSelectedAccount(defaultAcc);
      else if (accounts.length > 0) setSelectedAccount(accounts[0]);
    } catch (error) {}
  };

  const handlePay = () => {
  if (!amount || parseFloat(amount) <= 0) {
    Alert.alert('Error', 'Enter valid amount');
    return;
  }
  if (savedAccounts.length === 0) {
    Alert.alert('No Bank Account', 'Add a bank account first.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Add Account', onPress: () => navigation.navigate('AddBankAccount') },
    ]);
    return;
  }
  if (!selectedAccount) {
    Alert.alert('Error', 'Select a bank account');
    return;
  }

  // Navigate to secure PIN screen
  navigation.navigate('SecurePin', {
    accountId: selectedAccount.id,
    bankName: selectedAccount.bank_name,
    accNumber: selectedAccount.account_number,
    amount: amount,
    receiverName: receiverName,
    onSuccess: (verifiedPin: string) => {
      processPayment(verifiedPin);
    },
  });
};

const processPayment = async (verifiedPin: string) => {
  setLoading(true);
  try {
    let response;

    if (type === 'upi') {
      response = await api.post('/wallet/send-money', {
        upi_id: receiverUpi,
        amount: parseFloat(amount),
        note: note || undefined,
        account_id: selectedAccount.id,
      });
    } else if (type === 'bank') {
      response = await api.post('/bank/transfer', {
        account_id: selectedAccount.id,
        to_account_number: receiverAccount,
        to_ifsc_code: receiverIfsc,
        receiver_name: receiverName,
        amount: parseFloat(amount),
        note: note || undefined,
        account_pin: verifiedPin,
      });
    }

    Alert.alert('Success', 'Payment successful!', [
      { text: 'OK', onPress: () => {
        refreshProfile?.();
        if (onComplete) onComplete();
        navigation.goBack();
      }}
    ]);
  } catch (error: any) {
    Alert.alert('Error', error.response?.data?.message || 'Payment failed');
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
        <Text style={styles.headerTitle}>Confirm Payment</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Amount Display */}
        <View style={styles.amountSection}>
          <Text style={styles.amountLabel}>Paying</Text>
          <View style={styles.amountRow}>
            <Text style={styles.currencySymbol}>₹</Text>
            <Text style={styles.amountDisplay}>{amount || '0'}</Text>
          </View>
        </View>

        {/* Receiver Info */}
        <View style={styles.receiverCard}>
          <View style={styles.receiverIcon}>
            <Ionicons name="person" size={24} color="#1a73e8" />
          </View>
          <View>
            <Text style={styles.receiverName}>{receiverName || 'Receiver'}</Text>
            <Text style={styles.receiverDetail}>
              {type === 'upi' ? receiverUpi : `A/C: ${receiverAccount?.slice(-4)}`}
            </Text>
          </View>
        </View>

        {/* From Account */}
        <TouchableOpacity 
          style={styles.fromAccount}
          onPress={() => setShowAccountSelector(true)}
        >
          <Text style={styles.fromLabel}>FROM</Text>
          <View style={styles.fromRow}>
            <View style={styles.bankIconSmall}>
              <Ionicons name="business" size={18} color="#1a73e8" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.bankName}>
                {selectedAccount?.bank_name || 'Select Account'}
              </Text>
              <Text style={styles.accDetail}>
                ****{selectedAccount?.account_number?.slice(-4)} • {selectedAccount?.upi_id}
              </Text>
            </View>
            <Ionicons name="chevron-down" size={20} color="#999" />
          </View>
        </TouchableOpacity>

        {/* Note */}
        <TextInput
          style={styles.noteInput}
          placeholder="Add a note (optional)"
          value={note}
          onChangeText={setNote}
          placeholderTextColor="#999"
        />


        {/* Pay Button */}
        <TouchableOpacity 
            style={[styles.payButton, (!amount || loading) && styles.payButtonDisabled]}
            onPress={handlePay}
            disabled={!amount || loading}
            >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.payButtonText}>
              Pay ₹{amount || '0'}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Account Selector Modal */}
      <AccountSelector
        visible={showAccountSelector}
        accounts={savedAccounts}
        selectedId={selectedAccount?.id || null}
        onSelect={(account) => {
          setSelectedAccount(account);
          setShowAccountSelector(false);
        }}
        onClose={() => setShowAccountSelector(false)}
      />
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
  content: { flex: 1, padding: 20 },
  amountSection: { alignItems: 'center', marginBottom: 24 },
  amountLabel: { fontSize: 14, color: '#999', marginBottom: 4 },
  amountRow: { flexDirection: 'row', alignItems: 'baseline' },
  currencySymbol: { fontSize: 24, color: '#333', marginRight: 4 },
  amountDisplay: { fontSize: 40, fontWeight: 'bold', color: '#333' },
  receiverCard: {
    flexDirection: 'row', alignItems: 'center',
    padding: 14, backgroundColor: '#f8f9fa', borderRadius: 12, marginBottom: 16,
    gap: 12,
  },
  receiverIcon: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#e8f0fe', justifyContent: 'center', alignItems: 'center',
  },
  receiverName: { fontSize: 15, fontWeight: '600', color: '#333' },
  receiverDetail: { fontSize: 13, color: '#666', marginTop: 2 },
  fromAccount: {
    padding: 14, backgroundColor: '#f8f9fa', borderRadius: 12, marginBottom: 16,
    borderWidth: 1, borderColor: '#e0e0e0',
  },
  fromLabel: { fontSize: 11, color: '#999', marginBottom: 8, letterSpacing: 0.5 },
  fromRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  bankIconSmall: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#e8f0fe', justifyContent: 'center', alignItems: 'center',
  },
  bankName: { fontSize: 14, fontWeight: '600', color: '#333' },
  accDetail: { fontSize: 12, color: '#666', marginTop: 2 },
  noteInput: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 12,
    padding: 14, fontSize: 15, marginBottom: 20,
  },
  pinLabel: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 4 },
  pinSubtext: { fontSize: 12, color: '#999', marginBottom: 8 },
  pinInput: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 12,
    padding: 14, fontSize: 20, textAlign: 'center',
    letterSpacing: 10, marginBottom: 24,
    backgroundColor: '#f8f9fa',
  },
  payButton: {
    backgroundColor: '#1a73e8', padding: 16, borderRadius: 25, alignItems: 'center',
  },
  payButtonDisabled: { backgroundColor: '#93c5fd' },
  payButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});