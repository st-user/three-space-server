'use strict';

const { systemLogger } = require('./Logger.js');
const { clientTokenManager } = require('./ApplicationComponents.js');
const fs = require('fs');

module.exports = class VrmDataRequestHandler{

    filePaths;

    constructor(filePaths) {
        this.filePaths = filePaths;
    }

    handle(req, res) {

        const bodyJson = req.body;
        const clientId = bodyJson.clientId;
        const vrmToken = bodyJson.vrmToken;
        const vrmType = bodyJson.type;

        if (!clientTokenManager.check(clientId, 'vrmToken', vrmToken, true)) {
            systemLogger.error(`Maybe malicious vrmToken ${vrmToken}.`);
            res.status(400).send({ error: 'Maybe malicious vrmToken.' });
            return;
        }

        const filePath = this.filePaths[vrmType];
        fs.stat(filePath, (error, stat) => {
            if (error) {
                res.writeHead(404, 'Not Found');
                res.end();
            }
            res.writeHead(200, {
                'Content-Type': 'application/octet-stream',
                'Content-Length': stat.size
            });

            const readStream = fs.createReadStream(filePath);

            readStream.on('error', () => {
                res.writeHead(404, 'Not Found');
                res.end();
            });

            readStream.pipe(res);
        });


    }
};
