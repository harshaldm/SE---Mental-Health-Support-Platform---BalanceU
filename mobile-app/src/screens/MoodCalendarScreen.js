import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Dimensions
} from 'react-native';
import axios from 'axios';
import { designTokens } from '../globalStyles';
import { BASE_URL } from '../config/apiConfig';
import logger from '../utils/logger';

const C = designTokens.colors;
const R = designTokens.radius;
const { width } = Dimensions.get('window');

const MOOD_EMOJIS = {
  1: '😔',
  2: '😐',
  3: '🙂',
  4: '😊',
  5: '✨',
};

export default function MoodCalendarScreen({ token }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    logger.start('MoodCalendar', 'Fetching mood history');
    try {
      const res = await axios.get(`${BASE_URL}/api/mood/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLogs(res.data.logs || []);
    } catch (err) {
      logger.error('MoodCalendar', 'History Fetch Failed', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // ─── Calendar Generation ───────────────────────────────────────────────────
  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Trace Logging
    console.log(`[MoodCalendarScreen.js : generateCalendar : 56] -> ${currentDate.toLocaleString('default', { month: 'long' })} ${year} starts on day index: ${firstDay}`);

    const days = [];
    // Padding for start of month
    for (let i = 0; i < firstDay; i++) {
      days.push(<View key={`empty-${i}`} style={styles.dayCell} />);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const log = logs.find(l => l.log_date === dateStr);
      const isToday = new Date().toISOString().split('T')[0] === dateStr;

      days.push(
        <View key={d} style={[styles.dayCell, isToday && styles.todayCell]}>
          <Text style={[styles.dayNum, isToday && styles.todayNum]}>{d}</Text>
          {log ? (
            <Text style={styles.dayEmoji}>{MOOD_EMOJIS[log.mood_score]}</Text>
          ) : (
            <View style={styles.dot} />
          )}
        </View>
      );
    }

    return days;
  };

  const changeMonth = (offset) => {
    const next = new Date(currentDate.setMonth(currentDate.getMonth() + offset));
    setCurrentDate(new Date(next));
  };

  // ─── Analytics ─────────────────────────────────────────────────────────────
  const calculateAverage = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const monthLogs = logs.filter(l => {
      const d = new Date(l.log_date);
      return d.getFullYear() === year && d.getMonth() === month;
    });

    if (monthLogs.length === 0) return 0;
    const sum = monthLogs.reduce((acc, curr) => acc + curr.mood_score, 0);
    return (sum / monthLogs.length).toFixed(1);
  };

  const monthName = currentDate.toLocaleString('default', { month: 'long' });
  const avg = calculateAverage();

  if (loading) return <View style={styles.center}><ActivityIndicator color={C.sage} /></View>;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        {/* Header */}
        <View style={styles.calendarHeader}>
          <TouchableOpacity onPress={() => changeMonth(-1)}>
            <Text style={styles.navBtn}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.monthTitle}>{monthName} {currentDate.getFullYear()}</Text>
          <TouchableOpacity onPress={() => changeMonth(1)}>
            <Text style={styles.navBtn}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Days Header */}
        <View style={styles.daysRow}>
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, index) => (
            // By using `${d}-${index}`, every 'S' and 'T' gets a unique ID (e.g., S-0, S-6)
            <Text key={`${d}-${index}`} style={styles.dayLabel}>{d}</Text>
          ))}
        </View>

        {/* Grid */}
        <View style={styles.grid}>
          {renderCalendar()}
        </View>
      </View>

      {/* Analytics */}
      <View style={styles.analyticsCard}>
        <Text style={styles.analyticsLabel}>Your {monthName} Sanctuary Average</Text>
        <Text style={styles.analyticsValue}>{avg}/5</Text>
        <Text style={styles.analyticsSub}>
          {avg > 4 ? "You're radiating! Keep it up." : avg > 2 ? "A steady journey. We're here for you." : "Sending you extra support today."}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.cream, padding: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 16,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  navBtn: { fontSize: 32, color: C.sage, fontWeight: '300', paddingHorizontal: 10 },
  monthTitle: { fontSize: 18, fontWeight: '800', color: C.charcoal },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 8,
  },
  dayLabel: { fontSize: 12, fontWeight: '700', color: C.muted, width: '14.28%', textAlign: 'center' },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayCell: {
    backgroundColor: C.sageLight,
    borderRadius: 12,
  },
  dayNum: { fontSize: 12, color: C.muted, marginBottom: 4 },
  todayNum: { color: C.sage, fontWeight: '900' },
  dayEmoji: { fontSize: 20 },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#E0D900' || C.border }, // fallback dot
  analyticsCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    marginBottom: 40,
  },
  analyticsLabel: { fontSize: 13, fontWeight: '700', color: C.muted, marginBottom: 8 },
  analyticsValue: { fontSize: 32, fontWeight: '900', color: C.sage, marginBottom: 4 },
  analyticsSub: { fontSize: 12, color: C.muted, textAlign: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.cream },
});
