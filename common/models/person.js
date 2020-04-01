'use strict';
const lbApp = require('../../server/server');
module.exports = function(Person) {
    Person.prototype.updatePerson = async function(body) {
        var body;
        try {
            var error = [];
            var PersonInstance = this;
            var location = PersonInstance.location;
            if (!body.location) {
                throw Error('Wrong request body discription');
            }
            body.location.forEach((loc, i) => {
                if (!loc.altitude) {
                    error.push('Missing attribute altitude at index ' + i);
                }
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
                loc['syncToLedger'] = true;
                location.push(loc);
            });
            if (error.length > 0) {
                error.join();
                throw error;
            }
            //personal note : still have to figure -->loc['syncToLedger'] = true;
            //creating ledgers
            console.log('check if works===>', PersonInstance.id);
            await Promise.all(
                body.location.map(loc => _createLedger(loc, PersonInstance.id))
            );

            const newPerson = await PersonInstance.updateAttributes({
                location: location
            });

            return 'Location Updated';
        } catch (error) {
            throw new Error(error);
        }
    };
};
async function _createLedger(loc, id) {
    try {
        return await lbApp.models['Ledger'].create({
            altitude: loc.altitude,
            startTime: loc.startTime,
            endTime: loc.endTime,
            lat: loc.lat,
            lng: loc.lng,
            personId: id
        });
    } catch (e) {
        console.log(e);
    }
}