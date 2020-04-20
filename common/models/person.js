'use strict';
const lbApp = require('../../server/server');
const moment = require('moment');
module.exports = function(Person) {
    Person.validatesUniquenessOf('phone');
    Person.prototype.postPersonSymptoms = async function(body) {
        try {
            console.log('idh agya atleast');
            var personInstance = this;
            var temp = personInstance;
            var symptoms = [];
            if (!body.symptoms) {
                throw Error('Wrong request body discription');
            }
            body.symptoms.forEach((symptom, i) => {
                if (!symptom.id) {
                    throw Error('Missing attribute id at index ' + i);
                }
                if (!symptom.date) {
                    throw Error('Missing attribute date at index ' + i);
                }
                var allKeys = Object.keys(temp.__data);

                if (allKeys.includes('symptoms')) {
                    console.log('we are here');
                    console.log(temp);
                    temp.symptoms.push({ id: symptom.id, date: symptom.date });
                } else {
                    temp['symptoms'] = [{ id: symptom.id, date: symptom.date }];
                }
            });

            const newPerson = await personInstance.updateAttributes({
                symptoms: temp.symptoms,
            });

            return 'Symptoms Updated';
        } catch (error) {
            throw new Error(error);
        }
    };
    Person.prototype.getPersonSymptoms = async function() {
        var personInstance = this;
        if (!personInstance.symptoms) {
            return [];
        }
        if (personInstance.symptoms.length === 0) {
            return [];
        }

        var personSymptoms = await Promise.all(
            personInstance.symptoms.map((x) => _getSymptomDetails(x))
        );
        var sortedSymptoms = {};

        personSymptoms.forEach((symptom) => {
            //sortedSymptoms.filter(x=>)
            if (!(symptom.postedOn in sortedSymptoms)) {
                sortedSymptoms[symptom.postedOn] = personSymptoms.filter(
                    (x) => x.postedOn === symptom.postedOn
                );
            }
        });

        return sortedSymptoms;
    };
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
                if (!loc.syncToLedger) {
                    error.push('Missing attribute syncToLedger at index ' + i);
                }
                if (!loc.date) {
                    error.push('Missing attribute date at index ' + i);
                }
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
                body.location.map((loc) => _createLedger(loc, PersonInstance.id))
            );

            // const newPerson = await PersonInstance.updateAttributes({
            //     location: location,
            // });

            return 'Location Updated';
        } catch (error) {
            throw new Error(error);
        }
    };
    Person.prototype.getInteractions = async function() {
        var userInteractions = [];
        var personInstance = this;
        const allInteractions = await lbApp.models['Interaction'].find();

        allInteractions.forEach((interaction) => {
            if (
                interaction.identityA.personId.toString() ===
                personInstance.id.toString()
            ) {
                userInteractions.push({
                    interactedWith: interaction.identityB,
                    dist: interaction.dist,
                });
            } else if (
                interaction.identityB.personId.toString() ===
                personInstance.id.toString()
            ) {
                userInteractions.push({
                    interactedWith: interaction.identityA,
                    dist: interaction.dist,
                });
            }
        });
        return userInteractions;
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
            personId: id,
        });
    } catch (e) {
        console.log(e);
    }
}
async function _getSymptomDetails(symptom) {
    const symptomDetails = await lbApp.models['Symptoms'].findById(symptom.id);
    var temp1 = { postedOn: moment(symptom.date).startOf('day').toISOString() };
    var temp2 = {...symptomDetails };
    var temp3 = {...temp2.__data, ...temp1 };
    return temp3;
}