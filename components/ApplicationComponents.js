'use strict';

const ClientIdGenerator = require('./ClientIdGenerator.js');
const ClientTokenManager = require('./ClientTokenManager.js');
const ParticipantsManager = require('./ParticipantsManager.js');
const SpaceIdentifierManager = require('./SpaceIdentifierManager.js');
const ExpirationManager = require('./ExpirationManager.js');

const { systemLogger } = require('./Logger.js');

/* manager */
const clientIdGenerator = new ClientIdGenerator();
const spaceIdentifierManager = new SpaceIdentifierManager();
const participantsManager = new ParticipantsManager(clientIdGenerator);
const clientTokenManager = new ClientTokenManager();
new ExpirationManager(
    spaceIdentifierManager, participantsManager, clientTokenManager
).init();


systemLogger.info('Application components are initialized.');
module.exports = {
    clientIdGenerator: clientIdGenerator,
    spaceIdentifierManager: spaceIdentifierManager,
    participantsManager: participantsManager,
    clientTokenManager: clientTokenManager
};
