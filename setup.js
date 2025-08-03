/**
 * Setup script for Sign Language Video Chat Application
 * 
 * This script helps users set up and run the application with a single command.
 * It installs dependencies for both client and server, and starts both in development mode.
 */

const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Determine the platform-specific command prefix
const isWindows = os.platform() === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';

// Paths
const serverPath = path.join(__dirname, 'server');
const clientPath = path.join(__dirname, 'client');

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

/**
 * Execute a command in a specific directory
 * @param {string} command - Command to execute
 * @param {string} cwd - Working directory
 * @param {string} name - Name for logging
 * @returns {Promise} - Promise that resolves when the command completes
 */
function executeCommand(command, cwd, name) {
  return new Promise((resolve, reject) => {
    console.log(`${colors.bright}${colors.blue}[${name}]${colors.reset} Running: ${command}`);
    
    exec(command, { cwd }, (error, stdout, stderr) => {
      if (error) {
        console.error(`${colors.bright}${colors.red}[${name}]${colors.reset} Error: ${error.message}`);
        return reject(error);
      }
      
      if (stderr) {
        console.warn(`${colors.bright}${colors.yellow}[${name}]${colors.reset} Warning: ${stderr}`);
      }
      
      console.log(`${colors.bright}${colors.green}[${name}]${colors.reset} Completed successfully`);
      resolve(stdout);
    });
  });
}

/**
 * Start a long-running process
 * @param {string} command - Command to run
 * @param {Array} args - Command arguments
 * @param {string} cwd - Working directory
 * @param {string} name - Name for logging
 * @returns {ChildProcess} - The spawned process
 */
function startProcess(command, args, cwd, name) {
  console.log(`${colors.bright}${colors.blue}[${name}]${colors.reset} Starting: ${command} ${args.join(' ')}`);
  
  const process = spawn(command, args, {
    cwd,
    stdio: 'pipe',
    shell: isWindows
  });
  
  process.stdout.on('data', (data) => {
    console.log(`${colors.bright}${colors.green}[${name}]${colors.reset} ${data.toString().trim()}`);
  });
  
  process.stderr.on('data', (data) => {
    console.error(`${colors.bright}${colors.red}[${name}]${colors.reset} ${data.toString().trim()}`);
  });
  
  process.on('close', (code) => {
    if (code !== 0) {
      console.error(`${colors.bright}${colors.red}[${name}]${colors.reset} Process exited with code ${code}`);
    } else {
      console.log(`${colors.bright}${colors.green}[${name}]${colors.reset} Process completed successfully`);
    }
  });
  
  return process;
}

/**
 * Check if a directory exists
 * @param {string} dir - Directory path
 * @returns {boolean} - True if directory exists
 */
function directoryExists(dir) {
  try {
    return fs.statSync(dir).isDirectory();
  } catch (err) {
    return false;
  }
}

/**
 * Main setup function
 */
async function setup() {
  console.log(`${colors.bright}${colors.magenta}=== Sign Language Video Chat Application Setup ===${colors.reset}\n`);
  
  try {
    // Check if directories exist
    if (!directoryExists(serverPath)) {
      console.error(`${colors.bright}${colors.red}[Error]${colors.reset} Server directory not found: ${serverPath}`);
      process.exit(1);
    }
    
    if (!directoryExists(clientPath)) {
      console.error(`${colors.bright}${colors.red}[Error]${colors.reset} Client directory not found: ${clientPath}`);
      process.exit(1);
    }
    
    // Install server dependencies
    console.log(`${colors.bright}${colors.cyan}[Setup]${colors.reset} Installing server dependencies...`);
    await executeCommand(`${npmCmd} install`, serverPath, 'Server');
    
    // Install client dependencies
    console.log(`\n${colors.bright}${colors.cyan}[Setup]${colors.reset} Installing client dependencies...`);
    await executeCommand(`${npmCmd} install`, clientPath, 'Client');
    
    console.log(`\n${colors.bright}${colors.green}[Setup]${colors.reset} All dependencies installed successfully!`);
    
    // Start the server and client
    console.log(`\n${colors.bright}${colors.cyan}[Setup]${colors.reset} Starting the application...\n`);
    
    // Start the server
    const serverProcess = startProcess(npmCmd, ['run', 'dev'], serverPath, 'Server');
    
    // Wait a bit for the server to start
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Start the client
    const clientProcess = startProcess(npmCmd, ['start'], clientPath, 'Client');
    
    // Handle process termination
    const cleanup = () => {
      console.log(`\n${colors.bright}${colors.yellow}[Setup]${colors.reset} Shutting down...`);
      serverProcess.kill();
      clientProcess.kill();
      process.exit(0);
    };
    
    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
    
    console.log(`\n${colors.bright}${colors.magenta}[Setup]${colors.reset} Application is running!`);
    console.log(`${colors.bright}${colors.magenta}[Setup]${colors.reset} Press Ctrl+C to stop the application\n`);
    
  } catch (error) {
    console.error(`${colors.bright}${colors.red}[Error]${colors.reset} Setup failed: ${error.message}`);
    process.exit(1);
  }
}

// Run the setup
setup();