import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { IMAGE_BASE } from '../services/config';


export default function ChatScreen({ navigation, route }: any) {
  const { user } = useAuth();
  const { chatUser } = route.params;
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  const [amount, setAmount] = useState('');
  const flatListRef = useRef(null);

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      const response = await api.get(`/chat/${chatUser.id}`);
      setMessages(response.data.messages);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() && !showPayment) return;

    try {
      await api.post('/chat/send', {
        receiver_id: chatUser.id,
        message: inputMessage.trim() || null,
      });
      setInputMessage('');
      loadMessages();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const sendPayment = async () => {
    if (!amount) return;

    try {
      await api.post('/chat/send', {
        receiver_id: chatUser.id,
        amount: parseFloat(amount),
        message: inputMessage.trim() || null,
      });
      setAmount('');
      setInputMessage('');
      setShowPayment(false);
      loadMessages();
    } catch (error) {
      console.error('Error sending payment:', error);
    }
  };

  const renderMessage = ({ item }: any) => {
    const isMine = item.sender_id === user?.id;

    if (item.type === 'payment') {
      return (
        <View style={[styles.paymentBubble, isMine ? styles.myPayment : styles.theirPayment]}>
          <Text style={styles.paymentLabel}>
            {isMine ? 'You paid' : 'Received'}
          </Text>
          <Text style={styles.paymentAmount}>₹{item.amount}</Text>
          {item.message && <Text style={styles.paymentNote}>{item.message}</Text>}
        </View>
      );
    }

    return (
      <View style={[styles.messageBubble, isMine ? styles.myMessage : styles.theirMessage]}>
        <Text style={[styles.messageText, isMine && styles.myMessageText]}>
          {item.message}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.headerUser}>
          {chatUser.profile_pic ? (
            <Image source={{ uri: IMAGE_BASE + chatUser.profile_pic }} style={styles.headerPic} />
          ) : (
            <View style={styles.headerPicPlaceholder}>
              <Text style={styles.headerPicText}>{chatUser.name?.charAt(0)}</Text>
            </View>
          )}
          <View>
            <Text style={styles.headerName}>{chatUser.name}</Text>
            <Text style={styles.headerUpi}>{chatUser.upi_id}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => setShowPayment(!showPayment)}>
          <Ionicons name="cash-outline" size={24} color={showPayment ? '#1a73e8' : '#666'} />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id.toString()}
        style={styles.messageList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        ListEmptyComponent={
          <View style={styles.emptyChat}>
            <Ionicons name="chatbubbles-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No messages yet</Text>
            <Text style={styles.emptySubtext}>Send a message or payment</Text>
          </View>
        }
      />

      {/* Payment Bar */}
      {showPayment && (
        <View style={styles.paymentBar}>
          <Text style={styles.currencySymbol}>₹</Text>
          <TextInput
            style={styles.amountInput}
            placeholder="Enter amount"
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            placeholderTextColor="#999"
          />
          <TouchableOpacity 
            style={[styles.payButton, !amount && styles.payButtonDisabled]}
            onPress={sendPayment}
            disabled={!amount}
          >
            <Text style={styles.payButtonText}>Pay</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Input Bar */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.inputBar}>
          <TextInput
            style={styles.textInput}
            placeholder={showPayment ? "Add a note..." : "Type a message..."}
            value={inputMessage}
            onChangeText={setInputMessage}
            placeholderTextColor="#999"
            multiline
          />
          {showPayment ? null : (
            <TouchableOpacity onPress={sendMessage} disabled={!inputMessage.trim()}>
              <Ionicons 
                name="send" 
                size={24} 
                color={inputMessage.trim() ? '#1a73e8' : '#ccc'} 
              />
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    gap: 12,
  },
  headerUser: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerPic: { width: 40, height: 40, borderRadius: 20 },
  headerPicPlaceholder: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#1a73e8', justifyContent: 'center', alignItems: 'center',
  },
  headerPicText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  headerName: { fontSize: 16, fontWeight: '600', color: '#333' },
  headerUpi: { fontSize: 12, color: '#999' },
  messageList: { flex: 1, padding: 15 },
  messageBubble: { maxWidth: '75%', padding: 12, borderRadius: 18, marginBottom: 8 },
  myMessage: { alignSelf: 'flex-end', backgroundColor: '#1a73e8' },
  theirMessage: { alignSelf: 'flex-start', backgroundColor: '#f0f0f0' },
  messageText: { fontSize: 15, color: '#333' },
  myMessageText: { color: '#fff' },
  paymentBubble: { maxWidth: '75%', padding: 15, borderRadius: 18, marginBottom: 8 },
  myPayment: { alignSelf: 'flex-end', backgroundColor: '#e8f5e9' },
  theirPayment: { alignSelf: 'flex-start', backgroundColor: '#f0f0f0' },
  paymentLabel: { fontSize: 12, color: '#666' },
  paymentAmount: { fontSize: 22, fontWeight: 'bold', color: '#2e7d32', marginVertical: 5 },
  paymentNote: { fontSize: 13, color: '#666' },
  emptyChat: { alignItems: 'center', paddingTop: 80 },
  emptyText: { fontSize: 18, color: '#999', marginTop: 15 },
  emptySubtext: { fontSize: 13, color: '#ccc', marginTop: 5 },
  paymentBar: {
    flexDirection: 'row', alignItems: 'center', padding: 12,
    borderTopWidth: 1, borderTopColor: '#eee', gap: 10,
    backgroundColor: '#f8f9fa',
  },
  currencySymbol: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  amountInput: { flex: 1, fontSize: 18, borderBottomWidth: 1, borderBottomColor: '#ddd', paddingVertical: 5 },
  payButton: { backgroundColor: '#1a73e8', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  payButtonDisabled: { backgroundColor: '#93c5fd' },
  payButtonText: { color: '#fff', fontWeight: '600' },
  inputBar: {
    flexDirection: 'row', alignItems: 'center', padding: 10,
    borderTopWidth: 1, borderTopColor: '#eee', gap: 10,
  },
  textInput: { flex: 1, fontSize: 15, maxHeight: 80, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#f5f5f5', borderRadius: 20 },
});