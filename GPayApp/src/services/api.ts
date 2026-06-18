import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from './config';
// ... rest stays same
// For Android emulator

 // Same as API but without /api

// When displaying image:
// For physical device: Replace with your computer's IP
// Example: 'http://192.168.1.100:8000/api'
// Run 'ipconfig' in cmd to find your IPv4 Address

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Automatically add token to requests
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;