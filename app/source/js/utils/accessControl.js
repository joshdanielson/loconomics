/**
    Create an Access Control for an app that just checks
    the activity property for allowed user level.
    To be provided to Shell.js and used by the app.js,
    very tied to that both classes.

    Activities can define on its object an accessLevel
    property like next examples

    this.accessLevel = app.Usertype.user; // anyone
    this.accessLevel = app.UserType.anonymous; // anonymous users only
    this.accessLevel = app.UserType.loggedUser; // authenticated users only
**/
'use strict';

// UserType enumeration is bit based, so several
// users can has access in a single property
//var UserType = require('../models/User').UserType;
var user = require('../data/userProfile').data;

module.exports = function createAccessControl(app) {

    return function accessControl(route) {

        var activity = app.getActivityControllerByRoute(route);

        var currentType = user.userType();

        if (activity && activity.accessLevel) {

            var can = activity.accessLevel & currentType;

            if (!can) {
                // Notify error, why cannot access
                return {
                    requiredLevel: activity.accessLevel,
                    currentType: currentType
                };
            }
        }

        // Allow
        return null;
    };
};
