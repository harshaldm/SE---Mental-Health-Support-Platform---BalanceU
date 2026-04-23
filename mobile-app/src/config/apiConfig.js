import Constants from 'expo-constants';

const getBaseUrl = () => {
  // Extracts the IP address from the address that served the JS bundle (the QR code IP)
  const debuggerHost = Constants.expoConfig?.hostUri || Constants.manifest2?.extra?.expoGo?.debuggerHost || '';
  const laptopIp = debuggerHost.split(':')[0] || '192.168.137.12'; // Fallback to recorded hotspot IP
  return `http://${laptopIp}:5000`;
};

export const BASE_URL = getBaseUrl();
export const API_URL = BASE_URL; // Alias for backward compatibility

console.log(">>> [SYSTEM] API Base URL auto-detected:", BASE_URL);
