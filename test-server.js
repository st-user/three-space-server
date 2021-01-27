'use strict';

const { app, express } = require('./server.js');
const { spaceIdentifierManager } = require('./components/ApplicationComponents.js');
const { hash } = require('./tools/keygen.js');

app.use('/three-space', express.static('../three-space/dist/three-space'));

const exp = new Date();
exp.setMonth(exp.getMonth() + 1);
const testPasswords = ['1234567890', '2234567890'];

testPasswords.forEach(tp => {
    hash(tp).then(spaceIdentifierHash => {
        spaceIdentifierManager.availableSpaceIdentifierHashes.set(spaceIdentifierHash, {
            expiration: exp
        });
        console.log(`Test SpaceIdentificer ${tp}`);
    });
});
