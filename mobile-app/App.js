import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native';
import { useState } from 'react';
import Login from './src/screens/Login';
import MedTracker from './src/screens/MedTracker';
import { globalStyles } from './src/globalStyles';

export default function App() {
  // Simple state-based navigation for scaffolding purposes
  const [isLoggedIn, setLoggedIn] = useState(false);

  return (
    <SafeAreaView style={globalStyles.safeArea}>
      {isLoggedIn ? (
        <MedTracker token="dummy_token_123" />
      ) : (
        <Login setLoggedIn={setLoggedIn} />
      )}
      <StatusBar style="auto" />
    </SafeAreaView>
  );
}
