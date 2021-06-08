'use strict';

const log4js = require('log4js');

const config = {
    categories: {
        default: { appenders:['system'], level: 'info' }
    }
};

if (process.env.NODE_ENV === 'development') {
    config.appenders = {
        system: { type: 'file', filename: './log/system.log', maxLogSize: 100000, backups: 2 }
    };
}


log4js.configure(config);
const systemLogger = log4js.getLogger();

systemLogger.info('System logger is initialized.');
module.exports = {
    systemLogger
};
