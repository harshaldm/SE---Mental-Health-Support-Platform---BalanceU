import Constants from 'expo-constants';
import { Platform } from 'react-native';

const getBaseUrl = () => {
  if (Platform.OS === 'web') {
    return 'http://localhost:5000';
  }
  // Extracts the IP address from the address that served the JS bundle (the QR code IP)
  const debuggerHost = Constants.expoConfig?.hostUri || Constants.manifest2?.extra?.expoGo?.debuggerHost || '';
  const laptopIp = debuggerHost.split(':')[0] || '192.168.137.12'; // Fallback to recorded hotspot IP
  return `http://${laptopIp}:5000`;
};

export const BASE_URL = getBaseUrl();
export const API_URL = BASE_URL; // Alias for backward compatibility

console.log("[Connection] -> Mobile app API URL synced for Web environment.");
console.log(">>> [SYSTEM] API Base URL auto-detected:", BASE_URL);
