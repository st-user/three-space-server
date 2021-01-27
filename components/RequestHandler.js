'use strict';

const { systemLogger } = require('./Logger.js');

module.exports = class RequestHandler {

    async doHandle(req, res, requestContext) {
        try {
            systemLogger.info(`Request : ${req.path}`);
            await this.handle(req, res, requestContext);
        } catch (e) {
            systemLogger.error('Uncaught exception on RequestHandler', e);
            throw e;
        }
    }

};
