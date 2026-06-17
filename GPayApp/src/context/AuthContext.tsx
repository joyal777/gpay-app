import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import api from '../services/api';

interface User {
  id: number;
  name: string;
  phone: string;
  email: string;
  upi_id: string;
  profile_pic: string | null;
  qr_code: string | null;
  wallet: {
    balance: number;
    upi_id: string;
  };
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (phone: string, password: string) => Promise<void>;
  register: (name: string, phone: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await SecureStore.getItemAsync('authToken');
      const storedUser = await SecureStore.getItemAsync('userData');
      
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Error loading auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (phone: string, password: string) => {
    const response = await api.post('/login', { phone, password });
    const { token, user } = response.data;
    
    await SecureStore.setItemAsync('authToken', token);
    await SecureStore.setItemAsync('userData', JSON.stringify(user));
    
    setToken(token);
    setUser(user);
  };

  const register = async (name: string, phone: string, email: string, password: string) => {
    const response = await api.post('/register', {
      name,
      phone,
      email,
      password,
      password_confirmation: password,
    });
    
    const { token, user } = response.data;
    
    await SecureStore.setItemAsync('authToken', token);
    await SecureStore.setItemAsync('userData', JSON.stringify(user));
    
    setToken(token);
    setUser(user);
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync('authToken');
    await SecureStore.deleteItemAsync('userData');
    setToken(null);
    setUser(null);
  };

  const refreshProfile = async () => {
    try {
        const response = await api.get('/profile');
        const userData = response.data.user;
        setUser(userData);
        await SecureStore.setItemAsync('userData', JSON.stringify(userData));
    } catch (error) {
        console.error('Error refreshing profile:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);