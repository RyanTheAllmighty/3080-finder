import config from 'config';
import * as path from 'path';
import * as winston from 'winston';
import type Transport from 'winston-transport';

const logger = winston.createLogger({
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: path.resolve(__dirname, '../../logs/server.log') }),
    ].filter(Boolean) as Transport[],
    level: config.get<string>('logging_level'),
});

export default logger;
