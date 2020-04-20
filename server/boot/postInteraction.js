'use strict';
const cron = require('node-cron');
const moment = require('moment');
module.exports = function(app) {
    cron.schedule('*/2 * * * *', function() {
        _postingInteractions(app);
    });
};

async function _postingInteractions(app) {
    //dependecies
    const MongoClient = require('mongodb').MongoClient;
    const assert = require('assert');
    const Promise = require('promise');
    var geodist = require('geodist');

    //variables
    let interactionsGraph = [];
    let interactionsPoints = [];
    let interactions = [];

    //if we get a scale of more than 10,000 users, we need to then scale this algorithm to go locaiton query, but for now, we can get all records
    //based on some testing, on my mac, 5000 ledger transactions take approx 30 seconds to get interactions. Probably is faster on EC2

    //This function needs to run every 5 mins. Need to cap transactions at 5000 max.
    const getLedgerData = (lastJob) => {
        let mongoitems = [];
        return new Promise(async function(resolve, reject) {
            const url =
                'mongodb+srv://covid-tracker-db-user:Newyork2020!@cluster0-su83o.mongodb.net/test?retryWrites=true&w=majority';
            MongoClient.connect(url, async function(err, client) {
                const db = client.db('test');
                var cursor;
                if (lastJob.length === 0) {
                    cursor = db.collection('Ledger').find({});
                } else {
                    cursor = db
                        .collection('Ledger')
                        .find({ endTime: { $gte: lastJob[0].createdAt } });
                    // cursor = db
                    //     .collection('Ledger')
                    //     .find({})
                    //     .sort({
                    //         endTime: -1.0,
                    //     })
                    //     .limit(600);
                }

                function iterateFunc(doc) {
                    mongoitems.push(doc);
                }

                function errorFunc(error) {
                    if (error === null) {
                        resolve(mongoitems);
                        client.close();
                    }
                }
                cursor.forEach(iterateFunc, errorFunc);
                // assert.equal(null, err);
            });
        });
    };

    //this function created a interaction graph
    const getInteractionGraph = (mongoItems) => {
        return new Promise(function(resolve, reject) {
            mongoItems.forEach(function(element, index, array) {
                findInteraction(element, mongoItems);
                if (array.length === index + 1) {
                    //console.log(interactionsGraph.length);
                    resolve(interactionsGraph);
                }
            });
        });
    };

    //this function checks if lat is same
    const findInteraction = (element, mongoItems) => {
        return new Promise(function(resolve, reject) {
            mongoItems.forEach(function(element2, index2, array2) {
                let roundElement2 = Math.round(element2.lat);
                let roundElement = Math.round(element.lat);
                if (roundElement === roundElement2) {
                    // //console.log('lats are the same');
                    //this needs to change to matching lat and long by rounding it. Waiting for DB to contain data 5 decimal places value.
                    interactionsGraph.push(element);
                } else {
                    return;
                }
            });
        });
    };

    //this function creates a graph of possible interactions and measures distance
    const evaluateInteractionGraphDistance = (interactionsGraph) => {
        return new Promise(function(resolve, reject) {
            interactionsGraph.forEach(function(element, index, array) {
                var dist = geodist({ lat: element.lat, lon: element.lng }, {
                    lat: interactionsGraph[index + 1].lat,
                    lon: interactionsGraph[index + 1].lng,
                }, { exact: true, unit: 'meter' });
                if (dist < 4) {
                    ////console.log('close proximity achieved');
                    ////console.log(element.personId)
                    ////console.log(interactionsGraph[index + 1].personId)
                    if (element.personId === interactionsGraph[index + 1].personId) {
                        //console.log('skip for same person');
                    } else {
                        var interimInteractionObject = {
                            identityA: element,
                            identityB: interactionsGraph[index + 1],
                            dist: dist,
                        };
                        ////console.log(interimInteractionObject);
                        ////console.log(interimInteractionObject);
                        interactionsPoints.push(interimInteractionObject);
                    }
                }
                // //console.log(array.length);
                // //console.log(index + 2);
                if (array.length === index + 2) {
                    //console.log(interactionsPoints.length, 'interactionsPoints');

                    resolve(interactionsPoints);
                }
            });
        });
    };

    const evaluateInteractionPoints = (interactionsPoints) => {
        //console.log(interactionsPoints);
        return new Promise(function(resolve, reject) {
            interactionsPoints.forEach(async function(element, index, array) {
                let roundAltitude1 = Math.round(element.identityA.altitude);
                let roundAltitude2 = Math.round(element.identityB.altitude);
                if (roundAltitude1 === roundAltitude2) {
                    //console.log('---------------------------------------');
                    //console.log('altitude is same');
                    //console.log('Matching startTime');
                    if (element.identityA.startTime <= element.identityB.startTime) {
                        //console.log('startTime matched');
                        //console.log(
                        //     element.identityA.startTime + '<' + element.identityB.startTime
                        // );

                        //console.log('Matching endTime');
                        //console.log(
                        //     element.identityA.endTime + '>' + element.identityB.endTime
                        // );
                        if (element.identityA.endTime >= element.identityB.endTime) {
                            //console.log(' endTime matched');

                            if (
                                element.identityA.personId.toString() !==
                                element.identityB.personId.toString()
                            ) {
                                //console.log(element.identityA.personId.toString());
                                //console.log('===');
                                //console.log(element.identityB.personId.toString());
                                // let today = new Date();
                                // const todaysInteractions = await app.models.Interaction.find({
                                //     where: {
                                //         createdAt: {
                                //             gte: moment(today).startOf('day').toISOString(),
                                //         },
                                //     },
                                // });
                                // if (todaysInteractions.length) {
                                //     todaysInteractions.forEach((interaction) => {
                                //         if (
                                //             interaction.identityA === element.identityA &&
                                //             interaction.identityB !== element.identityB
                                //         ) {
                                //             //push interaction
                                //             interactions.push(element);
                                //         } else if (
                                //             interaction.identityA !== element.identityA &&
                                //             interaction.identityB === element.identityB
                                //         ) {
                                //             //push interaction
                                //             interactions.push(element);
                                //         } else if (
                                //             interaction.identityA === element.identityB &&
                                //             interaction.identityB !== element.identityA
                                //         ) {
                                //             //push interaction
                                //             interactions.push(element);
                                //         } else if (
                                //             interaction.identityB === element.identityA &&
                                //             interaction.identityA !== element.identityB
                                //         ) {
                                //             //push interaction
                                //             interactions.push(element);
                                //         }
                                //     });
                                // } else {
                                //     interactions.push(element);
                                // }
                                interactions.push(element);
                            }
                        }
                    }

                    // //console.log(element.identityA.startTime - element.identityB.startTime)
                    // let fragment = element.identityA.startTime
                    // //console.log(fragment)
                    //add code to push these items to interactions
                    //Interactions format: IdentityA, identityB
                }
                if (array.length === index + 1) {
                    console.log(
                        'after evaluating interaction points we hav a total of ',
                        interactions.length
                    );
                    resolve(interactions);
                }
            });
        });
    };
    const postInteraction = async(obj) => {
        return app.models.Interaction.create(obj);
    };
    const postCronJobLog = async(obj) => {
        return app.models.CronJobLog.create(obj);
    };

    const addtoInteractionsTable = (interactions) => {
        return new Promise(async function(resolve, reject) {
            console.log('a total of ' + interactions.length + ' interactions');
            const postedData = await Promise.all(interactions.map(postInteraction));

            const cronJobLog = await app.models.CronJobLog.create({
                numberOfInteractions: interactions.length,
            });
            console.log(cronJobLog);
        });
    };
    const lastJob = await app.models.CronJobLog.find({
        order: 'createdAt DESC',
        limit: 1,
    });

    const removeExistingInteractions = (interactions) => {
        //console.log(typeof interactions);
        return new Promise(async function(resolve, reject) {
            //console.log('inside removeExisting Interactions');
            //console.log(interactions.length);
            let today = new Date();
            const todaysInteractions = await app.models.Interaction.find({
                where: {
                    createdAt: {
                        gte: moment(today).startOf('day').toISOString(),
                    },
                },
            });
            console.log('todays Interactions ', todaysInteractions.length);
            if (todaysInteractions.length === 0) {
                resolve(interactions);
            } else {
                let finalInteractions = [];
                let skips = 0;
                //console.log('here');
                todaysInteractions.forEach(function(element, index, array) {
                    //console.log('pizza');
                    //console.log(interactions);
                    interactions.forEach(function(element1, index1, array1) {
                        //console.log('here2');
                        if (
                            element1.identityA.personId.toString() ===
                            element.identityA.personId.toString() &&
                            element1.identityB.personId.toString() ===
                            element.identityB.personId.toString()
                        ) {
                            skips++;
                        } else if (
                            element1.identityA.personId.toString() ===
                            element.identityB.personId.toString() &&
                            element1.identityB.personId.toString() ===
                            element.identityA.personId.toString()
                        ) {
                            skips++;
                        } else {
                            // if (index1 + 1 === array1.length) {
                            //     if (index + 1 === array.length) {
                            //resolve(interactions);
                            let exists = finalInteractions.filter(
                                (x) =>
                                x.personId.toString() ===
                                element1.identityA.personId.toString()
                            );
                            if (exists.length === 0) {
                                console.log('item pushed in final array');
                                finalInteractions.push(element1);
                            }

                            //     }
                            // }
                        }
                    });
                });
                console.log('total skips', skips);
                console.log('final interactions', finalInteractions.length);
                resolve(finalInteractions);
            }
        });
    };

    getLedgerData(lastJob)
        .then((mongoItems) => getInteractionGraph(mongoItems))
        .then((interactionsGraph) =>
            evaluateInteractionGraphDistance(interactionsGraph)
        )
        .then((interactionsPoints) => evaluateInteractionPoints(interactionsPoints))
        .then((interactions) => removeExistingInteractions(interactions))
        .then((interactions) => addtoInteractionsTable(interactions));
}