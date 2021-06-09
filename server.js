'use strict';

require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const jwt = require('express-jwt');
const jwtAuthz = require('express-jwt-authz');
const jwksRsa = require('jwks-rsa');
const { v4: uuidv4 } = require('uuid');

const { postRouting, websocketServerRouting } = require('./components/ApplicationRoutings.js');
const { systemLogger } = require('./components/Logger.js');
const { hash } = require('./tools/keygen.js');
const { spaceIdentifierManager } = require('./components/ApplicationComponents.js');

/* Server Port */
const PORT = process.env.PORT;

/* NODE_ENV */
systemLogger.info(`NODE_ENV is ${process.env.NODE_ENV}`);

/* express */
const app = express();
app.use(express.json());
app.use(helmet());
app.use(
    helmet.contentSecurityPolicy({
        directives: {
            ...helmet.contentSecurityPolicy.getDefaultDirectives(),
            'connect-src': [`'self' blob: https://${process.env.AUTH0_DOMAIN}/`],
            'frame-src': [ `https://${process.env.AUTH0_DOMAIN}/` ]
        },
    })
);

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
        domain: process.env.AUTH0_DOMAIN,
        clientId: process.env.AUTH0_CLIENT_ID,
        audience: process.env.AUTH0_AUDIENCE
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

const checkJwt = jwt({
    secret: jwksRsa.expressJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestPerMinute: 5,
        jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`
    }),

    audience: process.env.AUTH0_AUDIENCE,
    issuer: `https://${process.env.AUTH0_DOMAIN}/`,
    algorithms: ['RS256']
});

const checkScopes = jwtAuthz([ 'create:spaceIdentifier' ], {
    customScopeKey: 'permissions'
});

app.get('/api/generateSpaceIdentifier', checkJwt, checkScopes, (req, res) => {
    const spaceIdentifier = uuidv4();

    const exp = new Date();
    const length = parseInt(process.env.SPACE_IDENTIFIER_LIFE_SPAN_HOURS || '3');
    exp.setHours(exp.getHours() + length);

    hash(spaceIdentifier).then(spaceIdentifierHash => {
        spaceIdentifierManager.availableSpaceIdentifierHashes.set(spaceIdentifierHash, {
            expiration: exp
        });
        res.json({ spaceIdentifier });
    });
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

module.exports = {
    app,
    express
};
