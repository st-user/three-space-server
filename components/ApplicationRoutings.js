const ParticipantsManagmentServer = require('./ParticipantsManagmentServer.js');
const ParticipatRequestHandler = require('./ParticipatRequestHandler.js');
const { systemLogger } = require('./Logger.js');

/* routing */
const routing = new Map();
routing.set('/participate', new ParticipatRequestHandler());

/* websocketServerRouting */
const websocketServerRouting = new Map();
websocketServerRouting.set('/manage', new ParticipantsManagmentServer());

websocketServerRouting.forEach(server => server.init());



systemLogger.info('Application routings are initialized.');
module.exports = {
    routing,
    websocketServerRouting
};
