'use strict';

const { app, express } = require('./server.js');
const { spaceIdentifierManager } = require('./components/ApplicationComponents.js');

app.use('/three-space', express.static('./dist/three-space'));

const exp = new Date();
exp.setMonth(exp.setMonth() + 1);
spaceIdentifierManager.availableSpaceIdentifiers.set('', {
    expiration: exp
});
