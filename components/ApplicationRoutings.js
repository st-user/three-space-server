'use strict';

const express = require('express');
const appRouter = express.Router();

const ParticipantsManagmentServer = require('./ParticipantsManagmentServer.js');
const ParticipantsRequestHandler = require('./ParticipantsRequestHandler.js');
const VrmDataRequestHandler = require('./VrmDataRequestHandler.js');
const { systemLogger } = require('./Logger.js');

/* routing */
const participantsRequestHandler = new ParticipantsRequestHandler();
appRouter.post('/participate', async (req, res, next) => {
    try {
        await participantsRequestHandler.handle(req, res);    
    } catch (e) {
        return next(e);
    }
});

const vrmDataRequestHandler = new VrmDataRequestHandler([
    './.vrm/sample_1.vrm',
    './.vrm/sample_2.vrm',
]);
appRouter.post('/loadVrm', (req, res) => {
    vrmDataRequestHandler.handle(req, res);
});

/* websocketServerRouting */
const websocketServerRouting = new Map();
websocketServerRouting.set('/manage', new ParticipantsManagmentServer());

websocketServerRouting.forEach(server => server.init());



systemLogger.info('Application routings are initialized.');
module.exports = {
    appRouter,
    websocketServerRouting
};
