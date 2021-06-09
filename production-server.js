'use strict';

const { spaceIdentifierManager } = require('./components/ApplicationComponents.js');
const spaceIdentifierHashes = process.env.SPACE_IDENTIFIER_HASHES.split(',');

const exp = new Date();
exp.setHours(exp.getHours() + 6);

spaceIdentifierHashes.forEach(spaceIdentifierHash=> {
    if (spaceIdentifierHash) {
        spaceIdentifierManager.availableSpaceIdentifierHashes.set(spaceIdentifierHash, {
            expiration: exp
        });
    }
});
