'use strict';

const crypto = require('crypto');

const EXPIRES_IN_MINUTES = 15;
module.exports = class ClientTokenManager {

    tokensByClientId;

    constructor() {
        this.tokensByClientId = new Map();
    }

    generateToken(clientId) {
        const pmToken = this._generateToken();

        const exp = new Date();
        exp.setMinutes(exp.getMinutes() + EXPIRES_IN_MINUTES);

        const tokens = {
            pmToken: pmToken,
            expiration: exp
        };
        this.tokensByClientId.set(clientId, tokens);
        return tokens;
    }

    check(clientId, tokenName, inputValue) {
        const tokens = this.tokensByClientId.get(clientId);
        if (!tokens) {
            return false;
        }
        const token = tokens[tokenName];
        delete tokens[tokenName];
        return token === inputValue;
    }

    checkExpiration(now) {
        const expired = [];
        this.tokensByClientId.forEach((tokens, clientId) => {
            if (!tokens.pmToken || !tokens.expiration || tokens.expiration < now) {
                expired.push(clientId);
            }
        });
        expired.forEach(clientId => this.tokensByClientId.delete(clientId));
        return expired;
    }

    _generateToken() {
        const buff = crypto.randomBytes(8);
        const hex = buff.toString('hex');
        return hex;
    }
};
