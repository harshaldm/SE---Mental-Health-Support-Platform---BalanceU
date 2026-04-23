import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  ActivityIndicator, Modal, ScrollView, Alert, StyleSheet as RN,
} from 'react-native';
import axios from 'axios';
import { BASE_URL } from '../config/apiConfig';
import { designTokens } from '../globalStyles';
import ChatScreen from './ChatScreen';

const C = designTokens.colors;
const R = designTokens.radius;

// ─── Risk colour helper ───────────────────────────────────────────────────────
const getRisk = (level = '') => {
  const l = level.toLowerCase();
  if (l.includes('high') || l.includes('severe')) return { text: C.error, bg: C.errorContainer };
  if (l.includes('medium') || l.includes('moderate')) return { text: '#D97706', bg: '#FEF3C7' };
  return { text: C.sage, bg: C.sageLight };
};

// ─────────────────────────────────────────────────────────────────────────────
// SupportHub — top-level Support Hub screen
// Contains a segmented control: [Counselor Support] [Medication]
// Props: token, user, latestAssessment, onOpenCounselorDirectory
// ─────────────────────────────────────────────────────────────────────────────
export default function SupportHub({ token, user, latestAssessment, onOpenCounselorDirectory }) {
  const [segment, setSegment] = useState('counselor');
  // activeChat: null = hidden, { appointmentId, peerName } = show ChatScreen
  const [activeChat, setActiveChat] = useState(null);

  return (
    <View style={styles.root}>
      {/* ── Segmented Control ── */}
      <View style={styles.segmentBar}>
        <TouchableOpacity
          style={[styles.segment, segment === 'counselor' && styles.segmentActive]}
          onPress={() => setSegment('counselor')}
        >
          <Text style={[styles.segmentText, segment === 'counselor' && styles.segmentTextActive]}>
            🫂 Counselor Support
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segment, segment === 'medication' && styles.segmentActive]}
          onPress={() => setSegment('medication')}
        >
          <Text style={[styles.segmentText, segment === 'medication' && styles.segmentTextActive]}>
            💊 Medication
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Panel ── */}
      {segment === 'counselor'
        ? <CounselorPanel token={token} user={user} latestAssessment={latestAssessment}
          currentUserId={user?.id} onOpenChat={(chat) => setActiveChat(chat)} />
        : <MedicationPanel />
      }

      {/* ── Chat Screen full-screen overlay ── */}
      {activeChat && (
        <View style={StyleSheet.absoluteFill}>
          <ChatScreen
            appointmentId={activeChat.appointmentId}
            peerName={activeChat.peerName}
            currentUserId={user?.id}
            token={token}
            onBack={() => setActiveChat(null)}
          />
        </View>
      )}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CounselorPanel
// ─────────────────────────────────────────────────────────────────────────────
function CounselorPanel({ token, user, latestAssessment, currentUserId, onOpenChat }) {
  const [counselors, setCounselors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  // Map: counselor_id → { appointmentId, peerName }
  const [conversations, setConversations] = useState({});

  const instituteId = user?.institute_id;
  const riskStyle = getRisk(latestAssessment?.riskLevel);

  const load = useCallback(async () => {
    if (!instituteId) {
      setError('Your account is not linked to an institute. Contact your administrator.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const [counselorRes, convRes] = await Promise.allSettled([
        axios.get(`${BASE_URL}/api/institutes/${instituteId}/counselors`),
        axios.get(`${BASE_URL}/api/requests/my-conversations`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      if (counselorRes.status === 'fulfilled') {
        setCounselors(counselorRes.value.data.counselors || []);
      }
      if (convRes.status === 'fulfilled') {
        const convMap = {};
        (convRes.value.data.conversations || []).forEach(c => {
          if (c.appointment_id) {
            convMap[c.counselor.id] = {
              appointmentId: c.appointment_id,
              peerName: c.counselor.name,
            };
          }
        });
        setConversations(convMap);
      }
    } catch {
      setError('Could not load counselors. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [instituteId, token]);

  useEffect(() => { load(); }, [load]);

  const sendRequest = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      await axios.post(
        `${BASE_URL}/api/requests/submit`,
        {
          counselor_id: selected.id,
          institute_id: instituteId,
          score: latestAssessment?.score ?? null,
          risk_level: latestAssessment?.riskLevel || null,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSelected(null);
      Alert.alert(
        '✅ Request Sent',
        `${selected.name} has been notified by email and will respond shortly.`
      );
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to send request.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <View style={styles.centered}>
      <ActivityIndicator size="large" color={C.sage} />
      <Text style={styles.mutedText}>Finding your counselors…</Text>
    </View>
  );

  if (error) return (
    <View style={styles.centered}>
      <Text style={styles.errorText}>{error}</Text>
      <TouchableOpacity onPress={load} style={styles.sageBtn}>
        <Text style={styles.sageBtnText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      {/* Assessment context banner */}
      {latestAssessment?.score != null && (
        <View style={[styles.assessBanner, { borderColor: riskStyle.text }]}>
          <Text style={styles.assessLabel}>LATEST ASSESSMENT WILL BE SHARED</Text>
          <Text style={[styles.assessScore, { color: riskStyle.text }]}>
            Score: {latestAssessment.score}
          </Text>
          <View style={[styles.riskPill, { backgroundColor: riskStyle.bg }]}>
            <Text style={[styles.riskPillText, { color: riskStyle.text }]}>
              {latestAssessment.riskLevel || 'Low'} Risk
            </Text>
          </View>
        </View>
      )}

      {counselors.length === 0 ? (
        <View style={styles.centered}>
          <Text style={{ fontSize: 40, marginBottom: 12 }}>😕</Text>
          <Text style={styles.mutedText}>No counselors available at your institute yet.</Text>
        </View>
      ) : (
        <FlatList
          data={counselors}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          renderItem={({ item }) => {
            const conv = conversations[item.id];
            return (
              <View style={styles.counselorCard}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{(item.name || 'C')[0].toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.counselorName}>{item.name}</Text>
                  {item.specialization ? <Text style={styles.counselorSpec}>{item.specialization}</Text> : null}
                  {item.bio ? <Text style={styles.counselorBio} numberOfLines={2}>{item.bio}</Text> : null}
                </View>
                {conv ? (
                  <TouchableOpacity
                    style={[styles.requestBtn, { backgroundColor: '#0EA5E9' }]}
                    onPress={() => onOpenChat?.({ appointmentId: conv.appointmentId, peerName: item.name })}
                  >
                    <Text style={styles.requestBtnText}>💬 Chat</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={styles.requestBtn} onPress={() => setSelected(item)}>
                    <Text style={styles.requestBtnText}>Request</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          }}
        />
      )}

      {/* Confirmation Modal */}
      <Modal visible={!!selected} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Confirm Request</Text>
            <Text style={styles.modalBody}>
              Requesting support from{' '}
              <Text style={{ fontWeight: '800', color: C.sage }}>{selected?.name}</Text>.
            </Text>

            <View style={[styles.sharedBox, { borderColor: latestAssessment?.score != null ? riskStyle.text : C.border }]}>
              <Text style={styles.sharedLabel}>📊 What will be shared with {selected?.name}:</Text>
              {latestAssessment?.score != null ? (
                <Text style={[styles.sharedScore, { color: riskStyle.text }]}>
                  Score: {latestAssessment.score} — {latestAssessment.riskLevel || 'Low'} Risk
                </Text>
              ) : (
                <Text style={styles.mutedText}>No assessment found — request will still be sent.</Text>
              )}
              {latestAssessment?.summary ? (
                <Text style={styles.summaryPreview} numberOfLines={2}>"{latestAssessment.summary}"</Text>
              ) : null}
            </View>

            <Text style={styles.consentText}>
              By proceeding, you consent to sharing this. {selected?.name} will receive an email immediately.
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setSelected(null)} disabled={submitting}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sendBtn, submitting && { opacity: 0.55 }]}
                onPress={sendRequest}
                disabled={submitting}
              >
                <Text style={styles.sendBtnText}>{submitting ? 'Sending…' : '📩 Send Request'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MedicationPanel (placeholder)
// ─────────────────────────────────────────────────────────────────────────────
function MedicationPanel() {
  return (
    <ScrollView contentContainerStyle={styles.medicationContainer}>
      <Text style={styles.medicationTitle}>💊 Clinical Medication Tracking</Text>
      <Text style={styles.medicationSubtitle}>
        This section is for managing prescriptions and clinical follow-ups.
      </Text>

      <View style={styles.medicationCard}>
        <Text style={styles.medicationCardIcon}>🔒</Text>
        <Text style={styles.medicationCardTitle}>Unlocked by Your Counselor</Text>
        <Text style={styles.medicationCardDesc}>
          Once your counselor accepts your support request, they can create a medication plan for you here.
          Discuss your needs in your first session to get started.
        </Text>
      </View>

      <View style={styles.medicationInfoRow}>
        <View style={styles.medicationInfoItem}>
          <Text style={styles.medicationInfoIcon}>📋</Text>
          <Text style={styles.medicationInfoLabel}>Prescription Tracking</Text>
        </View>
        <View style={styles.medicationInfoItem}>
          <Text style={styles.medicationInfoIcon}>⏰</Text>
          <Text style={styles.medicationInfoLabel}>Dose Reminders</Text>
        </View>
        <View style={styles.medicationInfoItem}>
          <Text style={styles.medicationInfoIcon}>📈</Text>
          <Text style={styles.medicationInfoLabel}>Progress Logs</Text>
        </View>
      </View>

      <Text style={styles.medicationDisclaimer}>
        All medication data is encrypted and only accessible to you and your assigned counselor.
      </Text>
    </ScrollView>
  );
}

// ─── Shared Styles ────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.cream },

  // Segmented Control
  segmentBar: {
    flexDirection: 'row',
    margin: 16,
    backgroundColor: '#EEEAE2',
    borderRadius: R.full,
    padding: 4,
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: R.full,
    alignItems: 'center',
  },
  segmentActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  segmentText: { fontSize: 13, fontWeight: '700', color: C.muted },
  segmentTextActive: { color: C.charcoal },

  // Counselor panel
  assessBanner: {
    marginHorizontal: 16,
    marginBottom: 8,
    borderWidth: 1.5,
    borderRadius: R.md,
    padding: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  assessLabel: { fontSize: 10, fontWeight: '800', color: C.muted, letterSpacing: 1.2, marginBottom: 4 },
  assessScore: { fontSize: 20, fontWeight: '800', marginBottom: 4 },
  riskPill: { paddingHorizontal: 12, paddingVertical: 3, borderRadius: R.full },
  riskPillText: { fontSize: 11, fontWeight: '800' },

  list: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24 },

  counselorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: R.md,
    padding: 14,
    borderWidth: 1,
    borderColor: C.border,
  },
  avatar: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: C.sageLight,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 20, fontWeight: '800', color: C.sage },
  counselorName: { fontSize: 15, fontWeight: '800', color: C.charcoal, marginBottom: 1 },
  counselorSpec: { fontSize: 12, fontWeight: '600', color: C.sage, marginBottom: 3 },
  counselorBio: { fontSize: 12, color: C.muted, lineHeight: 17 },
  requestBtn: { backgroundColor: C.sage, paddingHorizontal: 14, paddingVertical: 8, borderRadius: R.full },
  requestBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  // Shared utility
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  mutedText: { fontSize: 13, color: C.muted, textAlign: 'center', lineHeight: 20, marginTop: 6 },
  errorText: { fontSize: 13, color: C.error, textAlign: 'center', marginBottom: 16 },
  sageBtn: { backgroundColor: C.sage, paddingHorizontal: 24, paddingVertical: 11, borderRadius: R.full },
  sageBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.48)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 28, paddingBottom: 44 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: C.charcoal, marginBottom: 10 },
  modalBody: { fontSize: 15, color: C.charcoal, lineHeight: 22, marginBottom: 16 },
  sharedBox: { borderWidth: 1.5, borderRadius: R.md, padding: 14, marginBottom: 14, backgroundColor: C.cream },
  sharedLabel: { fontSize: 12, fontWeight: '700', color: C.charcoal, marginBottom: 6 },
  sharedScore: { fontSize: 16, fontWeight: '800', marginBottom: 4 },
  summaryPreview: { fontSize: 12, color: C.muted, lineHeight: 18, fontStyle: 'italic', marginTop: 4 },
  consentText: { fontSize: 11, color: C.muted, lineHeight: 17, marginBottom: 20, fontStyle: 'italic' },
  modalActions: { flexDirection: 'row', gap: 10 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: R.full, borderWidth: 1.5, borderColor: C.border, alignItems: 'center' },
  cancelBtnText: { fontWeight: '700', color: C.charcoal, fontSize: 14 },
  sendBtn: { flex: 2, paddingVertical: 14, borderRadius: R.full, backgroundColor: C.sage, alignItems: 'center' },
  sendBtnText: { fontWeight: '700', color: '#fff', fontSize: 14 },

  // Medication panel
  medicationContainer: { padding: 20 },
  medicationTitle: { fontSize: 22, fontWeight: '800', color: C.charcoal, marginBottom: 8 },
  medicationSubtitle: { fontSize: 14, color: C.muted, lineHeight: 21, marginBottom: 24 },
  medicationCard: {
    backgroundColor: '#fff',
    borderRadius: R.lg,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 20,
  },
  medicationCardIcon: { fontSize: 36, marginBottom: 12 },
  medicationCardTitle: { fontSize: 17, fontWeight: '800', color: C.charcoal, marginBottom: 8, textAlign: 'center' },
  medicationCardDesc: { fontSize: 14, color: C.muted, textAlign: 'center', lineHeight: 22 },
  medicationInfoRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20 },
  medicationInfoItem: { alignItems: 'center', gap: 8 },
  medicationInfoIcon: { fontSize: 28 },
  medicationInfoLabel: { fontSize: 11, fontWeight: '700', color: C.muted, textAlign: 'center', maxWidth: 80 },
  medicationDisclaimer: { fontSize: 11, color: C.muted, textAlign: 'center', lineHeight: 18, fontStyle: 'italic', paddingHorizontal: 8 },
});
