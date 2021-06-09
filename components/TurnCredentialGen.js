const crypto = require('crypto');

const { 
    TURN_SECRET, 
    HOURS_TURN_CREDENTIAL_VALID
} = require('./components/Environment.js');

const generateTurnCredentials = (name) => {

    if (!TURN_SECRET || !HOURS_TURN_CREDENTIAL_VALID) {
        return undefined;
    }

    const timestamp = parseInt(Date.now() / 1000) + HOURS_TURN_CREDENTIAL_VALID * 3600;
    const username = `${timestamp}:${name}`;

    const hmac = crypto.createHmac('sha1', TURN_SECRET);
    hmac.setEncoding('base64');
    hmac.write(username);
    hmac.end();

    const password = hmac.read();

    return {
        username: username,
        password: password
    };
};

module.exports = { generateTurnCredentials };
