'use strict';

const WebSocket = require('ws');
const WebSocketServerWrapper = require('./WebSocketServerWrapper.js');
const { clientTokenManager, participantsManager, spaceIdentifierManager } = require('./ApplicationComponents.js');
const { systemLogger } = require('./Logger.js');

const CLIENT_HEALTH_CHECK_INTERVAL_MILLIS = 3000;
const CONNECTION_PING_PONG_INTERVAL_MILLIS = 10000;

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
            participantsManager.forEachClientIdsBySpace(spaceIdentifierHash => {

                const sockClients = this.sockClientsBySpaceIdentifierHash.get(spaceIdentifierHash);
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
                refleshedSpaceCount++;
            });

            if (0 < refleshedSpaceCount) {
                systemLogger.info(`Refleshes clients. refleshed count: ${refleshedSpaceCount}`);
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
