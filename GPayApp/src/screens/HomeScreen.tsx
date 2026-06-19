import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  TextInput,
  Image,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { useFocusEffect } from '@react-navigation/native';
import { IMAGE_BASE } from '../services/config';

export default function HomeScreen({ navigation }: any) {
  const { user, refreshProfile } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [chatUsers, setChatUsers] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useFocusEffect(
  useCallback(() => {
    loadTransactions();
    loadChatUsers();
  }, [])
);

  const loadTransactions = async () => {
    try {
      const response = await api.get('/wallet/transactions');
      if (response.data && response.data.data) {
        setRecentTransactions(response.data.data.slice(0, 5));
      }
    } catch (error) {
      // Silent fail - no transactions yet
      setRecentTransactions([]);
    }
};

const searchUsers = async (query: string) => {
  setSearchQuery(query);
  
  if (query.length < 1) {
    setSearchResults([]);
    setShowDropdown(false);
    return;
  }

  try {
    const response = await api.get(`/users/search?q=${query}`);
    setSearchResults(response.data.users);
    setShowDropdown(response.data.users.length > 0);
  } catch (error) {
    setSearchResults([]);
    setShowDropdown(false);
  }
};

const loadChatUsers = async () => {
  try {
    const response = await api.get('/chat/users');
    if (response.data && response.data.users) {
      setChatUsers(response.data.users);
    }
  } catch (error) {
    setChatUsers([]);
  }
};

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshProfile();
    await loadTransactions();
    setRefreshing(false);
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1a73e8']} />
        }
      >
        {/* TOP SECTION WITH BACKGROUND */}
        <View style={styles.topSection}>
          {/* Search Bar */}
          {/* Search Bar */}
          {/* Search Bar with Dropdown */}
          <View style={styles.searchWrapper}>
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#6e6c6c" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by UPI ID or phone number"
                placeholderTextColor="#f4f4f4"
                value={searchQuery}
                onChangeText={searchUsers}
                onFocus={() => {
                  if (searchResults.length > 0) setShowDropdown(true);
                }}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                  setShowDropdown(false);
                }}>
                  <Ionicons name="close-circle" size={20} color="#fff" />
                </TouchableOpacity>
              )}
            </View>

            {/* Dropdown - Positioned Absolutely */}
            {showDropdown && (
              <View style={styles.dropdown}>
                {searchResults.map((item: any) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setShowDropdown(false);
                      setSearchQuery('');
                      setSearchResults([]);
                      navigation.navigate('Chat', { chatUser: item });
                    }}
                  >
                    <View style={styles.dropdownPic}>
                      {item.profile_pic ? (
                        <Image 
                          source={{ uri: IMAGE_BASE + item.profile_pic }} 
                          style={styles.dropdownPicImage} 
                        />
                      ) : (
                        <Text style={styles.dropdownPicText}>
                          {item.name?.charAt(0)}
                        </Text>
                      )}
                    </View>
                    <View style={styles.dropdownInfo}>
                      <Text style={styles.dropdownName}>{item.name}</Text>
                      <Text style={styles.dropdownUpi}>{item.upi_id}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#999" />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Profile Card */}
          <TouchableOpacity 
            style={styles.profileCard}
            onPress={() => navigation.navigate('Profile')}
          >
            <View style={styles.profileLeft}>
              {user?.profile_pic ? (
                <Image source={{ uri: IMAGE_BASE + user.profile_pic }} style={styles.profilePic} />
              ) : (
                <View style={styles.profilePicPlaceholder}>
                  <Text style={styles.profilePicText}>
                    {user?.name?.charAt(0)?.toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={styles.profileInfo}>
                <Text style={styles.greeting}>Good morning,</Text>
                <Text style={styles.userName}>{user?.name}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* WHITE SECTION */}
        <View style={styles.whiteSection}>
          {/* Balance Card */}
          {/* <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Available Balance</Text>
            <Text style={styles.balanceAmount}>₹{user?.wallet?.balance || '0.00'}</Text>
          </View> */}
            {/* People - Chat Users */}
        <View style={styles.peopleSection}>
            <Text style={styles.sectionTitle}>People</Text>
            <FlatList
                horizontal
                data={chatUsers}
                renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.personItem}
                  onPress={() => navigation.navigate('Chat', { chatUser: item })}
                >
                  {item.profile_pic ? (
                    <Image 
                      source={{ uri: IMAGE_BASE + item.profile_pic }} 
                      style={styles.personPicImage} 
                    />
                  ) : (
                    <View style={styles.personPic}>
                      <Text style={styles.personPicText}>{item.name?.charAt(0)}</Text>
                    </View>
                  )}
                  <Text style={styles.personName} numberOfLines={1}>{item.name}</Text>
                </TouchableOpacity>
                )}
                keyExtractor={(item) => item.id.toString()}
                showsHorizontalScrollIndicator={false}
            />
        </View>
          {/* Quick Actions */}
          <View style={styles.actionsRow}>
            <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => navigation.navigate('SendMoney')}
                >
                <View style={[styles.actionIcon, { backgroundColor: '#e8f5e9' }]}>
                    <Ionicons name="send" size={24} color="#2e7d32" />
                </View>
                <Text style={styles.actionText}>Send</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton}>
              <View style={[styles.actionIcon, { backgroundColor: '#e3f2fd' }]}>
                <Ionicons name="qr-code" size={24} color="#1565c0" />
              </View>
              <Text style={styles.actionText}>Scan</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton}>
              <View style={[styles.actionIcon, { backgroundColor: '#fff3e0' }]}>
                <Ionicons name="wallet" size={24} color="#e65100" />
              </View>
              <Text style={styles.actionText}>Add Money</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton}>
              <View style={[styles.actionIcon, { backgroundColor: '#fce4ec' }]}>
                <Ionicons name="card" size={24} color="#c62828" />
              </View>
              <Text style={styles.actionText}>Pay Bill</Text>
            </TouchableOpacity>
          </View>

          {/* Recent Transactions */}
          <View style={styles.transactionsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Activity</Text>
              <TouchableOpacity>
                <Text style={styles.viewAll}>View All</Text>
              </TouchableOpacity>
            </View>

            {recentTransactions.length > 0 ? (
              recentTransactions.map((tx: any) => (
                <View key={tx.id} style={styles.transactionItem}>
  {/* Profile Pic of other person */}
  <View style={styles.txProfilePic}>
    <Text style={styles.txProfilePicText}>
      {tx.sender_id === user?.id 
        ? tx.receiver?.name?.charAt(0) 
        : tx.sender?.name?.charAt(0)}
    </Text>
  </View>
  
  <View style={styles.txInfo}>
    <Text style={styles.txName}>
      {tx.sender_id === user?.id 
        ? `You paid ${tx.receiver?.name || 'Unknown'}` 
        : `${tx.sender?.name || 'Unknown'} paid you`}
    </Text>
    <Text style={styles.txDate}>
      {new Date(tx.created_at).toLocaleDateString()} • {new Date(tx.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
    </Text>
  </View>
  
  {/* Debit/Credit indicator only, no amount */}
  <View style={[styles.txIndicator, {
    backgroundColor: tx.sender_id === user?.id ? '#fce4ec' : '#e8f5e9'
  }]}>
    <Ionicons 
      name={tx.sender_id === user?.id ? "arrow-up" : "arrow-down"} 
      size={16} 
      color={tx.sender_id === user?.id ? "#c62828" : "#2e7d32"} 
    />
  </View>
</View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="receipt-outline" size={48} color="#ccc" />
                <Text style={styles.emptyText}>No recent transactions</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#32bc82',
  },
  topSection: {
    backgroundColor: '#32bc82',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 30,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 25,
    paddingHorizontal: 15,
    marginBottom: 20,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#fff',
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  profileLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profilePic: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  profilePicPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  profilePicText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  profileInfo: {
    // empty
  },
  greeting: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  userName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 2,
  },
  whiteSection: {
    backgroundColor: '#f5f5f5',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    marginTop: -10,
    paddingHorizontal: 20,
    paddingTop: 20,
    minHeight: 500,
  },
  balanceCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a73e8',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  actionButton: {
    alignItems: 'center',
    width: '22%',
  },
  actionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  transactionsSection: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  viewAll: {
    fontSize: 14,
    color: '#1a73e8',
    fontWeight: '500',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  txIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  txProfilePic: {
  width: 40,
  height: 40,
  borderRadius: 20,
  backgroundColor: '#e8f0fe',
  justifyContent: 'center',
  alignItems: 'center',
  marginRight: 12,
},
txProfilePicText: {
  color: '#1a73e8',
  fontSize: 16,
  fontWeight: 'bold',
},
txIndicator: {
  width: 32,
  height: 32,
  borderRadius: 16,
  justifyContent: 'center',
  alignItems: 'center',
},
  txInfo: {
    flex: 1,
  },
  txName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  txDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  txAmount: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyText: {
    color: '#999',
    marginTop: 10,
    fontSize: 14,
  },
  peopleSection: {
    marginBottom: 20,
  },
    personItem: {
    alignItems: 'center',
    marginRight: 20,
    width: 65,
    },
    personPic: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    backgroundColor: '#1a73e8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
    },
    personPicText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    },
    personName: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
    },

    searchWrapper: {
      position: 'relative',
      zIndex: 10,
    },
    dropdown: {
      position: 'absolute',
      top: 50, // Height of search bar
      left: 0,
      right: 0,
      backgroundColor: '#fff',
      borderRadius: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 8,
      zIndex: 100,
      maxHeight: 300,
    },
    dropdownItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 14,
      borderBottomWidth: 1,
      borderBottomColor: '#f0f0f0',
      gap: 12,
    },
    dropdownPic: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: '#1a73e8',
      justifyContent: 'center',
      alignItems: 'center',
    },
    dropdownPicText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: 'bold',
    },
    dropdownInfo: {
      flex: 1,
    },
    dropdownName: {
      fontSize: 15,
      fontWeight: '500',
      color: '#333',
    },
    dropdownUpi: {
      fontSize: 12,
      color: '#999',
      marginTop: 2,
    },
    personPicImage: {
  width: 55,
  height: 55,
  borderRadius: 27.5,
  marginBottom: 5,
},
dropdownPicImage: {
  width: 40,
  height: 40,
  borderRadius: 20,
},

});