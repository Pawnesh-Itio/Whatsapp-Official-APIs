// utils/whatsappLogger.js

const { createLogger, format, transports } = require('winston');

const whatsappLogger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.printf(
      (info) => `[${info.timestamp}] ${info.level.toUpperCase()}: ${info.message}`
    )
  ),
  transports: [
    new transports.File({ filename: 'logs/whatsapp-error.log', level: 'error' }),
    new transports.File({ filename: 'logs/whatsapp-combined.log' }),
  ],
});

module.exports = { whatsappLogger };
