import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  FlatList, ActivityIndicator, Linking, ScrollView
} from 'react-native';
import axios from 'axios';
import { designTokens } from '../globalStyles';
import { BASE_URL } from '../config/apiConfig';
import logger from '../utils/logger';

const C = designTokens.colors;
const R = designTokens.radius;

export default function ResourceTab({ token, initialSearch = '' }) {
  const [activeSegment, setActiveSegment] = useState('Find'); // 'Find' or 'Counselor'
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [results, setResults] = useState([]);
  const [assigned, setAssigned] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialSearch) {
      setSearchQuery(initialSearch);
      handleGeminiSearch(initialSearch);
    }
  }, [initialSearch]);

  useEffect(() => {
    if (activeSegment === 'Counselor') {
      fetchAssignedResources();
    }
  }, [activeSegment]);

  const handleGeminiSearch = async (queryOverride) => {
    const query = queryOverride || searchQuery;
    if (!query.trim()) return;

    setLoading(true);
    logger.start('ResourceTab', `Gemini Search: ${query}`);
    try {
      const res = await axios.post(`${BASE_URL}/api/resources/search`, 
        { query }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResults(res.data.results || []);
      logger.success('ResourceTab', `Search complete. Found ${res.data.results?.length} items.`);
    } catch (err) {
      logger.error('ResourceTab', 'Search failed', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignedResources = async () => {
    setLoading(true);
    logger.start('ResourceTab', 'Fetch Assigned Resources');
    try {
      const res = await axios.get(`${BASE_URL}/api/resources/assigned`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAssigned(res.data.assigned || []);
      logger.success('ResourceTab', 'Fetch assigned complete');
    } catch (err) {
      logger.error('ResourceTab', 'Fetch assigned failed', err);
    } finally {
      setLoading(false);
    }
  };

  const renderResourceCard = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <Text style={styles.cardType}>{item.type === 'Video' ? '📺 VIDEO' : '📄 ARTICLE'}</Text>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
      </View>
      <TouchableOpacity 
        style={styles.cardAction} 
        onPress={() => Linking.openURL(item.url)}
      >
        <Text style={styles.cardActionText}>{item.type === 'Video' ? 'Watch Now' : 'Read Article'}</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* ── Segmented Control ── */}
      <View style={styles.segmentBar}>
        <TouchableOpacity 
          style={[styles.segment, activeSegment === 'Find' && styles.segmentActive]}
          onPress={() => setActiveSegment('Find')}
        >
          <Text style={[styles.segmentText, activeSegment === 'Find' && styles.segmentTextActive]}>Find Resources</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.segment, activeSegment === 'Counselor' && styles.segmentActive]}
          onPress={() => setActiveSegment('Counselor')}
        >
          <Text style={[styles.segmentText, activeSegment === 'Counselor' && styles.segmentTextActive]}>Counselor Assigned</Text>
        </TouchableOpacity>
      </View>

      {activeSegment === 'Find' ? (
        <View style={styles.content}>
          <View style={styles.searchBox}>
            <TextInput
              style={styles.input}
              placeholder="E.g. Healing from burnout..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <TouchableOpacity style={styles.searchBtn} onPress={() => handleGeminiSearch()}>
              <Text style={styles.searchBtnText}>Ask Gemini ✨</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.center}><ActivityIndicator color={C.sage} /></View>
          ) : (
            <FlatList
              data={results}
              renderItem={renderResourceCard}
              keyExtractor={(item, index) => index.toString()}
              contentContainerStyle={{ paddingBottom: 100 }}
              ListEmptyComponent={
                <View style={[styles.center, { marginTop: 40 }]}>
                  <Text style={styles.emptyText}>Need help finding something?</Text>
                  <Text style={styles.emptySubText}>Ask our AI to scout the best readings for you.</Text>
                </View>
              }
            />
          )}
        </View>
      ) : (
        <View style={styles.content}>
          <FlatList
            data={assigned}
            renderItem={renderResourceCard}
            keyExtractor={(item) => item._id}
            contentContainerStyle={{ paddingBottom: 100 }}
            ListEmptyComponent={
              <View style={[styles.center, { marginTop: 60 }]}>
                <Text style={{ fontSize: 40, marginBottom: 10 }}>🌿</Text>
                <Text style={styles.emptyText}>Nothing assigned yet.</Text>
                <Text style={styles.emptySubText}>Your counselor will prescribe specific readings or videos here after your sessions.</Text>
              </View>
            }
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.cream },
  segmentBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: R.full,
    padding: 4,
    borderWidth: 1,
    borderColor: C.border,
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: R.full,
  },
  segmentActive: {
    backgroundColor: C.sage,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '700',
    color: C.muted,
  },
  segmentTextActive: {
    color: '#fff',
  },
  content: { flex: 1, paddingHorizontal: 16 },
  searchBox: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  input: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: R.md,
    paddingHorizontal: 16,
    fontSize: 14,
  },
  searchBtn: {
    backgroundColor: C.sage,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: R.md,
    justifyContent: 'center',
  },
  searchBtnText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  card: {
    backgroundColor: '#fff',
    borderRadius: R.lg,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 16,
    overflow: 'hidden',
  },
  cardTop: { padding: 16 },
  cardType: { fontSize: 9, fontWeight: '900', color: C.sage, letterSpacing: 1, marginBottom: 4 },
  cardTitle: { fontSize: 16, fontWeight: '800', color: C.charcoal, marginBottom: 6 },
  cardDesc: { fontSize: 13, color: C.muted, lineHeight: 18 },
  cardAction: {
    backgroundColor: C.sageLight,
    paddingVertical: 12,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  cardActionText: { color: C.sage, fontWeight: '800', fontSize: 14 },
  center: { alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 16, fontWeight: '800', color: C.charcoal, marginBottom: 4 },
  emptySubText: { fontSize: 13, color: C.muted, textAlign: 'center', paddingHorizontal: 40 },
});
