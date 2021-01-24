'use strict';

const { systemLogger } = require('./Logger.js');

module.exports = class RequestHandler {

    doHandle(req, res, requestContext) {
        try {
            systemLogger.info(`Request : ${req.path}`);
            this.handle(req, res, requestContext);
        } catch (e) {
            systemLogger.error('Uncaught exception on RequestHandler', e);
            throw e;
        }
    }

    handle(req, res) { /* subclassで実装 */ } // eslint-disable-line no-unused-vars
};
