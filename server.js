'use strict';

const express = require('express');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const { routing, websocketServerRouting } = require('./components/ApplicationRoutings.js');
const { systemLogger, handleErrorQuietly } = require('./components/Logger.js');

/* Server Port */
const PORT = 3333;

/* express */
const app = express();
app.use(bodyParser.json());
app.use(helmet());
const httpServer = app.listen(PORT, () => {
    systemLogger.info(`Start listening on ${PORT}`);
});
app.set('trust proxy', 'loopback');

routing.forEach((compoment, path) => {

    app.post(path, (req, res) => {

        compoment.doHandle(req, res);

    });
});

/* websocket */
// https://www.npmjs.com/package/ws#multiple-servers-sharing-a-single-https-server
httpServer.on('upgrade', (request, socket, head) => {

    try {
        const url = new URL(
            request.url,
            'http://example.com' // path以降を取り出したいだけなので、baseは適当でよい
        );
        const pathname = url.pathname;
        systemLogger.info(`Upgrade ${pathname}`);

        const serverWrapper = websocketServerRouting.get(pathname);
        if (!serverWrapper) {
            systemLogger.error(`Undefined pathname : ${pathname}`);
            socket.destoy();
            return;
        }

        serverWrapper.onDoUpgrade(request, socket, head, url);

    } catch(e) {
        handleErrorQuietly(e, () => socket.destroy());
    }

});

module.exports = {
    app,
    express
};
