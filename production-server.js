'use strict';

const { app, express } = require('./server.js');
const { spaceIdentifierManager } = require('./components/ApplicationComponents.js');

app.use('/three-space', express.static('./dist/three-space'));


const spaceIdentifieres = process.env.SPACE_IDENTIFIER.split(',');

const exp = new Date();
exp.setHours(exp.getHours() + 6);

spaceIdentifieres.forEach(spaceIdentifier => {
    if (spaceIdentifier && 10 <= spaceIdentifier.length) {
        spaceIdentifierManager.availableSpaceIdentifiers.set(spaceIdentifier, {
            expiration: exp
        });
    }
});
