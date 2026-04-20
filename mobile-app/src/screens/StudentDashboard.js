import React, { useState, useRef } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, 
  Animated, Dimensions, SafeAreaView, ScrollView 
} from 'react-native';
import { designTokens, globalStyles } from '../globalStyles';
import QuizOnboarding from './QuizOnboarding';
import QuizActive from './QuizActive';

const { width } = Dimensions.get('window');
const DRAWER_WIDTH = width * 0.75;

export default function StudentDashboard({ setLoggedIn, token = 'dummy_token' }) {
  const [activeTab, setActiveTab] = useState('Quizzes');
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const drawerAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;

  const toggleDrawer = () => {
    const toValue = isDrawerOpen ? -DRAWER_WIDTH : 0;
    Animated.timing(drawerAnim, {
      toValue,
      duration: 300,
      useNativeDriver: true,
    }).start();
    setIsDrawerOpen(!isDrawerOpen);
  };

  const handleTabPress = (tab) => {
    setActiveTab(tab);
    setCurrentQuiz(null); // Reset quiz state when switching tabs
    toggleDrawer();
  };

  const renderContent = () => {
    if (activeTab === 'Quizzes') {
      if (currentQuiz) {
        return (
          <QuizActive 
            quizType={currentQuiz} 
            token={token}
            onCancel={() => setCurrentQuiz(null)}
            onComplete={(nextTab) => {
              setCurrentQuiz(null);
              if (nextTab) setActiveTab(nextTab);
            }}
          />
        );
      }
      return <QuizOnboarding onStartQuiz={(type) => setCurrentQuiz(type)} />;
    }

    switch (activeTab) {
      case 'Wellness':
        return <MedTracker token={token} />;
      case 'Counselor':
        return (
          <View style={styles.placeholderContainer}>
            <Text style={styles.tabTitle}>Counselor Support</Text>
            <Text style={globalStyles.textBody}>Connect with your institutional counselor here.</Text>
          </View>
        );
      default:
        return (
          <View style={styles.placeholderContainer}>
            <Text style={styles.tabTitle}>{activeTab}</Text>
            <Text style={globalStyles.textBody}>Component under development.</Text>
          </View>
        );
    }
  };

  const menuItems = [
    { label: 'Quizzes', icon: '📝' },
    { label: 'Counselor', icon: '🫂' },
    { label: 'Wellness', icon: '💊' },
    { label: 'Fun Activities', icon: '🎮' },
    { label: 'Mood Calendar', icon: '🗓️' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={toggleDrawer} style={styles.menuBtn}>
          <Text style={{ fontSize: 24 }}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{activeTab}</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Main Content Area */}
      <View style={styles.main}>
        {renderContent()}
      </View>

      {/* Drawer Overlay */}
      {isDrawerOpen && (
        <TouchableOpacity 
          activeOpacity={1} 
          onPress={toggleDrawer} 
          style={styles.overlay} 
        />
      )}

      {/* Animated Side Drawer */}
      <Animated.View style={[styles.drawer, { transform: [{ translateX: drawerAnim }] }]}>
        <View style={styles.drawerHeader}>
          <Text style={[globalStyles.textDisplay, { fontSize: 24, color: designTokens.colors.primary }]}>BalanceU</Text>
        </View>
        
        <View style={styles.drawerItems}>
          {menuItems.map((item) => (
            <TouchableOpacity 
              key={item.label} 
              style={[styles.drawerItem, activeTab === item.label && styles.activeItem]}
              onPress={() => handleTabPress(item.label)}
            >
              <Text style={styles.drawerIcon}>{item.icon}</Text>
              <Text style={[styles.drawerLabel, activeTab === item.label && styles.activeLabel]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity 
          style={styles.logoutBtn} 
          onPress={() => setLoggedIn(false)}
        >
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: designTokens.colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    height: 60,
    backgroundColor: designTokens.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: designTokens.colors.onSurface,
  },
  menuBtn: {
    padding: 10,
  },
  main: {
    flex: 1,
  },
  contentScroll: {
    padding: 24,
  },
  tabTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: designTokens.colors.onSurface,
    marginBottom: 20,
  },
  placeholderContainer: {
    padding: 24,
  },
  cardHighlight: {
    fontSize: 18,
    fontWeight: 'bold',
    color: designTokens.colors.primary,
    marginBottom: 8,
  },
  cardDesc: {
    color: designTokens.colors.onSurfaceVariant,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    zIndex: 10,
  },
  drawer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: DRAWER_WIDTH,
    backgroundColor: designTokens.colors.surfaceContainerLow,
    zIndex: 20,
    paddingTop: 60,
    paddingHorizontal: 20,
    boxShadow: '4px 0 10px rgba(0,0,0,0.1)',
  },
  drawerHeader: {
    marginBottom: 40,
    paddingHorizontal: 10,
  },
  drawerItems: {
    flex: 1,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 16,
    marginBottom: 10,
  },
  activeItem: {
    backgroundColor: designTokens.colors.primaryContainer,
  },
  drawerIcon: {
    fontSize: 20,
    marginRight: 15,
  },
  drawerLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: designTokens.colors.onSurfaceVariant,
  },
  activeLabel: {
    color: designTokens.colors.primary,
  },
  logoutBtn: {
    marginBottom: 40,
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  logoutText: {
    color: designTokens.colors.error,
    fontWeight: 'bold',
    fontSize: 16,
  }
});
