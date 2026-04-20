import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { designTokens, globalStyles } from '../globalStyles';

export default function QuizOnboarding({ onStartQuiz }) {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Mental Health Check-in</Text>
      <Text style={styles.subtitle}>
        Select a brief assessment to help us understand how you're feeling.
      </Text>

      <TouchableOpacity 
        style={styles.card} 
        onPress={() => onStartQuiz('PHQ-9')}
      >
        <View style={[styles.iconBox, { backgroundColor: '#e6f0eb' }]}>
          <Text style={{ fontSize: 24 }}>📋</Text>
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.cardTitle}>PHQ-9 (Depression)</Text>
          <Text style={styles.cardDesc}>
            A 9-question tool to monitor mood severity.
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.card} 
        onPress={() => onStartQuiz('GAD-7')}
      >
        <View style={[styles.iconBox, { backgroundColor: '#fdf3e8' }]}>
          <Text style={{ fontSize: 24 }}>🛡️</Text>
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.cardTitle}>GAD-7 (Anxiety)</Text>
          <Text style={styles.cardDesc}>
            A 7-question tool for tracking anxiety level.
          </Text>
        </View>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: designTokens.colors.onSurface,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: designTokens.colors.onSurfaceVariant,
    marginBottom: 32,
    lineHeight: 22,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: designTokens.colors.surfaceContainerLow,
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  iconBox: {
    width: 60,
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: designTokens.colors.onSurface,
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 14,
    color: designTokens.colors.onSurfaceVariant,
  }
});
