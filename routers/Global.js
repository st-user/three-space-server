'use strict';

const { systemLogger } = require('../components/Logger.js');

const before = (req, res, next) => {
    systemLogger.info(`Start request: ${req.path}`);
    next();
};

module.exports = {
    before
};