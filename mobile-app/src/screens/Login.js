import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { designTokens, globalStyles } from '../globalStyles';

export default function Login({ setLoggedIn }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    // In actual implementation, make POST to API_URL/api/auth/login
    // Here we simulate successful login
    setLoggedIn(true);
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
          <TouchableOpacity style={globalStyles.buttonPrimary} onPress={handleLogin}>
            <Text style={globalStyles.buttonText}>Sign In</Text>
          </TouchableOpacity>
        </form>
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
    // Note: React Native shadow replacement for the "Ambient Shadow"
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
