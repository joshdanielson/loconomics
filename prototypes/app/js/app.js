'use strict';

/** Global dependencies **/
var $ = require('jquery');
require('jquery-mobile');
var ko = require('knockout');
ko.bindingHandlers.format = require('../vendor/iagosrl/ko/formatBinding').formatBinding;
require('es6-promise').polyfill();

/** Global static config **/
var baseUrl = '/prototypes/app/';

/** app static class **/
var app = {

    currentZIndex: 1,
    
    history: [],

    unexpectedError: function unexpectedError(error) {
        // TODO: enhance with dialog
        var str = typeof(error) === 'string' ? error : JSON.stringify(error);
        window.alert(str);
    },

    loadActivity: function loadActivity(activityName) {
        return new Promise(function(resolve, reject) {
            var $act = app.findActivityElement(activityName);
            if ($act.length) {
                resolve($act);
            }
            else {
                $.get(baseUrl + activityName + '.html').then(function(html) {
                    var $h = $($.parseHTML(html));
                    $act = app.findActivityElement(activityName, $h);
                    if ($act.length)
                        resolve($act);
                    else
                        reject(Error('Activity not found in the source file.'));
                    
                }, reject);
            }
        });
    },
    
    findActivityElement: function findActivityElement(activityName, $root) {
        $root = $root || $(document);
        // TODO: save name parsing for css selector
        return $root.find('[data-activity="' + activityName + '"]');
    },
    
    showActivity: function showActivity(activityName, options) {
        // Ensure its loaded, and do anything later
        app.loadActivity(activityName).then(function($activity) {
            
            $activity.css('zIndex', ++app.currentZIndex).show();
            var currentActivity = app.history[app.history.length - 1];
            app.history.push({
                name: activityName,
                $activity: $activity,
                options: options
            });
            activities[activityName].init($activity, options);
            
            app.hideActivity(currentActivity.name);

        }).catch(app.unexpectedError);
    },

    goToActivity: function goToActivity(activityName, options) {

        var currentActivity = app.history.pop();
        app.hideActivity(currentActivity.name);
        app.currentZIndex--;
        app.showActivity(activityName, options);
    },

    hideActivity: function hideActivity(activityName) {

        var $activity = app.findActivityElement(activityName);
        $activity.hide();
    },
    
    goBack: function goBack(options) {

        var previousActivity = app.history[app.history.length - 2];
        app.goToActivity(previousActivity.name, options);
    }
};

/** Load activities **/
var activities = {
    'calendar': require('./activities/calendar'),
    'datetimePicker': require('./activities/datetimePicker'),
    'clients': require('./activities/clients'),
    'services': require('./activities/services'),
    'locations': require('./activities/locations'),
    'textEditor': require('./activities/textEditor')
};

/** Page ready **/
$(function() {
    // Detect activities loaded in the current document
    // and initialize them:
    $('[data-activity]').each(function() {
        var $activity = $(this);
        var actName = $activity.data('activity');
        if (activities.hasOwnProperty(actName)) {
            activities[actName].init($activity);
            app.$currentActivity = $activity;
        }
    });
});
