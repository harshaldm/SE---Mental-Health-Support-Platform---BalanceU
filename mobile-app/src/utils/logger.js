import axios from 'axios';
import { BASE_URL } from '../config/apiConfig';

/**
 * Mobile Trace Logger
 * Specifically formatted for the Metro terminal and Backend proxy.
 */
const logger = {
  info: (component, message) => {
    const raw = `[${component}] -> ${message}`;
    console.log(raw);
    sendToTerminal('INFO', component, message);
  },
  
  start: (component, processName) => {
    const msg = `START: Executing Process: {${processName}}`;
    console.log(`[${component}] ${msg}`);
    sendToTerminal('START', component, msg);
  },
  
  success: (component, processName) => {
    const msg = `SUCCESS: Process Complete: {${processName}}`;
    console.log(`[${component}] ${msg}`);
    sendToTerminal('SUCCESS', component, msg);
  },
  
  error: (component, processName, err) => {
    const msg = `ERROR: Process Failed: {${processName}} | ${err?.message || err}`;
    console.warn(`[${component}] ${msg}`);
    sendToTerminal('ERROR', component, msg);
  }
};

async function sendToTerminal(level, component, message) {
  try {
    // Metro terminal shows console.logs anyway, 
    // but sending to backend terminal helps unify the trace.
    await axios.post(`${BASE_URL}/api/dev-logs`, {
      source: 'MOBILE',
      level,
      component,
      message: `(${level}) ${message}`
    });
  } catch {
    // Ignore server-side logging failures on mobile
  }
}

export default logger;
