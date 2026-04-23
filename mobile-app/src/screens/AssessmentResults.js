import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { designTokens, globalStyles } from '../globalStyles';

// EMERGENCY RESTORATION: Premium Results UI
// This component displays clinical observations and numerical scores.
export default function AssessmentResults({ quizType, aiInsights = {}, onReturn }) {
  // Destructure with robust fallbacks to prevent crashes
  const summary = aiInsights?.summary || 'Analysis data missing. Please contact support.';
  const riskLevel = aiInsights?.riskLevel || 'Low'; 
  const potentialPattern = aiInsights?.potentialPattern || 'Standard Profile';
  const score = aiInsights?.score ?? 0;
  const disclaimer = aiInsights?.disclaimer || "AI observations are for informational purposes only. Please consult a licensed professional.";
  
  const maxScore = quizType === 'PHQ-9' ? 27 : 21;

  // Determine Risk Color & mapping for 'Undeterminable' bug prevention
  const getRiskStyles = (level) => {
    const l = (level || '').toLowerCase();
    if (l.includes('high') || l.includes('severe')) {
        return { color: designTokens.colors.error, bg: designTokens.colors.errorContainer };
    }
    if (l.includes('medium') || l.includes('moderate')) {
        return { color: '#F59E0B', bg: '#FEF3C7' };
    }
    // Default / Low
    return { color: designTokens.colors.primary, bg: designTokens.colors.primaryContainer };
  };

  const riskStyles = getRiskStyles(riskLevel);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.header}>Your Assessment Results</Text>
        
        {/* Score Card - LARGE DISPLAY */}
        <View style={styles.scoreBox}>
          <Text style={styles.scoreLabel}>Total Assessment Score</Text>
          <Text style={[styles.scoreValue, { color: riskStyles.color }]}>
            {score}
            <Text style={styles.maxScoreText}> / {maxScore}</Text>
          </Text>
          
          <View style={[styles.riskBadge, { backgroundColor: riskStyles.bg }]}>
            <Text style={[styles.riskText, { color: riskStyles.color }]}>{riskLevel.toUpperCase()}</Text>
          </View>
        </View>

        {/* Pattern Badge */}
        <View style={styles.patternSection}>
          <Text style={styles.sectionLabel}>CLINICAL OBSERVATION</Text>
          <View style={styles.patternBadge}>
             <Text style={styles.patternText}>{potentialPattern}</Text>
          </View>
        </View>

        {/* Summary Block */}
        <View style={styles.summarySection}>
          <Text style={styles.summaryText}>{summary}</Text>
        </View>

        {/* Disclaimer */}
        <Text style={styles.disclaimer}>{disclaimer}</Text>

        <TouchableOpacity 
          style={[globalStyles.buttonPrimary, { marginTop: 32 }]} 
          onPress={onReturn}
        >
          <Text style={globalStyles.buttonText}>Return to Quizzes</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingTop: 48,
    flexGrow: 1,
    backgroundColor: designTokens.colors.surface,
  },
  card: {
    backgroundColor: designTokens.colors.surfaceContainerLow,
    padding: 32,
    borderRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: designTokens.colors.onSurface,
    marginBottom: 32,
  },
  scoreBox: {
    alignItems: 'center',
    marginBottom: 32,
    padding: 24,
    backgroundColor: designTokens.colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#f0f0ea',
  },
  scoreLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: designTokens.colors.onSurfaceVariant,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  scoreValue: {
    fontSize: 64, // HUGE font for primary attention
    fontWeight: '800',
  },
  maxScoreText: {
    fontSize: 24,
    color: designTokens.colors.onSurfaceVariant,
    fontWeight: '400',
  },
  riskBadge: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 50,
  },
  riskText: {
    fontSize: 14,
    fontWeight: '800',
  },
  patternSection: {
    marginBottom: 24,
    alignItems: 'center',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: designTokens.colors.onSurfaceVariant,
    marginBottom: 12,
    letterSpacing: 1.5,
  },
  patternBadge: {
    backgroundColor: '#F0F9FF', // Sky light
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  patternText: {
    color: '#0369A1',
    fontWeight: 'bold',
    fontSize: 16,
  },
  summarySection: {
    backgroundColor: designTokens.colors.surface,
    padding: 24,
    borderRadius: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#f5f5f0',
  },
  summaryText: {
    fontSize: 16,
    lineHeight: 26,
    color: designTokens.colors.onSurface,
    textAlign: 'center',
  },
  disclaimer: {
    fontSize: 12,
    color: designTokens.colors.onSurfaceVariant,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 18,
    paddingHorizontal: 10,
  }
});
