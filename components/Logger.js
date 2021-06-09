'use strict';
const { LOG_LEVEL } = require('./Environment.js');


const log4js = require('log4js');

const systemLogger = log4js.getLogger();
systemLogger.level = LOG_LEVEL;

systemLogger.info(`System logger[${LOG_LEVEL}] is initialized.`);

module.exports = {
    systemLogger
};
