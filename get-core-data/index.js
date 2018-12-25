/**
 * Responds to any HTTP request that can provide a "message" field in the body.
 *
 * @param {!Object} req Cloud Function request context.
 * @param {!Object} res Cloud Function response context.
 */

const Datastore = require('@google-cloud/datastore');

const projectId = 'prototype-backend';
const datastore = new Datastore({
    projectId: projectId,
});
let response;
let key;

// Required to support calls from an origin other than the function host
const cors = require('cors')({ origin: true });

exports.getCoreData = (req, res) => {
    cors(req, res, (err) => {
        if (!err) {
            response = res;
            key = datastore.key(['coreData', req.query.orgscopedid]);
            checkIfRegistered();
        } else {
            res.status(500).send('Internal Server Error ' + err);
        }
    });
};

const checkIfRegistered = () => {
    datastore.get(key, (err, entity) => {
        if (!err) {
            if (entity) {
                // Core exists, send data
                console.log("Core data found: ", entity);
                response.status(200).send(entity);
            } else {
                createCore();
            }
        } else {
            response.status(500).send("Error checking Core data: " + err);
        }
    });
};

const createCore = () => {
    const newCoreEntity = {
        key: key,
        data: {
            availablePoints: 1,
            placements: [{ x: 0, y: 0, z: 0 }]
        }
    };
    datastore.save(newCoreEntity, (err) => {
        if (!err) {
            // Created a new Core, send data
            console.log("Core data saved: ", newCoreEntity);
            response.status(201).send(newCoreEntity.data);
        } else {
            response.status(500).send("Error saving new Core data: " + err);
        }
    });
};