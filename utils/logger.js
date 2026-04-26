const path = require('path');

/**
 * Parses the stack trace to find the caller's location.
 * @returns {string} "[Filename : Function : Line]"
 */
function getTrace() {
  const obj = {};
  Error.captureStackTrace(obj, getTrace);
  
  // stack[0] is Error
  // stack[1] is getTrace
  // stack[2] is log/info/error function
  // stack[3] is the actual caller we want
  const stack = obj.stack.split('\n');
  const callerLine = stack[3] || '';
  
  // Regex to extract file, line, and function name
  // Format usually: at FunctionName (path/to/file.js:line:col)
  // or: at path/to/file.js:line:col
  const match = callerLine.match(/at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)/) || 
                callerLine.match(/at\s+(.+?):(\d+):(\d+)/);

  if (!match) return '[UNKNOWN]';

  let funcName, filePath, line;
  
  if (match.length === 5) {
    funcName = match[1];
    filePath = match[2];
    line     = match[3];
  } else {
    funcName = 'anonymous';
    filePath = match[1];
    line     = match[2];
  }

  const fileName = path.basename(filePath);
  return `[${fileName} : ${funcName} : ${line}]`;
}

const logger = {
  info: (msg, ...args) => {
    console.log(`\x1b[36m%s\x1b[0m %s`, getTrace(), msg, ...args);
  },
  success: (msg, ...args) => {
    console.log(`\x1b[32m%s SUCCESS:\x1b[0m %s`, getTrace(), msg, ...args);
  },
  start: (msg, ...args) => {
    console.log(`\x1b[35m%s START:\x1b[0m %s`, getTrace(), msg, ...args);
  },
  error: (msg, ...args) => {
    console.log(`\x1b[31m%s ERROR:\x1b[0m %s`, getTrace(), msg, ...args);
  },
  // Specifically for proxying logs from Web/Mobile
  external: (source, component, msg) => {
    const color = source === 'WEB' ? '\x1b[33m' : '\x1b[34m'; // Yellow for Web, Blue for Mobile
    console.log(`${color}[${source} | ${component}]\x1b[0m -> ${msg}`);
  }
};

module.exports = logger;
