import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { designTokens } from '../globalStyles';

const C = designTokens.colors;
const R = designTokens.radius;

// ─── Risk style helper ────────────────────────────────────────────────────────
const getRiskStyle = (level = '') => {
  const l = level.toLowerCase();
  if (l.includes('high') || l.includes('severe'))   return { color: C.error,   bg: C.errorContainer };
  if (l.includes('medium') || l.includes('moderate')) return { color: '#F59E0B', bg: '#FEF3C7' };
  return { color: C.sage, bg: C.sageLight };
};

// ─────────────────────────────────────────────────────────────────────────────
// AssessmentResults
// Props:
//   quizType              — 'PHQ-9' | 'GAD-7'
//   aiInsights            — { summary, riskLevel, potentialPattern, score, disclaimer }
//   onReturn              — go back to quiz list
//   onConnectWithSupport  — (assessmentData) => navigate to counselor directory
//   onGoToResources       — () => switch to Resource tab
// ─────────────────────────────────────────────────────────────────────────────
export default function AssessmentResults({
  quizType,
  aiInsights = {},
  onReturn,
  onConnectWithSupport,
  onGoToResources,
}) {
  const [showChoiceModal, setShowChoiceModal] = useState(false);

  // Robust fallbacks
  const summary          = aiInsights?.summary          || 'Analysis data missing. Please contact support.';
  const riskLevel        = aiInsights?.riskLevel        || 'Low';
  const potentialPattern = aiInsights?.potentialPattern || 'Standard Profile';
  const score            = aiInsights?.score            ?? 0;
  const disclaimer       = aiInsights?.disclaimer       || 'AI observations are for informational purposes only.';

  const maxScore   = quizType === 'PHQ-9' ? 27 : 21;
  const riskStyle  = getRiskStyle(riskLevel);

  // Handler: user picks "Counselor Support" from the modal
  const handleCounselorChoice = () => {
    setShowChoiceModal(false);
    onConnectWithSupport?.({ score, riskLevel, summary });
  };

  // Handler: user picks "Resources" from the modal
  const handleResourceChoice = () => {
    setShowChoiceModal(false);
    onGoToResources?.();
  };

  return (
    <>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card}>
          <Text style={styles.header}>Your Assessment Results</Text>

          {/* ── Score Card ── */}
          <View style={styles.scoreBox}>
            <Text style={styles.scoreLabel}>TOTAL SCORE</Text>
            <Text style={[styles.scoreValue, { color: riskStyle.color }]}>
              {score}
              <Text style={styles.maxScore}> / {maxScore}</Text>
            </Text>
            <View style={[styles.riskBadge, { backgroundColor: riskStyle.bg }]}>
              <Text style={[styles.riskText, { color: riskStyle.color }]}>
                {riskLevel.toUpperCase()} RISK
              </Text>
            </View>
          </View>

          {/* ── Clinical Observation ── */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>CLINICAL OBSERVATION</Text>
            <View style={styles.patternPill}>
              <Text style={styles.patternText}>{potentialPattern}</Text>
            </View>
          </View>

          {/* ── AI Summary ── */}
          <View style={styles.summaryBox}>
            <Text style={styles.summaryText}>{summary}</Text>
          </View>

          {/* ── Disclaimer ── */}
          <Text style={styles.disclaimer}>{disclaimer}</Text>

          {/* ── "Connect with Support" — primary CTA ── */}
          <TouchableOpacity
            style={styles.connectBtn}
            onPress={() => setShowChoiceModal(true)}
          >
            <Text style={styles.connectBtnText}>🫂 Connect with Support</Text>
          </TouchableOpacity>

          {/* ── Return button ── */}
          <TouchableOpacity style={styles.returnBtn} onPress={onReturn}>
            <Text style={styles.returnBtnText}>Return to Quizzes</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ── Choice Modal ── */}
      <Modal visible={showChoiceModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>How would you like to proceed?</Text>
            <Text style={styles.modalSubtitle}>
              Choose the type of support that feels right for you right now.
            </Text>

            {/* Option 1: Counselor */}
            <TouchableOpacity style={styles.choiceCard} onPress={handleCounselorChoice}>
              <View style={styles.choiceIconBox}>
                <Text style={styles.choiceIcon}>🫂</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.choiceTitle}>Counselor Support</Text>
                <Text style={styles.choiceDesc}>
                  Connect with a qualified counselor at your institute. Your assessment will be shared to help them understand your situation.
                </Text>
              </View>
              <Text style={styles.choiceChevron}>›</Text>
            </TouchableOpacity>

            {/* Option 2: Resources */}
            <TouchableOpacity style={styles.choiceCard} onPress={handleResourceChoice}>
              <View style={[styles.choiceIconBox, { backgroundColor: '#FEF3C7' }]}>
                <Text style={styles.choiceIcon}>📚</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.choiceTitle}>Self-Help Resources</Text>
                <Text style={styles.choiceDesc}>
                  Explore guided readings, breathing exercises, and mental wellness articles at your own pace.
                </Text>
              </View>
              <Text style={styles.choiceChevron}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalDismiss} onPress={() => setShowChoiceModal(false)}>
              <Text style={styles.modalDismissText}>Not now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: 20,
    paddingTop: 36,
    flexGrow: 1,
    backgroundColor: C.cream,
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: R.lg,
    padding: 28,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 4,
  },

  header: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    color: C.charcoal,
    marginBottom: 28,
    letterSpacing: -0.3,
  },

  // Score Card
  scoreBox: {
    alignItems: 'center',
    marginBottom: 28,
    padding: 22,
    backgroundColor: C.cream,
    borderRadius: R.md,
    borderWidth: 1,
    borderColor: C.border,
  },
  scoreLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: C.muted,
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  scoreValue: { fontSize: 62, fontWeight: '800', lineHeight: 70 },
  maxScore: { fontSize: 22, color: C.muted, fontWeight: '500' },
  riskBadge: { marginTop: 12, paddingHorizontal: 18, paddingVertical: 6, borderRadius: R.full },
  riskText: { fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },

  // Clinical pattern
  section: { alignItems: 'center', marginBottom: 22 },
  sectionLabel: {
    fontSize: 10, fontWeight: '800', color: C.muted,
    letterSpacing: 1.5, marginBottom: 10,
  },
  patternPill: {
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: R.md,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  patternText: { color: '#0369A1', fontWeight: '700', fontSize: 15 },

  // Summary
  summaryBox: {
    backgroundColor: C.cream,
    padding: 20,
    borderRadius: R.md,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: C.border,
  },
  summaryText: {
    fontSize: 15,
    lineHeight: 24,
    color: C.charcoal,
    textAlign: 'center',
  },

  // Disclaimer
  disclaimer: {
    fontSize: 11,
    color: C.muted,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 17,
    paddingHorizontal: 8,
    marginBottom: 4,
  },

  // Buttons
  connectBtn: {
    marginTop: 28,
    backgroundColor: C.sage,
    borderRadius: R.full,
    paddingVertical: 16,
    alignItems: 'center',
  },
  connectBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  returnBtn: {
    marginTop: 10,
    backgroundColor: C.sageLight,
    borderRadius: R.full,
    paddingVertical: 15,
    alignItems: 'center',
  },
  returnBtnText: { color: C.sage, fontWeight: '700', fontSize: 15 },

  // Choice Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(44,44,44,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 28,
    paddingBottom: 44,
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: C.charcoal, marginBottom: 6 },
  modalSubtitle: { fontSize: 14, color: C.muted, lineHeight: 20, marginBottom: 22 },

  choiceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: C.cream,
    borderRadius: R.md,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  choiceIconBox: {
    width: 48, height: 48,
    borderRadius: 14,
    backgroundColor: C.sageLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceIcon: { fontSize: 24 },
  choiceTitle: { fontSize: 15, fontWeight: '800', color: C.charcoal, marginBottom: 3 },
  choiceDesc: { fontSize: 12, color: C.muted, lineHeight: 18 },
  choiceChevron: { fontSize: 20, color: C.muted },

  modalDismiss: { marginTop: 8, alignItems: 'center', paddingVertical: 12 },
  modalDismissText: { fontSize: 14, color: C.muted, fontWeight: '600' },
});
