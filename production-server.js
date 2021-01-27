'use strict';

const { app, express } = require('./server.js');
const { spaceIdentifierManager } = require('./components/ApplicationComponents.js');

app.use('/three-space', express.static('./dist/three-space'));


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
