const RequestHandler = require('./RequestHandler.js');
const { systemLogger } = require('./Logger.js');
const { spaceIdentifierManager, clientTokenManager, participantsManager } = require('./ApplicationComponents.js');

module.exports = class ParticipatRequestHandler extends RequestHandler {

    handle(req, res) {

        const bodyJson = req.body;
        const myName = bodyJson.myName;
        const spaceIdentifier = bodyJson.spaceIdentifier;

        if (!spaceIdentifierManager.canAccept(spaceIdentifier)) {
            res.status(401).json({
                message: '参加キーが無効です'
            });
            return;
        }

        const newClientId = participantsManager.generateClient(
            spaceIdentifier, myName
        );

        if (!newClientId) {
            systemLogger.error(`Maybe malicious input client name ${myName}.`);
            res.status(400).send({ error: 'Maybe malicious input client name.' });
            return;
        }

        const theOtherClients = participantsManager.getTheOthers(
            spaceIdentifier, newClientId
        );

        const tokens = clientTokenManager.generateToken(newClientId);

        res.json({
            clientId: newClientId,
            theOtherClients: theOtherClients,
            tokens: tokens
        });
    }
};
