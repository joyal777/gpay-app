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


export default function BankTransferScreen({ navigation, route }: any) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'others' | 'self'>('others');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [receiverName, setReceiverName] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const preSelectedAccount = route?.params?.preSelectedAccount;
  const mode = route?.params?.mode; 
  
  // Multiple accounts
  const [savedAccounts, setSavedAccounts] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [showAccountSelector, setShowAccountSelector] = useState(false);

  useEffect(() => {
    loadSavedAccounts();
    loadHistory();

    if (preSelectedAccount) {
        setSelectedAccount(preSelectedAccount);
        // Auto-fill self-transfer
        setAccountNumber(preSelectedAccount.account_number);
        setIfscCode(preSelectedAccount.ifsc_code);
        setReceiverName(preSelectedAccount.account_holder);
        setActiveTab('self');
      }
    }, []);

  
  const loadSavedAccounts = async () => {
    try {
      const res = await api.get('/bank/accounts');
      const accounts = res.data.accounts || [];
      setSavedAccounts(accounts);
      const defaultAcc = accounts.find((a: any) => a.is_default);
      if (defaultAcc) setSelectedAccount(defaultAcc);
      else if (accounts.length > 0) setSelectedAccount(accounts[0]);
    } catch (error) {}
  };

  const loadHistory = async () => {
    try {
      const res = await api.get('/bank/history');
      setHistory(res.data.transfers?.data || []);
    } catch (error) {}
  };

  const handleSelfTransfer = () => {
    if (!selectedAccount) {
      Alert.alert('No Account', 'Please add your bank account first');
      return;
    }
    setAccountNumber(selectedAccount.account_number);
    setIfscCode(selectedAccount.ifsc_code);
    setReceiverName(selectedAccount.account_holder);
    setActiveTab('self');
  };

  const handleTransfer = () => {
  if (!selectedAccount) {
    Alert.alert('Error', 'Please select a bank account');
    return;
  }
  if (!accountNumber || !ifscCode || !receiverName || !amount) {
    Alert.alert('Error', 'Please fill all fields');
    return;
  }

  navigation.navigate('Payment', {
    amount: amount,
    receiverName: receiverName,
    receiverAccount: accountNumber,
    receiverIfsc: ifscCode,
    type: 'bank',
    note: note || undefined,
    onComplete: () => {
      setAmount(''); setNote('');
      loadHistory();
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
        <Text style={styles.headerTitle}>
          {mode === 'add-money' ? 'Add Money' : 'Bank Transfer'}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Account Selector */}
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

        {/* Selected Account */}
        <TouchableOpacity 
          style={styles.selectedAccount}
          onPress={() => setShowAccountSelector(true)}
        >
          <Text style={styles.fromLabel}>From Account</Text>
          <View style={styles.selectedAccountInfo}>
            <View style={styles.bankIcon}>
              <Ionicons name="business" size={20} color="#1a73e8" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.selectedBankName}>
                {selectedAccount?.bank_name || 'Select Bank Account'}
              </Text>
              <Text style={styles.selectedAccNum}>
                ****{selectedAccount?.account_number?.slice(-4) || '----'}
              </Text>
            </View>
            <Ionicons name="chevron-down" size={20} color="#999" />
          </View>
        </TouchableOpacity>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'others' && styles.activeTab]}
            onPress={() => setActiveTab('others')}
          >
            <Ionicons name="people" size={20} color={activeTab === 'others' ? '#1a73e8' : '#666'} />
            <Text style={[styles.tabText, activeTab === 'others' && styles.activeTabText]}>
              To Others
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'self' && styles.activeTab]}
            onPress={handleSelfTransfer}
          >
            <Ionicons name="person" size={20} color={activeTab === 'self' ? '#1a73e8' : '#666'} />
            <Text style={[styles.tabText, activeTab === 'self' && styles.activeTabText]}>
              To Self
            </Text>
          </TouchableOpacity>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.label}>Receiver Account Number</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter account number"
            value={accountNumber}
            onChangeText={setAccountNumber}
            keyboardType="numeric"
            maxLength={18}
            editable={activeTab !== 'self'}
          />

          <Text style={styles.label}>IFSC Code</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter IFSC code (e.g. SBIN0001234)"
            value={ifscCode}
            onChangeText={setIfscCode}
            autoCapitalize="characters"
            maxLength={11}
            editable={activeTab !== 'self'}
          />

          <Text style={styles.label}>Receiver Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter account holder name"
            value={receiverName}
            onChangeText={setReceiverName}
            editable={activeTab !== 'self'}
          />

          <Text style={styles.label}>Amount</Text>
          <View style={styles.amountContainer}>
            <Text style={styles.currencySymbol}>₹</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="0"
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
            />
          </View>

          <Text style={styles.label}>Note (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Add a note"
            value={note}
            onChangeText={setNote}
          />

          <TouchableOpacity 
            style={[styles.transferButton, (!amount || loading) && styles.transferButtonDisabled]}
            onPress={handleTransfer}
            disabled={!amount || loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.transferButtonText}>Send Money</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Recent Transfers */}
        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>Recent Bank Transfers</Text>
          {history.length > 0 ? (
            history.map((item: any) => (
              <View key={item.id} style={styles.historyItem}>
                <View style={styles.historyIcon}>
                  <Ionicons name="business" size={20} color="#1a73e8" />
                </View>
                <View style={styles.historyInfo}>
                  <Text style={styles.historyName}>{item.receiver_name}</Text>
                  <Text style={styles.historyAccount}>
                    A/C: {item.receiver_account_number.slice(-4).padStart(item.receiver_account_number.length, '*')}
                  </Text>
                </View>
                <Text style={styles.historyAmount}>-₹{item.amount}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No transfers yet</Text>
          )}
        </View>
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
  content: { flex: 1 },
  selectedAccount: {
    margin: 16, marginBottom: 0, padding: 14,
    backgroundColor: '#f8f9fa', borderRadius: 12,
    borderWidth: 1, borderColor: '#e0e0e0',
  },
  fromLabel: { fontSize: 11, color: '#999', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  selectedAccountInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  bankIcon: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#e8f0fe', justifyContent: 'center', alignItems: 'center',
  },
  selectedBankName: { fontSize: 14, fontWeight: '600', color: '#333' },
  selectedAccNum: { fontSize: 12, color: '#666', marginTop: 1 },
  tabContainer: {
    flexDirection: 'row', margin: 16,
    backgroundColor: '#f5f5f5', borderRadius: 12, padding: 4,
  },
  tab: {
    flex: 1, flexDirection: 'row', justifyContent: 'center',
    alignItems: 'center', paddingVertical: 12, borderRadius: 10, gap: 8,
  },
  activeTab: { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  tabText: { fontSize: 14, color: '#666', fontWeight: '500' },
  activeTabText: { color: '#1a73e8' },
  form: { padding: 16, paddingTop: 8 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 6, marginTop: 12 },
  input: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 12,
    padding: 14, fontSize: 16, backgroundColor: '#f8f9fa', color: '#333',
  },
  amountContainer: {
    flexDirection: 'row', alignItems: 'center',
    borderBottomWidth: 2, borderBottomColor: '#1a73e8', paddingBottom: 8,
  },
  currencySymbol: { fontSize: 24, fontWeight: 'bold', color: '#333', marginRight: 8 },
  amountInput: { flex: 1, fontSize: 24, color: '#333' },
  transferButton: {
    backgroundColor: '#1a73e8', padding: 16, borderRadius: 25,
    alignItems: 'center', marginTop: 24,
  },
  transferButtonDisabled: { backgroundColor: '#93c5fd' },
  transferButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  historySection: { padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 12 },
  historyItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  historyIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#e8f0fe', justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  historyInfo: { flex: 1 },
  historyName: { fontSize: 14, fontWeight: '500', color: '#333' },
  historyAccount: { fontSize: 12, color: '#999', marginTop: 2 },
  historyAmount: { fontSize: 14, fontWeight: '600', color: '#c62828' },
  emptyText: { color: '#999', textAlign: 'center', paddingVertical: 20 },
});