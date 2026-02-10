import { ConsoleLogger, LogLevel } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Custom logger that writes to both console and a log file.
 * Log file is stored at PROJECT_ROOT/logs/server.log
 */
export class FileLogger extends ConsoleLogger {
  private logStream: fs.WriteStream | null = null;

  constructor(context?: string) {
    super(context || 'FileLogger');
    this.initLogFile();
  }

  private initLogFile() {
    try {
      const logDir = path.resolve(__dirname, '../../../../logs');
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
      const logPath = path.join(logDir, 'server.log');
      this.logStream = fs.createWriteStream(logPath, { flags: 'a' });
    } catch {
      // Fall back to console-only logging
    }
  }

  private writeToFile(level: string, message: any, ...args: any[]) {
    if (!this.logStream) return;
    const timestamp = new Date().toISOString();
    const ctx =
      args.length > 0 && typeof args[args.length - 1] === 'string'
        ? args[args.length - 1]
        : this.context || '';
    const line = `${timestamp} [${level.toUpperCase()}] [${ctx}] ${message}\n`;
    this.logStream.write(line);

    // Write stack traces for errors
    for (const arg of args) {
      if (arg instanceof Error && arg.stack) {
        this.logStream.write(`${arg.stack}\n`);
      } else if (
        typeof arg === 'object' &&
        arg !== null &&
        !(typeof arg === 'string')
      ) {
        try {
          this.logStream.write(`${JSON.stringify(arg)}\n`);
        } catch {
          // Skip non-serializable objects
        }
      }
    }
  }

  log(message: any, ...optionalParams: any[]) {
    super.log(message, ...optionalParams);
    this.writeToFile('log', message, ...optionalParams);
  }

  error(message: any, ...optionalParams: any[]) {
    super.error(message, ...optionalParams);
    this.writeToFile('error', message, ...optionalParams);
  }

  warn(message: any, ...optionalParams: any[]) {
    super.warn(message, ...optionalParams);
    this.writeToFile('warn', message, ...optionalParams);
  }

  debug(message: any, ...optionalParams: any[]) {
    super.debug(message, ...optionalParams);
    this.writeToFile('debug', message, ...optionalParams);
  }

  verbose(message: any, ...optionalParams: any[]) {
    super.verbose(message, ...optionalParams);
    this.writeToFile('verbose', message, ...optionalParams);
  }
}
