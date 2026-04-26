import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, Switch, ActivityIndicator, Image, Alert
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { designTokens } from '../globalStyles';
import { BASE_URL } from '../config/apiConfig';
import logger from '../utils/logger';

const C = designTokens.colors;
const R = designTokens.radius;

export default function ProfileScreen({ token, user, onLogout, onUserUpdate }) {
  // ─── 1. States ───
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userData, setUserData] = useState(null);
  const [stats, setStats] = useState({ quizzes: 0, streak: 0 });
  const [schema, setSchema] = useState([]);
  const [isEditingInst, setIsEditingInst] = useState(false);
  
  const [formData, setFormData] = useState({
    phone_number: '',
    avatar_url: null,
    daily_reminder: true,
    institute_data: {}
  });
  const [originalData, setOriginalData] = useState({});
  const [isDirty, setIsDirty] = useState(false);

  // Trace Logging Component Sync
  console.log(`[ProfileScreen.js : Main : 37] -> Component rendering with 11 hooks initialized.`);

  // ─── 2. Effects ───
  useEffect(() => {
    fetchEverything();
  }, []);

  useEffect(() => {
    if (originalData.institute_data) {
      const dirty = JSON.stringify(formData) !== JSON.stringify(originalData);
      setIsDirty(dirty);
    }
  }, [formData, originalData]);

  // ─── 3. Logic Functions ───
  const fetchEverything = async () => {
    setLoading(true);
    try {
      const profileRes = await axios.get(`${BASE_URL}/api/user/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const u = profileRes.data.user;
      setUserData(u);

      const meta = u.profile_metadata || {};
      const instData = meta.institute_data || {};

      const initialForm = {
        phone_number: meta.phone_number || '',
        avatar_url: meta.avatar_url || null,
        daily_reminder: meta.daily_reminder ?? true,
        institute_data: instData
      };

      setFormData(initialForm);
      setOriginalData(JSON.parse(JSON.stringify(initialForm)));

      if (u.institute_id) {
        const schemaRes = await axios.get(`${BASE_URL}/api/institutes/${u.institute_id}/form-schema`);
        setSchema(schemaRes.data.schema || []);
      }

      const quizRes = await axios.get(`${BASE_URL}/api/quiz/my-results`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const moodRes = await axios.get(`${BASE_URL}/api/mood/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setStats({
        quizzes: quizRes.data.total || 0,
        streak: moodRes.data.logs?.length || 0
      });

    } catch (err) {
      logger.error('ProfileScreen', 'Initial fetch failed', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value, isNested = false) => {
    if (isNested) {
      setFormData(prev => ({
        ...prev,
        institute_data: { ...prev.institute_data, [field]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
    if (!result.canceled) {
      const newUrl = result.assets[0].uri;
      handleInputChange('avatar_url', newUrl);
      
      // Update global state immediately for visual sync
      onUserUpdate && onUserUpdate({ 
        profile_metadata: { ...user.profile_metadata, avatar_url: newUrl } 
      });
      
      logger.info(`[Profile.js : updateAvatar : 108] -> New avatar URL saved: ${newUrl}.`);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put(`${BASE_URL}/api/user/profile`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOriginalData(JSON.parse(JSON.stringify(formData)));
      setIsDirty(false);
      setIsEditingInst(false);
      
      // Sync global state on final save too
      onUserUpdate && onUserUpdate({ 
        profile_metadata: { ...user.profile_metadata, ...formData } 
      });

      Alert.alert('Success', 'Profile updated ✨');
    } catch (err) {
      logger.error('ProfileScreen', 'Save failed', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !userData) {
    return <View style={styles.center}><ActivityIndicator color={C.sage} /></View>;
  }

  const displayName = userData.role === 'Admin' ? userData.institute_name : (userData.full_name || "User");
  const firstName = displayName.split(' ')[0];
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <KeyboardAwareScrollView 
      style={styles.container} 
      contentContainerStyle={{ paddingBottom: 60 }}
      enableOnAndroid={true}
    >
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.avatarWrapper} onPress={pickImage}>
          {formData.avatar_url ? (
            <Image 
              source={{ uri: formData.avatar_url }} 
              style={styles.avatar} 
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.avatar, styles.initialsAvatar]}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>
          )}
          <View style={styles.editIconBadge}><Text style={{ fontSize: 10 }}>✏️</Text></View>
        </TouchableOpacity>
        <Text style={styles.userName}>{firstName}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{userData.institute_name}</Text>
        </View>
      </View>

      {/* ── Stats ── */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statEmoji}>🌿</Text>
          <Text style={styles.statValue}>{stats.quizzes}</Text>
          <Text style={styles.statLabel}>Quizzes</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statEmoji}>✨</Text>
          <Text style={styles.statValue}>{stats.streak}</Text>
          <Text style={styles.statLabel}>Streak</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Personal Details</Text>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Full Name</Text>
          <TextInput style={[styles.input, styles.disabledInput]} value={displayName} editable={false} />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Email</Text>
          <TextInput style={[styles.input, styles.disabledInput]} value={userData.email} editable={false} />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Phone</Text>
          <TextInput 
            style={styles.input} 
            value={formData.phone_number} 
            onChangeText={(v) => handleInputChange('phone_number', v)} 
            keyboardType="phone-pad"
            placeholder="Contact info"
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Institute Record</Text>
        {schema.map((field, idx) => (
          <View key={idx} style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{field.label}</Text>
            {field.type === 'Dropdown' ? (
              <View style={[styles.input, !isEditingInst && styles.disabledInput, { paddingVertical: 0 }]}>
                <Picker
                  enabled={isEditingInst}
                  selectedValue={formData.institute_data[field.label] || ''}
                  onValueChange={(val) => handleInputChange(field.label, val, true)}
                >
                  <Picker.Item label="Select..." value="" />
                  {(field.options || []).map((o, i) => <Picker.Item key={i} label={o} value={o} />)}
                </Picker>
              </View>
            ) : (
              <TextInput 
                style={[styles.input, !isEditingInst && styles.disabledInput]} 
                value={String(formData.institute_data[field.label] || '')} 
                onChangeText={(v) => handleInputChange(field.label, v, true)} 
                editable={isEditingInst}
                placeholder={`Enter ${field.label}`}
                keyboardType={field.type === 'Number' ? 'numeric' : 'default'}
              />
            )}
          </View>
        ))}
        <TouchableOpacity style={styles.editSubBtn} onPress={() => setIsEditingInst(!isEditingInst)}>
          <Text style={styles.editSubBtnText}>{isEditingInst ? 'Cancel' : 'Edit Institute Info'}</Text>
        </TouchableOpacity>
        <View style={styles.reminderRow}>
          <Text style={styles.reminderLabel}>Daily Reminder</Text>
          <Switch 
            value={formData.daily_reminder} 
            onValueChange={(v) => handleInputChange('daily_reminder', v)}
            trackColor={{ false: '#eee', true: C.sage }}
          />
        </View>
      </View>

      <TouchableOpacity 
        style={[styles.saveBtn, !isDirty && styles.saveBtnDisabled]} 
        onPress={handleSave} 
        disabled={!isDirty || saving}
      >
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
        <Text style={styles.logoutBtnText}>Logout</Text>
      </TouchableOpacity>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.cream, padding: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.cream },
  header: { alignItems: 'center', marginVertical: 20 },
  avatarWrapper: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: C.sage, padding: 3,
    marginBottom: 12, position: 'relative',
    borderWidth: 1, borderColor: C.sage, overflow: 'hidden'
  },
  avatar: { width: '100%', height: '100%', borderRadius: 42 },
  initialsAvatar: { justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontSize: 32, fontWeight: '800' },
  editIconBadge: {
    position: 'absolute', bottom: 0, right: 0,
    backgroundColor: '#fff', width: 24, height: 24,
    borderRadius: 12, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: C.border, zIndex: 10
  },
  userName: { fontSize: 20, fontWeight: '800', color: C.charcoal, marginBottom: 4 },
  badge: { backgroundColor: C.sage, paddingHorizontal: 12, paddingVertical: 4, borderRadius: R.full },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 12,
    alignItems: 'center', borderWidth: 1, borderColor: C.border
  },
  statEmoji: { fontSize: 18, marginBottom: 2 },
  statValue: { fontSize: 18, fontWeight: '900', color: C.charcoal },
  statLabel: { fontSize: 9, fontWeight: '700', color: C.muted },
  section: { 
    backgroundColor: '#fff', borderRadius: 20, padding: 16, 
    marginBottom: 16, borderWidth: 1, borderColor: C.border 
  },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: C.charcoal, marginBottom: 12 },
  inputGroup: { marginBottom: 12 },
  inputLabel: { fontSize: 10, fontWeight: '700', color: C.muted, marginBottom: 4 },
  input: {
    backgroundColor: C.cream, borderRadius: R.sm, paddingHorizontal: 12,
    paddingVertical: 10, fontSize: 13, color: C.charcoal,
    borderWidth: 1, borderColor: C.border
  },
  disabledInput: { backgroundColor: '#f9f9f9', color: '#999' },
  editSubBtn: {
    paddingVertical: 8, alignItems: 'center',
    borderWidth: 1, borderColor: C.sage, borderRadius: R.sm, marginBottom: 12
  },
  editSubBtnText: { color: C.sage, fontSize: 12, fontWeight: '800' },
  reminderRow: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 8, borderTopWidth: 1, borderTopColor: '#f5f5f5' 
  },
  reminderLabel: { fontSize: 12, fontWeight: '700', color: C.charcoal },
  saveBtn: {
    backgroundColor: C.sage, height: 50, borderRadius: 25,
    justifyContent: 'center', alignItems: 'center', marginBottom: 12
  },
  saveBtnDisabled: { backgroundColor: '#ccc' },
  saveBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  logoutBtn: { alignItems: 'center', paddingVertical: 10 },
  logoutBtnText: { color: C.muted, fontSize: 12, textDecorationLine: 'underline' }
});
