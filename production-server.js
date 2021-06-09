'use strict';

const { SPACE_IDENTIFIER_HASHES } = require('./components/Environment.js');

const { spaceIdentifierManager } = require('./components/ApplicationComponents.js');
const spaceIdentifierHashes = SPACE_IDENTIFIER_HASHES.split(',');

const exp = new Date();
exp.setHours(exp.getHours() + 6);

spaceIdentifierHashes.forEach(spaceIdentifierHash=> {
    if (spaceIdentifierHash) {
        spaceIdentifierManager.availableSpaceIdentifierHashes.set(spaceIdentifierHash, {
            expiration: exp
        });
    }
});
