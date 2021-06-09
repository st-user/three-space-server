'use strict';

module.exports = class ParticipantsManager {

    whitespaceRegExp = /^\s+$/;
    charRegExp = /[<>&"'\\]/;

    idGenerator;
    participantsBySpace;
    spaceIdentifierHashByClientId;

    constructor(idGenerator) {
        this.idGenerator = idGenerator;
        this.participantsBySpace = new Map();
        this.spaceIdentifierHashByClientId = new Map();
    }

    generateClient(spaceIdentifierHash, name) {
        // この段階で不正な値の場合、正常な画面操作で生成されたリクエストではない
        if (!name || this.whitespaceRegExp.test(name)
                || this.charRegExp.test(name)
                || 10 < name.length) {
            return undefined;
        }
        const clientId = this.idGenerator.generate();
        const participantByClientId = this._compute(spaceIdentifierHash);


        const exp = new Date();
        exp.setHours(exp.getHours() + 3);
        participantByClientId.set(clientId, {
            clientId: clientId,
            name: name,
            exp
        });
        this.spaceIdentifierHashByClientId.set(clientId, spaceIdentifierHash);
        return clientId;
    }

    deleteClients(spaceIdentifierHash, clientIdsToRemove) {
        const participantByClientId = this.participantsBySpace.get(spaceIdentifierHash);
        if (!participantByClientId) {
            return;
        }
        clientIdsToRemove.forEach(clientId => {
            participantByClientId.delete(clientId);
            this.spaceIdentifierHashByClientId.delete(clientId);
        });

    }

    deleteBySpaceIdentifierHashes(spaceIdentifierHashes) {
        if (!spaceIdentifierHashes) {
            return;
        }
        const clientIdsToRemove = [];
        this.spaceIdentifierHashByClientId.forEach((clientId, hash) => {
            if (spaceIdentifierHashes.includes(hash)) {
                clientIdsToRemove.push(clientId);
            }
        });
        clientIdsToRemove.forEach(clientId => {
            this.spaceIdentifierHashByClientId.delete(clientId);
        });
        spaceIdentifierHashes.forEach(hash => {
            this.participantsBySpace.delete(hash);
        });
    }

    getSpaceIdentifierHash(clientId) {
        return this.spaceIdentifierHashByClientId.get(clientId);
    }

    getTheOthers(spaceIdentifierHash, myClientId) {
        return this.getClients(
            spaceIdentifierHash, client => client.clientId !== myClientId
        );
    }

    getClients(spaceIdentifierHash, filter) {
        const participantByClientId = this.participantsBySpace.get(
            spaceIdentifierHash
        );
        if (!participantByClientId) {
            return [];
        }
        const ret = [];
        participantByClientId.forEach(client => {
            if (!filter || filter(client)) {
                ret.push(client);
            }
        });
        return ret;
    }

    getClient(spaceIdentifierHash, clientId) {
        const participantByClientId = this.participantsBySpace.get(
            spaceIdentifierHash
        );
        if (!participantByClientId) {
            return;
        }
        return participantByClientId.get(clientId);
    }

    isTheClientAvailable(clientId) {
        return this.spaceIdentifierHashByClientId.has(clientId);
    }

    forEachClientIdsBySpace(handler) {
        this.participantsBySpace.forEach((ps, spaceIdentifierHash) => {
            handler(spaceIdentifierHash, Array.from(ps.keys()));
        });
    }

    _compute(spaceIdentifierHash) {
        let participants = this.participantsBySpace.get(
            spaceIdentifierHash
        );
        if (!participants) {
            participants = new Map();
            this.participantsBySpace.set(spaceIdentifierHash, participants);

        }
        return participants;
    }
};
