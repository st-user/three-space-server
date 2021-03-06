'use strict';

require('dotenv').config();

const _parseInt = (v, defaultValue) => !v ? defaultValue : parseInt(v, 10);

const ENVS = {

    isDevelopment: process.env.NODE_ENV === 'development',

    NODE_ENV: process.env.NODE_ENV,
    PORT: _parseInt(process.env.PORT, 8080),
    LOG_LEVEL: process.env.LOG_LEVEL || 'info',
    SPACE_IDENTIFIER_HASHES: process.env.SPACE_IDENTIFIER_HASHES || '',

    TURN_SECRETS: process.env.TURN_SECRETS,
    STUN_URLS: process.env.STUN_URLS,
    TURN_URLS: process.env.TURN_URLS,
    HOURS_TURN_CREDENTIAL_VALID: _parseInt(process.env.HOURS_TURN_CREDENTIAL_VALID, 30),
    
    AUTH0_DOMAIN: process.env.AUTH0_DOMAIN,
    AUTH0_CLIENT_ID: process.env.AUTH0_CLIENT_ID,
    AUTH0_AUDIENCE: process.env.AUTH0_AUDIENCE,
    
    SPACE_IDENTIFIER_TIMEOUT_SECONDS: _parseInt(process.env.SPACE_IDENTIFIER_TIMEOUT_SECONDS, 600),
    CLIENT_INFO_TIMEOUT_SECONDS: _parseInt(process.env.CLIENT_INFO_TIMEOUT_SECONDS, 60),

    CLIENT_TOKEN_LIFE_SPAN_SECONDS: _parseInt(process.env.CLIENT_TOKEN_LIFE_SPAN_SECONDS ,900),

    CLIENT_HEALTH_CHECK_INTERVAL_SECONDS: _parseInt(process.env.CLIENT_HEALTH_CHECK_INTERVAL_SECONDS, 3),
    CONNECTION_PING_PONG_INTERVAL_SECONDS: _parseInt(process.env.CONNECTION_PING_PONG_INTERVAL_SECONDS, 10),
    
    EXPIRATION_CHECK_INTERVAL_SECONDS: _parseInt(process.env.EXPIRATION_CHECK_INTERVAL_SECONDS, 15),
};

ENVS.CLIENT_INFO_TIMEOUT_COUNT = Math.round(ENVS.CLIENT_INFO_TIMEOUT_SECONDS / ENVS.CLIENT_HEALTH_CHECK_INTERVAL_SECONDS);

module.exports = ENVS;