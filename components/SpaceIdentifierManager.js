'use strict';

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
            if (!data.expiration || data.expiration < now) {
                expired.push(spaceIdentifierHash);
            }
        });
        expired.forEach(hash => this.availableSpaceIdentifierHashes.delete(hash));
        return expired;
    }
};
