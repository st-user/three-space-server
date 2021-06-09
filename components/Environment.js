require('dotenv').config();

const parseInt = (v, defaultValue) => !v ? defaultValue : parseInt(v, 10);

const ENVS = {

    isDevelopment: process.env.NODE_ENV === 'development',

    NODE_ENV: process.env.NODE_ENV,
    PORT: parseInt(process.env.PORT, 8080),
    LOG_LEVEL: process.env.LOG_LEVEL || 'info',
    SPACE_IDENTIFIER_HASHES: process.env.SPACE_IDENTIFIER_HASHES || '',

    TURN_SECRET: process.env.TURN_SECRET,
    STUN_URL: process.env.STUN_URL,
    TURN_URL: process.env.TURN_URL,
    HOURS_TURN_CREDENTIAL_VALID: parseInt(process.env.HOURS_TURN_CREDENTIAL_VALID, 30),
    
    AUTH0_DOMAIN: process.env.AUTH0_DOMAIN,
    AUTH0_CLIENT_ID: process.env.AUTH0_CLIENT_ID,
    AUTH0_AUDIENCE: process.env.AUTH0_AUDIENCE,
    
    SPACE_IDENTIFIER_TIMEOUT_SECONDS: parseInt(process.env.SPACE_IDENTIFIER_TIMEOUT_SECONDS, 600),
    CLIENT_INFO_TIMEOUT_SECONDS: parseInt(process.env.CLIENT_INFO_TIMEOUT_SECONDS, 60),

    CLIENT_TOKEN_LIFE_SPAN_MINUTES: parseInt(process.env.CLIENT_TOKEN_LIFE_SPAN_MINUTES ,15),

    CLIENT_HEALTH_CHECK_INTERVAL_SECONDS: parseInt(process.env.CLIENT_HEALTH_CHECK_INTERVAL_SECONDS, 3),
    CONNECTION_PING_PONG_INTERVAL_SECONDS: parseInt(process.env.CONNECTION_PING_PONG_INTERVAL_SECONDS, 10),
    
    EXPIRATION_CHECK_INTERVAL_SECONDS: parseInt(process.env.EXPIRATION_CHECK_INTERVAL_SECONDS, 15),
};

ENVS.CLIENT_INFO_TIMEOUT_COUNT = ENVS.CLIENT_INFO_TIMEOUT_SECONDS / ENVS.CLIENT_HEALTH_CHECK_INTERVAL_SECONDS;

module.exports = ENVS;