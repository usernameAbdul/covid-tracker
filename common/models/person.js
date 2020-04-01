'use strict';

module.exports = function(Person) {
    Person.prototype.updatePerson = async function(body) {
        var body;
        try {
            var error = [];
            var PersonInstance = this;
            var location = PersonInstance.location;
            body.location.forEach((loc, i) => {
                if (!loc.lat) {
                    error.push('Missing attribute lat at index ' + i);
                }
                if (!loc.lng) {
                    error.push('Missing attribute lng at index ' + i);
                }
                if (!loc.startTime) {
                    error.push('Missing attribute startTime at index ' + i);
                }
                if (!loc.endTime) {
                    error.push('Missing attribute endTime at index ' + i);
                }
                loc['syncToLedger'] = false;
                location.push(loc);
            });
            if (error.length > 0) {
                error.join();
                throw error;
            }

            const newPerson = await PersonInstance.updateAttributes({
                location: location
            });
            return newPerson;
        } catch (error) {
            throw new Error(error);
        }
    };
};