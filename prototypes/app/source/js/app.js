'use strict';

/** Global dependencies **/
var $ = require('jquery');
require('bootstrap');
require('jquery-mobile');
var ko = require('knockout');
ko.bindingHandlers.format = require('ko/formatBinding').formatBinding;
var bootknock = require('./utils/bootknockBindingHelpers');
require('./utils/Function.prototype._inherits');
require('./utils/Function.prototype._delayed');
// Promise polyfill, so its not 'require'd per module:
require('es6-promise').polyfill();

var layoutUpdateEvent = require('layoutUpdateEvent');
var NavAction = require('./viewmodels/NavAction'),
    AppModel = require('./viewmodels/AppModel');

// Register the special locale
require('./locales/en-US-LC');

/**
    App static class
**/
var app = {
    shell: require('./app-shell'),
    
    // New app model, that starts with anonymous user
    model: new AppModel(),
    
    // TODO Double check it works
    // 'out', 'login', 'onboarding', 'in'
    status: ko.observable('out'),
    
    /** Load activities controllers (not initialized) **/
    activities: require('./app-activities'),
    
    /**
        Just redirect the better place for current user and state
    **/
    goDashboard: function goDashboard() {
        var onboarding = this.model.user().onboardingStep();
        if (onboarding) {
            this.shell.go('onboardingHome/' + onboarding);
        }
        else {
            this.shell.go('home');
        }
    },
    
    /**
        Update the app menu to highlight the
        given link name
    **/
    updateMenu: function updateMenu(name) {
        
        this.$menu = this.$menu || $('#navbar');
        
        // Remove any active
        this.$menu
        .find('li')
        .removeClass('active');
        // Add active
        this.$menu
        .find('.go-' + name)
        .closest('li')
        .addClass('active');
        // Hide menu
        this.$menu
        .filter(':visible')
        .collapse('hide');
    },
    
    /**
        Observables and methods to manage the shared
        app navigation bar.
        
        TODO: complete for the new design
    **/
    navAction: ko.observable(null),
    defaultNavAction: null,
    updateAppNav: function updateAppNav(activity) {
        // navAction, if the activity has its own
        if ('navAction' in activity) {
            // Use specializied activity action
            this.navAction(activity.navAction);
        }
        else {
            // Use default action
            this.navAction(this.defaultNavAction);
        }
    }
};

/** Continue app creation with things that need a reference to the app **/

app.getActivity = function getActivity(name) {
    var activity = this.activities[name];
    if (activity) {
        var $act = this.shell.items.find(name);
        if ($act && $act.length)
            return activity.init($act, this);
    }
    return null;
};

app.getActivityControllerByRoute = function getActivityControllerByRoute(route) {
    // From the route object, the important piece is route.name
    // that contains the activity name except if is the root
    var actName = route.name || this.shell.indexName;
    
    return this.getActivity(actName);
};

// accessControl setup: cannot be specified on Shell creation because
// depends on the app instance
app.shell.accessControl = require('./utils/accessControl')(app);

// Shortcut to UserType enumeration used to set permissions
app.UserType = app.model.user().constructor.UserType;

// Updating app status on user changes
function updateStatesOnUserChange() {

    var user = app.model.user();

    if (user.onboardingStep()) {
        app.status('onboarding');
    }
    else if (user.isAnonymous()) {
        app.status('out');
    }
    else {
        app.status('in');
    }
}
app.model.user().isAnonymous.subscribe(updateStatesOnUserChange);
app.model.user().onboardingStep.subscribe(updateStatesOnUserChange);


/** App Init **/
var appInit = function appInit() {
    
    // Enabling the 'layoutUpdate' jQuery Window event that happens on resize and transitionend,
    // and can be triggered manually by any script to notify changes on layout that
    // may require adjustments on other scripts that listen to it.
    // The event is throttle, guaranting that the minor handlers are executed rather
    // than a lot of them in short time frames (as happen with 'resize' events).
    layoutUpdateEvent.on();
    
    // NOTE: Safari iOS bug workaround, min-height/height on html doesn't work as expected,
    // getting bigger than viewport. May be a problem only on Safari and not in 
    // the WebView, double check.
    var iOS = /(iPad|iPhone|iPod)/g.test( navigator.userAgent );
    if (iOS) {
        $('html').height(window.innerHeight + 'px');
        $(window).on('layoutUpdate', function() {
            $('html').height(window.innerHeight + 'px');
        });
    }
    
    // Load Knockout binding helpers
    bootknock.plugIn(ko);
    
    // Plugins setup
    if (window && window.plugins && window.plugins.Keyboard) {
        window.plugins.Keyboard.disableScroll(true);
    }
    
    // Easy links to shell actions, like goBack, in html elements
    // Example: <button data-shell="goBack 2">Go 2 times back</button>
    $(document).on('tap', '[data-shell]', function(e) {
        var cmdline = $(this).data('shell') || '',
            args = cmdline.split(' '),
            cmd = args[0];

        if (cmd && typeof(app.shell[cmd]) === 'function') {
            app.shell[cmd].apply(app.shell, args.slice(1));
        }
    });
    
    // When an activity is ready in the Shell:
    app.shell.on(app.shell.events.itemReady, function($act, state) {
        
        // Connect the 'activities' controllers to their views
        // Get initialized activity for the DOM element
        var actName = $act.data('activity');
        var activity = app.getActivity(actName);
        // Trigger the 'show' logic of the activity controller:
        activity.show(state);

        // Update menu
        app.updateMenu(actName);
        
        // Update app navigation
        app.updateAppNav(activity);
    });
    
    // Set model for the AppNav
    ko.applyBindings({
        navAction: app.navAction,
        status: app.status
    }, $('.AppNav').get(0));

    // App init:
    var alertError = function(err) {
        window.alert('There was an error loading: ' + err && err.message || err);
    };

    app.model.init()
    .then(app.shell.run.bind(app.shell), alertError)
    .then(function() {
        // Mark the page as ready
        $('html').addClass('is-ready');
    }, alertError);

    // DEBUG
    window.app = app;
};

// App init on page ready and phonegap ready
if (window.cordova) {
    // On DOM-Ready first
    $(function() {
        // Page is ready, device is too?
        // Note: Cordova ensures to call the handler even if the
        // event was already fired, so is good to do it inside
        // the dom-ready and we are ensuring that everything is
        // ready.
        $(document).on('deviceready', appInit);
    });
} else {
    // Only on DOM-Ready, for in browser development
    $(appInit);
}