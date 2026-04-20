import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native';
import { useState } from 'react';
import Login from './src/screens/Login';
import MedTracker from './src/screens/MedTracker';
import Register from './src/screens/Register';
import { globalStyles } from './src/globalStyles';

export default function App() {
  // Simple state-based navigation for scaffolding purposes
  const [isLoggedIn, setLoggedIn] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  return (
    <SafeAreaView style={globalStyles.safeArea}>
      {isLoggedIn ? (
        <MedTracker token="dummy_token_123" />
      ) : showRegister ? (
        <Register setLoggedIn={setLoggedIn} />
      ) : (
        <Login setLoggedIn={setLoggedIn} setShowRegister={setShowRegister} />
      )}
      <StatusBar style="auto" />
    </SafeAreaView>
  );
}
