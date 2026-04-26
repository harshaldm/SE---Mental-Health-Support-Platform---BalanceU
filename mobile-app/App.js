import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native';
import { useState } from 'react';
import Login from './src/screens/Login';
import StudentDashboard from './src/screens/StudentDashboard';
import Register from './src/screens/Register';
import { globalStyles } from './src/globalStyles';
import { BASE_URL } from './src/config/apiConfig';

export default function App() {
  // Production-ready state management
  const [isLoggedIn, setLoggedIn] = useState(false);
  const [userToken, setUserToken] = useState(null);
  const [userData, setUserData] = useState(null);
  const [showRegister, setShowRegister] = useState(false);

  const handleLoginSuccess = (token, user) => {
    setUserToken(token);
    setUserData(user);
    setLoggedIn(true);
  };

  const handleUserUpdate = (updatedUser) => {
    setUserData(prev => ({ ...prev, ...updatedUser }));
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FDFBF7' }}>
      {isLoggedIn ? (
        <StudentDashboard
          setLoggedIn={setLoggedIn}
          token={userToken}
          user={userData}
          onUserUpdate={handleUserUpdate}
        />
      ) : showRegister ? (
        <Register setLoggedIn={setLoggedIn} />
      ) : (
        <Login
          onLoginSuccess={handleLoginSuccess}
          setShowRegister={setShowRegister}
        />
      )}
      <StatusBar style="dark" />
    </SafeAreaView>
  );
}
