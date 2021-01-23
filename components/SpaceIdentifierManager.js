module.exports = class SpaceIdentifierManager {

    availableSpaceIdentifiers;

    constructor() {
        this.availableSpaceIdentifiers = new Map();
    }

    canAccept(spaceIdentifier) {
        return this.availableSpaceIdentifiers.has(spaceIdentifier);
    }

    checkExpiration(now) {
        const expired = [];
        this.availableSpaceIdentifiers.forEach((data, spaceIdentifier) => {
            if (!data.expiration || data.expiration < now) {
                expired.push(spaceIdentifier);
            }
        });
        expired.forEach(idn => this.availableSpaceIdentifiers.delete(idn));
        return expired;
    }
};
