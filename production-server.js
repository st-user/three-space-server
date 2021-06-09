'use strict';

require('./server.js');

const { SPACE_IDENTIFIER_HASHES } = require('./components/Environment.js');

const { spaceIdentifierManager } = require('./components/ApplicationComponents.js');
const spaceIdentifierHashes = SPACE_IDENTIFIER_HASHES.split(',');

spaceIdentifierHashes.forEach(spaceIdentifierHash=> {
    if (spaceIdentifierHash) {
        spaceIdentifierManager.setNew(spaceIdentifierHash);
    }
});
