module.exports = class SpaceIdentifierManager {

    availableSpaceIdentifiers;

    constructor() {
        this.availableSpaceIdentifiers = new Map();

        /* For Test */
        const exp = new Date();
        exp.setMonth(exp.setMonth() + 1);
        this.availableSpaceIdentifiers.set('1234567890', {
            expiration: exp
        });

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
