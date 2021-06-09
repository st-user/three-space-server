'use strict';

const { 
    NODE_ENV,
    PORT,
    AUTH0_DOMAIN,
    AUTH0_CLIENT_ID,
    AUTH0_AUDIENCE
} = require('./components/Environment.js');

const express = require('express');
const helmet = require('helmet');

const { join } = require('path');

const { appRouter, websocketServerRouting } = require('./components/ApplicationRoutings.js');
const { systemLogger } = require('./components/Logger.js');

const { before } = require('./routers/Global.js');
const spaceIdentifierGeneratorRouter = require('./routers/api/SpaceIdentifierGeneratorRouter.js');

/* NODE_ENV */
systemLogger.info(`NODE_ENV is ${NODE_ENV}`);

/* express */
const app = express();
app.use(express.json());
app.use(helmet());
app.use(
    helmet.contentSecurityPolicy({
        directives: {
            ...helmet.contentSecurityPolicy.getDefaultDirectives(),
            'connect-src': [`'self' blob: https://${AUTH0_DOMAIN}/`],
            'frame-src': [ `https://${AUTH0_DOMAIN}/` ]
        },
    })
);
app.use('/', express.static(join(__dirname, 'dist')));


const httpServer = app.listen(PORT, () => {
    systemLogger.info(`Start listening on ${PORT}`);
});
app.set('trust proxy', 'loopback');


app.get('/auth_config', (req, res) => {
    res.send({
        domain: AUTH0_DOMAIN,
        clientId: AUTH0_CLIENT_ID,
        audience: AUTH0_AUDIENCE
    });
});

app.use(before);
app.use(appRouter);
app.use('/api', spaceIdentifierGeneratorRouter);


/* websocket */
// https://www.npmjs.com/package/ws#multiple-servers-sharing-a-single-https-server
httpServer.on('upgrade', (request, socket, head) => {

    try {
        const url = new URL(
            request.url,
            'http://example.com'
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

module.exports = { app };