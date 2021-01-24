'use strict';

const CHECK_EXPIRATION_INTERVAL = 1000 * 60;
const { systemLogger } = require('./Logger.js');

module.exports = class ExpirationManager {

    spaceIdentifierManager;
    participantsManager;
    clientTokenManager;

    constructor(spaceIdentifierManager, participantsManager, clientTokenManager) {
        this.spaceIdentifierManager = spaceIdentifierManager;
        this.participantsManager = participantsManager;
        this.clientTokenManager = clientTokenManager;
    }

    init() {
        const check = () => {

            const now = new Date();
            const expired = this.spaceIdentifierManager.checkExpiration(now);
            this.participantsManager.deleteBySpaceIdentifiers(expired);

            const expiredTokens = this.clientTokenManager.checkExpiration(now);

            if (expired.length !== 0 || expiredTokens.length !== 0) {
                systemLogger.info(
                    `${expired.length} spaceIndentifier(s) and ${expiredTokens.length} token(s) expired.`
                );
            }

            setTimeout(check, CHECK_EXPIRATION_INTERVAL);
        };
        setTimeout(check, CHECK_EXPIRATION_INTERVAL);
    }
};
