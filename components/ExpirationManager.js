'use strict';

const { EXPIRATION_CHECK_INTERVAL_SECONDS } = require('./Environment.js');
const EXPIRATION_CHECK_INTERVAL_MILLIS = EXPIRATION_CHECK_INTERVAL_SECONDS * 1000;

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
        // TODO 予期せぬ例外時に処理を継続すべきか精査
        const check = () => {

            const now = new Date();
            const expired = this.spaceIdentifierManager.checkExpiration(now);
            this.participantsManager.deleteBySpaceIdentifierHashes(expired);

            const expiredTokens = this.clientTokenManager.checkExpiration(now);

            if (expired.length !== 0 || expiredTokens.length !== 0) {
                systemLogger.info(
                    `${expired.length} spaceIndentifier(s) and ${expiredTokens.length} token(s) expired.`
                );
            }

            setTimeout(check, EXPIRATION_CHECK_INTERVAL_MILLIS);
        };
        setTimeout(check, EXPIRATION_CHECK_INTERVAL_MILLIS);
    }
};
