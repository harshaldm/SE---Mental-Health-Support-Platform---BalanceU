import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { designTokens, globalStyles } from '../globalStyles';
import { BASE_URL as API_URL } from '../config/apiConfig';

export default function Login({ onLoginSuccess, setShowRegister }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      alert('Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/auth/login`, {
        email: email.trim(),
        password
      });

      const { token, user } = res.data;
      
      // PERSISTENT STORAGE: Save raw token (no stringify)
      await AsyncStorage.setItem('userToken', token);
      
      onLoginSuccess(token, user);
    } catch (error) {
      console.error(">>> [LOGIN ERROR] Full Detail:", error);
      const serverMsg = error.response?.data?.error || error.response?.data?.message;
      
      // Production-friendly messaging
      const msg = serverMsg || "We're having trouble connecting to the server. Please check your internet and try again.";
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={globalStyles.textDisplay}>Welcome back.</Text>
        <Text style={globalStyles.textBody}>Sign in to BalanceU App</Text>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email Address"
            placeholderTextColor={designTokens.colors.onSurfaceVariant}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={designTokens.colors.onSurfaceVariant}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity 
            style={[globalStyles.buttonPrimary, loading && { opacity: 0.7 }]} 
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={globalStyles.buttonText}>{loading ? 'Signing In...' : 'Sign In'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowRegister && setShowRegister(true)} style={{ alignItems: 'center' }}>
            <Text style={{ color: designTokens.colors.primary, fontWeight: 'bold' }}>Create an Account</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: designTokens.colors.surface,
    justifyContent: 'center',
    padding: 24,
  },
  content: {
    backgroundColor: designTokens.colors.surfaceContainerLow,
    padding: 32,
    borderRadius: designTokens.radius.xl,
    shadowColor: designTokens.colors.onSurface,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 3,
  },
  form: {
    marginTop: 32,
    gap: 16
  },
  input: {
    backgroundColor: designTokens.colors.surfaceContainer,
    borderRadius: designTokens.radius.md,
    padding: 16,
    color: designTokens.colors.onSurface,
    fontSize: 16
  }
});