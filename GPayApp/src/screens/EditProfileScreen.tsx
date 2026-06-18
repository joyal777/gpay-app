import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import * as ImagePicker from 'expo-image-picker';
import { IMAGE_BASE } from '../services/config';
// ... rest stays same
export default function EditProfileScreen({ navigation }: any) {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
  // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please allow access to your photos');
        return;
    }

    // Pick image
    const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'] as any,  // ← NEW API (array format)
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
    });

    if (!result.canceled && result.assets[0]) {
        uploadImage(result.assets[0].uri);
    }
    };

    const uploadImage = async (uri: string) => {
    setLoading(true);
    try {
        const formData = new FormData();
        formData.append('profile_pic', {
        uri: uri,
        type: 'image/jpeg',
        name: 'profile.jpg',
        } as any);

        const response = await api.post('/profile/pic', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        });

        if (response.data.status) {
        updateUser(response.data.user);
        Alert.alert('Success', 'Profile picture updated!');
        }
    } catch (error: any) {
        Alert.alert('Error', error.response?.data?.message || 'Upload failed');
    } finally {
        setLoading(false);
    }
    };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }

    setLoading(true);
    try {
      const response = await api.put('/profile', {
        name: name.trim(),
        email: email.trim(),
      });

      if (response.data.status) {
        updateUser(response.data.user);
        Alert.alert('Success', 'Profile updated successfully', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <TouchableOpacity onPress={handleSave} disabled={loading}>
            {loading ? (
              <ActivityIndicator size="small" color="#1a73e8" />
            ) : (
              <Text style={styles.saveText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* Profile Picture Section */}
          <View style={styles.picSection}>
            <TouchableOpacity style={styles.picContainer} onPress={pickImage}>
                {user?.profile_pic ? (
                <Image source={{ uri: IMAGE_BASE + user.profile_pic }} style={styles.profilePic} />
                ) : (
                <View style={styles.profilePicPlaceholder}>
                    <Text style={styles.profilePicText}>
                    {name?.charAt(0)?.toUpperCase()}
                    </Text>
                </View>
                )}
                <View style={styles.cameraIcon}>
                <Ionicons name="camera" size={16} color="#fff" />
                </View>
            </TouchableOpacity>
            {/* Text OUTSIDE TouchableOpacity */}
            <TouchableOpacity onPress={pickImage}>
                <Text style={styles.changePhotoText}>Change Profile Photo</Text>
            </TouchableOpacity>
          </View>

          {/* Form Fields */}
          <View style={styles.formSection}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Enter your name"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <View style={styles.disabledInput}>
                <Text style={styles.disabledText}>+91 {user?.phone}</Text>
                <Ionicons name="lock-closed" size={16} color="#999" />
              </View>
              <Text style={styles.helperText}>
                Phone number cannot be changed
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>UPI ID</Text>
              <View style={styles.disabledInput}>
                <Text style={styles.disabledText}>{user?.upi_id}</Text>
              </View>
              <Text style={styles.helperText}>
                UPI ID is auto-generated
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  flex: {
    flex: 1,
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
  saveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a73e8',
  },
  content: {
    flex: 1,
  },
  picSection: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  picContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  profilePic: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  profilePicPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#1a73e8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profilePicText: {
    color: '#fff',
    fontSize: 40,
    fontWeight: 'bold',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#333',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  changePhotoText: {
    color: '#1a73e8',
    fontSize: 14,
    fontWeight: '500',
  },
  formSection: {
    paddingHorizontal: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#f8f9fa',
  },
  disabledInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 12,
    padding: 14,
    backgroundColor: '#f5f5f5',
  },
  disabledText: {
    fontSize: 16,
    color: '#999',
  },
  helperText: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
    marginLeft: 5,
  },
});