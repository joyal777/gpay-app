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
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';

export default function AddBankAccountScreen({ navigation }: any) {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<any>(null);
  
  const [accountNumber, setAccountNumber] = useState('');
  const [confirmAccount, setConfirmAccount] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountPin, setAccountPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [selectedAccountForPin, setSelectedAccountForPin] = useState<any>(null);
  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');
  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      const res = await api.get('/bank/accounts');
      setAccounts(res.data.accounts || []);
    } catch (error) {}
  };

  const resetForm = () => {
    setAccountNumber('');
    setConfirmAccount('');
    setIfscCode('');
    setAccountHolder('');
    setBankName('');
    setAccountPin('');
    setEditingAccount(null);
  };

  const handleEdit = (account: any) => {
    setEditingAccount(account);
    setAccountNumber(account.account_number);
    setConfirmAccount(account.account_number);
    setIfscCode(account.ifsc_code);
    setAccountHolder(account.account_holder);
    setBankName(account.bank_name || '');
    setAccountPin('');
    setShowForm(true);
  };

  const showPinModal = (account: any) => {
  setSelectedAccountForPin(account);
  setNewPin('');
  setConfirmNewPin('');
  setPinModalVisible(true);
};

const handleSetPin = async () => {
  if (!newPin || newPin.length !== 4) {
    Alert.alert('Error', 'PIN must be 4 digits');
    return;
  }
  if (newPin !== confirmNewPin) {
    Alert.alert('Error', 'PINs do not match');
    return;
  }

  setLoading(true);
  try {
    await api.post(`/bank/account/${selectedAccountForPin.id}/pin`, {
      account_pin: newPin,
    });
    Alert.alert('Success', 'PIN set successfully!');
    setPinModalVisible(false);
    loadAccounts();
  } catch (error: any) {
    Alert.alert('Error', error.response?.data?.message || 'Failed');
  } finally {
    setLoading(false);
  }
};

  const handleSave = async () => {
    if (!accountNumber || !confirmAccount || !ifscCode || !accountHolder) {
      Alert.alert('Error', 'Please fill all fields');
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

    if (!editingAccount && !accountPin) {
      Alert.alert('Error', 'PIN is required for new account');
      return;
    }

    if (!editingAccount && accountPin.length !== 4) {
      Alert.alert('Error', 'PIN must be 4 digits');
      return;
    }

    setLoading(true);
    try {
      if (editingAccount) {
        // For edit: delete old and create new (since we can't update hashed PIN easily)
        // Or just update non-PIN fields
        Alert.alert('Info', 'To change PIN, please remove and re-add the account');
        setShowForm(false);
        resetForm();
        return;
      }

      await api.post('/bank/account', {
        account_number: accountNumber,
        ifsc_code: ifscCode,
        account_holder: accountHolder,
        bank_name: bankName,
        account_pin: accountPin,
      });

      Alert.alert('Success', editingAccount ? 'Account updated!' : 'Bank account added!', [
        { text: 'OK', onPress: () => {
          setShowForm(false);
          resetForm();
          loadAccounts();
        }}
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefault = async (id: number) => {
    try {
      await api.post(`/bank/account/${id}/default`);
      Alert.alert('Success', 'Default account updated');
      loadAccounts();
    } catch (error) {}
  };

  const handleDelete = (account: any) => {
    if (account.is_default) {
      Alert.alert('Cannot Delete', 'Set another account as default first before removing this one.');
      return;
    }
    Alert.alert(
      'Remove Account',
      `Remove account ****${account.account_number?.slice(-4)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive', 
          onPress: async () => {
            try {
              await api.delete(`/bank/account/${account.id}`);
              Alert.alert('Removed', 'Bank account removed');
              loadAccounts();
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.message || 'Failed');
            }
          }
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bank Accounts</Text>
        <TouchableOpacity onPress={() => {
          resetForm();
          setShowForm(!showForm);
        }}>
          <Ionicons name={showForm ? "close" : "add-circle"} size={28} color="#1a73e8" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Info */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={20} color="#1a73e8" />
          <Text style={styles.infoText}>
            Add multiple bank accounts. Set one as default for quick transfers.
          </Text>
        </View>

        {/* Account List */}
        {accounts.length === 0 && !showForm ? (
          <View style={styles.emptyState}>
            <Ionicons name="business-outline" size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>No Bank Accounts</Text>
            <Text style={styles.emptySubtext}>Tap + to add your first account</Text>
          </View>
        ) : (
          accounts.map((acc) => (
            <View key={acc.id} style={styles.accountCard}>
              <View style={styles.accountIcon}>
                <Ionicons name="business" size={24} color="#1a73e8" />
              </View>
              <View style={styles.accountInfo}>
                <View style={styles.accountHeader}>
                  <Text style={styles.bankName}>{acc.bank_name || 'Bank Account'}</Text>
                  {acc.is_default && (
                    <View style={styles.defaultBadge}>
                      <Text style={styles.defaultText}>Default</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.accNum}>****{acc.account_number?.slice(-4)}</Text>
                <Text style={styles.accHolder}>{acc.account_holder}</Text>
                <Text style={styles.ifsc}>IFSC: {acc.ifsc_code}</Text>
              </View>
              
              {/* Actions */}
              {/* Actions */}
            <View style={styles.actionColumn}>
            <TouchableOpacity 
                style={styles.actionBtn}
                onPress={() => handleEdit(acc)}
            >
                <Ionicons name="pencil" size={18} color="#1a73e8" />
            </TouchableOpacity>
            
            {/* Set PIN button */}
            <TouchableOpacity 
                style={styles.actionBtn}
                onPress={() => showPinModal(acc)}
            >
                <Ionicons name="key" size={18} color="#7c3aed" />
            </TouchableOpacity>
            
            {!acc.is_default && (
                <TouchableOpacity 
                style={styles.actionBtn}
                onPress={() => handleSetDefault(acc.id)}
                >
                <Ionicons name="star-outline" size={18} color="#f59e0b" />
                </TouchableOpacity>
            )}
            
            <TouchableOpacity 
                style={styles.actionBtn}
                onPress={() => handleDelete(acc)}
            >
                <Ionicons name="trash-outline" size={18} color={acc.is_default ? '#ccc' : '#c62828'} />
            </TouchableOpacity>
            </View>
            </View>
          ))
        )}

        {/* Add/Edit Form */}
        {showForm && (
          <View style={styles.form}>
            <Text style={styles.formTitle}>
              {editingAccount ? 'Edit Account' : 'Add New Account'}
            </Text>
            
            <Text style={styles.label}>Account Holder Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Full name as on bank account"
              value={accountHolder}
              onChangeText={setAccountHolder}
            />
            
            <Text style={styles.label}>Bank Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. State Bank of India"
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
              placeholder="e.g. SBIN0001234"
              value={ifscCode}
              onChangeText={setIfscCode}
              autoCapitalize="characters"
              maxLength={11}
            />
            
            {!editingAccount && (
              <>
                <Text style={styles.label}>Set PIN (4 digits) *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Create 4-digit PIN for this account"
                  value={accountPin}
                  onChangeText={setAccountPin}
                  keyboardType="numeric"
                  maxLength={4}
                  secureTextEntry
                />
              </>
            )}
            
            {editingAccount && (
              <View style={styles.editNote}>
                <Ionicons name="information-circle" size={16} color="#f59e0b" />
                <Text style={styles.editNoteText}>
                  PIN cannot be changed. Remove and re-add account to set new PIN.
                </Text>
              </View>
            )}
            
            <View style={styles.formButtons}>
              <TouchableOpacity 
                style={styles.cancelBtn}
                onPress={() => {
                  setShowForm(false);
                  resetForm();
                }}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.saveBtn, loading && styles.saveBtnDisabled]}
                onPress={handleSave}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.saveBtnText}>
                    {editingAccount ? 'Update' : 'Add Account'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
      {/* Set PIN Modal */}
     <Modal visible={pinModalVisible} transparent animationType="fade">
     <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>Set Account PIN</Text>
        <Text style={styles.modalSubtitle}>
            {selectedAccountForPin?.bank_name || 'Bank'} - ****{selectedAccountForPin?.account_number?.slice(-4)}
        </Text>
        
        <Text style={styles.label}>New PIN (4 digits)</Text>
        <TextInput
            style={styles.input}
            placeholder="Enter 4-digit PIN"
            value={newPin}
            onChangeText={setNewPin}
            keyboardType="numeric"
            maxLength={4}
            secureTextEntry
        />
        
        <Text style={styles.label}>Confirm PIN</Text>
        <TextInput
            style={styles.input}
            placeholder="Re-enter PIN"
            value={confirmNewPin}
            onChangeText={setConfirmNewPin}
            keyboardType="numeric"
            maxLength={4}
            secureTextEntry
        />
        
        <View style={styles.modalButtons}>
            <TouchableOpacity 
            style={styles.modalCancelBtn}
            onPress={() => setPinModalVisible(false)}
            >
            <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
            style={styles.modalSaveBtn}
            onPress={handleSetPin}
            >
            <Text style={styles.saveBtnText}>Set PIN</Text>
            </TouchableOpacity>
        </View>
        </View>
     </View>
     </Modal>
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
  infoCard: {
    flexDirection: 'row', alignItems: 'center',
    margin: 16, padding: 12,
    backgroundColor: '#e8f0fe', borderRadius: 10,
    gap: 8,
  },
  infoText: { flex: 1, fontSize: 13, color: '#1a73e8' },
  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#333', marginTop: 12 },
  emptySubtext: { fontSize: 14, color: '#999', marginTop: 4 },
  accountCard: {
    flexDirection: 'row', alignItems: 'flex-start',
    marginHorizontal: 16, marginBottom: 10,
    padding: 14, backgroundColor: '#f8f9fa', borderRadius: 12,
  },
  accountIcon: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#e8f0fe', justifyContent: 'center',
    alignItems: 'center', marginRight: 12, marginTop: 2,
  },
  accountInfo: { flex: 1 },
  accountHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  bankName: { fontSize: 15, fontWeight: '600', color: '#333' },
  defaultBadge: {
    backgroundColor: '#e8f5e9', paddingHorizontal: 8,
    paddingVertical: 2, borderRadius: 8,
  },
  defaultText: { fontSize: 10, color: '#2e7d32', fontWeight: '600' },
  accNum: { fontSize: 13, color: '#666', marginTop: 2 },
  accHolder: { fontSize: 12, color: '#999' },
  ifsc: { fontSize: 11, color: '#999', marginTop: 2 },
  actionColumn: { gap: 8, marginLeft: 8 },
  actionBtn: { padding: 4 },
  form: {
    margin: 16, padding: 16,
    backgroundColor: '#f8f9fa', borderRadius: 12,
  },
  formTitle: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 8 },
  label: { fontSize: 13, fontWeight: '600', color: '#333', marginBottom: 4, marginTop: 10 },
  input: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 10,
    padding: 12, fontSize: 15, backgroundColor: '#fff', color: '#333',
  },
  editNote: {
    flexDirection: 'row', alignItems: 'center',
    marginTop: 12, gap: 6,
    backgroundColor: '#fff8e1', padding: 10, borderRadius: 8,
  },
  editNoteText: { flex: 1, fontSize: 12, color: '#f59e0b' },
  formButtons: {
    flexDirection: 'row', gap: 10, marginTop: 16,
  },
  cancelBtn: {
    flex: 1, padding: 14, borderRadius: 25,
    borderWidth: 1, borderColor: '#ddd', alignItems: 'center',
  },
  cancelBtnText: { fontSize: 14, color: '#666', fontWeight: '500' },
  saveBtn: {
    flex: 1, backgroundColor: '#1a73e8', padding: 14,
    borderRadius: 25, alignItems: 'center',
  },
  saveBtnDisabled: { backgroundColor: '#93c5fd' },
  saveBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  modalOverlay: {
  flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
  justifyContent: 'center', alignItems: 'center',
},
modalContent: {
  backgroundColor: '#fff', borderRadius: 16,
  padding: 24, width: '85%',
},
modalTitle: { fontSize: 18, fontWeight: '600', color: '#333', textAlign: 'center' },
modalSubtitle: { fontSize: 13, color: '#666', textAlign: 'center', marginTop: 6, marginBottom: 16 },
modalButtons: { flexDirection: 'row', gap: 10, marginTop: 16 },
modalCancelBtn: {
  flex: 1, padding: 14, borderRadius: 25,
  borderWidth: 1, borderColor: '#ddd', alignItems: 'center',
},
modalSaveBtn: {
  flex: 1, backgroundColor: '#7c3aed', padding: 14,
  borderRadius: 25, alignItems: 'center',
},
});