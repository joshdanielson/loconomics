/**
 * Manages the locally stored user authentication key data.
 * This let identify the user and authorize it
 * at the remote webservice.
 * @module data/userAuthKey
 */
'use strict';
var STORE_NAME = 'userAuthKey';
var local = require('./drivers/localforage');

/**
 * User authentication key and identification,
 * with optional copy of it's profile, as of current
 * remote response data for a succesfully logged user
 * @typedef {Object} UserAuthKey
 * @property {string} username
 * @property {number} userID
 * @property {string} authKey Authentification key for future requests
 * @property {UserProfile} profile Basic profile information of the user
 */

/**
 * Check if the given object seems to have
 * valid user auth key data by checking for almost a
 * value on required properties.
 * @private
 * @param {UserAuthKey} userAuthKey
 */
var seemsValidData = function(userAuthKey) {
    return !!(
        userAuthKey &&
        userAuthKey.userID &&
        userAuthKey.username &&
        userAuthKey.authKey
    );
};

/**
 * Returns the stored user auth key data,
 * or throws error if not found or looks corrupt
 * @returns {Promise<UserAuthKey>}
 */
exports.get = function() {
    return local
    .getItem(STORE_NAME)
    .then(function(userAuthKey) {
        if (seemsValidData(userAuthKey)) {
            return userAuthKey;
        }
        else {
            throw new Error('User Auth Key data not found');
        }
    });
};

/**
 * Stores the given user auth key data locally.
 * Let's the app to keep the user logged between executions
 * until explicitely removes them.
 * It throws error if given data don't seem valid
 * @param {UserAuthKey} userAuthKey
 * @returns {Promise}
 */
exports.set = function(userAuthKey) {
    if (seemsValidData(userAuthKey)) {
        return local.setItem(STORE_NAME, {
            userID: userAuthKey.userID,
            username: userAuthKey.username,
            authKey: userAuthKey.authKey
        });
    }
    else {
        throw new Error('Invalid user auth key data');
    }
};

/**
 * Removes the stored user auth key data
 * @returns {Promise}
 */
exports.clear = function() {
    return local.removeItem(STORE_NAME);
};

/**
 * It detects old local store and
 * migrates that to the current name.
 *
 * THIS IS TEMPORARY CODE
 * @private
 */
function migrateConfig() {
    var data = localStorage["LoconomicsApp/credentials"];
    if (data) {
        try {
            data = JSON.parse(data);
            // Disabled for now, before reach master, to allow to go back to
            // previous set-up at other branches
            //delete localStorage["LoconomicsApp/credentials"];

            return local.setItem(STORE_NAME, data);
        }
        catch(ex) { }
    }
}
// Do it now!
migrateConfig();
