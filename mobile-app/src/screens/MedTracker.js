import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { designTokens, globalStyles } from '../globalStyles';
import { API_URL } from '../config';

// Fallback logic representing the API state over the local network
export default function MedTracker({ token }) {
  const [logs, setLogs] = useState([
    { _id: '1', med_name: 'Sertraline', slot_name: 'Morning', is_taken: true, status: 'completed', due_date: new Date().toISOString() },
    { _id: '2', med_name: 'Alprazolam', slot_name: 'Afternoon', is_taken: false, status: 'missed', due_date: new Date().toISOString() },
    { _id: '3', med_name: 'Melatonin', slot_name: 'Night', is_taken: false, status: 'pending', due_date: new Date().toISOString() }
  ]);

  const takeMedication = (id) => {
    // Make call to backend: PATCH /api/meds/take/:logId
    // fetch(`${API_URL}/api/meds/take/${id}`, ...)
    setLogs(prev => prev.map(log => log._id === id ? { ...log, is_taken: true, status: 'completed' } : log));
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={globalStyles.textDisplay}>Medication Schedule</Text>
      <Text style={globalStyles.textBody}>Track your daily wellness plan.</Text>
      
      <View style={{ marginTop: 24 }}>
        {logs.map((log) => (
          <View key={log._id} style={styles.logCard}>
             <View style={styles.logInfo}>
                <Text style={styles.slotText}>{log.slot_name}</Text>
                <Text style={styles.medName}>{log.med_name}</Text>
                <Text style={styles.timeText}>{new Date(log.due_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</Text>
             </View>
             
             {/* Dynamic Icon based on Stitch logic requirement */}
             <View style={styles.actionArea}>
                {log.status === 'missed' ? (
                  <View style={styles.missedIcon}>
                    <Text style={{color: designTokens.colors.onError, fontWeight: 'bold'}}>❌</Text>
                  </View>
                ) : log.is_taken ? (
                  <View style={styles.takenIcon}>
                    <Text style={{color: designTokens.colors.onPrimary, fontWeight: 'bold'}}>✅</Text>
                  </View>
                ) : (
                  <TouchableOpacity onPress={() => takeMedication(log._id)} style={styles.takeBtn}>
                    <Text style={{color: designTokens.colors.onPrimary, fontWeight: 'bold'}}>Take</Text>
                  </TouchableOpacity>
                )}
             </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: designTokens.colors.surface
  },
  logCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: designTokens.colors.surfaceContainerLow,
    padding: 20,
    borderRadius: designTokens.radius.lg,
    marginBottom: 16
  },
  slotText: {
    color: designTokens.colors.onSurfaceVariant,
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase'
  },
  medName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: designTokens.colors.onSurface,
    marginTop: 4
  },
  timeText: {
    marginTop: 8,
    color: designTokens.colors.onSurfaceVariant
  },
  actionArea: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  missedIcon: {
    backgroundColor: designTokens.colors.error,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center'
  },
  takenIcon: {
    backgroundColor: designTokens.colors.primary,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center'
  },
  takeBtn: {
    backgroundColor: designTokens.colors.onSurfaceVariant,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
  }
});
