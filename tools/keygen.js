const crypto = require('crypto');

const KEY_LENGTH = 64;

const hash = key => {
    return new Promise(resolve => {

        const salt = crypto.randomBytes(16).toString('hex');

        crypto.scrypt(key, salt, KEY_LENGTH, (error, derivedKey) => {

            resolve(`${salt}:${derivedKey.toString('hex')}`);
        });
    });
};

if (process.env.PASS) {
    const password = process.env.PASS;

    hash(password).then(result => {
        console.log(`hash: ${result}`);
    });
}

module.exports = { hash };
