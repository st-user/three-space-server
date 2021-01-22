const WebSocket = require('ws');
const WebSocketServerWrapper = require('./WebSocketServerWrapper.js');
const { clientTokenManager, participantsManager, spaceIdentifierManager } = require('./ApplicationComponents.js');
const { systemLogger } = require('./Logger.js');

const CLIENT_HEALTH_CHECK_INTERVAL_MILLIS = 3000;

module.exports = class ParticipantsManagmentServer extends WebSocketServerWrapper {

    clientsBySpaceIdentifier;

    constructor() {
        super();
        this.clientsBySpaceIdentifier = new Map();
    }

    init() {
        super.init();
        this._startManagingConnection();
    }

    onUpgrade(request, socket, head, requestContext) {
        const clientId = requestContext.params.clientId;
        const token = requestContext.params.token;

        if (!clientTokenManager.check(clientId, 'pmToken', token)) {
            return {
                log: `Maybe malicious pmToken ${token}.`
            };
        }
        return undefined;
    }

    onMessage(server, ws, messageObj) {
        if (messageObj.cmd === 'requestParticipantsManagement') {
            this._onRequestParticipantsManagement(messageObj, ws);
            return;
        }
    }

    onSignalingMessage(server, ws, messageObj) {

        const fromClientId = messageObj.fromClientId;
        const toClientId = messageObj.toClientId;

        const spaceIdentifier = participantsManager.getSpaceIdentifier(fromClientId);
        const clients = this.clientsBySpaceIdentifier.get(spaceIdentifier);

        if (!clients) {
            return;
        }

        const sockClient = clients.get(toClientId);
        if (!sockClient || sockClient.readyState !== WebSocket.OPEN) {
            return;
        }

        sockClient.send(JSON.stringify(messageObj));
    }

    _startManagingConnection() {

        const manage = () => {

            if (this.clientsBySpaceIdentifier.size === 0) {
                setTimeout(manage, CLIENT_HEALTH_CHECK_INTERVAL_MILLIS);
                return;
            }

            // spaceIdentifierが存在しない=spaceIdentifierが期限切れ
            const maybeExpiredSpaceIdentifiers = [];
            this.clientsBySpaceIdentifier.forEach((sockClients, spaceIdentifier) => {
                if (!spaceIdentifierManager.canAccept(spaceIdentifier)) {
                    maybeExpiredSpaceIdentifiers.push(spaceIdentifier);
                    sockClients.forEach(client => client.terminate());
                }
            });
            maybeExpiredSpaceIdentifiers.forEach(idn => this.clientsBySpaceIdentifier.delete(idn));

            let refleshedSpaceCount = 0;
            participantsManager.forEachClientIdsBySpace(spaceIdentifier => {

                const sockClients = this.clientsBySpaceIdentifier.get(spaceIdentifier);
                if (!sockClients || sockClients.length === 0) {
                    return;
                }
                const notAvailableClientIds = [];
                sockClients.forEach((sockClient, clientId) => {
                    if (sockClient.readyState === WebSocket.CLOSING
                            || sockClient.readyState === WebSocket.CLOSED) {
                        notAvailableClientIds.push(clientId);
                    }
                });
                if (notAvailableClientIds.length === 0) {
                    return;
                }
                notAvailableClientIds.forEach(clientIdToRomove => {
                    sockClients.delete(clientIdToRomove);
                });

                participantsManager.deleteClients(spaceIdentifier, notAvailableClientIds);

                const allClients = participantsManager.getClients(spaceIdentifier);

                sockClients.forEach((client, clientId) => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({
                            cmd: 'refleshClients',
                            clientId: clientId,
                            allClients: allClients
                        }));
                    }
                });
                refleshedSpaceCount++;
            });

            if (0 < refleshedSpaceCount) {
                systemLogger.info(`Refleshes clients. refleshed count: ${refleshedSpaceCount}`);
            }

            setTimeout(manage, CLIENT_HEALTH_CHECK_INTERVAL_MILLIS);
        };
        manage();
    }

    _onRequestParticipantsManagement(messageObj, ws) {

        const clientId = messageObj.clientId;

        const spaceIdentifier = participantsManager.getSpaceIdentifier(clientId);
        const allClients = participantsManager.getClients(spaceIdentifier);

        let clients = this.clientsBySpaceIdentifier.get(spaceIdentifier);
        if (!clients) {
            clients = new Map();
            this.clientsBySpaceIdentifier.set(spaceIdentifier, clients);
        }
        clients.forEach(client => {
            if (ws !== client && client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                    cmd: 'newOpen',
                    clientId: clientId,
                    allClients: allClients
                }));
            }
        });

        clients.set(clientId, ws);
    }
};
