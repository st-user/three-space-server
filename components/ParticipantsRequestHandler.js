'use strict';

const { systemLogger } = require('./Logger.js');
const { spaceIdentifierManager, clientTokenManager, participantsManager } = require('./ApplicationComponents.js');
const { generateICEServerInfo } = require('./TurnCredentialGen.js');


module.exports = class ParticipantsRequestHandler {

    async handle(req, res) {

        const bodyJson = req.body;
        const myName = bodyJson.myName;
        const spaceIdentifier = bodyJson.spaceIdentifier;

        const spaceIdentifierHash = await spaceIdentifierManager.canAccept(spaceIdentifier);
        if (!spaceIdentifierHash) {
            systemLogger.error('Unavailable spaceIdentifier (expired, mistaken or maybe malicious).');
            res.status(401).json({
                message: '参加キーが無効です'
            });
            return;
        }

        const newClientId = participantsManager.generateClient(
            spaceIdentifierHash, myName
        );

        if (!newClientId) {
            systemLogger.error(`Maybe malicious input client name ${myName}.`);
            res.status(400).send({ error: 'Maybe malicious input client name.' });
            return;
        }

        const theOtherClients = participantsManager.getTheOthers(
            spaceIdentifierHash, newClientId
        );

        const tokens = clientTokenManager.generateToken(newClientId);
        const iceServerInfo = generateICEServerInfo();

        res.json({
            clientId: newClientId,
            theOtherClients: theOtherClients,
            tokens: tokens,
            iceServerInfo
        });
    }
};
