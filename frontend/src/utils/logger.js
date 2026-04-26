import axios from 'axios';
import { BASE_URL } from '../config/apiConfig';

/**
 * Web Trace Logger
 * Sends logs to the backend terminal for real-time visibility.
 */
const logger = {
  info: (component, message) => {
    console.log(`[${component}] -> ${message}`);
    sendToTerminal('INFO', component, message);
  },
  start: (component, processName) => {
    const msg = `START: Executing Process: {${processName}}`;
    console.log(`%c[${component}] ${msg}`, 'color: #8b5cf6; font-weight: bold');
    sendToTerminal('START', component, msg);
  },
  success: (component, processName) => {
    const msg = `SUCCESS: Process Complete: {${processName}}`;
    console.log(`%c[${component}] ${msg}`, 'color: #10b981; font-weight: bold');
    sendToTerminal('SUCCESS', component, msg);
  },
  error: (component, processName, err) => {
    const msg = `ERROR: Process Failed: {${processName}} | ${err?.message || err}`;
    console.error(`[${component}] ${msg}`, err);
    sendToTerminal('ERROR', component, msg);
  }
};

async function sendToTerminal(level, component, message) {
  // Silent fail in production, only for dev terminal proxy
  try {
    await axios.post(`${BASE_URL}/api/dev-logs`, {
      source: 'WEB',
      level,
      component,
      message: `(${level}) ${message}`
    });
  } catch {
    // Avoid infinite loops or noise if backend is down
  }
}

export default logger;
