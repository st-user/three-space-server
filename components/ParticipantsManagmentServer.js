'use strict';

const { 
    CLIENT_HEALTH_CHECK_INTERVAL_SECONDS,
    CONNECTION_PING_PONG_INTERVAL_SECONDS
} = require('./Environment.js');

const CLIENT_HEALTH_CHECK_INTERVAL_MILLIS = CLIENT_HEALTH_CHECK_INTERVAL_SECONDS * 1000;
const CONNECTION_PING_PONG_INTERVAL_MILLIS = CONNECTION_PING_PONG_INTERVAL_SECONDS * 1000;

const WebSocket = require('ws');
const WebSocketServerWrapper = require('./WebSocketServerWrapper.js');
const { clientTokenManager, participantsManager, spaceIdentifierManager } = require('./ApplicationComponents.js');
const { systemLogger } = require('./Logger.js');


module.exports = class ParticipantsManagmentServer extends WebSocketServerWrapper {

    sockClientsBySpaceIdentifierHash;

    constructor() {
        super();
        this.sockClientsBySpaceIdentifierHash = new Map();
    }

    init() {
        super.init();
        this._startManagingConnection();
    }

    onUpgrade(request, socket, head, requestContext) {
        const clientId = requestContext.params.clientId;
        const token = requestContext.params.token;

        if (!participantsManager.isTheClientAvailable(clientId)) {
            return {
                log: `The client is not available ${clientId}.`
            };            
        }

        if (!clientTokenManager.check(clientId, 'pmToken', token)) {
            return {
                log: `Maybe malicious pmToken ${token}.`
            };
        }
        return undefined;
    }

    onMessage(server, ws, messageObj) {
        if (messageObj.cmd === 'pong') {
            return;
        }
        if (messageObj.cmd === 'resetToken') {
            this._resetToken(messageObj, ws);
            return;
        }
        if (messageObj.cmd === 'requestParticipantsManagement') {
            this._onRequestParticipantsManagement(messageObj, ws);
            return;
        }
    }

    onSignalingMessage(server, ws, messageObj) {

        const fromClientId = messageObj.from;
        const toClientId = messageObj.to;

        const spaceIdentifierHash = participantsManager.getSpaceIdentifierHash(fromClientId);
        const clients = this.sockClientsBySpaceIdentifierHash.get(spaceIdentifierHash);

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
        // TODO 予期せぬ例外時に処理を継続すべきか精査
        const manage = () => {

            if (this.sockClientsBySpaceIdentifierHash.size === 0) {
                setTimeout(manage, CLIENT_HEALTH_CHECK_INTERVAL_MILLIS);
                return;
            }

            // spaceIdentifierが存在しない=spaceIdentifierが期限切れ
            const maybeExpiredSpaceIdentifierHashes = [];
            this.sockClientsBySpaceIdentifierHash.forEach((sockClients, spaceIdentifierHash) => {
                if (!spaceIdentifierManager.contains(spaceIdentifierHash)) {
                    maybeExpiredSpaceIdentifierHashes.push(spaceIdentifierHash);
                    sockClients.forEach(client => client.terminate());
                }
            });
            maybeExpiredSpaceIdentifierHashes.forEach(hash => this.sockClientsBySpaceIdentifierHash.delete(hash));

            let refleshedSpaceCount = 0;
            let deactivedSpaceCount = 0;
            participantsManager.forEachClientIdsBySpace(spaceIdentifierHash => {

                const sockClients = this.sockClientsBySpaceIdentifierHash.get(spaceIdentifierHash);
                if (!sockClients || sockClients.length === 0) {
                    return;
                }
                const notAvailableClientIds = [];
                sockClients.forEach((sockClient, clientId) => {
                    const clientInfo = participantsManager.getClient(spaceIdentifierHash, clientId);
                    if (!clientInfo) {
                        notAvailableClientIds.push(clientId);
                        return;
                    }
                    if (sockClient.readyState === WebSocket.CLOSING
                            || sockClient.readyState === WebSocket.CLOSED) {
                       
                        clientInfo.markAsDisconnected();

                        if (clientInfo.shoudlBeDeleted()) {
                            notAvailableClientIds.push(clientId);
                        }
                    } else {
                        clientInfo.activate();
                    }
                });

                notAvailableClientIds.forEach(clientIdToRomove => {
                    sockClients.delete(clientIdToRomove);
                });
                participantsManager.deleteClients(spaceIdentifierHash, notAvailableClientIds);

                const allClients = participantsManager.getClients(spaceIdentifierHash);
                sockClients.forEach((client, clientId) => {                   
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({
                            cmd: 'refleshClients',
                            clientId: clientId,
                            allClients: allClients
                        }));
                    }
                });

                if (0 < notAvailableClientIds.length) {
                    refleshedSpaceCount++;

                    if (allClients.length === 0) {
                        deactivedSpaceCount++;
                    }
                }

                if (0 < allClients.length) {
                    spaceIdentifierManager.activate(spaceIdentifierHash);
                }
            });

            if (0 < refleshedSpaceCount) {
                systemLogger.info(`Refleshes clients. refleshed space(s) : ${refleshedSpaceCount}`);
            }

            if (0 < deactivedSpaceCount) {
                systemLogger.info(`${deactivedSpaceCount} space(s) become(s) inactive.`);
            }

            setTimeout(manage, CLIENT_HEALTH_CHECK_INTERVAL_MILLIS);
        };
        manage();

        const ping = () => {
            this.sockClientsBySpaceIdentifierHash.forEach(sockClients => {
                sockClients.forEach(sockClient => {
                    if (sockClient.readyState === WebSocket.OPEN) {
                        sockClient.send(JSON.stringify({ cmd: 'ping' }));
                    }
                });
            });
            setTimeout(ping, CONNECTION_PING_PONG_INTERVAL_MILLIS);
        };
        setTimeout(ping, CONNECTION_PING_PONG_INTERVAL_MILLIS);
    }

    _resetToken(messageObj, ws) {
        const newToken = clientTokenManager.resetToken(messageObj.clientId, 'pmToken');
        if (!newToken) {
            throw 'Token being reset is undefined.';
        }
        ws.send(JSON.stringify({
            cmd: 'resetToken',
            pmToken: newToken
        }));
    }

    _onRequestParticipantsManagement(messageObj, ws) {

        const clientId = messageObj.clientId;

        const spaceIdentifierHash = participantsManager.getSpaceIdentifierHash(clientId);
        const allClients = participantsManager.getClients(spaceIdentifierHash);

        let clients = this.sockClientsBySpaceIdentifierHash.get(spaceIdentifierHash);
        if (!clients) {
            clients = new Map();
            this.sockClientsBySpaceIdentifierHash.set(spaceIdentifierHash, clients);
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
