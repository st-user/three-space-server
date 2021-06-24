const environment = require('./Environment.js');
const SECRETS = environment.isDevelopment ? undefined : environment.TURN_SECRETS;
const {
    HOURS_TURN_CREDENTIAL_VALID,
    STUN_URLS,
    TURN_URLS
} = environment;

const crypto = require('crypto');

const generateTurnCredentials = (secret, name) => {

    if (!secret || !HOURS_TURN_CREDENTIAL_VALID) {
        return undefined;
    }

    const timestamp = parseInt(Date.now() / 1000) + HOURS_TURN_CREDENTIAL_VALID * 3600;
    const username = `${timestamp}:${name}`;

    const hmac = crypto.createHmac('sha1', secret);
    hmac.setEncoding('base64');
    hmac.write(username);
    hmac.end();

    const credential = hmac.read();

    return {
        username: username,
        credential: credential
    };
};

const generateICEServerInfo = () => {

    if (!SECRETS) {
        return undefined;
    }

    const secrets = SECRETS.split(',');
    const stuns = STUN_URLS.split(',');
    const turns = TURN_URLS.split(',');
    const iceServers = [];

    secrets.forEach((sec, index) => {
        const stun = stuns[index];
        const turn = turns[index];
        const { username, credential } = generateTurnCredentials(sec, crypto.randomBytes(8).toString('hex'));

        iceServers.push({
            urls: [stun]
        });
        iceServers.push({
            urls: [turn],
            username, credential
        });
    });  

    const iceServerInfo = { iceServers };

    return iceServerInfo;
};

module.exports = { generateICEServerInfo };
