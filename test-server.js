'use strict';

const { app, express } = require('./server.js');
const { spaceIdentifierManager } = require('./components/ApplicationComponents.js');

app.use('/three-space', express.static('../three-space/dist/three-space'));

const exp = new Date();
exp.setMonth(exp.getMonth() + 1);
spaceIdentifierManager.availableSpaceIdentifiers.set('1234567890', {
    expiration: exp
});
spaceIdentifierManager.availableSpaceIdentifiers.set('2234567890', {
    expiration: exp
});
console.log(spaceIdentifierManager.availableSpaceIdentifiers);
