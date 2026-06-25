import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Alert, ActivityIndicator, TextInput, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function WalletScreen({ navigation }: any) {
  const { user, refreshProfile } = useAuth();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddMoney, setShowAddMoney] = useState(false);
  const [addAmount, setAddAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [totalBalance, setTotalBalance] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [accRes, walRes] = await Promise.all([
        api.get('/bank/accounts'),
        api.get('/wallet/balance'),
      ]);
      
      const accs = accRes.data.accounts || [];
      setAccounts(accs);
      setWalletBalance(parseFloat(walRes.data.data?.balance) || 0);
      
      // Calculate total
      const bankTotal = accs.reduce((sum: number, a: any) => sum + (parseFloat(a.balance) || 0), 0);
      setTotalBalance(parseFloat(walRes.data.data?.balance || 0) + bankTotal);
    } catch (error) {
      console.error('Error loading wallet:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    await refreshProfile?.();
    setRefreshing(false);
  };

  const handleAddMoney = async () => {
    if (!addAmount || parseFloat(addAmount) <= 0) {
      Alert.alert('Error', 'Enter valid amount');
      return;
    }

    setLoading(true);
    try {
      await api.post('/wallet/add-money', {
        amount: parseFloat(addAmount),
      });

      Alert.alert('Success', `₹${addAmount} added to wallet!`);
      setAddAmount('');
      setShowAddMoney(false);
      loadData();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed');
    } finally {
      setLoading(false);
    }
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
        <TouchableOpacity onPress={() => setShowAddMoney(!showAddMoney)}>
          <Ionicons name={showAddMoney ? "close" : "add-circle"} size={28} color="#1a73e8" />
        </TouchableOpacity>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1a73e8']} />}
        contentContainerStyle={styles.content}
      >
        {/* Total Balance Card */}
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Total Balance</Text>
          <Text style={styles.totalAmount}>₹{totalBalance.toFixed(2)}</Text>
          <View style={styles.totalRow}>
            <View style={styles.totalItem}>
              <Text style={styles.totalItemLabel}>Wallet</Text>
              <Text style={styles.totalItemValue}>₹{walletBalance.toFixed(2)}</Text>
            </View>
            <View style={styles.totalDivider} />
            <View style={styles.totalItem}>
              <Text style={styles.totalItemLabel}>Bank Accounts</Text>
              <Text style={styles.totalItemValue}>
                ₹{(totalBalance - walletBalance).toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        {/* Add Money Section */}
        {showAddMoney && (
          <View style={styles.addMoneyCard}>
            <Text style={styles.addMoneyTitle}>Add Money to Wallet</Text>
            <View style={styles.addMoneyRow}>
              <Text style={styles.currencySymbol}>₹</Text>
              <TextInput
                style={styles.addMoneyInput}
                placeholder="Enter amount"
                value={addAmount}
                onChangeText={setAddAmount}
                keyboardType="decimal-pad"
                placeholderTextColor="#999"
              />
            </View>
            <TouchableOpacity 
              style={[styles.addButton, (!addAmount || loading) && styles.addButtonDisabled]}
              onPress={handleAddMoney}
              disabled={!addAmount || loading}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.addButtonText}>Add Money</Text>}
            </TouchableOpacity>
          </View>
        )}

        {/* Main Wallet */}
        <View style={styles.sectionHeader}>
          <Ionicons name="wallet" size={20} color="#1a73e8" />
          <Text style={styles.sectionTitle}>GPay Wallet</Text>
        </View>
        
        <View style={styles.accountCard}>
          <View style={[styles.accountIcon, { backgroundColor: '#E8F0FE' }]}>
            <Ionicons name="wallet" size={24} color="#1a73e8" />
          </View>
          <View style={styles.accountInfo}>
            <Text style={styles.accountName}>Main Wallet</Text>
            <Text style={styles.accountUpi}>{user?.upi_id}</Text>
          </View>
          <Text style={styles.accountBalance}>₹{walletBalance.toFixed(2)}</Text>
        </View>

        {/* Bank Accounts */}
        <View style={styles.sectionHeader}>
          <Ionicons name="business" size={20} color="#1a73e8" />
          <Text style={styles.sectionTitle}>Bank Accounts</Text>
        </View>

        {accounts.length > 0 ? (
          accounts.map((acc, index) => (
            <View key={acc.id} style={styles.accountCard}>
              <View style={[styles.accountIcon, { backgroundColor: getBankColor(index) + '20' }]}>
                <Ionicons name="business" size={24} color={getBankColor(index)} />
              </View>
              <View style={styles.accountInfo}>
                <View style={styles.accountNameRow}>
                  <Text style={styles.accountName}>{acc.bank_name || 'Bank'}</Text>
                  {acc.is_default && (
                    <View style={styles.defaultBadge}>
                      <Text style={styles.defaultText}>Default</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.accountNumber}>****{acc.account_number?.slice(-4)}</Text>
                <Text style={styles.accountUpi}>{acc.upi_id}</Text>
              </View>
              <View style={styles.accountBalanceContainer}>
                <Text style={styles.accountBalance}>₹{parseFloat(acc.balance || 0).toFixed(2)}</Text>
                <Text style={styles.accountIfsc}>IFSC: {acc.ifsc_code}</Text>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="business-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No bank accounts</Text>
            <TouchableOpacity onPress={() => navigation.navigate('AddBankAccount')}>
              <Text style={styles.addAccountLink}>+ Add Bank Account</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.quickAction}
            onPress={() => navigation.navigate('AddBankAccount')}
          >
            <Ionicons name="add-circle-outline" size={20} color="#1a73e8" />
            <Text style={styles.quickActionText}>Add Account</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.quickAction}
            onPress={() => setShowAddMoney(true)}
          >
            <Ionicons name="cash-outline" size={20} color="#2e7d32" />
            <Text style={styles.quickActionText}>Add Money</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    backgroundColor: '#1a73e8', padding: 20, borderRadius: 16,
    marginBottom: 16, alignItems: 'center',
  },
  totalLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginBottom: 4 },
  totalAmount: { color: '#fff', fontSize: 36, fontWeight: 'bold' },
  totalRow: { flexDirection: 'row', marginTop: 15, width: '100%' },
  totalItem: { flex: 1, alignItems: 'center' },
  totalItemLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 11 },
  totalItemValue: { color: '#fff', fontSize: 16, fontWeight: '600', marginTop: 4 },
  totalDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.3)' },
  addMoneyCard: {
    backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 16,
  },
  addMoneyTitle: { fontSize: 15, fontWeight: '600', color: '#333', marginBottom: 10 },
  addMoneyRow: {
    flexDirection: 'row', alignItems: 'center',
    borderBottomWidth: 2, borderBottomColor: '#1a73e8', paddingBottom: 8, marginBottom: 12,
  },
  currencySymbol: { fontSize: 22, fontWeight: 'bold', color: '#333', marginRight: 8 },
  addMoneyInput: { flex: 1, fontSize: 22, color: '#333' },
  addButton: { backgroundColor: '#1a73e8', padding: 12, borderRadius: 25, alignItems: 'center' },
  addButtonDisabled: { backgroundColor: '#93c5fd' },
  addButtonText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center',
    marginBottom: 10, marginTop: 5, gap: 8,
  },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#333' },
  accountCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', padding: 14, borderRadius: 12,
    marginBottom: 10, gap: 12,
  },
  accountIcon: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center',
  },
  accountInfo: { flex: 1 },
  accountNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  accountName: { fontSize: 14, fontWeight: '600', color: '#333' },
  defaultBadge: {
    backgroundColor: '#e8f5e9', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6,
  },
  defaultText: { fontSize: 9, color: '#2e7d32', fontWeight: '600' },
  accountNumber: { fontSize: 12, color: '#666', marginTop: 2 },
  accountUpi: { fontSize: 11, color: '#999', marginTop: 1 },
  accountBalance: { fontSize: 16, fontWeight: 'bold', color: '#1a73e8' },
  accountBalanceContainer: { alignItems: 'flex-end' },
  accountIfsc: { fontSize: 10, color: '#999', marginTop: 2 },
  emptyState: { alignItems: 'center', paddingVertical: 20 },
  emptyText: { color: '#999', marginTop: 8 },
  addAccountLink: { color: '#1a73e8', fontWeight: '500', marginTop: 6 },
  quickActions: {
    flexDirection: 'row', gap: 10, marginTop: 20,
  },
  quickAction: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', backgroundColor: '#fff',
    padding: 14, borderRadius: 12, gap: 8,
  },
  quickActionText: { fontSize: 13, fontWeight: '500', color: '#333' },
});