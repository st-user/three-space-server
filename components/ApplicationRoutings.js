'use strict';

const ParticipantsManagmentServer = require('./ParticipantsManagmentServer.js');
const ParticipatRequestHandler = require('./ParticipatRequestHandler.js');
const VrmDataRequestHandler = require('./VrmDataRequestHandler.js');
const { systemLogger } = require('./Logger.js');

/* routing */
const postRouting = new Map();
postRouting.set('/participate', new ParticipatRequestHandler());
postRouting.set('/loadVrm', new VrmDataRequestHandler([
    './.vrm/sample_1.vrm',
    './.vrm/sample_2.vrm',
]));

/* websocketServerRouting */
const websocketServerRouting = new Map();
websocketServerRouting.set('/manage', new ParticipantsManagmentServer());

websocketServerRouting.forEach(server => server.init());



systemLogger.info('Application routings are initialized.');
module.exports = {
    postRouting,
    websocketServerRouting
};
