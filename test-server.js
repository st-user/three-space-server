'use strict';

const { spaceIdentifierManager } = require('./components/ApplicationComponents.js');
const { hash } = require('./tools/keygen.js');

const exp = new Date();
exp.setMonth(exp.getMonth() + 1);
const testPasswords = ['123abcABC', '223cdeCDE'];

testPasswords.forEach(tp => {
    hash(tp).then(spaceIdentifierHash => {
        spaceIdentifierManager.availableSpaceIdentifierHashes.set(spaceIdentifierHash, {
            expiration: exp
        });
        console.log(`Test SpaceIdentificer ${tp}`);
    });
});
