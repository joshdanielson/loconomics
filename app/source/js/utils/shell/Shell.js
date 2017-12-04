/**
    Javascritp Shell for SPAs.
**/
/*global window, document */
'use strict';

/** DI entry points for default builds. Most dependencies can be
    specified in the constructor settings for per-instance setup.
**/
var deps = require('./dependencies');
var ko = require('knockout');

/** Constructor **/

function Shell(settings) {
    //jshint maxcomplexity:16

    deps.EventEmitter.call(this);

    this.$ = settings.jquery || deps.jquery;
    this.$root = this.$(settings.root);
    this.baseUrl = settings.baseUrl || '';
    // With forceHashbang=true:
    // - fragments URLs cannot be used to scroll to an element (default browser behavior),
    //   they are defaultPrevented to avoid confuse the routing mechanism and current URL.
    // - all URLs routed through the shell will include a hashbang (#!), the shell ensures
    //   that happens by appending the hashbang to any URL passed in (except the standard hash
    //   that are skipt).
    this.forceHashbang = settings.forceHashbang || false;
    // By default, or if forceHashbang is true:
    // - pressed links to fragments URLs are not routed, they are skipped silently
    //   except when they are a hashbang (#!). This way, special links
    //   that performn js actions doesn't conflits.
    // But with useSingleHashForRouting=true, fragment URLs are routed even if do not include the hashbang
    this.useSingleHashForRouting = this.forceHashbang ? false : settings.useSingleHashForRouting || false;
    this.linkEvent = settings.linkEvent || 'click';
    this.parseUrl = (settings.parseUrl || deps.parseUrl).bind(this, this.baseUrl);
    this.absolutizeUrl = (settings.absolutizeUrl || deps.absolutizeUrl).bind(this, this.baseUrl);

    this.history = settings.history || window.history;

    this.indexName = settings.indexName || 'index';

    this.items = settings.domItemsManager;

    // loader can be disabled passing 'null', so we must
    // ensure to not use the default on that cases:
    this.loader = typeof(settings.loader) === 'undefined' ? deps.loader : settings.loader;
    // loader setup
    if (this.loader)
        this.loader.baseUrl = this.baseUrl;

    // Definition of events that this object can trigger,
    // its value can be customized but any listener needs
    // to keep updated to the correct event string-name used.
    // The items manipulation events MUST be triggered
    // by the 'items.switch' function
    this.events = {
        willOpen: 'shell-will-open',
        willClose: 'shell-will-close',
        itemReady: 'shell-item-ready',
        closed: 'shell-closed',
        opened: 'shell-opened'
    };

    /**
        A function to decide if the
        access is allowed (returns 'null')
        or forbidden (return a state object with information
        that will be passed to the 'forbiddenAccessName' item;
        the 'route' property on the state is automatically filled).

        The default buit-in just allow everything
        by just returning 'null' all the time.

        It receives as parameter the state object,
        that almost contains the 'route' property with
        information about the URL.
    **/
    this.accessControl = settings.accessControl || deps.accessControl;
    // What item to load when access is forbidden
    this.forbiddenAccessName = settings.forbiddenAccessName || this.indexName;

    // Access to the current route
    this.currentRoute = null;
    this.currentRouteObservable = ko.observable();
    // Access to referrer/previous route
    this.referrerRoute = null;
}

// Shell inherits from EventEmitter
Shell.prototype = Object.create(deps.EventEmitter.prototype, {
    constructor: {
        value: Shell,
        enumerable: false,
        writable: true,
        configurable: true
    }
});

module.exports = Shell;


/** API definition **/

/**
    Move shell to the given url appending the change to the history.
    @url:string
    @state:object Optional. Default: null. State information to provide to the item to load
    @useReplace:bool Optional. Default: false. Ask to replace current history state
    rather than append it to the history (using history.replaceState). This is recommended
    when a transparent redirect wants to be performed, since helps keep the history 'sane'
    (allowing the user to go back, rather than enter in a situation where clicking back
    seems doing nothing because gets automatically redirected again to the same url).
**/
Shell.prototype.go = function go(url, state, useReplace) {
    if (typeof(url) !== 'string') {
        console.error('Shell.go aborted. It needs a string as URL, given:', url);
        return;
    }
    if (this.forceHashbang) {
        if (!/^#!/.test(url)) {
            url = '#!' + url;
        }
    }
    else {
        url = this.absolutizeUrl(url);
    }
    if (useReplace) {
        this.history.replaceState(state, undefined, url);
    } else {
        this.history.pushState(state, undefined, url);
    }
    // pushState/replaceState do NOT trigger the popstate event, so
    return this.replace(state);
};

Shell.prototype.goBack = function goBack(state, steps) {
    steps = 0 - (steps || 1);
    // If there is nothing to go-back or not enought
    // 'back' steps, go to the index
    if (steps < 0 && Math.abs(steps) >= this.history.length) {
        this.go(this.indexName);
    }
    else {
        // On replace, the passed state is merged with
        // the one that comes from the saved history
        // entry (it 'pops' when doing the history.go())
        this._pendingStateUpdate = state;
        this.history.go(steps);
    }
};

/**
    Process the given state in order to get the current state
    based on that or the saved in history, merge it with
    any updated state pending and adds the route information,
    returning an state object suitable to use.
**/
Shell.prototype.getUpdatedState = function getUpdatedState(state) {
    /*jshint maxcomplexity: 8 */

    // For current uses, any pendingStateUpdate is used as
    // the state, rather than the provided one
    state = this._pendingStateUpdate || state || this.history.state || {};

    // TODO: more advanced uses must be to use the 'state' to
    // recover the UI state, with any message from other UI
    // passing in a way that allow update the state, not
    // replace it (from pendingStateUpdate).
    /*
    // State or default state
    state = state || this.history.state || {};
    // merge pending updated state
    this.$.extend(state, this._pendingStateUpdate);
    // discard the update
    */
    this._pendingStateUpdate = null;

    // Doesn't matters if state includes already
    // 'route' information, need to be overwritten
    // to match the current one.
    // NOTE: previously, a check prevented this if
    // route property exists, creating infinite loops
    // on redirections from activity.show since 'route' doesn't
    // match the new desired location

    // Detect if is a hashbang URL or an standard one.
    // Except if the app is forced to use hashbang.
    var isHashBang = /#!/.test(location.href) || this.forceHashbang;

    var link = (
        isHashBang ?
        location.hash :
        location.pathname
    );
    // Is better to do this check here, because the hash can contain a query (even if
    // not valid for URL query, is valid for hashbang queries)
    if (location.search) {
        var sep = link.indexOf('?') !== -1 ? '&' : '?';
        link += sep + location.search.substr(1);
    }

    // Set the route
    state.route = this.parseUrl(link);

    return state;
};

Shell.prototype._getLocationRoutedUrl = function() {
    var reg = /^#!/;
    return reg.test(window.location.hash) ? window.location.hash : window.location.pathname + window.location.search + window.location.hash;
};

/**
    Internal use only.
    Update the URL/route saved as Referrer using the current one from location.
**/
Shell.prototype._refreshReferrer = function() {
    this.referrerRoute = this.parseUrl(this._getLocationRoutedUrl());
};
Shell.prototype._refreshCurrent = function() {
    this.currentRoute = this.parseUrl(this._getLocationRoutedUrl());
    this.currentRouteObservable(this.currentRoute);
};

/**
    Shortcut to history.replaceState API that keeps some internal Shell state correct.
**/
Shell.prototype.replaceState = function replaceState(state, title, url) {
    this._refreshReferrer();
    this.history.replaceState(state, title, url);
    this._refreshCurrent();
};

/**
    Shortcut to history.replaceState API that keeps some internal Shell state correct.
**/
Shell.prototype.pushState = function pushState(state, title, url) {
    this._refreshReferrer();
    this.history.pushState(state, title, url);
    this._refreshCurrent();
};

Shell.prototype.replace = function replace(state) {

    state = this.getUpdatedState(state);

    // Use the index on root calls
    if (state.route.root === true) {
        state.route = this.parseUrl(this.indexName);
    }
    this.referrerRoute = this.currentRoute;
    this.currentRoute = state.route;
    this.currentRouteObservable(this.currentRoute);
    //console.log('shell replace', state.route);

    // Access control
    var accessError = this.accessControl(state.route);
    if (accessError) {
        // Prevent to go if already there, to don't enter and endless loop
        if (this.currentRoute.name !== this.forbiddenAccessName) {
            return this.go(this.forbiddenAccessName, accessError, true);
        }
    }

    // Locating the container
    var $cont = this.items.find(state.route.name);
    var shell = this;
    var promise = null;

    if ($cont && $cont.length) {
        promise = new Promise(function(resolve, reject) {
            try {

                var $oldCont = shell.items.getActive();
                $oldCont = $oldCont.not($cont);
                // On first load (there is no referrer), we don't want the focus
                // to change to the activity so we ask to prevent it
                shell.items.switch($oldCont, $cont, shell, state, !shell.referrerRoute);
                //console.log('shell replace after switch', state.route);

                resolve(); //? resolve(act);
            }
            catch (ex) {
                reject(ex);
            }
        });
    }
    else {
        if (this.loader) {
            // load and inject the content in the page
            // then try the replace again
            promise = this.loader.load(state.route).then(function(html) {
                // Add to the items (the manager takes care you
                // add only the item, if there is one)
                shell.items.inject(state.route.name, html);
                // Double check that the item was added and is ready
                // to avoid an infinite loop because a request not returning
                // the item and the 'replace' trying to load it again, and again, and..
                if (shell.items.find(state.route.name).length)
                    return shell.replace(state);
            });
        }
        else {
            var err = new Error('Page not found (' + state.route.name + ')');
            console.warn('Shell Page not found, state:', state);
            promise = Promise.reject(err);

            // To avoid being in an inexistant URL (generating inconsistency between
            // current view and URL, creating bad history entries),
            // a goBack is executed, just after the current pipe ends
            // TODO: implement redirect that cut current processing rather than execute delayed
            setTimeout(function() {
                this.goBack();
            }.bind(this), 1);
        }
    }

    var thisShell = this;
    promise.catch(function(err) {
        if (!(err instanceof Error))
            err = new Error(err);

        // Log error,
        console.error('Shell, unexpected error.', err);
        // notify as an event
        thisShell.emit('error', err);
        // and continue propagating the error
        throw err;
    });

    return promise;
};

Shell.prototype.run = function run() {

    var shell = this;

    // Catch popstate event to update shell replacing the active container.
    // Allows polyfills to provide a different but equivalent event name
    this.$(window).on(this.history.popstateEvent || 'popstate', function(event) {

        var state = event.state ||
            (event.originalEvent && event.originalEvent.state) ||
            shell.history.state;

        // get state for current. To support polyfills, we use the general getter
        // history.state as fallback (they must be the same on browsers supporting History API)
        shell.replace(state);
    });

    // TODO: Review if all this next still is usable and has use cases, since the project
    // now uses fastclick library to avoid the iOS delay, using again click against tap event.
    //
    // Catch all links in the page (not only $root ones) and like-links.
    // IMPORTANT: the timeout and linkWorking is a kind of hack/workaround because of:
    // - iOS click delay: changing linkEvent to be 'tap click' (jqm tap event) or
    //   more standard but simplistic 'touchend click', only on iOS if possible, the
    //   iOS click delay can be avoided, letting the touch event to trigger this Shell handler
    //   and preventing the click from happening to avoid double execution
    //   (thanks to linkWorking and setTimeout).
    //   A broken alternative would be to use only one event, like 'tap' or 'touchend', but
    //   they fall down when a touch gesture happens in the limit of a link/element because
    //   a touchstart happens out of our target link -failing touchend and tap since don't
    //   get triggered in our link- but the browser/webview still executes (and inmediatly)
    //   the 'click' event on the link. It seems an edge case but is easier to make it happens
    //   than it seems. It's the bug that forced to implement this workaournd :-/
    // - And additionally: it prevents two 'clicks' from happening excessive fast because
    //   some kind of a second unwanted touch happening very fast, making
    //   a click by mistake on a different link on the loaded new page.
    var linkWorking = null,
        // OLD: iOS 300ms delay, a bit increased to avoid problems.
        // NOTE: as of inclusion of fastclick in the main project, reduced
        // this delay to avoid being noticeable on some edge cases, but still
        // preserving because other not verified use cases (like on a touch on a link that dynamically
        // changes being perceived as two quick consecutive clicks, executing two actions in one and that being unwanted)
        linkWorkingDelay = 80; // 340; // ms
    //DEBUG var linkEvent = this.linkEvent;
    this.$(document).on(this.linkEvent, '[href], [data-href]', function(e) {
        //jshint maxcomplexity:8
        //DEBUG console.log('Shell on event', e.type, linkWorking);
        // If working, avoid everything:
        if (linkWorking) return false;
        linkWorking = setTimeout(function() {
            linkWorking = null;
        }, linkWorkingDelay);

        var $t = shell.$(this);
        var href = $t.attr('href') || $t.data('href');

        // If there is no link, silently abort.
        if (!href) {
            e.preventDefault();
            return;
        }

        //DEBUG console.log('Shell on', linkEvent, e.type, 'href', href, 'element', $t);

        // Do nothing if the URL contains the protocol
        // and when the link has a target value (will open in new window/tab)
        var target = $t.attr('target');
        if (/^[a-z]+:/i.test(href) || target) {
            return;
        }
        else if (!this.useSingleHashForRouting && /^#([^!]|$)/.test(href)) {
            // Standard hash, but not hashbang: avoid routing and default behavior
            e.preventDefault();
            // Trigger special event on the shell, so external scripts can do
            // something, like trying to implement standard scroll behavior or any
            // Pass in: source fragment link, element that receive the original event and
            // the original event.
            shell.emit('fragmentNavigation', href, this, e);
            return;
        }

        e.preventDefault();

        // Executed delayed to avoid handler collisions, because
        // of the new page modifying the element and other handlers
        // reading it attributes and applying logic on the updated link
        // as if was the old one (example: shared links, like in a
        // global navbar, that modifies with the new page).
        setTimeout(function() {
            shell.go(href);
        }, 1);
    });

    // Initiallize state
    this.items.init();
    // Route to the current url/state
    this.replace();
};

/**
 * Generates and returns an observable variable that updates when the active
 * route changes, but limited to changes on the current route name
 * (scoped to that, so views can get notified only on changes that affects them)
 * @returns {KnockoutObservable<shell/route>}
 */
Shell.prototype.getCurrentObservableRoute = function() {
    var route = this.currentRouteObservable;
    var lastValue = route();
    var scopedName = lastValue.name;
    return ko.pureComputed(function() {
        var updatedRoute = route();
        if (updatedRoute.name === scopedName) {
            lastValue = updatedRoute;
            return updatedRoute;
        }
        else {
            return lastValue;
        }
    });
};
