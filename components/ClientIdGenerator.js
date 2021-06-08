'use strict';

const { v4: uuidv4 } = require('uuid');

module.exports = class ClientIdGenerator {

    generate() {
        return uuidv4();
    }

};
