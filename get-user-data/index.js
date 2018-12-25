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
let orgScopedID;
let screenName;
let key;

// Required to support calls from an origin other than the function host
const cors = require('cors')({ origin: true });

exports.getUserData = (req, res) => {
    cors(req, res, (err) => {
        if (!err) {
            response = res;
            orgScopedID = req.query.orgscopedid;
            screenName = req.query.screenname;
            key = datastore.key(['userData', orgScopedID]);
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
                // User exists, send data
                console.log("User data found: ", entity);
                checkIfNameChanged(entity);
            } else {
                createNewUser();
            }
        } else {
            response.status(500).send("Error checking User data: " + err);
        }
    });
};

const checkIfNameChanged = (backendEntity) => {
    if (backendEntity.screenName !== screenName) {
        // User screen name was changed by Oculus, update it here
        backendEntity.screenName = screenName;
        const updatedEntity = {
            key: key,
            data: backendEntity
        };
        datastore.save(updatedEntity, (err) => {
            if (!err) {
                // Updated User screen name, send data
                console.log("User data saved: ", updatedEntity);
                response.status(200).send(updatedEntity.data);
            } else {
                response.status(500).send("Error saving updated User data: " + err);
            }
        });

    } else {
        // User screen name has not changed, send data
        response.status(200).send(backendEntity);
    }
};

const createNewUser = () => {
    const newUserEntity = {
        key: key,
        data: {
            screenName: screenName,
            experience: 0,
            level: 1
        }
    };
    datastore.save(newUserEntity, (err) => {
        if (!err) {
            // Created a new User, send data
            console.log("User data saved: ", newUserEntity);
            response.status(201).send(newUserEntity.data);
        } else {
            response.status(500).send("Error saving new User data: " + err);
        }
    });
};