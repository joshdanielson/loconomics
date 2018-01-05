/**
    Simple implementation of the History API using only hashbangs URLs,
    doesn't matters the browser support.
    Required when the context don't allow URL rewritting,
    like in local environments without a server or server that don't support that,
    for example in phonegap apps (where apps run at file://),
    or to completely by-pass browser support of History API because
    is buggy (like Android <= 4.1 and other old browsers).
    Externally, a wrapper lib can make detection and auto selection of native History API vs hashbangHistory.

    NOTES:
    - Browser must support 'hashchange' event. (There are polyfills out there, mostly using timers).
    - Browser must has support for standard JSON class. (there are polyfills out there, like JSON2).
    - Relies on sessionstorage for persistance, supported by all browsers and webviews
      for a enough long time now.
    - Similar approach as the popular module History.js, but simplified: it appends a fake query
      parameter '_suid=0' to the hash value (yes, the actual query goes before the hash, but
      we need it inside).
    - For simplification, only the state is persisted, the 'title' parameter is not
      used at all (the same as major browsers do, so standard compatibility is not a problem); in this line,
      only history entries with state are persisted. But don't looks complicated to support title if that's
      wanted in a future or a fork :-)
    - Browser must support 'js properties getters'. If older browsers need to be supported, a fork can change
      the current use of getters syntax by using the defineProperty and similar functions.
    - This class must be instantiated early because must be the first attaching a handler for native 'popstate',
      so can block all others and avoid edge-case errors (more on the code at the end; may change if TODO-1 is successfully done).
    - Browser must support history.replaceState
**/
//global location
'use strict';
var $ = require('jquery');
var sanitizeUrl = require('./sanitizeUrl');
var getUrlQuery = require('../getUrlQuery');

// Init: Load saved copy from sessionStorage
var session = sessionStorage.getItem('hashbangHistory.store');
// Or create a new one
if (!session) {
    session = {
        // States array where each index is the SUID code and the
        // value is just the value passed as state on pushState/replaceState
        states: []
    };
}
else {
    session = JSON.parse(session);
}


/**
    Get the SUID number
    from a hash string
**/
function getSuid(hash) {

    var suid = +getUrlQuery(hash)._suid;
    if (isNaN(suid))
        return null;
    else
        return suid;
}

function setSuid(hash, suid) {

    // We need the query, since we need
    // to replace the _suid (may exist)
    // and recreate the query in the
    // returned hash-url
    var qs = getUrlQuery(hash);
    qs.push('_suid');
    qs._suid = suid;

    var query = [];
    for(var i = 0; i < qs.length; i++) {
        query.push(qs[i] + '=' + encodeURIComponent(qs[qs[i]]));
    }
    query = query.join('&');

    if (query) {
        var index = hash.indexOf('?');
        if (index > -1)
            hash = hash.substr(0, index);
        hash += '?' + query;
    }

    return hash;
}

/**
    Ask to persist the session data.
    It is done with a timeout in order to avoid
    delay in the current task mainly any handler
    that acts after a History change.
**/
function persist() {
    // Enough time to allow routing tasks,
    // most animations from finish and the UI
    // being responsive.
    // Because sessionStorage is synchronous.
    setTimeout(function() {
        sessionStorage.setItem('hashbangHistory.store', JSON.stringify(session));
    }, 1500);
}

/**
    Returns the given state or null
    if is an empty object.
**/
function checkState(state) {

    if (state) {
        // is empty?
        if (Object.keys(state).length > 0) {
            // No
            return state;
        }
        // its empty
        return null;
    }
    // Anything else
    return state;
}

/**
    Get a canonical representation
    of the URL so can be compared
    with success.
**/
function cannonicalUrl(url) {

    // Avoid some bad or problematic syntax
    url = sanitizeUrl(url || '');

    // Get the hash part
    var ihash = url.indexOf('#');
    if (ihash > -1) {
        url = url.substr(ihash + 1);
    }
    // Maybe a hashbang URL, remove the
    // 'bang' (the hash was removed already)
    url = url.replace(/^!/, '');

    return url;
}

/*
    Native pushState should not trigger hashchange. When
    we manually trigger hashchange by setting location.hash,
    we catch and suppress that hashchange event.
*/
var hashchangeTriggeredManually = false;

/**
    History Polyfill
**/
var hashbangHistory = {
    pushState: function pushState(state, title, url) {

        // cleanup url
        url = cannonicalUrl(url);

        // save new state for url
        state = checkState(state) || null;
        if (state !== null) {
            // save state
            session.states.push(state);
            var suid = session.states.length - 1;
            // update URL with the suid
            url = setSuid(url, suid);
            // call to persist the updated session
            persist();
        }

        hashchangeTriggeredManually = true;

        // update location to track history:
        location.hash = '#!' + url;
    },
    replaceState: function replaceState(state, title, url) {

        // cleanup url
        url = cannonicalUrl(url);

        // it has saved state?
        var suid = getSuid(url);
        var hasOldState = suid !== null;

        // save new state for url
        state = checkState(state) || null;
        // its saved if there is something to save
        // or something to destroy
        if (state !== null || hasOldState) {
            // save state
            if (hasOldState) {
                // replace existing state
                session.states[suid] = state;
                // the url remains the same
            }
            else {
                // create state
                session.states.push(state);
                suid = session.states.length - 1;
                // update URL with the suid
                url = setSuid(url, suid);
            }
            // call to persist the updated session
            persist();
        }

        // update location to track history:
        var hash = '#!' + url;

        // update location to track history:
        window.history.replaceState(state, title, location.origin + location.pathname + hash);
    },
    get state() {

        var suid = getSuid(location.hash);
        return (
            suid !== null ?
            session.states[suid] :
            null
        );
    },
    get length() {
        return window.history.length;
    },
    go: function go(offset) {
        window.history.go(offset);
    },
    back: function back() {
        window.history.back();
    },
    forward: function forward() {
        window.history.forward();
    }
};

// Attach hashcange event to trigger History API event 'popstate'
var $w = $(window);
$w.on('hashchange', function(e) {

    var url = e.originalEvent.newURL;
    url = cannonicalUrl(url);

    // An URL being pushed or replaced
    // must NOT trigger popstate
    if (hashchangeTriggeredManually) {
        hashchangeTriggeredManually = false;
        return;
    }

    // get state from history entry
    // for the updated URL, if any
    // (can have value when traversing
    // history).
    var suid = getSuid(url);
    var state = null;

    if (suid !== null)
        state = session.states[suid];

    $w.trigger(new $.Event('popstate', {
        state: state
    }), 'hashbangHistory');
});

// For HistoryAPI capable browsers, we need
// to capture the native 'popstate' event that
// gets triggered on our push/replaceState because
// of the location change, but too on traversing
// the history (back/forward).
// We will lock the event except when is
// the one we trigger.
//
// NOTE: to this trick to work, this must
// be the first handler attached for this
// event, so can block all others.
// ALTERNATIVE: instead of this, on the
// push/replaceState methods detect if
// HistoryAPI is native supported and
// use replaceState there rather than
// a hash change.
$w.on('popstate', function(e, source) {

    // Ensuring is the one we trigger
    if (source === 'hashbangHistory')
        return;

    // In other case, block:
    e.preventDefault();
    e.stopImmediatePropagation();
});

// Expose API
module.exports = hashbangHistory;
