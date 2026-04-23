import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, Dimensions, SafeAreaView, ActivityIndicator,
} from 'react-native';
import { designTokens } from '../globalStyles';
import QuizOnboarding from './QuizOnboarding';
import QuizActive from './QuizActive';
import MedTracker from './MedTracker';
import SupportHub from './SupportHub';
import CounselorDirectory from './CounselorDirectory';

const C = designTokens.colors;
const { width } = Dimensions.get('window');
const DRAWER_WIDTH = width * 0.75;

// ─── Tab configuration ─────────────────────────────────────────────────────────
const TABS = [
  { label: 'Quizzes',        icon: '📝' },
  { label: 'Support Hub',    icon: '🫂' },
  { label: 'Resource',       icon: '🌿' },
  { label: 'Mood Calendar',  icon: '🗓️' },
  { label: 'Fun Activities', icon: '🎮' },
];

export default function StudentDashboard({ setLoggedIn, token = '', user = null }) {
  const [activeTab, setActiveTab]   = useState('Quizzes');
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [sharedData, setSharedData] = useState(null);
  // CounselorDirectory overlay: null = hidden, object = visible
  const [counselorDirData, setCounselorDirData] = useState(null);

  const drawerAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;

  // ─── Loading guard — must be AFTER all hooks ─────────────────────────────
  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={C.sage} />
        <Text style={styles.loadingText}>Loading your space…</Text>
      </View>
    );
  }

  // ─── Drawer animation ─────────────────────────────────────────────────────
  const toggleDrawer = () => {
    const to = isDrawerOpen ? -DRAWER_WIDTH : 0;
    Animated.spring(drawerAnim, { toValue: to, useNativeDriver: true, tension: 80, friction: 12 }).start();
    setIsDrawerOpen(!isDrawerOpen);
  };

  const handleTabPress = (label) => {
    setActiveTab(label);
    setCurrentQuiz(null);
    setSharedData(null);
    toggleDrawer();
  };

  // ─── Content router ───────────────────────────────────────────────────────
  const renderContent = () => {
    if (activeTab === 'Quizzes') {
      if (currentQuiz) {
        return (
          <QuizActive
            quizType={currentQuiz}
            token={token}
            onCancel={() => setCurrentQuiz(null)}
            onConnectWithSupport={(assessmentData) => {
              setCounselorDirData(assessmentData);
              setCurrentQuiz(null);
            }}
            onGoToResources={() => {
              setCurrentQuiz(null);
              setActiveTab('Resource');
            }}
            onComplete={(nextTab, data) => {
              setCurrentQuiz(null);
              if (data) setSharedData(data);
              if (nextTab) setActiveTab(nextTab);
            }}
          />
        );
      }
      return <QuizOnboarding onStartQuiz={(type) => setCurrentQuiz(type)} />;
    }

    switch (activeTab) {
      case 'Support Hub':
        return (
          <SupportHub
            token={token}
            user={user}
            latestAssessment={sharedData}
            onOpenCounselorDirectory={(data) => setCounselorDirData(data || {})}
          />
        );
      case 'Resource':
        return <ResourcePlaceholder />;
      default:
        return (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderIcon}>🚧</Text>
            <Text style={styles.placeholderTitle}>{activeTab}</Text>
            <Text style={styles.placeholderMsg}>Coming soon.</Text>
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={toggleDrawer} style={styles.menuBtn} hitSlop={{ top:10, bottom:10, left:10, right:10 }}>
          <View style={styles.hamburger}>
            <View style={styles.hamburgerLine} />
            <View style={[styles.hamburgerLine, { width: 18 }]} />
            <View style={styles.hamburgerLine} />
          </View>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerLogo}>BalanceU</Text>
          <Text style={styles.headerTab}>{activeTab}</Text>
        </View>

        <View style={styles.headerAvatar}>
          <Text style={styles.headerAvatarText}>
            {(user?.profile_metadata?.full_name || user?.email || 'U')[0].toUpperCase()}
          </Text>
        </View>
      </View>

      {/* ── Main content ── */}
      <View style={styles.main}>
        {renderContent()}
      </View>

      {/* ── CounselorDirectory full-screen overlay ── */}
      {counselorDirData && (
        <View style={StyleSheet.absoluteFill}>
          <CounselorDirectory
            instituteId={user?.institute_id}
            score={counselorDirData.score}
            riskLevel={counselorDirData.riskLevel}
            summary={counselorDirData.summary}
            token={token}
            onBack={() => setCounselorDirData(null)}
          />
        </View>
      )}

      {/* ── Drawer backdrop ── */}
      {isDrawerOpen && (
        <TouchableOpacity activeOpacity={1} onPress={toggleDrawer} style={styles.overlay} />
      )}

      {/* ── Side Drawer ── */}
      <Animated.View style={[styles.drawer, { transform: [{ translateX: drawerAnim }] }]}>
        <View style={styles.drawerTop}>
          <Text style={styles.drawerLogo}>🌿 BalanceU</Text>
          <Text style={styles.drawerGreeting}>
            Hi, {user?.profile_metadata?.full_name?.split(' ')[0] || 'there'} 👋
          </Text>
        </View>

        <View style={styles.drawerItems}>
          {TABS.map(({ label, icon }) => (
            <TouchableOpacity
              key={label}
              style={[styles.drawerItem, activeTab === label && styles.drawerItemActive]}
              onPress={() => handleTabPress(label)}
            >
              <Text style={styles.drawerIcon}>{icon}</Text>
              <Text style={[styles.drawerLabel, activeTab === label && styles.drawerLabelActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={() => setLoggedIn(false)}>
          <Text style={styles.logoutText}>🚪 Logout</Text>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

// ─── Resource Placeholder ─────────────────────────────────────────────────────
function ResourcePlaceholder() {
  return (
    <View style={styles.placeholder}>
      <Text style={{ fontSize: 52, marginBottom: 16 }}>📚</Text>
      <Text style={styles.placeholderTitle}>Resources</Text>
      <Text style={styles.placeholderMsg}>
        Curated mental wellness readings, breathing exercises, and guided practices.
        Coming soon.
      </Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const C2 = designTokens.colors;
const R  = designTokens.radius;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C2.cream },

  // Loading
  loadingContainer: {
    flex: 1, backgroundColor: C2.cream,
    alignItems: 'center', justifyContent: 'center', gap: 14,
  },
  loadingText: { fontSize: 14, color: C2.muted, fontWeight: '500' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: C2.border,
  },
  menuBtn: { padding: 4 },
  hamburger: { gap: 5 },
  hamburgerLine: {
    height: 2,
    width: 24,
    backgroundColor: C2.charcoal,
    borderRadius: 2,
  },
  headerCenter: { alignItems: 'center' },
  headerLogo: { fontSize: 11, fontWeight: '800', color: C2.sage, letterSpacing: 1.5 },
  headerTab: { fontSize: 17, fontWeight: '800', color: C2.charcoal, marginTop: 1 },
  headerAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: C2.sageLight,
    alignItems: 'center', justifyContent: 'center',
  },
  headerAvatarText: { fontSize: 15, fontWeight: '800', color: C2.sage },

  // Main
  main: { flex: 1 },

  // Placeholder tabs
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: C2.cream,
  },
  placeholderIcon: { fontSize: 48, marginBottom: 14 },
  placeholderTitle: { fontSize: 22, fontWeight: '800', color: C2.charcoal, marginBottom: 10 },
  placeholderMsg: {
    fontSize: 14, color: C2.muted, textAlign: 'center', lineHeight: 22,
  },

  // Drawer backdrop
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(44,44,44,0.35)',
    zIndex: 10,
  },

  // Drawer
  drawer: {
    position: 'absolute', top: 0, bottom: 0, left: 0,
    width: DRAWER_WIDTH,
    backgroundColor: '#fff',
    zIndex: 20,
    paddingTop: 56,
    paddingHorizontal: 20,
    borderRightWidth: 1,
    borderRightColor: C2.border,
  },
  drawerTop: { marginBottom: 36 },
  drawerLogo: { fontSize: 18, fontWeight: '900', color: C2.sage, marginBottom: 6 },
  drawerGreeting: { fontSize: 14, color: C2.muted, fontWeight: '500' },
  drawerItems: { flex: 1, gap: 4 },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: R.md,
    gap: 14,
  },
  drawerItemActive: { backgroundColor: C2.sageLight },
  drawerIcon: { fontSize: 18 },
  drawerLabel: { fontSize: 15, fontWeight: '600', color: C2.muted },
  drawerLabelActive: { color: C2.sage, fontWeight: '800' },
  logoutBtn: {
    paddingVertical: 16, marginBottom: 32,
    borderTopWidth: 1, borderTopColor: C2.border,
  },
  logoutText: { fontSize: 14, fontWeight: '700', color: C2.error },
});
