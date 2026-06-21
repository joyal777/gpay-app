import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';

export default function AddBankAccountScreen({ navigation }: any) {
  const [accountNumber, setAccountNumber] = useState('');
  const [confirmAccount, setConfirmAccount] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [bankName, setBankName] = useState('');
  const [loading, setLoading] = useState(false);
  const [existingAccount, setExistingAccount] = useState<any>(null);

  useEffect(() => {
    loadExistingAccount();
  }, []);

  const loadExistingAccount = async () => {
    try {
      const res = await api.get('/bank/account');
      if (res.data.account) {
        setExistingAccount(res.data.account);
        setAccountNumber(res.data.account.account_number);
        setIfscCode(res.data.account.ifsc_code);
        setAccountHolder(res.data.account.account_holder);
        setBankName(res.data.account.bank_name || '');
      }
    } catch (error) {}
  };

  const handleSave = async () => {
    if (!accountNumber || !ifscCode || !accountHolder) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    if (accountNumber !== confirmAccount) {
      Alert.alert('Error', 'Account numbers do not match');
      return;
    }

    if (ifscCode.length !== 11) {
      Alert.alert('Error', 'IFSC code must be 11 characters');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/bank/account', {
        account_number: accountNumber,
        ifsc_code: ifscCode,
        account_holder: accountHolder,
        bank_name: bankName,
      });

      if (res.data.status) {
        Alert.alert('Success', 'Bank account saved successfully!', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to save account');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Remove Account',
      'Are you sure you want to remove this bank account?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: async () => {
            // Just clear locally - backend will update on next save
            setAccountNumber('');
            setConfirmAccount('');
            setIfscCode('');
            setAccountHolder('');
            setBankName('');
            setExistingAccount(null);
          }
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {existingAccount ? 'Edit Bank Account' : 'Add Bank Account'}
        </Text>
        <TouchableOpacity onPress={handleSave} disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color="#1a73e8" />
          ) : (
            <Text style={styles.saveText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="shield-checkmark" size={24} color="#2e7d32" />
          <Text style={styles.infoText}>
            Your bank details are encrypted and secure. Used for withdrawals and self-transfers.
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.label}>Account Holder Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter full name as on bank account"
            value={accountHolder}
            onChangeText={setAccountHolder}
          />

          <Text style={styles.label}>Bank Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter bank name (e.g. SBI, HDFC)"
            value={bankName}
            onChangeText={setBankName}
          />

          <Text style={styles.label}>Account Number *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter account number"
            value={accountNumber}
            onChangeText={setAccountNumber}
            keyboardType="numeric"
            maxLength={18}
          />

          <Text style={styles.label}>Confirm Account Number *</Text>
          <TextInput
            style={styles.input}
            placeholder="Re-enter account number"
            value={confirmAccount}
            onChangeText={setConfirmAccount}
            keyboardType="numeric"
            maxLength={18}
          />

          <Text style={styles.label}>IFSC Code *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter IFSC code (e.g. SBIN0001234)"
            value={ifscCode}
            onChangeText={setIfscCode}
            autoCapitalize="characters"
            maxLength={11}
          />
          <Text style={styles.helperText}>
            You can find IFSC code on your cheque book or bank app
          </Text>
        </View>

        {/* Remove Button */}
        {existingAccount && (
          <TouchableOpacity style={styles.removeButton} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={20} color="#c62828" />
            <Text style={styles.removeText}>Remove Bank Account</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
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
  saveText: { fontSize: 16, fontWeight: '600', color: '#1a73e8' },
  content: { flex: 1 },
  infoCard: {
    flexDirection: 'row', alignItems: 'center',
    margin: 16, padding: 14,
    backgroundColor: '#E8F5E9', borderRadius: 12,
    gap: 12,
  },
  infoText: { flex: 1, fontSize: 13, color: '#2E7D32', lineHeight: 18 },
  form: { padding: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 6, marginTop: 16 },
  input: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 12,
    padding: 14, fontSize: 16, backgroundColor: '#f8f9fa', color: '#333',
  },
  helperText: { fontSize: 12, color: '#999', marginTop: 6 },
  removeButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    margin: 16, padding: 14, gap: 8,
    borderWidth: 1, borderColor: '#ffcdd2', borderRadius: 12,
  },
  removeText: { fontSize: 14, color: '#c62828', fontWeight: '500' },
});