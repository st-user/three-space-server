'use strict';
const { CLIENT_TOKEN_LIFE_SPAN_SECONDS } = require('./Environment.js');

const { v4: uuidv4 } = require('uuid');

module.exports = class ClientTokenManager {

    tokensByClientId;

    constructor() {
        this.tokensByClientId = new Map();
    }

    generateToken(clientId) {
        const pmToken = this._generateToken();
        const vrmToken = this._generateToken();

        const exp = new Date();
        exp.setSeconds(exp.getSeconds() + CLIENT_TOKEN_LIFE_SPAN_SECONDS);

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

    resetToken(clientId) {
        const tokens = this.tokensByClientId.get(clientId);
        if (!tokens) {
            return undefined;
        }
        const newTokens = this.generateToken(clientId);
        return Object.assign(tokens, newTokens);
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
