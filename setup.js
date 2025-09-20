/**
 * Setup Script for Sign Language Video Chat Application
 * 
 * Комплексный скрипт установки и запуска приложения для видеозвонков на языке жестов
 * Включает систему логирования, управление процессами и обработку ошибок
 * 
 * Основные функции:
 * - Установка зависимостей для клиента и сервера
 * - Параллельный запуск клиента и сервера
 * - Детальное логирование в файлы и консоль
 * - Корректное завершение процессов при остановке
 * - Кросс-платформенная поддержка (Windows, macOS, Linux)
 */

const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Создание директории для логов, если она не существует
const logDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// Создание потоков для записи логов (основных и ошибок)
const setupLogStream = fs.createWriteStream(path.join(logDir, 'setup.log'), { flags: 'a' });
const errorLogStream = fs.createWriteStream(path.join(logDir, 'setup-error.log'), { flags: 'a' });

/**
 * Универсальная функция логирования в файл
 * @param {fs.WriteStream} stream - Поток для записи лога
 * @param {string} message - Сообщение для записи
 * @param {string} context - Контекст/источник сообщения
 * @returns {string} - Отформатированное сообщение лога
 */
function logToFile(stream, message, context = '') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${context} ${message}\n`;
  stream.write(logMessage);
  return logMessage;
}

// ANSI коды цветов для форматирования вывода в консоли
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',      // Для ошибок
  green: '\x1b[32m',    // Для успешных операций
  yellow: '\x1b[33m',   // Для предупреждений
  blue: '\x1b[34m',     // Для информационных сообщений
  magenta: '\x1b[35m',  // Для заголовков
  cyan: '\x1b[36m',     // Для подзаголовков
};

// Определение платформы для корректного выполнения команд
const isWindows = os.platform() === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm'; // Использование npm.cmd на Windows

// Определение путей к клиентской и серверной частям приложения
const serverPath = path.join(__dirname, 'server');
const clientPath = path.join(__dirname, 'client');

// Множество для отслеживания активных дочерних процессов
const activeProcesses = new Set();

/**
 * Выполнение одиночной команды с логированием и обработкой ошибок
 * @param {string} command - Команда для выполнения
 * @param {string} cwd - Рабочая директория
 * @param {string} name - Имя процесса для логирования
 * @returns {Promise} - Промис, разрешающийся при завершении команды
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
 * Запуск долгоиграющего процесса с мониторингом вывода
 * @param {string} command - Команда для выполнения
 * @param {Array} args - Аргументы команды
 * @param {string} cwd - Рабочая директория
 * @param {string} name - Имя процесса для логирования
 * @returns {ChildProcess} - Объект дочернего процесса
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
  
  // Логирование stdout процесса
  process.stdout.on('data', (data) => {
    const message = data.toString().trim();
    console.log(`${colors.green}${logContext}${colors.reset} ${message}`);
    logToFile(setupLogStream, message, logContext);
  });
  
  // Логирование stderr процесса
  process.stderr.on('data', (data) => {
    const errorMessage = data.toString().trim();
    console.error(`${colors.red}${logContext}${colors.reset} ${errorMessage}`);
    logToFile(errorLogStream, errorMessage, logContext);
  });
  
  // Обработка завершения процесса
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
 * Проверка существования директории
 * @param {string} dir - Путь к директории
 * @returns {boolean} - Существует ли директория
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
 * Функция очистки и корректного завершения процессов
 * @returns {Promise} - Промис, разрешающийся при завершении всех процессов
 */
async function cleanup() {
  console.log(`\n${colors.yellow}[Cleanup]${colors.reset} Shutting down processes...`);
  logToFile(setupLogStream, 'Initiating shutdown sequence');
  
  let exitCode = 0;
  const cleanupPromises = [];
  
  // Отправка сигнала завершения всем дочерним процессам
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
    // Ожидание завершения процессов с таймаутом
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
   // Закрытие потоков логирования и выход
    setupLogStream.end();
    errorLogStream.end();
    process.exit(exitCode);
  }
}

/**
 * Основная функция установки и запуска приложения
 * @returns {Promise} - Промис, разрешающийся при завершении установки
 */
async function setup() {
  console.log(`${colors.magenta}=== Sign Language Video Chat Application Setup ===${colors.reset}\n`);
  logToFile(setupLogStream, 'Starting application setup');

  try {
    // Проверка структуры проекта
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

    // Установка зависимостей
    logToFile(setupLogStream, 'Installing dependencies');
    console.log(`${colors.cyan}[Setup]${colors.reset} Installing server dependencies...`);
    await executeCommand(`${npmCmd} install`, serverPath, 'Server');
    
    console.log(`\n${colors.cyan}[Setup]${colors.reset} Installing client dependencies...`);
    await executeCommand(`${npmCmd} install`, clientPath, 'Client');
    
    // Запуск приложения
    logToFile(setupLogStream, 'Starting application processes');
    console.log(`\n${colors.green}[Setup]${colors.reset} All dependencies installed successfully!`);
    console.log(`\n${colors.cyan}[Setup]${colors.reset} Starting the application...\n`);
    
    // Запуск сервера и клиента с задержкой для стабильности
    const serverProcess = startProcess(npmCmd, ['run', 'dev'], serverPath, 'Server');
    await new Promise(resolve => setTimeout(resolve, 3000));
    const clientProcess = startProcess(npmCmd, ['start'], clientPath, 'Client');

    // Обработка сигналов завершения 
    process.on('SIGINT', cleanup); // Ctrl+C
    process.on('SIGTERM', cleanup); // Сигнал завершения
    
    console.log(`\n${colors.magenta}[Setup]${colors.reset} Application is running!`);
    console.log(`${colors.magenta}[Setup]${colors.reset} Press Ctrl+C to stop the application\n`);
    logToFile(setupLogStream, 'Application started successfully');
    
  } catch (error) {
    // Обработка ошибок 
    const errorMsg = `Setup failed: ${error.message}`;
    console.error(`${colors.red}[Error]${colors.reset} ${errorMsg}`);
    logToFile(errorLogStream, errorMsg);
    await cleanup();
  }
}

// Запуск процесса установки
setup();