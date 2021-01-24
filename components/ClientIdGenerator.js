'use strict';

const crypto = require('crypto');

module.exports = class ClientIdGenerator {

    idCounter;

    constructor() {
        this.idCounter = 0;
    }

    generate() {
        this.idCounter++;
        return this._generateToken() + '_' + this.idCounter;
    }

    _generateToken() {
        const buff = crypto.randomBytes(8);
        const hex = buff.toString('hex');
        return hex;
    }
};
