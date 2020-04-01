'use strict';

module.exports = function(Person) {
    Person.prototype.updatePerson = async function(body) {
        var body;
        try {
            var PersonInstance = this;
            var location = PersonInstance.location;
            body.location.forEach(loc => {
                loc['syncToLedger'] = false;
                location.push(loc);
            });
            const newPerson = await PersonInstance.updateAttributes({
                location: location
            });
            return newPerson;
        } catch (error) {
            console.log(error);
        }

        return body;
    };
};