import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, ScrollView, 
  StyleSheet, Alert 
} from 'react-native';
import { Picker } from '@react-native-picker/picker'; // Optional for better dropdowns, but will use native standard if missing
import { globalStyles, designTokens } from '../globalStyles';

// A minimal shim for axios built on fetch, just in case axios isn't installed in mobile
const fetchAPI = async (url, options = {}) => {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'API call failed');
  return data;
};

export default function Register({ setLoggedIn }) {
  const [institutes, setInstitutes] = useState([]);
  const [selectedInstitute, setSelectedInstitute] = useState('');
  const [schema, setSchema] = useState([]);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [customData, setCustomData] = useState({});

  useEffect(() => {
    // URL uses local IPv4 for Expo
    fetchAPI('http://192.168.29.107:5000/api/institutes/list')
      .then(data => {
        setInstitutes(data.institutes);
      })
      .catch(err => console.error(err));
  }, []);

  const handleInstituteChange = async (instId) => {
    setSelectedInstitute(instId);
    setSchema([]);
    setCustomData({});
    if (instId) {
      try {
        const data = await fetchAPI(`http://192.168.29.107:5000/api/institutes/${instId}/form-schema`);
        setSchema(data.schema || []);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleRegister = async () => {
    if (password !== confirmPassword) {
      return Alert.alert('Error', 'Passwords do not match');
    }
    try {
      await fetchAPI('http://192.168.29.107:5000/api/auth/register-student', {
        method: 'POST',
        body: JSON.stringify({
          email,
          password,
          institute_id: selectedInstitute,
          custom_data: customData
        })
      });
      Alert.alert('Success', 'Registered successfully!');
      // Typically pop back to login
      setLoggedIn && setLoggedIn(true);
    } catch (err) {
      Alert.alert('Registration Failed', err.message);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 60 }}>
      <View style={styles.content}>
        <Text style={globalStyles.textDisplay}>Join BalanceU</Text>
        <Text style={globalStyles.textBody}>Create your verified student profile</Text>

        <View style={styles.formSection}>
          <Text style={styles.label}>Select Institute</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedInstitute}
              onValueChange={handleInstituteChange}
              style={{ color: designTokens.colors.onSurface }}
            >
              <Picker.Item label="Tap to select your institute..." value="" />
              {institutes.map(inst => (
                <Picker.Item key={inst.id} label={inst.name} value={inst.id} />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.formSection}>
          <TextInput 
            style={styles.input} 
            placeholder="Official College Email" 
            placeholderTextColor={designTokens.colors.onSurfaceVariant}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput 
            style={styles.input} 
            placeholder="Password" 
            placeholderTextColor={designTokens.colors.onSurfaceVariant}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          <TextInput 
            style={styles.input} 
            placeholder="Confirm Password" 
            placeholderTextColor={designTokens.colors.onSurfaceVariant}
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
        </View>

        {schema.length > 0 && (
          <View style={styles.dynamicSection}>
            <Text style={styles.sectionTitle}>Institute Details</Text>
            {schema.map((field, idx) => (
              <View key={idx} style={{ marginBottom: 16 }}>
                <Text style={styles.label}>{field.label} {field.required ? '*' : ''}</Text>
                
                {field.type === 'Dropdown' ? (
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={customData[field.label] || ''}
                      onValueChange={(val) => setCustomData({...customData, [field.label]: val})}
                    >
                      <Picker.Item label="Select..." value="" />
                      {field.options.map((o, i) => <Picker.Item key={i} label={o} value={o} />)}
                    </Picker>
                  </View>
                ) : (
                  <TextInput 
                    style={styles.input} 
                    placeholder={`Enter ${field.label}`}
                    placeholderTextColor={designTokens.colors.onSurfaceVariant}
                    value={customData[field.label] || ''}
                    onChangeText={(val) => setCustomData({...customData, [field.label]: val})}
                    keyboardType={field.type === 'Number' ? 'numeric' : field.type === 'Phone' ? 'phone-pad' : 'default'}
                  />
                )}
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity 
          style={[globalStyles.buttonPrimary, { marginTop: 32 }]} 
          onPress={handleRegister}
          disabled={!selectedInstitute || !email}
        >
          <Text style={globalStyles.buttonText}>Submit Profile</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: designTokens.colors.surface,
  },
  content: {
    padding: 24,
    paddingTop: 48,
  },
  formSection: {
    marginTop: 32,
    gap: 16
  },
  dynamicSection: {
    marginTop: 24,
    padding: 16,
    backgroundColor: designTokens.colors.surfaceContainerLow,
    borderRadius: designTokens.radius.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: designTokens.colors.onSurface,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: designTokens.colors.onSurfaceVariant,
    marginBottom: 8,
    fontWeight: '600'
  },
  input: {
    backgroundColor: designTokens.colors.surfaceContainer,
    borderRadius: designTokens.radius.md,
    padding: 16,
    color: designTokens.colors.onSurface,
    fontSize: 16,
    borderWidth: 0,
  },
  pickerContainer: {
    backgroundColor: designTokens.colors.surfaceContainer,
    borderRadius: designTokens.radius.md,
    overflow: 'hidden'
  }
});
