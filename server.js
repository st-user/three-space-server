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
const jwt = require('express-jwt');
const jwtAuthz = require('express-jwt-authz');
const jwksRsa = require('jwks-rsa');
const { v4: uuidv4 } = require('uuid');
const { join } = require('path');

const { postRouting, websocketServerRouting } = require('./components/ApplicationRoutings.js');
const { systemLogger } = require('./components/Logger.js');
const { hash } = require('./tools/keygen.js');
const { spaceIdentifierManager } = require('./components/ApplicationComponents.js');

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

postRouting.forEach((compoment, path) => {

    app.post(path, async (req, res) => {

        await compoment.doHandle(req, res);

    });
});

/* for endpoint that should be authenticated by auth0 */

app.get('/auth_config', (req, res) => {
    res.send({
        domain: AUTH0_DOMAIN,
        clientId: AUTH0_CLIENT_ID,
        audience: AUTH0_AUDIENCE
    });
});

const checkJwt = jwt({
    secret: jwksRsa.expressJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestPerMinute: 5,
        jwksUri: `https://${AUTH0_DOMAIN}/.well-known/jwks.json`
    }),

    audience: AUTH0_AUDIENCE,
    issuer: `https://${AUTH0_DOMAIN}/`,
    algorithms: ['RS256']
});

const checkScopes = jwtAuthz([ 'create:spaceIdentifier' ], {
    customScopeKey: 'permissions'
});

app.get('/api/generateSpaceIdentifier', checkJwt, checkScopes, (req, res) => {
    const spaceIdentifier = uuidv4();

    hash(spaceIdentifier).then(spaceIdentifierHash => {
        spaceIdentifierManager.setNew(spaceIdentifierHash);
        res.json({ spaceIdentifier });
    });
});

app.use((err, req, res, next) => {

    if (err.name === 'UnauthorizedError') {
        return res.status(401).send({
            msg: 'Invalid token'
        });
    }

    next(err, req, res);
});

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