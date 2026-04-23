import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { designTokens } from '../globalStyles';

const C = designTokens.colors;
const R = designTokens.radius;

const QUIZZES = [
  {
    type: 'PHQ-9',
    emoji: '📋',
    title: 'PHQ-9 — Depression',
    subtitle: 'Patient Health Questionnaire',
    desc: '9 questions · ~3 minutes',
    detail: 'Monitors severity of depressive symptoms to guide clinical care.',
    iconBg: '#EFF4F1',
  },
  {
    type: 'GAD-7',
    emoji: '🛡️',
    title: 'GAD-7 — Anxiety',
    subtitle: 'Generalized Anxiety Disorder',
    desc: '7 questions · ~2 minutes',
    detail: 'Measures anxiety frequency and severity over the past two weeks.',
    iconBg: '#FEF3C7',
  },
];

export default function QuizOnboarding({ onStartQuiz }) {
  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.headerSection}>
        <Text style={styles.greeting}>Self-Assessment</Text>
        <Text style={styles.title}>Mental Health Check-in</Text>
        <Text style={styles.subtitle}>
          Select a brief, clinically-validated tool to understand how you're feeling.
          Your responses are private and secure.
        </Text>
      </View>

      {/* Quiz cards */}
      {QUIZZES.map(({ type, emoji, title, subtitle, desc, detail, iconBg }) => (
        <TouchableOpacity
          key={type}
          style={styles.card}
          onPress={() => onStartQuiz(type)}
          activeOpacity={0.85}
        >
          <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
            <Text style={styles.iconEmoji}>{emoji}</Text>
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.cardTitle}>{title}</Text>
            <Text style={styles.cardSubtitle}>{subtitle}</Text>
            <Text style={styles.cardDesc}>{desc}</Text>
            <Text style={styles.cardDetail}>{detail}</Text>
          </View>
          <View style={styles.arrowBox}>
            <Text style={styles.arrow}>›</Text>
          </View>
        </TouchableOpacity>
      ))}

      {/* Footer note */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          🔒 Your responses are encrypted and never shared without your consent.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: 28,
    paddingBottom: 40,
    backgroundColor: C.cream,
    flexGrow: 1,
  },

  headerSection: {
    marginBottom: 28,
  },
  greeting: {
    fontSize: 11,
    fontWeight: '800',
    color: C.sage,
    letterSpacing: 1.5,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: C.charcoal,
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    color: C.muted,
    lineHeight: 21,
  },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: R.lg,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    gap: 14,
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconEmoji: { fontSize: 26 },

  cardBody: { flex: 1 },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: C.charcoal,
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 11,
    fontWeight: '700',
    color: C.sage,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 12,
    color: C.muted,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardDetail: {
    fontSize: 12,
    color: C.muted,
    lineHeight: 17,
  },

  arrowBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: C.sageLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrow: { fontSize: 18, color: C.sage, fontWeight: '800', marginTop: -2 },

  footer: {
    marginTop: 8,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: R.md,
    borderWidth: 1,
    borderColor: C.border,
  },
  footerText: {
    fontSize: 12,
    color: C.muted,
    textAlign: 'center',
    lineHeight: 18,
  },
});
