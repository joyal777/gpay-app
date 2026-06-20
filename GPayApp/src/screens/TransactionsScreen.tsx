import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { useFocusEffect } from '@react-navigation/native';

export default function TransactionsScreen({ navigation }: any) {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadAllTransactions();
    }, [])
  );

  const loadAllTransactions = async () => {
    try {
      const response = await api.get('/wallet/transactions');
      const data = response.data?.data?.data || 
                   response.data?.data || 
                   response.data?.transactions || 
                   [];
      
      if (Array.isArray(data)) {
        setTransactions(data);
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAllTransactions();
    setRefreshing(false);
  };

  const renderTransaction = ({ item }: any) => {
    const isDebit = item.sender_id === user?.id;
    const otherPerson = isDebit ? item.receiver : item.sender;

    return (
      <TouchableOpacity 
        style={styles.txItem}
        onPress={() => navigation.navigate('Chat', { 
          chatUser: otherPerson,
          highlightTransactionId: item.transaction_id 
        })}
      >
        <View style={[styles.txIcon, {
          backgroundColor: isDebit ? '#fce4ec' : '#e8f5e9'
        }]}>
          <Ionicons 
            name={isDebit ? "arrow-up" : "arrow-down"} 
            size={22} 
            color={isDebit ? "#c62828" : "#2e7d32"} 
          />
        </View>

        <View style={styles.txInfo}>
          <Text style={styles.txName}>
            {isDebit ? `Paid to ${otherPerson?.name || 'Unknown'}` : `Received from ${otherPerson?.name || 'Unknown'}`}
          </Text>
          <Text style={styles.txMeta}>
            {new Date(item.created_at).toLocaleDateString('en-IN', { 
              day: 'numeric', month: 'short', year: 'numeric' 
            })} • {new Date(item.created_at).toLocaleTimeString([], {
              hour: '2-digit', minute: '2-digit'
            })}
          </Text>
          {item.note && <Text style={styles.txNote}>{item.note}</Text>}
          <Text style={styles.txId}>TXN: {item.transaction_id}</Text>
        </View>

        <View style={styles.txAmountContainer}>
          <Text style={[styles.txAmount, {
            color: isDebit ? '#c62828' : '#2e7d32'
          }]}>
            {isDebit ? '-' : '+'}₹{parseFloat(item.amount).toFixed(2)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All Transactions</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Summary */}
      <View style={styles.summary}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total Debits</Text>
          <Text style={[styles.summaryAmount, { color: '#c62828' }]}>
            -₹{transactions
              .filter((t: any) => t.sender_id === user?.id)
              .reduce((sum: number, t: any) => sum + parseFloat(t.amount), 0)
              .toFixed(2)}
          </Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total Credits</Text>
          <Text style={[styles.summaryAmount, { color: '#2e7d32' }]}>
            +₹{transactions
              .filter((t: any) => t.receiver_id === user?.id)
              .reduce((sum: number, t: any) => sum + parseFloat(t.amount), 0)
              .toFixed(2)}
          </Text>
        </View>
      </View>

      {/* Transaction List */}
      <FlatList
        data={transactions}
        renderItem={renderTransaction}
        keyExtractor={(item: any) => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1a73e8']} />
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No transactions yet</Text>
            <Text style={styles.emptySubtext}>Your payment history will appear here</Text>
          </View>
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
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
  summary: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 5,
  },
  summaryAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: '#ddd',
    marginHorizontal: 10,
  },
  listContent: {
    paddingBottom: 30,
  },
  txItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
  },
  txIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  txInfo: {
    flex: 1,
  },
  txName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
  },
  txMeta: {
    fontSize: 12,
    color: '#999',
    marginTop: 3,
  },
  txNote: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  txId: {
    fontSize: 10,
    color: '#bbb',
    marginTop: 2,
  },
  txAmountContainer: {
    marginLeft: 10,
  },
  txAmount: {
    fontSize: 15,
    fontWeight: '600',
  },
  separator: {
    height: 1,
    backgroundColor: '#f0f0f0',
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
    marginTop: 15,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#ccc',
    marginTop: 5,
  },
});