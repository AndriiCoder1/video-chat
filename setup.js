/**
 * Setup script for Sign Language Video Chat Application
 * Enhanced with comprehensive logging system
 */

const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Configure logging system
const logDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const setupLogStream = fs.createWriteStream(path.join(logDir, 'setup.log'), { flags: 'a' });
const errorLogStream = fs.createWriteStream(path.join(logDir, 'setup-error.log'), { flags: 'a' });

function logToFile(stream, message, context = '') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${context} ${message}\n`;
  stream.write(logMessage);
  return logMessage;
}

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Determine the platform-specific command prefix
const isWindows = os.platform() === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';

// Paths
const serverPath = path.join(__dirname, 'server');
const clientPath = path.join(__dirname, 'client');

// Process tracking
const activeProcesses = new Set();

/**
 * Execute a command in a specific directory with enhanced logging
 */
function executeCommand(command, cwd, name) {
  return new Promise((resolve, reject) => {
    const logContext = `[${name}]`;
    const consoleMessage = `${colors.blue}${logContext}${colors.reset} Running: ${command}`;
    console.log(consoleMessage);
    logToFile(setupLogStream, `Executing command: ${command}`, logContext);

    const startTime = Date.now();
    const child = exec(command, { cwd }, (error, stdout, stderr) => {
      const duration = Date.now() - startTime;
      
      if (error) {
        const errorMsg = `Command failed after ${duration}ms: ${error.message}`;
        console.error(`${colors.red}${logContext} Error:${colors.reset} ${errorMsg}`);
        logToFile(errorLogStream, errorMsg, logContext);
        if (stderr) logToFile(errorLogStream, stderr, logContext);
        return reject(error);
      }
      
      if (stderr) {
        console.warn(`${colors.yellow}${logContext} Warning:${colors.reset} ${stderr.trim()}`);
        logToFile(setupLogStream, stderr.trim(), logContext);
      }
      
      const successMsg = `Completed in ${duration}ms`;
      console.log(`${colors.green}${logContext}${colors.reset} ${successMsg}`);
      logToFile(setupLogStream, successMsg, logContext);
      
      resolve(stdout);
    });

    activeProcesses.add(child);
    child.on('exit', () => activeProcesses.delete(child));
  });
}

/**
 * Start a long-running process with enhanced monitoring
 */
function startProcess(command, args, cwd, name) {
  const logContext = `[${name}]`;
  const commandString = `${command} ${args.join(' ')}`;
  const startMsg = `Starting process: ${commandString}`;
  
  console.log(`${colors.blue}${logContext}${colors.reset} ${startMsg}`);
  logToFile(setupLogStream, startMsg, logContext);

  const startTime = Date.now();
  const process = spawn(command, args, {
    cwd,
    stdio: 'pipe',
    shell: isWindows
  });

  activeProcesses.add(process);
  
  process.stdout.on('data', (data) => {
    const message = data.toString().trim();
    console.log(`${colors.green}${logContext}${colors.reset} ${message}`);
    logToFile(setupLogStream, message, logContext);
  });
  
  process.stderr.on('data', (data) => {
    const errorMessage = data.toString().trim();
    console.error(`${colors.red}${logContext}${colors.reset} ${errorMessage}`);
    logToFile(errorLogStream, errorMessage, logContext);
  });
  
  process.on('close', (code) => {
    const duration = Date.now() - startTime;
    activeProcesses.delete(process);
    
    if (code !== 0) {
      const errorMsg = `Process exited with code ${code} after ${duration}ms`;
      console.error(`${colors.red}${logContext}${colors.reset} ${errorMsg}`);
      logToFile(errorLogStream, errorMsg, logContext);
    } else {
      const successMsg = `Process completed successfully after ${duration}ms`;
      console.log(`${colors.green}${logContext}${colors.reset} ${successMsg}`);
      logToFile(setupLogStream, successMsg, logContext);
    }
  });

  return process;
}

/**
 * Check if a directory exists with logging
 */
function directoryExists(dir) {
  try {
    const exists = fs.statSync(dir).isDirectory();
    logToFile(setupLogStream, `Directory check: ${dir} - ${exists ? 'Exists' : 'Missing'}`);
    return exists;
  } catch (err) {
    logToFile(errorLogStream, `Directory check failed: ${dir} - ${err.message}`);
    return false;
  }
}

/**
 * Cleanup function for process termination
 */
async function cleanup() {
  console.log(`\n${colors.yellow}[Cleanup]${colors.reset} Shutting down processes...`);
  logToFile(setupLogStream, 'Initiating shutdown sequence');
  
  let exitCode = 0;
  const cleanupPromises = [];
  
  // Send SIGTERM to all child processes
  for (const proc of activeProcesses) {
    cleanupPromises.push(new Promise(resolve => {
      if (!proc.killed) {
        proc.on('exit', () => resolve());
        proc.kill('SIGTERM');
      } else {
        resolve();
      }
    }));
  }
  
  try {
    await Promise.race([
      Promise.all(cleanupPromises),
      new Promise(resolve => setTimeout(resolve, 5000))
    ]);
    logToFile(setupLogStream, 'Cleanup completed successfully');
  } catch (err) {
    exitCode = 1;
    logToFile(errorLogStream, `Cleanup error: ${err.message}`);
    console.error(`${colors.red}[Cleanup Error]${colors.reset} ${err.message}`);
  } finally {
    setupLogStream.end();
    errorLogStream.end();
    process.exit(exitCode);
  }
}

/**
 * Main setup function with error handling
 */
async function setup() {
  console.log(`${colors.magenta}=== Sign Language Video Chat Application Setup ===${colors.reset}\n`);
  logToFile(setupLogStream, 'Starting application setup');

  try {
    // Validate directory structure
    logToFile(setupLogStream, 'Checking project structure');
    
    if (!directoryExists(serverPath)) {
      const errorMsg = `Server directory not found: ${serverPath}`;
      logToFile(errorLogStream, errorMsg);
      throw new Error(errorMsg);
    }
    
    if (!directoryExists(clientPath)) {
      const errorMsg = `Client directory not found: ${clientPath}`;
      logToFile(errorLogStream, errorMsg);
      throw new Error(errorMsg);
    }

    // Install dependencies
    logToFile(setupLogStream, 'Installing dependencies');
    console.log(`${colors.cyan}[Setup]${colors.reset} Installing server dependencies...`);
    await executeCommand(`${npmCmd} install`, serverPath, 'Server');
    
    console.log(`\n${colors.cyan}[Setup]${colors.reset} Installing client dependencies...`);
    await executeCommand(`${npmCmd} install`, clientPath, 'Client');
    
    // Start application
    logToFile(setupLogStream, 'Starting application processes');
    console.log(`\n${colors.green}[Setup]${colors.reset} All dependencies installed successfully!`);
    console.log(`\n${colors.cyan}[Setup]${colors.reset} Starting the application...\n`);
    
    const serverProcess = startProcess(npmCmd, ['run', 'dev'], serverPath, 'Server');
    await new Promise(resolve => setTimeout(resolve, 3000));
    const clientProcess = startProcess(npmCmd, ['start'], clientPath, 'Client');

    // Handle process termination
    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
    
    console.log(`\n${colors.magenta}[Setup]${colors.reset} Application is running!`);
    console.log(`${colors.magenta}[Setup]${colors.reset} Press Ctrl+C to stop the application\n`);
    logToFile(setupLogStream, 'Application started successfully');
    
  } catch (error) {
    const errorMsg = `Setup failed: ${error.message}`;
    console.error(`${colors.red}[Error]${colors.reset} ${errorMsg}`);
    logToFile(errorLogStream, errorMsg);
    await cleanup();
  }
}

// Run the setup
setup();