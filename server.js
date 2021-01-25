'use strict';

require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const { postRouting, websocketServerRouting } = require('./components/ApplicationRoutings.js');
const { systemLogger } = require('./components/Logger.js');

/* Server Port */
const PORT = process.env.PORT;

/* NODE_ENV */
systemLogger.info(`NODE_ENV is ${process.env.NODE_ENV}`);

/* express */
const app = express();
app.use(bodyParser.json());
app.use(helmet());
app.use(
    helmet.contentSecurityPolicy({
        directives: {
            ...helmet.contentSecurityPolicy.getDefaultDirectives(),
            'connect-src': ['\'self\' blob:'],
        },
    })
);

const httpServer = app.listen(PORT, () => {
    systemLogger.info(`Start listening on ${PORT}`);
});
app.set('trust proxy', 'loopback');

postRouting.forEach((compoment, path) => {

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
        systemLogger.error('Uncaught exception on upgrade', e);
        socket.destroy();
        throw e;
    }

});

module.exports = {
    app,
    express
};
