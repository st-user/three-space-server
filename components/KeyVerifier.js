const crypto = require('crypto');

const KEY_LENGTH = 64;

const verify = (password, hash) => {

    return new Promise((resolve, reject) => {

        const [salt, key] = hash.split(':');

        crypto.scrypt(password, salt, KEY_LENGTH, (error, derivedKey) => {

            if (error) {
                reject(error);
            }
            resolve(
                key === derivedKey.toString('hex')
            );

        });
    });
};

module.exports = { verify };
