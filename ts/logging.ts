export enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3
}

export class Logger {
    private logLevel: LogLevel = LogLevel.DEBUG;

    debug(message: string, ...args: unknown[]) {
        if (this.level > LogLevel.DEBUG) {
            return;
        }
        console.debug(message, ...args);
    }

    info(message: string, ...args: unknown[]) {
        if (this.level > LogLevel.INFO) {
            return;
        }
        console.info(message, ...args);
    }

    warn(message: string, ...args: unknown[]) {
        if (this.level > LogLevel.WARN) {
            return;
        }
        console.warn(message, ...args);
    }

    error(message: string, ...args: unknown[]) {
        if (this.level > LogLevel.ERROR) {
            return;
        }
        console.error(message, ...args);
    }

    get level(): LogLevel {
        return this.logLevel;
    }

    set level(logLevel: LogLevel) {
        this.logLevel = logLevel;
    }
}

export const logger = new Logger();
