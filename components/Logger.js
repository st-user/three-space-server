'use strict';

const log4js = require('log4js');

log4js.configure({
    appenders: {
        system: { type: 'file', filename: './log/system.log', maxLogSize: 100000, backups: 2 }
    },
    categories: {
        default: { appenders:['system'], level: 'info' }
    }
});
const systemLogger = log4js.getLogger();

systemLogger.info('System logger is initialized.');
module.exports = {
    systemLogger
};
