import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  ActivityIndicator, Modal, ScrollView, Alert,
} from 'react-native';
import axios from 'axios';
import { BASE_URL } from '../config/apiConfig';

// ─── Design Tokens ────────────────────────────────────────────────────────────
const SAGE    = '#556B5F';
const CREAM   = '#FDFBF7';
const CHARCOAL = '#2C2C2C';
const MUTED   = '#7A7A6E';
const BORDER  = '#E0D9CE';

// ─── Risk colour helper ───────────────────────────────────────────────────────
const getRiskStyle = (level = '') => {
  const l = level.toLowerCase();
  if (l.includes('high') || l.includes('severe')) return { text: '#DC2626', bg: '#FEE2E2' };
  if (l.includes('medium') || l.includes('moderate')) return { text: '#D97706', bg: '#FEF3C7' };
  return { text: SAGE, bg: '#EFF4F1' };
};

// ─────────────────────────────────────────────────────────────────────────────
// CounselorDirectory
// Props:
//   instituteId  — student's institute_id (from user object)
//   score        — numeric assessment score
//   riskLevel    — 'Low' | 'Medium' | 'High'
//   summary      — AI-generated summary string
//   token        — JWT auth token
//   onBack       — callback to return to previous screen
// ─────────────────────────────────────────────────────────────────────────────
export default function CounselorDirectory({ instituteId, score, riskLevel, summary, token, onBack }) {
  const [counselors, setCounselors]   = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');

  // Modal state
  const [selectedCounselor, setSelectedCounselor] = useState(null);
  const [submitting, setSubmitting]   = useState(false);

  // ── Fetch active counselors for this institute ──
  const fetchCounselors = useCallback(async () => {
    if (!instituteId) {
      setError('Your account is not linked to an institute. Please contact your administrator.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`${BASE_URL}/api/institutes/${instituteId}/counselors`);
      setCounselors(res.data.counselors || []);
    } catch (err) {
      setError('Could not load counselors. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [instituteId]);

  useEffect(() => { fetchCounselors(); }, [fetchCounselors]);

  // ── Submit the support request ──
  const handleSendRequest = async () => {
    if (!selectedCounselor) return;
    setSubmitting(true);
    try {
      await axios.post(
        `${BASE_URL}/api/requests/submit`,
        {
          counselor_id:   selectedCounselor.id,
          institute_id:   instituteId,
          score:          score ?? null,
          risk_level:     riskLevel || null,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSelectedCounselor(null);
      Alert.alert(
        '✅ Request Sent',
        `${selectedCounselor.name} has been notified via email and will review your assessment. They will respond shortly.`,
        [{ text: 'OK', onPress: onBack }]
      );
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to send request. Please try again.';
      Alert.alert('Error', msg);
    } finally {
      setSubmitting(false);
    }
  };

  const riskStyle = getRiskStyle(riskLevel);

  // ─── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={SAGE} />
        <Text style={styles.mutedText}>Finding counselors at your institute…</Text>
      </View>
    );
  }

  // ─── Error ────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={fetchCounselors} style={styles.sageBtn}>
          <Text style={styles.sageBtnText}>Try Again</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onBack} style={[styles.sageBtn, { backgroundColor: 'transparent', borderWidth: 1, borderColor: BORDER, marginTop: 8 }]}>
          <Text style={[styles.sageBtnText, { color: CHARCOAL }]}>← Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select a Counselor</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* ── Assessment context banner ── */}
      {score != null && (
        <View style={[styles.assessBanner, { borderColor: riskStyle.text }]}>
          <Text style={styles.assessLabel}>YOUR ASSESSMENT WILL BE SHARED</Text>
          <Text style={[styles.assessScore, { color: riskStyle.text }]}>
            Score: {score}
          </Text>
          <View style={[styles.riskPill, { backgroundColor: riskStyle.bg }]}>
            <Text style={[styles.riskPillText, { color: riskStyle.text }]}>
              {riskLevel || 'Low'} Risk
            </Text>
          </View>
        </View>
      )}

      {/* ── Counselor List ── */}
      {counselors.length === 0 ? (
        <View style={styles.centered}>
          <Text style={{ fontSize: 36, marginBottom: 12 }}>😕</Text>
          <Text style={styles.mutedText}>
            No counselors are currently available at your institute.
          </Text>
        </View>
      ) : (
        <FlatList
          data={counselors}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          renderItem={({ item }) => (
            <View style={styles.card}>
              {/* Avatar */}
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {(item.name || 'C')[0].toUpperCase()}
                </Text>
              </View>

              {/* Info */}
              <View style={{ flex: 1 }}>
                <Text style={styles.counselorName}>{item.name}</Text>
                {item.specialization ? (
                  <Text style={styles.counselorSpec}>{item.specialization}</Text>
                ) : null}
                {item.bio ? (
                  <Text style={styles.counselorBio} numberOfLines={2}>
                    {item.bio}
                  </Text>
                ) : null}
              </View>

              {/* Request button */}
              <TouchableOpacity
                style={styles.requestBtn}
                onPress={() => setSelectedCounselor(item)}
              >
                <Text style={styles.requestBtnText}>Request</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      {/* ── Confirmation Modal ── */}
      <Modal visible={!!selectedCounselor} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Confirm Request</Text>

            <Text style={styles.modalBody}>
              Requesting support from{' '}
              <Text style={{ fontWeight: '800', color: SAGE }}>
                {selectedCounselor?.name}
              </Text>
              .
            </Text>

            {/* What will be shared */}
            <View style={[styles.sharedBox, { borderColor: score != null ? riskStyle.text : BORDER }]}>
              <Text style={styles.sharedLabel}>📊 The following will be shared with {selectedCounselor?.name}:</Text>
              {score != null ? (
                <Text style={[styles.sharedScore, { color: riskStyle.text }]}>
                  Score: {score} — {riskLevel || 'Low'} Risk
                </Text>
              ) : (
                <Text style={styles.noAssessText}>No assessment data available.</Text>
              )}
              {summary ? (
                <Text style={styles.summaryPreview} numberOfLines={3}>
                  "{summary}"
                </Text>
              ) : null}
            </View>

            <Text style={styles.consentText}>
              By proceeding, you consent to sharing this information. {selectedCounselor?.name} will receive an email notification immediately.
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setSelectedCounselor(null)}
                disabled={submitting}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.sendBtn, submitting && { opacity: 0.55 }]}
                onPress={handleSendRequest}
                disabled={submitting}
              >
                <Text style={styles.sendBtnText}>
                  {submitting ? 'Sending…' : '📩 Send Request'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: CREAM },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  backBtn: { paddingVertical: 4, paddingHorizontal: 4 },
  backBtnText: { fontSize: 16, fontWeight: '700', color: SAGE },
  headerTitle: { fontSize: 16, fontWeight: '800', color: CHARCOAL },

  // Assessment Banner
  assessBanner: {
    margin: 16,
    marginBottom: 8,
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 14,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  assessLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: MUTED,
    letterSpacing: 1.2,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  assessScore: { fontSize: 22, fontWeight: '800', marginBottom: 6 },
  riskPill: {
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 20,
  },
  riskPillText: { fontSize: 12, fontWeight: '800' },

  // List
  list: { padding: 16, paddingTop: 12 },

  // Card
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EFF4F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 22, fontWeight: '900', color: SAGE },
  counselorName: { fontSize: 15, fontWeight: '800', color: CHARCOAL, marginBottom: 2 },
  counselorSpec: { fontSize: 12, fontWeight: '600', color: SAGE, marginBottom: 3 },
  counselorBio: { fontSize: 12, color: MUTED, lineHeight: 17 },
  requestBtn: {
    backgroundColor: SAGE,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 50,
  },
  requestBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  // Centered helpers
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  mutedText: { fontSize: 14, color: MUTED, textAlign: 'center', lineHeight: 20, marginTop: 8 },
  errorText: { fontSize: 14, color: '#DC2626', textAlign: 'center', marginBottom: 16, lineHeight: 20 },
  sageBtn: {
    backgroundColor: SAGE,
    paddingHorizontal: 24,
    paddingVertical: 11,
    borderRadius: 50,
  },
  sageBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 28,
    paddingBottom: 44,
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: CHARCOAL, marginBottom: 10 },
  modalBody: { fontSize: 15, color: CHARCOAL, lineHeight: 22, marginBottom: 16 },
  sharedBox: {
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    backgroundColor: CREAM,
  },
  sharedLabel: { fontSize: 13, fontWeight: '700', color: CHARCOAL, marginBottom: 6 },
  sharedScore: { fontSize: 17, fontWeight: '800', marginBottom: 4 },
  noAssessText: { fontSize: 13, color: MUTED },
  summaryPreview: {
    fontSize: 12,
    color: MUTED,
    lineHeight: 18,
    fontStyle: 'italic',
    marginTop: 6,
  },
  consentText: { fontSize: 12, color: MUTED, lineHeight: 17, marginBottom: 22, fontStyle: 'italic' },
  modalActions: { flexDirection: 'row', gap: 10 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 50,
    borderWidth: 1.5,
    borderColor: BORDER,
    alignItems: 'center',
  },
  cancelBtnText: { fontWeight: '700', color: CHARCOAL, fontSize: 14 },
  sendBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 50,
    backgroundColor: SAGE,
    alignItems: 'center',
  },
  sendBtnText: { fontWeight: '700', color: '#fff', fontSize: 14 },
});
