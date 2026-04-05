import winston from 'winston';

export const logger = winston.createLogger({
    level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        process.env.NODE_ENV === 'development' 
            ? winston.format.combine(winston.format.colorize(), winston.format.simple())
            : winston.format.json() 
    ),
    transports: [
        new winston.transports.Console()
    ],
});