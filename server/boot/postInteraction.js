'use strict';
const cron = require('node-cron');
module.exports = function(app) {
    // cron.schedule('*/1 * * * *', function() {
    //     _postingInteractions(app);
    // });
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
        return new Promise(function(resolve, reject) {
            const url =
                'mongodb+srv://covid-tracker-db-user:Newyork2020!@cluster0-su83o.mongodb.net/test?retryWrites=true&w=majority';
            MongoClient.connect(url, function(err, client) {
                const db = client.db('test');
                if (lastJob.length === 0) {
                    var cursor = db.collection('Ledger').find({});
                } else {
                    var cursor = db
                        .collection('Ledger')
                        .find({ endTime: { gte: lastJob[0].createdAt } });
                }

                function iterateFunc(doc) {
                    mongoitems.push(doc);
                }

                function errorFunc(error) {
                    if (error === null) {
                        console.log('here');
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
                    resolve(interactionsGraph);
                }
            });
        });
    };

    //this function checks if lat is same
    const findInteraction = (element, mongoItems) => {
        return new Promise(function(resolve, reject) {
            //console.log(element)
            mongoItems.forEach(function(element2, index2, array2) {
                if (element2.lat === element.lat) {
                    //this needs to change to matching lat and long by rounding it. Waiting for DB to contain data 5 decimal places value.
                    interactionsGraph.push(element);
                    //console.log(interactionsGraph.length)
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
                if (dist > 0 && dist < 6.0) {
                    //console.log(element.personId)
                    //console.log(interactionsGraph[index + 1].personId)
                    if (element.personId === interactionsGraph[index + 1].personId) {
                        console.log('skip for same person');
                    } else {
                        var interimInteractionObject = {
                            identityA: element,
                            identityB: interactionsGraph[index + 1],
                            dist: dist,
                        };
                        // console.log(interimInteractionObject);
                        interactionsPoints.push(interimInteractionObject);
                    }
                }
                // console.log(array.length);
                // console.log(index + 2);
                if (array.length === index + 2) {
                    console.log('here');
                    resolve(interactionsPoints);
                }
            });
        });
    };

    const evaluateInteractionPoints = (interactionsPoints) => {
        return new Promise(function(resolve, reject) {
            interactionsPoints.forEach(function(element, index, array) {
                if (element.identityA.altitude === element.identityB.altitude) {
                    if (element.identityA.startTime < element.identityB.startTime) {
                        if (element.identityA.endTime > element.identityB.endTime) {
                            // console.log('element');
                            interactions.push(element);
                        }
                    }

                    // console.log(element.identityA.startTime - element.identityB.startTime)
                    // let fragment = element.identityA.startTime
                    // console.log(fragment)
                    //add code to push these items to interactions
                    //Interactions format: IdentityA, identityB
                }
                if (array.length === index + 1) {
                    //console.log('resolving');
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
    getLedgerData(lastJob)
        .then((mongoItems) => getInteractionGraph(mongoItems))
        .then((interactionsGraph) =>
            evaluateInteractionGraphDistance(interactionsGraph)
        )
        .then((interactionsPoints) => evaluateInteractionPoints(interactionsPoints))
        .then((interactions) => addtoInteractionsTable(interactions));
}