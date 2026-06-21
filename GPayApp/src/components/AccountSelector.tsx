import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Account {
  id: number;
  bank_name: string;
  account_number: string;
  account_holder: string;
  is_default: boolean;
}

interface Props {
  visible: boolean;
  accounts: Account[];
  selectedId: number | null;
  onSelect: (account: Account) => void;
  onClose: () => void;
}

export default function AccountSelector({ visible, accounts, selectedId, onSelect, onClose }: Props) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity style={styles.sheet} activeOpacity={1}>
          <View style={styles.handle} />
          <Text style={styles.title}>Select Bank Account</Text>
          
          {accounts.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="business-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>No bank accounts added</Text>
            </View>
          ) : (
            <FlatList
              data={accounts}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={[
                    styles.accountItem, 
                    selectedId === item.id && styles.selectedItem
                  ]}
                  onPress={() => onSelect(item)}
                >
                  <View style={styles.radio}>
                    {selectedId === item.id && <View style={styles.radioSelected} />}
                  </View>
                  <View style={styles.accountInfo}>
                    <Text style={styles.bankName}>
                      {item.bank_name || 'Bank Account'}
                    </Text>
                    <Text style={styles.accountNumber}>
                      A/C: ****{item.account_number?.slice(-4)}
                    </Text>
                    <Text style={styles.accountHolder}>{item.account_holder}</Text>
                  </View>
                  {item.is_default && (
                    <View style={styles.defaultBadge}>
                      <Text style={styles.defaultText}>Default</Text>
                    </View>
                  )}
                </TouchableOpacity>
              )}
            />
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '60%',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#ddd',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 15,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  accountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#f8f9fa',
  },
  selectedItem: {
    backgroundColor: '#e8f0fe',
    borderWidth: 1,
    borderColor: '#1a73e8',
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#1a73e8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  radioSelected: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#1a73e8',
  },
  accountInfo: {
    flex: 1,
  },
  bankName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
  },
  accountNumber: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  accountHolder: {
    fontSize: 12,
    color: '#999',
  },
  defaultBadge: {
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  defaultText: {
    fontSize: 11,
    color: '#2e7d32',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyText: {
    color: '#999',
    marginTop: 10,
  },
});