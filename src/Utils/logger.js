/**
 * Logger — Winston
 * Instalar: npm i winston
 *
 * Niveles:  error > warn > info > http > debug
 * En producción sólo error/warn/info van a archivo; en dev todo va a consola.
 */
const { createLogger, format, transports } = require('winston');
const path = require('path');

const { combine, timestamp, printf, colorize, errors, json } = format;

const isDev = process.env.NODE_ENV !== 'production';

// Formato legible para consola
const devFormat = combine(
  colorize({ all: true }),
  timestamp({ format: 'HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ level, message, timestamp: ts, stack, ...meta }) => {
    const extra = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `${ts} [${level}] ${stack || message}${extra}`;
  })
);

// Formato JSON estructurado para producción / archivos
const prodFormat = combine(
  timestamp(),
  errors({ stack: true }),
  json()
);

const logger = createLogger({
  level:       isDev ? 'debug' : 'info',
  format:      isDev ? devFormat : prodFormat,
  transports: [
    new transports.Console(),
    ...(isDev ? [] : [
      new transports.File({
        filename: path.join('logs', 'error.log'),
        level:    'error',
        maxsize:  10 * 1024 * 1024, // 10 MB
        maxFiles: 5,
      }),
      new transports.File({
        filename: path.join('logs', 'combined.log'),
        maxsize:  20 * 1024 * 1024, // 20 MB
        maxFiles: 10,
      }),
    ]),
  ],
  // No matar el proceso ante excepciones no controladas
  exceptionHandlers: [
    new transports.Console(),
    ...(!isDev ? [new transports.File({ filename: path.join('logs', 'exceptions.log') })] : []),
  ],
  rejectionHandlers: [
    new transports.Console(),
  ],
});

module.exports = logger;
