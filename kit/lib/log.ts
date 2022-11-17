import { Chalk } from "chalk";

const chalk = new Chalk({ level: 3 });

enum LogLevel {
    DEBUG = "debug",
    INFO = "info",
    WARN = "warn",
    ERROR = "error",
    TRACE = "trace",
}

const logColor = {
    [LogLevel.DEBUG]: chalk.hex("#809bce").bold,
    [LogLevel.INFO]: chalk.hex("#008585").bold,
    [LogLevel.WARN]: chalk.hex("#e5c185").bold,
    [LogLevel.ERROR]: chalk.hex("#c7522a").bold,
    [LogLevel.TRACE]: chalk.hex("#893f71").bold,
};

function output(level: LogLevel, ...args: any[]) {
    console[level](
        `${logColor[level](level.toUpperCase().padStart(5, " "))} |`,
        ...args,
    );
}

export function debug(...args: any[]) {
    output(LogLevel.DEBUG, ...args);
}

export function info(...args: any[]) {
    output(LogLevel.INFO, ...args);
}

export function warn(...args: any[]) {
    output(LogLevel.WARN, ...args);
}

export function error(...args: any[]) {
    output(LogLevel.ERROR, ...args);
}

export function trace(...args: any[]) {
    output(LogLevel.TRACE, ...args);
}
