'use strict';

require('./server.js');

const { spaceIdentifierManager } = require('./components/ApplicationComponents.js');
const { hash } = require('./tools/keygen.js');

const testPasswords = ['123abcABC', '223cdeCDE'];

testPasswords.forEach(tp => {
    hash(tp).then(spaceIdentifierHash => {
        spaceIdentifierManager.setNew(spaceIdentifierHash);
        console.log(`Test SpaceIdentificer ${tp}`);
    });
});
