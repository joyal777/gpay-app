import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Alert, ActivityIndicator, RefreshControl, TextInput, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function WalletScreen({ navigation }: any) {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [revealedBalances, setRevealedBalances] = useState<{[key: number]: boolean}>({});

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      const res = await api.get('/bank/accounts');
      setAccounts(res.data.accounts || []);
    } catch (error) {}
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAccounts();
    setRefreshing(false);
  };
  const verifyPinWithValue = async (pinValue: string) => {
    setLoading(true);
    try {
        const res = await api.post(`/bank/account/${selectedAccount.id}/verify-pin`, {
        account_pin: pinValue,
        });

        if (res.data.status) {
        setRevealedBalances(prev => ({ ...prev, [selectedAccount.id]: true }));
        setShowPinModal(false);
        setPin('');
        } else {
        Alert.alert('Error', 'Invalid PIN');
        setPin('');
        }
    } catch (error) {
        Alert.alert('Error', 'Verification failed');
        setPin('');
    } finally {
        setLoading(false);
    }
    };

  const handleViewBalance = (account: any) => {
    if (revealedBalances[account.id]) {
      // Hide it
      setRevealedBalances(prev => ({ ...prev, [account.id]: false }));
      return;
    }
    setSelectedAccount(account);
    setPin('');
    setShowPinModal(true);
  };

  const verifyPinForBalance = async () => {
    if (pin.length !== 4) {
      Alert.alert('Error', 'Enter 4-digit PIN');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post(`/bank/account/${selectedAccount.id}/verify-pin`, {
        account_pin: pin,
      });

      if (res.data.status) {
        setRevealedBalances(prev => ({ ...prev, [selectedAccount.id]: true }));
        setShowPinModal(false);
        setPin('');
      } else {
        Alert.alert('Error', 'Invalid PIN');
        setPin('');
      }
    } catch (error) {
      Alert.alert('Error', 'Verification failed');
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMoney = (account: any) => {
    if (!revealedBalances[account.id]) {
      Alert.alert('PIN Required', 'View balance first to add money');
      return;
    }
    navigation.navigate('AddMoneyToAccount', { account });
  };

  const getTotalBalance = () => {
    return accounts.reduce((sum, acc) => sum + (parseFloat(acc.balance) || 0), 0);
  };

  const getBankColor = (index: number) => {
    const colors = ['#E53935', '#1565C0', '#E65100', '#2E7D32', '#7B1FA2'];
    return colors[index % colors.length];
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Wallet & Accounts</Text>
        <TouchableOpacity onPress={() => navigation.navigate('AddBankAccount')}>
          <Ionicons name="add-circle" size={28} color="#1a73e8" />
        </TouchableOpacity>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1a73e8']} />}
        contentContainerStyle={styles.content}
      >
        {/* Total Balance (Hidden by default) */}
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Total Balance</Text>
          <Text style={styles.totalAmount}>
            {accounts.some(a => revealedBalances[a.id]) 
              ? `₹${getTotalBalance().toFixed(2)}` 
              : '••••••'}
          </Text>
          <Text style={styles.totalHint}>Enter PIN on any account to reveal</Text>
        </View>

        {/* Bank Accounts */}
        <Text style={styles.sectionTitle}>Bank Accounts</Text>

        {accounts.length > 0 ? (
          accounts.map((acc, index) => (
            <View key={acc.id} style={styles.accountCard}>
              <View style={[styles.accountIcon, { backgroundColor: getBankColor(index) + '20' }]}>
                <Ionicons name="business" size={24} color={getBankColor(index)} />
              </View>
              <View style={styles.accountInfo}>
                <View style={styles.nameRow}>
                  <Text style={styles.bankName}>{acc.bank_name || 'Bank'}</Text>
                  {acc.is_default && (
                    <View style={styles.defaultBadge}>
                      <Text style={styles.defaultText}>Default</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.accNumber}>****{acc.account_number?.slice(-4)}</Text>
                <Text style={styles.accUpi}>{acc.upi_id}</Text>
              </View>
              <View style={styles.balanceSection}>
                <TouchableOpacity onPress={() => handleViewBalance(acc)}>
                  <Text style={styles.balanceAmount}>
                    {revealedBalances[acc.id] 
                      ? `₹${parseFloat(acc.balance || 0).toFixed(2)}`
                      : '••••••'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleViewBalance(acc)}>
                  <Ionicons 
                    name={revealedBalances[acc.id] ? "eye-off" : "eye"} 
                    size={18} 
                    color="#999" 
                  />
                </TouchableOpacity>
              </View>
              
              {/* Add Money Button (only when revealed) */}
              {revealedBalances[acc.id] && (
                <TouchableOpacity 
                  style={styles.addMoneyBtn}
                  onPress={() => handleAddMoney(acc)}
                >
                  
                </TouchableOpacity>
              )}
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="business-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No bank accounts yet</Text>
          </View>
        )}
      </ScrollView>

      {/* PIN Modal */}
      <Modal visible={showPinModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.modalClose} onPress={() => { setShowPinModal(false); setPin(''); }}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
            
            <Ionicons name="lock-closed" size={40} color="#1a73e8" />
            <Text style={styles.modalTitle}>Enter PIN</Text>
            <Text style={styles.modalSubtitle}>
              {selectedAccount?.bank_name} - ****{selectedAccount?.account_number?.slice(-4)}
            </Text>

            <View style={styles.pinDots}>
              {[0, 1, 2, 3].map((i) => (
                <View key={i} style={[styles.dot, pin.length > i && styles.dotFilled]} />
              ))}
            </View>

            {loading && <ActivityIndicator size="small" color="#1a73e8" />}

            <View style={styles.keypad}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, '⌫'].map((num, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.key}
                  onPress={() => {
                    if (num === '⌫') setPin(pin.slice(0, -1));
                    else if (num !== '' && pin.length < 4) {
                      const newPin = pin + num;
                        setPin(newPin);
                        if (newPin.length === 4) {
                        // Pass the pin directly instead of reading from state
                        setTimeout(() => verifyPinWithValue(newPin), 200);
                        }
                    }
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
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', padding: 16, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#eee',
  },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#333' },
  content: { padding: 16, paddingBottom: 40 },
  totalCard: {
    backgroundColor: '#1a73e8', padding: 24, borderRadius: 16,
    marginBottom: 20, alignItems: 'center',
  },
  totalLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginBottom: 4 },
  totalAmount: { color: '#fff', fontSize: 36, fontWeight: 'bold' },
  totalHint: { color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 12 },
  accountCard: {
    backgroundColor: '#fff', padding: 14, borderRadius: 12,
    marginBottom: 10,
  },
  accountIcon: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center',
    position: 'absolute', top: 14, left: 14,
  },
  accountInfo: { marginLeft: 56, marginBottom: 8 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bankName: { fontSize: 14, fontWeight: '600', color: '#333' },
  defaultBadge: {
    backgroundColor: '#e8f5e9', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6,
  },
  defaultText: { fontSize: 9, color: '#2e7d32', fontWeight: '600' },
  accNumber: { fontSize: 12, color: '#666', marginTop: 2 },
  accUpi: { fontSize: 11, color: '#999', marginTop: 1 },
  balanceSection: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginLeft: 56, paddingVertical: 8,
    borderTopWidth: 1, borderTopColor: '#f0f0f0',
  },
  balanceAmount: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  addMoneyBtn: {
    flexDirection: 'row', alignItems: 'center',
    marginLeft: 56, marginTop: 4, gap: 4,
  },
  addMoneyText: { fontSize: 12, color: '#1a73e8', fontWeight: '500' },
  emptyState: { alignItems: 'center', paddingVertical: 30 },
  emptyText: { color: '#999', marginTop: 8 },
  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff', borderRadius: 20,
    padding: 24, width: '85%', alignItems: 'center',
  },
  modalClose: { position: 'absolute', top: 12, right: 12 },
  modalTitle: { fontSize: 18, fontWeight: '600', color: '#333', marginTop: 10 },
  modalSubtitle: { fontSize: 13, color: '#666', marginTop: 4, marginBottom: 20 },
  pinDots: { flexDirection: 'row', gap: 15, marginBottom: 20 },
  dot: { width: 14, height: 14, borderRadius: 7, borderWidth: 1, borderColor: '#ddd' },
  dotFilled: { backgroundColor: '#1a73e8', borderColor: '#1a73e8' },
  keypad: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', width: 260, gap: 10 },
  key: {
    width: 70, height: 55, justifyContent: 'center', alignItems: 'center',
    borderRadius: 12, backgroundColor: '#f5f5f5',
  },
  keyText: { fontSize: 24, fontWeight: '500', color: '#333' },
});