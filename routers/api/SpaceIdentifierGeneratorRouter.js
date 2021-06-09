'use strict';

const { 
    AUTH0_DOMAIN,
    AUTH0_AUDIENCE
} = require('../../components/Environment.js');

const { spaceIdentifierManager } = require('../../components/ApplicationComponents.js');
const { systemLogger } = require('../../components/Logger.js');

const express = require('express');
const router = express.Router();

const { hash } = require('../../tools/keygen.js');
const jwt = require('express-jwt');
const jwtAuthz = require('express-jwt-authz');
const jwksRsa = require('jwks-rsa');
const { v4: uuidv4 } = require('uuid');

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

router.use(checkJwt);

router.get('/generateSpaceIdentifier', checkScopes, (req, res) => {
    const spaceIdentifier = uuidv4();
    
    systemLogger.info('Access token is valid to create a space identifier.');
    hash(spaceIdentifier).then(spaceIdentifierHash => {
        spaceIdentifierManager.setNew(spaceIdentifierHash);
        res.json({ spaceIdentifier });
    });
});

router.use((err, req, res, next) => {

    if (err.name === 'UnauthorizedError') {
        return res.status(401).send({
            msg: 'Invalid token'
        });
    }

    next(err, req, res);
});

module.exports = router;