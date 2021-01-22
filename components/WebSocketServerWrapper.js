const WebSocket = require('ws');
const { systemLogger, handleErrorQuietly } = require('./Logger.js');


module.exports = class WebSocketServerWrapper {

    websocketServer;

    constructor() {
        this.websocketServer = new WebSocket.Server({ noServer: true });
    }

    onDoUpgrade(request, socket, head, url) { /* super classのシグニチャーに合わせる*/ // eslint-disable-line no-unused-vars
        const clientId = url.searchParams.get('clientId');
        const token = url.searchParams.get('t');

        const requestContext = {};
        requestContext.params = {
            clientId: clientId,
            token: token
        };

        const error = this.onUpgrade(request, socket, head, requestContext);
        if (error) {
            systemLogger.error(error.log);
            socket.destroy();
            return;
        }

        this.websocketServer.handleUpgrade(request, socket, head, ws => {
            this.websocketServer.emit('connection', ws, request);
        });
    }

    init() {
        this.websocketServer.on('connection', ws => {

            try {
                ws.on('message', message => {

                    try {
                        const messageObj = JSON.parse(message);

                        if (!messageObj.webRtcSignaling) {
                            this.onMessage(
                                this.websocketServer, ws, messageObj
                            );
                        } else {
                            this.onSignalingMessage(
                                this.websocketServer, ws, messageObj
                            );
                        }

                    } catch(e) {
                        handleErrorQuietly(e, () => ws.terminate());
                    }
                });
                this.onConnection(this.websocketServer, ws);

            } catch(e) {
                handleErrorQuietly(e, () => ws.terminate());
            }
        });
    }

    /* subclassで実装 */
    onUpgrade(request, socket, head, requestContext) {} // eslint-disable-line no-unused-vars
    onConnection(server, ws) {} // eslint-disable-line no-unused-vars
    onMessage(server, ws, message) {} // eslint-disable-line no-unused-vars
};
