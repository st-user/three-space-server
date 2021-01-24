'use strict';

const { systemLogger, handleErrorQuietly } = require('./Logger.js');

module.exports = class RequestHandler {

    doHandle(req, res, requestContext) {
        try {
            systemLogger.info(`Request : ${req.path}`);
            this.handle(req, res, requestContext);
        } catch (e) {
            handleErrorQuietly(e, () => {
                res.status(500).send({ error: 'internal server error.' });
            });
        }
    }

    handle(req, res) { /* subclassで実装 */ } // eslint-disable-line no-unused-vars
};
