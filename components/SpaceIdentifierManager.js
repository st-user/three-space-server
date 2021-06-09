'use strict';

const { SPACE_IDENTIFIER_TIMEOUT_SECONDS } = require('./Environment.js');
const SPACE_IDENTIFIER_TIMEOUT_MILLIS = SPACE_IDENTIFIER_TIMEOUT_SECONDS * 1000;

const { verify } = require('./KeyVerifier.js');

module.exports = class SpaceIdentifierManager {

    //このフィールドに格納されている値はcrpto.scryptでhash化されたものである
    availableSpaceIdentifierHashes;

    constructor() {
        this.availableSpaceIdentifierHashes = new Map();
    }

    contains(hash) {
        return this.availableSpaceIdentifierHashes.has(hash);
    }

    async canAccept(spaceIdentifier) {

        for (const spaceIdentifierHash of this.availableSpaceIdentifierHashes.keys()) {
            const ret = await verify(spaceIdentifier, spaceIdentifierHash);
            if (ret) {
                return spaceIdentifierHash;
            }
        }
        return undefined;
    }

    checkExpiration(now) {
        const expired = [];
        this.availableSpaceIdentifierHashes.forEach((data, spaceIdentifierHash) => {

            const lastActiveTimestamp = data.lastActiveTimestamp;
            if (!lastActiveTimestamp || SPACE_IDENTIFIER_TIMEOUT_MILLIS < (now - lastActiveTimestamp)) {
                expired.push(spaceIdentifierHash);
            }
        });
        expired.forEach(hash => this.availableSpaceIdentifierHashes.delete(hash));
        return expired;
    }

    setNew(hash) {
        this.availableSpaceIdentifierHashes.set(hash, {});
        this.activate(hash);
    }

    activate(hash) {
        const data = this.availableSpaceIdentifierHashes.get(hash);
        if (data) {
            data.lastActiveTimestamp = Date.now();
        }
    }
};
