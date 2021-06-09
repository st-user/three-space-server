'use strict';

const log4js = require('log4js');


const systemLogger = log4js.getLogger();
systemLogger.level = 'info';

systemLogger.info('System logger is initialized.');
module.exports = {
    systemLogger
};
