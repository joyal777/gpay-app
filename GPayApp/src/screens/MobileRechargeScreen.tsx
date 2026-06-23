import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, Alert, ActivityIndicator, FlatList, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { IMAGE_BASE } from '../services/config';

const OPERATORS = [
  { id: 'airtel', name: 'Airtel', color: '#E53935', icon: 'sim-card' },
  { id: 'jio', name: 'Jio', color: '#1565C0', icon: 'sim-card' },
  { id: 'vi', name: 'Vi', color: '#E65100', icon: 'sim-card' },
  { id: 'bsnl', name: 'BSNL', color: '#2E7D32', icon: 'sim-card' },
];

export default function MobileRechargeScreen({ navigation }: any) {
  const { user, refreshProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'self' | 'others'>('self');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedOperator, setSelectedOperator] = useState<string>('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [plans, setPlans] = useState<any[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    if (activeTab === 'self') {
      setSelectedUser(user);
      setMobileNumber(user?.mobile_number_recharge || user?.phone || '');
      setSelectedOperator(user?.mobile_network || '');
      if (user?.mobile_network) loadPlans(user.mobile_network);
    }
    loadHistory();
  }, []);

  const loadPlans = async (operator: string) => {
    setLoading(true);
    try {
      const res = await api.get(`/recharge/plans?operator=${operator}`);
      setPlans(res.data.plans || []);
    } catch (error) {
      setPlans([]);
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      const res = await api.get('/recharge/history');
      setHistory(res.data.recharges?.data || []);
    } catch (error) {}
  };

  const searchUsers = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 1) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await api.get(`/users/search?q=${query}`);
      setSearchResults(res.data.users || []);
    } catch (error) {}
  };

  const handleUserSelect = async (selected: any) => {
    setSelectedUser(selected);
    setSearchQuery('');
    setSearchResults([]);
    setSelectedPlan(null);
    setPlans([]);
    
    try {
        const res = await api.get(`/recharge/user/${selected.id}/network`);
        const userData = res.data.user;
        
        // Auto-fill mobile number
        setMobileNumber(userData.mobile_number_recharge || selected.phone || '');
        
        // Auto-select operator if set
        if (userData.mobile_network) {
        setSelectedOperator(userData.mobile_network);
        loadPlans(userData.mobile_network);
        } else {
        setSelectedOperator('');
        }
    } catch (error) {
        // Fallback - just use phone number
        setMobileNumber(selected.phone || '');
        setSelectedOperator('');
    }
    };

  const handleOperatorSelect = (operator: string) => {
    setSelectedOperator(operator);
    setSelectedPlan(null);
    loadPlans(operator);
  };

  const handleRecharge = () => {
    if (!selectedPlan) {
      Alert.alert('Error', 'Select a plan');
      return;
    }
    if (!mobileNumber || mobileNumber.length < 10) {
      Alert.alert('Error', 'Enter valid mobile number');
      return;
    }

    navigation.navigate('Payment', {
      amount: selectedPlan.amount.toString(),
      receiverName: `${selectedOperator.toUpperCase()} Recharge`,
      note: selectedPlan.plan_name,
      type: 'recharge',
      onComplete: async () => {
        try {
          const res = await api.post('/recharge', {
            mobile_number: mobileNumber,
            operator: selectedOperator,
            plan_id: selectedPlan.id,
            amount: selectedPlan.amount,
          });
          
          Alert.alert('Success', 'Recharge successful!', [
            { text: 'View Invoice', onPress: () => {
              navigation.navigate('RechargeInvoice', { 
                invoice: res.data.invoice,
                chatUser: selectedUser 
              });
            }},
            { text: 'OK' }
          ]);
          loadHistory();
        } catch (error: any) {
          Alert.alert('Error', error.response?.data?.message || 'Recharge failed');
        }
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
        <Text style={styles.headerTitle}>Mobile Recharge</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Tabs */}
        {/* Tabs */}
        <View style={styles.tabContainer}>
            <TouchableOpacity 
                style={[styles.tab, activeTab === 'self' && styles.activeTab]}
                onPress={() => {
                setActiveTab('self');
                setSelectedUser(user);
                setMobileNumber(user?.mobile_number_recharge || user?.phone || '');
                setSelectedOperator(user?.mobile_network || '');
                setSelectedPlan(null);
                setSearchQuery('');
                setSearchResults([]);
                if (user?.mobile_network) loadPlans(user.mobile_network);
                }}
            >
                <Text style={[styles.tabText, activeTab === 'self' && styles.activeTabText]}>
                My Number
                </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
                style={[styles.tab, activeTab === 'others' && styles.activeTab]}
                onPress={() => {
                setActiveTab('others');
                setSelectedUser(null);
                setSelectedOperator('');
                setSelectedPlan(null);
                setPlans([]);
                setMobileNumber('');
                }}
            >
                <Text style={[styles.tabText, activeTab === 'others' && styles.activeTabText]}>
                For Others
                </Text>
            </TouchableOpacity>
        </View>

        {/* Search for Others */}
        {activeTab === 'others' && (
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#999" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search person by name or phone"
              value={searchQuery}
              onChangeText={searchUsers}
              placeholderTextColor="#999"
            />
          </View>
        )}

        {/* Search Results */}
        {searchResults.length > 0 && (
          <View style={styles.searchResults}>
            {searchResults.map((item: any) => (
              <TouchableOpacity
                key={item.id}
                style={styles.searchItem}
                onPress={() => handleUserSelect(item)}
              >
                <View style={styles.searchPic}>
                  {item.profile_pic ? (
                    <Image source={{ uri: IMAGE_BASE + item.profile_pic }} style={{ width: 36, height: 36, borderRadius: 18 }} />
                  ) : (
                    <Text style={styles.searchPicText}>{item.name?.charAt(0)}</Text>
                  )}
                </View>
                <View>
                  <Text style={styles.searchName}>{item.name}</Text>
                  <Text style={styles.searchPhone}>{item.phone}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Selected User */}
        {selectedUser && (
          <View style={styles.selectedUserCard}>
            <View style={styles.userPic}>
              <Text style={styles.userPicText}>{selectedUser.name?.charAt(0)}</Text>
            </View>
            <View>
              <Text style={styles.userName}>{selectedUser.name}</Text>
              <Text style={styles.userPhone}>{selectedUser.phone}</Text>
            </View>
          </View>
        )}

        {/* Mobile Number Input */}
        <Text style={styles.label}>Mobile Number</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter 10-digit mobile number"
          value={mobileNumber}
          onChangeText={setMobileNumber}
          keyboardType="numeric"
          maxLength={10}
        />

        {/* Select Operator */}
        <Text style={styles.label}>Select Operator</Text>
        <View style={styles.operatorRow}>
          {OPERATORS.map((op) => (
            <TouchableOpacity
              key={op.id}
              style={[styles.operatorBtn, selectedOperator === op.id && { borderColor: op.color, backgroundColor: op.color + '15' }]}
              onPress={() => handleOperatorSelect(op.id)}
            >
              <Ionicons name={op.icon as any} size={22} color={selectedOperator === op.id ? op.color : '#999'} />
              <Text style={[styles.operatorText, selectedOperator === op.id && { color: op.color, fontWeight: '600' }]}>
                {op.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Plans */}
        {selectedOperator && (
          <View style={styles.plansSection}>
            <Text style={styles.label}>
              {OPERATORS.find(o => o.id === selectedOperator)?.name} Plans
            </Text>
            
            {loading ? (
              <ActivityIndicator size="large" color="#1a73e8" style={{ padding: 20 }} />
            ) : (
              plans.map((plan) => (
                <TouchableOpacity
                  key={plan.id}
                  style={[styles.planCard, selectedPlan?.id === plan.id && styles.selectedPlan]}
                  onPress={() => setSelectedPlan(plan)}
                >
                  <View style={styles.planHeader}>
                    <View>
                      <Text style={styles.planName}>{plan.plan_name}</Text>
                      <Text style={styles.planData}>{plan.data_limit} • {plan.validity}</Text>
                    </View>
                    <Text style={styles.planAmount}>₹{plan.amount}</Text>
                  </View>
                  {plan.description && (
                    <Text style={styles.planDesc}>{plan.description}</Text>
                  )}
                  {selectedPlan?.id === plan.id && (
                    <View style={styles.planSelected}>
                      <Ionicons name="checkmark-circle" size={20} color="#1a73e8" />
                      <Text style={styles.planSelectedText}>Selected</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {/* Recharge Button */}
        {selectedPlan && (
          <TouchableOpacity style={styles.rechargeButton} onPress={handleRecharge}>
            <Text style={styles.rechargeButtonText}>
              Recharge ₹{selectedPlan.amount}
            </Text>
          </TouchableOpacity>
        )}

        {/* Recent Recharges */}
        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>Recent Recharges</Text>
          {history.length > 0 ? (
            history.map((item: any) => (
              <View key={item.id} style={styles.historyItem}>
                <View style={styles.historyIcon}>
                  <Ionicons name="phone-portrait" size={18} color="#1a73e8" />
                </View>
                <View style={styles.historyInfo}>
                  <Text style={styles.historyNumber}>{item.mobile_number}</Text>
                  <Text style={styles.historyOperator}>{item.operator?.toUpperCase()} • {item.plan?.plan_name}</Text>
                </View>
                <Text style={styles.historyAmount}>₹{item.amount}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No recharges yet</Text>
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
  tabContainer: {
    flexDirection: 'row', margin: 16,
    backgroundColor: '#f5f5f5', borderRadius: 12, padding: 4,
  },
  tab: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    paddingVertical: 12, borderRadius: 10,
  },
  activeTab: { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  tabText: { fontSize: 14, color: '#666', fontWeight: '500' },
  activeTabText: { color: '#1a73e8' },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 16, paddingHorizontal: 15,
    backgroundColor: '#f5f5f5', borderRadius: 12, gap: 10,
  },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 15 },
  searchResults: {
    marginHorizontal: 16, marginTop: 8,
    backgroundColor: '#fff', borderRadius: 12,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, elevation: 5,
  },
  searchItem: {
    flexDirection: 'row', alignItems: 'center',
    padding: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', gap: 12,
  },
  searchPic: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#1a73e8', justifyContent: 'center', alignItems: 'center',
  },
  searchPicText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  searchName: { fontSize: 14, fontWeight: '500', color: '#333' },
  searchPhone: { fontSize: 12, color: '#999' },
  selectedUserCard: {
    flexDirection: 'row', alignItems: 'center',
    margin: 16, padding: 12, backgroundColor: '#e8f0fe', borderRadius: 12, gap: 12,
  },
  userPic: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#1a73e8', justifyContent: 'center', alignItems: 'center',
  },
  userPicText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  userName: { fontSize: 15, fontWeight: '500', color: '#333' },
  userPhone: { fontSize: 12, color: '#666' },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginHorizontal: 16, marginTop: 16, marginBottom: 8 },
  input: {
    marginHorizontal: 16, borderWidth: 1, borderColor: '#ddd', borderRadius: 12,
    padding: 14, fontSize: 16, backgroundColor: '#f8f9fa',
  },
  operatorRow: {
    flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: 16, gap: 8,
  },
  operatorBtn: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 20, borderWidth: 1, borderColor: '#e0e0e0', gap: 6,
  },
  operatorText: { fontSize: 13, color: '#666' },
  plansSection: { marginHorizontal: 16, marginTop: 16 },
  planCard: {
    padding: 14, backgroundColor: '#f8f9fa', borderRadius: 12,
    marginBottom: 10, borderWidth: 1, borderColor: '#f0f0f0',
  },
  selectedPlan: { borderColor: '#1a73e8', backgroundColor: '#e8f0fe' },
  planHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  planName: { fontSize: 15, fontWeight: '600', color: '#333' },
  planData: { fontSize: 12, color: '#666', marginTop: 2 },
  planAmount: { fontSize: 18, fontWeight: 'bold', color: '#1a73e8' },
  planDesc: { fontSize: 12, color: '#999', marginTop: 6 },
  planSelected: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 4 },
  planSelectedText: { fontSize: 12, color: '#1a73e8', fontWeight: '500' },
  rechargeButton: {
    backgroundColor: '#1a73e8', margin: 16, padding: 16,
    borderRadius: 25, alignItems: 'center',
  },
  rechargeButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  historySection: { margin: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 10 },
  historyItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  historyIcon: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#e8f0fe', justifyContent: 'center', alignItems: 'center', marginRight: 10,
  },
  historyInfo: { flex: 1 },
  historyNumber: { fontSize: 14, fontWeight: '500', color: '#333' },
  historyOperator: { fontSize: 12, color: '#999', marginTop: 2 },
  historyAmount: { fontSize: 14, fontWeight: '600', color: '#1a73e8' },
  emptyText: { color: '#999', textAlign: 'center', paddingVertical: 15 },
});