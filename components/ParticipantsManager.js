module.exports = class ParticipantsManager {

    whitespaceRegExp = /^\s+$/;
    charRegExp = /[<>&"'\\]/;

    idGenerator;
    participantsBySpace;
    spaceIdentifierByClientId;

    constructor(idGenerator) {
        this.idGenerator = idGenerator;
        this.participantsBySpace = new Map();
        this.spaceIdentifierByClientId = new Map();
    }

    generateClient(spaceIdentifier, name) {
        // この段階で不正な値の場合、正常な画面操作で生成されたリクエストではない
        if (!name || this.whitespaceRegExp.test(name)
                || this.charRegExp.test(name)) {
            return undefined;
        }
        const clientId = this.idGenerator.generate();
        const participantByClientId = this._compute(spaceIdentifier);
        participantByClientId.set(clientId, {
            clientId: clientId,
            name: name
        });
        this.spaceIdentifierByClientId.set(clientId, spaceIdentifier);
        return clientId;
    }

    deleteClients(spaceIdentifier, clientIdsToRemove) {
        const participantByClientId = this.participantsBySpace.get(spaceIdentifier);
        if (!participantByClientId) {
            return;
        }
        clientIdsToRemove.forEach(clientId => {
            participantByClientId.delete(clientId);
            this.spaceIdentifierByClientId.delete(clientId);
        });

    }

    deleteBySpaceIdentifiers(spaceIdentifiers) {
        if (!spaceIdentifiers) {
            return;
        }
        const clientIdsToRemove = [];
        this.spaceIdentifierByClientId.forEach((clientId, idn) => {
            if (spaceIdentifiers.includes(idn)) {
                clientIdsToRemove.push(clientId);
            }
        });
        clientIdsToRemove.forEach(clientId => {
            this.spaceIdentifierByClientId.delete(clientId);
        });
        spaceIdentifiers.forEach(idn => {
            this.participantsBySpace.delete(idn);
        });
    }

    getSpaceIdentifier(clientId) {
        return this.spaceIdentifierByClientId.get(clientId);
    }

    getTheOthers(spaceIdentifier, myClientId) {
        return this.getClients(
            spaceIdentifier, client => client.clientId !== myClientId
        );
    }

    getClients(spaceIdentifier, filter) {
        const participantByClientId = this.participantsBySpace.get(
            spaceIdentifier
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

    forEachClientIdsBySpace(handler) {
        this.participantsBySpace.forEach((ps, spaceIdentifier) => {
            handler(spaceIdentifier, Array.from(ps.keys()));
        });
    }

    _compute(spaceIdentifier) {
        let participants = this.participantsBySpace.get(
            spaceIdentifier
        );
        if (!participants) {
            participants = new Map();
            this.participantsBySpace.set(spaceIdentifier, participants);

        }
        return participants;
    }
};
