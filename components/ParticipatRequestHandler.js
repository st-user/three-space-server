'use strict';

const RequestHandler = require('./RequestHandler.js');
const { systemLogger } = require('./Logger.js');
const { spaceIdentifierManager, clientTokenManager, participantsManager } = require('./ApplicationComponents.js');
const { generateTurnCredentials } = require('./TurnCredentialGen.js');

const STUN_URL = process.env.STUN_URL;
const TURN_URL = process.env.TURN_URL;

module.exports = class ParticipatRequestHandler extends RequestHandler {

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
        const turnCredentials = generateTurnCredentials(newClientId);

        res.json({
            clientId: newClientId,
            theOtherClients: theOtherClients,
            tokens: tokens,
            iceServerInfo: {
                stunUrl: STUN_URL,
                turnUrl: TURN_URL,
                turnCredentials: turnCredentials
            }
        });
    }
};
