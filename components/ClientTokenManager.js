'use strict';

const { v4: uuidv4 } = require('uuid');

const EXPIRES_IN_MINUTES = 15;
module.exports = class ClientTokenManager {

    tokensByClientId;

    constructor() {
        this.tokensByClientId = new Map();
    }

    generateToken(clientId) {
        const pmToken = this._generateToken();
        const vrmToken = this._generateToken();

        const exp = new Date();
        exp.setMinutes(exp.getMinutes() + EXPIRES_IN_MINUTES);

        const tokens = {
            pmToken: pmToken,
            vrmToken: vrmToken,
            expiration: exp
        };
        this.tokensByClientId.set(clientId, tokens);
        return tokens;
    }

    check(clientId, tokenName, inputValue, keepToken) {
        const tokens = this.tokensByClientId.get(clientId);
        if (!tokens) {
            return false;
        }
        const token = tokens[tokenName];
        if (!keepToken) {
            delete tokens[tokenName];
        }
        return token === inputValue;
    }

    checkExpiration(now) {
        const expired = [];
        this.tokensByClientId.forEach((tokens, clientId) => {
            if (!tokens.expiration || tokens.expiration < now) {
                expired.push(clientId);
            }
        });
        expired.forEach(clientId => this.tokensByClientId.delete(clientId));
        return expired;
    }

    _generateToken() {
        return uuidv4();
    }
};
