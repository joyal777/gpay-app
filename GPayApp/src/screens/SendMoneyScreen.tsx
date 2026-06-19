import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { IMAGE_BASE } from '../services/config';

export default function SendMoneyScreen({ navigation }: any) {
  const { user, refreshProfile } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);

  const searchUsers = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 1) {
      setUsers([]);
      return;
    }

    setLoading(true);
    try {
      const response = await api.get(`/users/search?q=${query}`);
      setUsers(response.data.users);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMoneyWithPin = () => {
    if (!selectedUser || !amount) {
      Alert.alert('Error', 'Please select user and enter amount');
      return;
    }
    
    // Navigate to PIN screen
    navigation.navigate('Pin', {
      amount: amount,
      receiverName: selectedUser.name,
      onSuccess: handleSendMoney,
    });
  };
  const handleSendMoney = async () => {
    if (!selectedUser || !amount) {
      Alert.alert('Error', 'Please select user and enter amount');
      return;
    }

    setSending(true);
    try {
      const response = await api.post('/wallet/send-money', {
        upi_id: selectedUser.upi_id,
        amount: parseFloat(amount),
        note: note || undefined,
      });

    Alert.alert('Success', `Sent ₹${amount} to ${selectedUser.name}`, [
    { text: 'Done', onPress: () => {
        setSelectedUser(null);
        setAmount('');
        setNote('');
        setSearchQuery('');
        setUsers([]);
        refreshProfile();
    }},
    { text: 'Send Message', onPress: () => {
        setSelectedUser(null);
        setAmount('');
        setNote('');
        setSearchQuery('');
        setUsers([]);
        navigation.navigate('Chat', { chatUser: selectedUser });
    }},
    ]);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Payment failed');
    } finally {
      setSending(false);
    }
  };

  const renderUser = ({ item }: any) => (
    <TouchableOpacity 
        style={[
        styles.userItem,
        selectedUser?.id === item.id && styles.selectedUser
        ]}
        onPress={() => setSelectedUser(item)}
    >
        <View style={styles.userLeft}>
        {item.profile_pic ? (
            <Image source={{ uri: IMAGE_BASE + item.profile_pic }} style={styles.userPic} />
        ) : (
            <View style={styles.userPicPlaceholder}>
            <Text style={styles.userPicText}>{item.name?.charAt(0)}</Text>
            </View>
        )}
        <View>
            <Text style={styles.userName}>{item.name}</Text>
            <Text style={styles.userUpi}>{item.upi_id}</Text>
        </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 15, alignItems: 'center' }}>
        <TouchableOpacity onPress={() => navigation.navigate('Chat', { chatUser: item })}>
            <Ionicons name="chatbubble-outline" size={22} color="#1a73e8" />
        </TouchableOpacity>
        {selectedUser?.id === item.id && (
            <Ionicons name="checkmark-circle" size={24} color="#1a73e8" />
        )}
        </View>
    </TouchableOpacity>
    );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Send Money</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, phone or UPI ID"
          value={searchQuery}
          onChangeText={searchUsers}
          placeholderTextColor="#999"
        />
        {loading && <ActivityIndicator size="small" color="#1a73e8" />}
      </View>

      {/* User List */}
      {!selectedUser ? (
        <FlatList
          data={users}
          renderItem={renderUser}
          keyExtractor={(item: any) => item.id.toString()}
          style={styles.userList}
          ListEmptyComponent={
            searchQuery.length > 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="people-outline" size={48} color="#ccc" />
                <Text style={styles.emptyText}>No users found</Text>
              </View>
            ) : null
          }
        />
      ) : (
        /* Send Money Form */
        <View style={styles.sendForm}>
          {/* Selected User */}
          <View style={styles.selectedUserCard}>
            {selectedUser.profile_pic ? (
              <Image source={{ uri: IMAGE_BASE + selectedUser.profile_pic }} style={styles.bigPic} />
            ) : (
              <View style={styles.bigPicPlaceholder}>
                <Text style={styles.bigPicText}>{selectedUser.name?.charAt(0)}</Text>
              </View>
            )}
            <Text style={styles.selectedName}>{selectedUser.name}</Text>
            <Text style={styles.selectedUpi}>{selectedUser.upi_id}</Text>
            <TouchableOpacity onPress={() => setSelectedUser(null)}>
              <Text style={styles.changeText}>Change</Text>
            </TouchableOpacity>
          </View>

          {/* Amount Input */}
          <Text style={styles.amountLabel}>Enter Amount</Text>
          <View style={styles.amountContainer}>
            <Text style={styles.currencySymbol}>₹</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="0"
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              placeholderTextColor="#ccc"
            />
          </View>

          {/* Note */}
          <TextInput
            style={styles.noteInput}
            placeholder="Add a note (optional)"
            value={note}
            onChangeText={setNote}
            placeholderTextColor="#999"
          />

          {/* Send Button */}
          <TouchableOpacity 
            style={[styles.sendButton, (!amount || sending) && styles.sendButtonDisabled]}
            onPress={handleSendMoneyWithPin}
            disabled={!amount || sending}
          >
            {sending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.sendButtonText}>Send Money</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    paddingHorizontal: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  userList: {
    flex: 1,
  },
  userItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedUser: {
    backgroundColor: '#e8f0fe',
  },
  userLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  userPic: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
  },
  userPicPlaceholder: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#1a73e8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userPicText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  userUpi: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 50,
  },
  emptyText: {
    color: '#999',
    marginTop: 10,
  },
  sendForm: {
    flex: 1,
    padding: 20,
  },
  selectedUserCard: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 15,
    marginBottom: 30,
  },
  bigPic: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginBottom: 10,
  },
  bigPicPlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#1a73e8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  bigPicText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  selectedName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  selectedUpi: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
    marginBottom: 10,
  },
  changeText: {
    color: '#1a73e8',
    fontWeight: '500',
  },
  amountLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#1a73e8',
    paddingBottom: 10,
    marginBottom: 20,
  },
  currencySymbol: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 5,
  },
  amountInput: {
    flex: 1,
    fontSize: 28,
    color: '#333',
  },
  noteInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 15,
    fontSize: 14,
    marginBottom: 30,
  },
  sendButton: {
    backgroundColor: '#1a73e8',
    padding: 16,
    borderRadius: 25,
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#93c5fd',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});