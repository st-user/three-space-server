'use strict';

const log4js = require('log4js');

log4js.configure({
    appenders: {
        system: { type: 'file', filename: './log/system.log' }
    },
    categories: {
        default: { appenders:['system'], level: 'info' }
    }
});
const systemLogger = log4js.getLogger();
const handleErrorQuietly = (_e, doClose) => {
    try {
        systemLogger.error(_e);
        doClose();
    } catch (e) {
        console.error(e);
    }
};

systemLogger.info('System logger is initialized.');
module.exports = {
    systemLogger,
    handleErrorQuietly
};
