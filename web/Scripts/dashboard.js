(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/** Implements a similar LcUrl object like the server-side one, basing
    in the information attached to the document at 'html' tag in the 
    'data-base-url' attribute (thats value is the equivalent for AppPath),
    and the lang information at 'data-culture'.
    The rest of URLs are built following the window.location and same rules
    than in the server-side object.
**/

var base = document.documentElement.getAttribute('data-base-url'),
    lang = document.documentElement.getAttribute('data-culture'),
    l = window.location,
    url = l.protocol + '//' + l.host;
// location.host includes port, if is not the default, vs location.hostname

base = base || '/';

var LcUrl = {
    SiteUrl: url,
    AppPath: base,
    AppUrl: url + base,
    LangId: lang,
    LangPath: base + lang + '/',
    LangUrl: url + base + lang
};
LcUrl.LangUrl = url + LcUrl.LangPath;
LcUrl.JsonPath = LcUrl.LangPath + 'JSON/';
LcUrl.JsonUrl = url + LcUrl.JsonPath;

module.exports = LcUrl;
},{}],2:[function(require,module,exports){
/** ProviderPosition class
  It provides minimun like-jquery event listeners
  with methods 'on' and 'off', and internally 'this.events'
  being a jQuery.Callbacks.
**/
var 
  $ = require('jquery'),
  LcUrl = require('./LcUrl'),
  smoothBoxBlock = require('./smoothBoxBlock'),
  ajaxCallbacks = require('LC/ajaxCallbacks');

/** Constructor
**/
var ProviderPosition = function (positionId) {
  this.positionId = positionId;

  // Events support through jquery.Callback
  this.events = $.Callbacks();
  this.on = function () { this.events.add.apply(this.events, Array.prototype.slice.call(arguments, 0)); return this; };
  this.off = function () { this.events.remove.apply(this.events, Array.prototype.slice.call(arguments, 0)); return this; };
};

// Using default configuration as prototype
ProviderPosition.prototype = {
  declinedMessageClass: 'info',
  declinedPopupClass: 'position-state-change',
  stateChangedEvent: 'state-changed',
  stateChangedDeclinedEvent: 'state-changed-declined',
  removeFormSelector: '.delete-message-confirm',
  removeFormContainer: '.DashboardSection-page',
  removeMessageClass: 'warning',
  removePopupClass: 'position-state-change',
  removedEvent: 'removed',
  removeFailedEvent: 'remove-failed'
};

/** changeState to the one given, it will raise a stateChangedEvent on success
  or stateChangedDeclinedEvent on error.
  @state: 'on' or 'off'
**/
ProviderPosition.prototype.changeState = function changePositionState(state) {
  var page = state == 'on' ? '$Reactivate' : '$Deactivate';
  var $d = $('#main');
  var that = this;
  var ctx = { form: $d, box: $d };
  $.ajax({
    url: LcUrl.LangPath + 'dashboard/position/' + page + '/?PositionID=' + this.positionId,
    context: ctx,
    error: ajaxCallbacks.error,
    success: function (data, text, jx) {
      $d.one('ajaxSuccessPost', function (event, data, t, j, ctx) {
        if (data && data.Code > 100) {
          if (data.Code == 101) {
            that.events.fire(state);
          } else {
            // Show message:
            var msg = $('<div/>').addClass(that.declinedMessageClass).append(data.Result.Message);
            smoothBoxBlock.open(msg, $d, that.declinedPopupClass, { closable: true, center: false, autofocus: false });
          }
        }
      });
      // Process the result, that eventually will call ajaxSuccessPost
      ajaxCallbacks.doJSONAction(data, text, jx, ctx);
    }
  });
  return this;
};

/**
    Delete position
**/
ProviderPosition.prototype.remove = function deletePosition() {

    var c = $(this.removeFormContainer),
        f = c.find(this.removeFormSelector).first(),
        popupForm = f.clone(),
        that = this;

    popupForm.one('ajaxSuccessPost', '.ajax-box', function (event, data) {

        function notify() {
            switch (data.Code) {
                case 101:
                    that.events.fire(that.removedEvent, [data.Result]);
                    break;
                case 103:
                    that.events.fire(that.removeFailedEvent, [data.Result]);
                    break;
            }
        }

        if (data && data.Code) {

            if (data.Result && data.Result.Message) {
                var msg = $('<div/>').addClass(that.removeMessageClass).append(data.Result.Message);
                var box = smoothBoxBlock.open(msg, c, that.removePopupClass, { closable: true, center: false, autofocus: false });

                box.on('xhide', function () {
                    notify();
                });
            }
            else {
                notify();
            }
        }

    });

    // Open confirmation form
    var b = smoothBoxBlock.open(popupForm, c, null, { closable: true });
};

module.exports = ProviderPosition;
},{"./LcUrl":1,"./smoothBoxBlock":7}],3:[function(require,module,exports){
/* Focus the first element in the document (or in @container)
with the html5 attribute 'autofocus' (or alternative @cssSelector).
It's fine as a polyfill and for ajax loaded content that will not
get the browser support of the attribute.
*/
var $ = require('jquery');

function autoFocus(container, cssSelector) {
    container = $(container || document);
    container.find(cssSelector || '[autofocus]').focus();
}

if (typeof module !== 'undefined' && module.exports)
    module.exports = autoFocus;
},{}],4:[function(require,module,exports){
/** Extended toggle-show-hide funtions.
    IagoSRL@gmail.com
    Dependencies: jquery
 **/
(function(){

    /** Implementation: require jQuery and returns object with the
        public methods.
     **/
    function xtsh(jQuery) {
        var $ = jQuery;

        /**
         * Hide an element using jQuery, allowing use standard  'hide' and 'fadeOut' effects, extended
         * jquery-ui effects (is loaded) or custom animation through jquery 'animate'.
         * Depending on options.effect:
         * - if not present, jQuery.hide(options)
         * - 'animate': jQuery.animate(options.properties, options)
         * - 'fade': jQuery.fadeOut
         */
        function hideElement(element, options) {
            var $e = $(element);
            switch (options.effect) {
                case 'animate':
                    $e.animate(options.properties, options);
                    break;
                case 'fade':
                    $e.fadeOut(options);
                    break;
                case 'height':
                    $e.slideUp(options);
                    break;
                // 'size' value and jquery-ui effects go to standard 'hide'
                // case 'size':
                default:
                    $e.hide(options);
                    break;
            }
            $e.trigger('xhide', [options]);
        }

        /**
        * Show an element using jQuery, allowing use standard  'show' and 'fadeIn' effects, extended
        * jquery-ui effects (is loaded) or custom animation through jquery 'animate'.
        * Depending on options.effect:
        * - if not present, jQuery.hide(options)
        * - 'animate': jQuery.animate(options.properties, options)
        * - 'fade': jQuery.fadeOut
        */
        function showElement(element, options) {
            var $e = $(element);
            // We performs a fix on standard jQuery effects
            // to avoid an error that prevents from running
            // effects on elements that are already visible,
            // what lets the possibility of get a middle-animated
            // effect.
            // We just change display:none, forcing to 'is-visible' to
            // be false and then running the effect.
            // There is no flickering effect, because jQuery just resets
            // display on effect start.
            switch (options.effect) {
                case 'animate':
                    $e.animate(options.properties, options);
                    break;
                case 'fade':
                    // Fix
                    $e.css('display', 'none')
                    .fadeIn(options);
                    break;
                case 'height':
                    // Fix
                    $e.css('display', 'none')
                    .slideDown(options);
                    break;
                // 'size' value and jquery-ui effects go to standard 'show'
                // case 'size':
                default:
                    // Fix
                    $e.css('display', 'none')
                    .show(options);
                    break;
            }
            $e.trigger('xshow', [options]);
        }

        /** Generic utility for highly configurable jQuery.toggle with support
            to specify the toggle value explicity for any kind of effect: just pass true as second parameter 'toggle' to show
            and false to hide. Toggle must be strictly a Boolean value to avoid auto-detection.
            Toggle parameter can be omitted to auto-detect it, and second parameter can be the animation options.
            All the others behave exactly as hideElement and showElement.
        **/
        function toggleElement(element, toggle, options) {
            // If toggle is not a boolean
            if (toggle !== true && toggle !== false) {
                // If toggle is an object, then is the options as second parameter
                if ($.isPlainObject(toggle))
                    options = toggle;
                // Auto-detect toggle, it can vary on any element in the collection,
                // then detection and action must be done per element:
                $(element).each(function () {
                    // Reusing function, with explicit toggle value
                    toggleElement(this, !$(this).is(':visible'), options);
                });
            }
            if (toggle)
                showElement(element, options);
            else
                hideElement(element, options);
        }
        
        /** Do jQuery integration as xtoggle, xshow, xhide
         **/
        function plugIn(jQuery) {
            /** toggleElement as a jQuery method: xtoggle
             **/
            jQuery.fn.xtoggle = function xtoggle(toggle, options) {
                toggleElement(this, toggle, options);
                return this;
            };

            /** showElement as a jQuery method: xhide
            **/
            jQuery.fn.xshow = function xshow(options) {
                showElement(this, options);
                return this;
            };

            /** hideElement as a jQuery method: xhide
             **/
            jQuery.fn.xhide = function xhide(options) {
                hideElement(this, options);
                return this;
            };
        }

        // Exporting:
        return {
            toggleElement: toggleElement,
            showElement: showElement,
            hideElement: hideElement,
            plugIn: plugIn
        };
    }

    // Module
    if(typeof define === 'function' && define.amd) {
        define(['jquery'], xtsh);
    } else if(typeof module !== 'undefined' && module.exports) {
        var jQuery = require('jquery');
        module.exports = xtsh(jQuery);
    } else {
        // Normal script load, if jQuery is global (at window), its extended automatically        
        if (typeof window.jQuery !== 'undefined')
            xtsh(window.jQuery).plugIn(window.jQuery);
    }

})();
},{}],5:[function(require,module,exports){
/* Some utilities for use with jQuery or its expressions
    that are not plugins.
*/
function escapeJQuerySelectorValue(str) {
    return str.replace(/([ #;&,.+*~\':"!^$[\]()=>|\/])/g, '\\$1');
}

if (typeof module !== 'undefined' && module.exports)
    module.exports = {
        escapeJQuerySelectorValue: escapeJQuerySelectorValue
    };

},{}],6:[function(require,module,exports){
function moveFocusTo(el, options) {
    options = $.extend({
        marginTop: 30,
        duration: 500
    }, options);
    $('html,body').stop(true, true).animate({ scrollTop: $(el).offset().top - options.marginTop }, options.duration, null);
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = moveFocusTo;
}
},{}],7:[function(require,module,exports){
/** Custom Loconomics 'like blockUI' popups
**/
var $ = require('jquery'),
    escapeJQuerySelectorValue = require('./jqueryUtils').escapeJQuerySelectorValue,
    autoFocus = require('./autoFocus'),
    moveFocusTo = require('./moveFocusTo');
require('./jquery.xtsh').plugIn($);

function smoothBoxBlock(contentBox, blocked, addclass, options) {
    // Load options overwriting defaults
    options = $.extend(true, {
        closable: false,
        center: false,
        /* as a valid options parameter for LC.hideElement function */
        closeOptions: {
            duration: 600,
            effect: 'fade'
        },
        autofocus: true,
        autofocusOptions: { marginTop: 60 },
        width: 'auto'
    }, options);

    contentBox = $(contentBox);
    var full = false;
    if (blocked == document || blocked == window) {
        blocked = $('body');
        full = true;
    } else
        blocked = $(blocked);

    var boxInsideBlocked = !blocked.is('body,tr,thead,tbody,tfoot,table,ul,ol,dl');

    // Getting box element if exists and referencing
    var bID = blocked.data('smooth-box-block-id');
    if (!bID)
        bID = (contentBox.attr('id') || '') + (blocked.attr('id') || '') + '-smoothBoxBlock';
    if (bID == '-smoothBoxBlock') {
        bID = 'id-' + guidGenerator() + '-smoothBoxBlock';
    }
    blocked.data('smooth-box-block-id', bID);
    var box = $('#' + escapeJQuerySelectorValue(bID));
    
    // Hiding/closing box:
    if (contentBox.length === 0) {

        box.xhide(options.closeOptions);

        // Restoring the CSS position attribute of the blocked element
        // to avoid some problems with layout on some edge cases almost
        // that may be not a problem during blocking but when unblocked.
        var prev = blocked.data('sbb-previous-css-position');
        blocked.css('position', prev || '');
        blocked.data('sbb-previous-css-position', null);

        return;
    }

    var boxc;
    if (box.length === 0) {
        boxc = $('<div class="smooth-box-block-element"/>');
        box = $('<div class="smooth-box-block-overlay"></div>');
        box.addClass(addclass);
        if (full) box.addClass('full-block');
        box.append(boxc);
        box.attr('id', bID);
        if (boxInsideBlocked)
            blocked.append(box);
        else
            $('body').append(box);
    } else {
        boxc = box.children('.smooth-box-block-element');
    }
    // Hidden for user, but available to compute:
    contentBox.show();
    box.show().css('opacity', 0);
    // Setting up the box and styles.
    boxc.children().remove();
    if (options.closable)
        boxc.append($('<a class="close-popup close-action" href="#close-popup">X</a>'));
    box.data('modal-box-options', options);
    if (!boxc.data('_close-action-added'))
      boxc
        .on('click', '.close-action', function (e) {
            e.preventDefault();
            smoothBoxBlock(null, blocked, null, box.data('modal-box-options'));
        })
        .data('_close-action-added', true);
    boxc.append(contentBox);
    boxc.width(options.width);
    box.css('position', 'absolute');
    if (boxInsideBlocked) {
        // Box positioning setup when inside the blocked element:
        box.css('z-index', blocked.css('z-index') + 10);
        if (!blocked.css('position') || blocked.css('position') == 'static') {
            blocked.data('sbb-previous-css-position', blocked.css('position'));
            blocked.css('position', 'relative');
        }
        //offs = blocked.position();
        box.css('top', 0);
        box.css('left', 0);
    } else {
        // Box positioning setup when outside the blocked element, as a direct child of Body:
        box.css('z-index', Math.floor(Number.MAX_VALUE));
        box.css(blocked.offset());
    }
    // Dimensions must be calculated after being appended and position type being set:
    box.width(blocked.outerWidth());
    box.height(blocked.outerHeight());

    if (options.center) {
        boxc.css('position', 'absolute');
        var cl, ct;
        if (full) {
            ct = screen.height / 2;
            cl = screen.width / 2;
        } else {
            ct = box.outerHeight(true) / 2;
            cl = box.outerWidth(true) / 2;
        }
        if (options.center === true || options.center === 'vertical')
            boxc.css('top', ct - boxc.outerHeight(true) / 2);
        if (options.center === true || options.center === 'horizontal')
            boxc.css('left', cl - boxc.outerWidth(true) / 2);
    }
    // Last setup
    autoFocus(box);
    // Show block
    box.animate({ opacity: 1 }, 300);
    if (options.autofocus)
        moveFocusTo(contentBox, options.autofocusOptions);
    return box;
}
function smoothBoxBlockCloseAll(container) {
    $(container || document).find('.smooth-box-block-overlay').hide();
}

// Module
if (typeof module !== 'undefined' && module.exports)
    module.exports = {
        open: smoothBoxBlock,
        close: function(blocked, addclass, options) { smoothBoxBlock(null, blocked, addclass, options); },
        closeAll: smoothBoxBlockCloseAll
    };
},{"./autoFocus":3,"./jquery.xtsh":4,"./jqueryUtils":5,"./moveFocusTo":6}],8:[function(require,module,exports){
/**
  It toggles a given value with the next in the given list,
  or the first if is the last or not matched.
  The returned function can be used directly or 
  can be attached to an array (or array like) object as method
  (or to a prototype as Array.prototype) and use it passing
  only the first argument.
**/
module.exports = function toggle(current, elements) {
  if (typeof (elements) === 'undefined' &&
      typeof (this.length) === 'number')
    elements = this;

  var i = elements.indexOf(current);
  if (i > -1 && i < elements.length - 1)
    return elements[i + 1];
  else
    return elements[0];
};

},{}],9:[function(require,module,exports){
/**
    User private dashboard section
**/
var $ = require('jquery');
var LcUrl = require('../LC/LcUrl');
var ajaxForms = require('LC/ajaxForms');

// Code on page ready
$(function () {
    /* Sidebar */
    var 
    toggle = require('../LC/toggle'),
    ProviderPosition = require('../LC/ProviderPosition');
    // Attaching 'change position' action to the sidebar links
    $(document).on('click', '[href = "#togglePositionState"]', function () {
        var 
      $t = $(this),
      v = $t.text(),
      n = toggle(v, ['on', 'off']),
      positionId = $t.closest('[data-position-id]').data('position-id');

        var pos = new ProviderPosition(positionId);
        pos
    .on(pos.stateChangedEvent, function (state) {
        $t.text(state);
    })
    .changeState(n);

        return false;
    })
    .on('click', '.delete-position a', function () {
        var positionId = $(this).closest('[data-position-id]').data('position-id');
        var pos = new ProviderPosition(positionId);

        pos
    .on(pos.removedEvent, function (msg) {
        // Current position page doesn't exist anymore, out!
        window.location = LcUrl.LangPath + 'dashboard/your-work/';
    })
    .remove();

        return false;
    });

    /* Promote */
    var generateBookNowButton = require('./dashboard/generateBookNowButton');
    // Listen on DashboardPromote instead of the more close container DashboardBookNowButton
    // allows to continue working without re-attachment after html-ajax-reloads from ajaxForm.
    generateBookNowButton.on('.DashboardPromote'); //'.DashboardBookNowButton'

    /* Privacy */
    var privacySettings = require('./dashboard/privacySettings');
    privacySettings.on('.DashboardPrivacy');

    /* Payments */
    var paymentAccount = require('./dashboard/paymentAccount');
    paymentAccount.on('.DashboardPayments');

    /* about-you */
    $('html').on('ajaxFormReturnedHtml', '.DashboardAboutYou form.ajax', initAboutYou);
    initAboutYou();

    /* Your work init */
    $('html').on('ajaxFormReturnedHtml', '.DashboardYourWork form.ajax', initYourWorkDom);
    initYourWorkDom();

    /* Availabilty */
    initAvailability();
    $('.DashboardAvailability').on('ajaxFormReturnedHtml', initAvailability);
});

/**
    Instant saving and correct changes tracking
**/
function setInstantSavingSection(sectionSelector) {

    var $section = $(sectionSelector);

    if ($section.data('instant-saving')) {
        $section.on('change', ':input', function () {
            ajaxForms.doInstantSaving($section, [this]);
        });
    }
}

function initAboutYou() {
    /* Profile photo */
    var changeProfilePhoto = require('./dashboard/changeProfilePhoto');
    changeProfilePhoto.on('.DashboardAboutYou');

    /* About you / education */
    var education = require('./dashboard/educationCrudl');
    education.on('.DashboardAboutYou');

    /* About you / verifications */
    require('./dashboard/verificationsActions').on('.DashboardVerifications');
    require('./dashboard/verificationsCrudl').on('.DashboardAboutYou');

    // Instant saving
    setInstantSavingSection('.DashboardPublicBio');
    setInstantSavingSection('.DashboardPersonalWebsite');
}

function initAvailability(e) {
  // We need to avoid this logic when an event bubble
  // from the any fieldset.ajax, because its a subform event
  // and must not reset the main form (#504)
  if (e && e.target && /fieldset/i.test(e.target.nodeName))
    return;

  require('./dashboard/monthlySchedule').on();
  var weekly = require('./dashboard/weeklySchedule').on();
  require('./dashboard/calendarSync').on();
  require('./dashboard/appointmentsCrudl').on('.DashboardAvailability');

  // Instant saving
  setInstantSavingSection('.DashboardWeeklySchedule');
  setInstantSavingSection('.DashboardMonthlySchedule');
  setInstantSavingSection('.DashboardCalendarSync');
}

/**
  Initialize Dom elements and events handlers for Your-work logic.

  NOTE: .DashboardYourWork is an ajax-box parent of the form.ajax, every section
  is inside the form and replaced on html returned from server.
**/
function initYourWorkDom() {
    /* Your work / pricing */
    require('./dashboard/pricingCrudl').on();

    /* Your work / services */
    require('./dashboard/serviceAttributesValidation').setup($('.DashboardYourWork form'));
    // Instant saving and correct changes tracking
    setInstantSavingSection('.DashboardServices');

    /* Your work / cancellation */
    setInstantSavingSection('.DashboardCancellationPolicy');

    /* Your work / scheduling */
    setInstantSavingSection('.DashboardSchedulingOptions');

    /* Your work / locations */
    require('./dashboard/locationsCrudl').on('.DashboardYourWork');

    /* Your work / licenses */
    require('./dashboard/licensesCrudl').on('.DashboardYourWork');

    /* Your work / photos */
    require('./dashboard/managePhotosUI').on('.DashboardPhotos');
    // PhotosUI is special and cannot do instant-saving on form changes
    // because of the re-use of the editing form
    //setInstantSavingSection('.DashboardPhotos');

    /* Your work / reviews */
    $('.DashboardYourWork').on('ajaxSuccessPost', 'form', function (event, data) {
        // Reseting the email addresses on success to avoid resend again messages because
        // mistake of a second submit.
        var tb = $('.DashboardReviews [name=clientsemails]');
        // Only if there was a value:
        if (tb.val()) {
            tb
      .val('')
      .attr('placeholder', tb.data('success-message'))
            // support for IE, 'non-placeholder-browsers'
      .placeholder();
        }
    });

    /* Your work / add-position */
    var addPosition = require('./dashboard/addPosition');
    addPosition.init('.DashboardAddPosition');
    $('body').on('ajaxFormReturnedHtml', '.DashboardAddPosition', function () {
        addPosition.init();
    });
}
},{"../LC/LcUrl":1,"../LC/ProviderPosition":2,"../LC/toggle":8,"./dashboard/addPosition":10,"./dashboard/appointmentsCrudl":11,"./dashboard/calendarSync":13,"./dashboard/changeProfilePhoto":14,"./dashboard/educationCrudl":15,"./dashboard/generateBookNowButton":16,"./dashboard/licensesCrudl":17,"./dashboard/locationsCrudl":18,"./dashboard/managePhotosUI":19,"./dashboard/monthlySchedule":20,"./dashboard/paymentAccount":21,"./dashboard/pricingCrudl":22,"./dashboard/privacySettings":23,"./dashboard/serviceAttributesValidation":24,"./dashboard/verificationsActions":25,"./dashboard/verificationsCrudl":26,"./dashboard/weeklySchedule":27}],10:[function(require,module,exports){
/**
* Add Position: logic for the add-position page under /dashboard/your-work/0/,
  with autocomplete, position description and 'added positions' list.

  TODO: Check if is more convenient a refactor as part of LC/ProviderPosition.js
*/
var $ = require('jquery');
var selectors = {
  list: '.DashboardAddPosition-positionsList',
  selectPosition: '.DashboardAddPosition-selectPosition',
  desc: '.DashboardAddPosition-selectPosition-description'
};

exports.init = function initAddPosition(selector) {
  selector = selector || '.DashboardAddPosition';
  var c = $(selector);

  // Template position item value must be reset on init (because some form-recovering browser features that put on it bad values)
  c.find(selectors.list + ' li.is-template [name=position]').val('');

  // Autocomplete positions and add to the list
  var positionsList = null, tpl = null;
  var positionsAutocomplete = c.find('.DashboardAddPosition-selectPosition-search').autocomplete({
    source: LcUrl.JsonPath + 'GetPositions/Autocomplete/',
    autoFocus: false,
    minLength: 0,
    select: function (event, ui) {

      positionsList = positionsList || c.find(selectors.list + ' > ul');
      tpl = tpl || positionsList.children('.is-template:eq(0)');
      // No value, no action :(
      if (!ui || !ui.item || !ui.item.value) return;

      // Add if not exists in the list
      if (positionsList.children().filter(function () {
        return $(this).data('position-id') == ui.item.value;
      }).length === 0) {
        // Create item from template:
        positionsList.append(tpl.clone()
                    .removeClass('is-template')
                    .data('position-id', ui.item.value)
                    .children('.name').text(ui.item.positionSingular) // .label
                    .end().children('[name=position]').val(ui.item.value)
                    .end());
      }

      c.find(selectors.desc + ' > textarea').val(ui.item.description);

      // We want show the label (position name) in the textbox, not the id-value
      $(this).val(ui.item.positionSingular);
      return false;
    },
    focus: function (event, ui) {
      if (!ui || !ui.item || !ui.item.positionSingular);
      // We want the label in textbox, not the value
      $(this).val(ui.item.positionSingular);
      return false;
    }
  });

  // Load all positions in background to replace the autocomplete source (avoiding multiple, slow look-ups)
  /*$.getJSON(LcUrl.JsonPath + 'GetPositions/Autocomplete/',
  function (data) {
  positionsAutocomplete.autocomplete('option', 'source', data);
  }
  );*/

  // Show autocomplete on 'plus' button
  c.find(selectors.selectPosition + ' .add-action').click(function () {
    positionsAutocomplete.autocomplete('search', '');
    return false;
  });

  // Remove positions from the list
  c.find(selectors.list + ' > ul').on('click', 'li > a', function () {
    var $t = $(this);
    if ($t.attr('href') == '#remove-position') {
      // Remove complete element from the list (label and hidden form value)
      $t.parent().remove();
    }
    return false;
  });
};

},{}],11:[function(require,module,exports){
/** Availability: calendar appointments page setup for CRUDL use
**/
var $ = require('jquery');

// TODO: Replace by real require and not global LC:
//var ajaxForms = require('../LC/ajaxForms');
//var crudl = require('../LC/crudl').setup(ajaxForms.onSuccess, ajaxForms.onError, ajaxForms.onComplete);
//LC.initCrudl = crudl.on;
var initCrudl = LC.initCrudl;

exports.on = function (containerSelector) {

  var $c = $(containerSelector),
    crudlSelector = '.DashboardAppointments',
    $crudlContainer = $c.find(crudlSelector).closest('.DashboardSection-page-section'),
    $others = $crudlContainer.siblings()
        .add($crudlContainer.find('.DashboardSection-page-section-introduction'))
        .add($crudlContainer.closest('.DashboardAvailability').siblings());

  var crudl = initCrudl(crudlSelector);

  crudl.elements
  .on(crudl.settings.events['edit-starts'], function () {
    $others.xhide({ effect: 'height', duration: 'slow' });
  })
  .on(crudl.settings.events['edit-ends'], function () {
    $others.xshow({ effect: 'height', duration: 'slow' });
  })
  .on(crudl.settings.events['editor-ready'], function (e, editor) {
    // Done after a small delay to let the editor be visible
    // and setup work as expected
    setTimeout(function () {
      editFormSetup(editor);
    }, 100);
  });

};

function editFormSetup(f) {
  var repeat = f.find('[name=repeat]').change(function () {
    var a = f.find('.repeat-options');
    if (this.checked)
      a.slideDown('fast');
    else
      a.slideUp('fast');
  });
  var allday = f.find('[name=allday]').change(function () {
    var a = f
    .find('[name=starttime],[name=endtime]')
    .prop('disabled', this.checked);
    if (this.checked)
      a.hide('fast');
    else
      a.show('fast');
  });
  var repeatFrequency = f.find('[name=repeat-frequency]').change(function () {
    var freq = $(this).children(':selected');
    var unit = freq.data('unit');
    f
    .find('.repeat-frequency-unit')
    .text(unit);
    // If there is no unit, there is not interval/repeat-every field:
    var interval = f.find('.repeat-every');
    if (unit)
      interval.show('fast');
    else
      interval.hide('fast');
    // Show frequency-extra, if there is someone
    f.find('.frequency-extra-' + freq.val()).slideDown('fast');
    // Hide all other frequency-extra
    f.find('.frequency-extra:not(.frequency-extra-' + freq.val() + ')').slideUp('fast');
  });
  // auto-select some options when its value change
  f.find('[name=repeat-ocurrences]').change(function () {
    f.find('[name=repeat-ends][value=ocurrences]').prop('checked', true);
  });
  f.find('[name=repeat-end-date]').change(function () {
    f.find('[name=repeat-ends][value=date]').prop('checked', true);
  });
  // start-date trigger
  f.find('[name=startdate]').on('change', function () {
    // auto fill enddate with startdate when this last is updated
    f.find('[name=enddate]').val(this.value);
    // if no week-days or only one, auto-select the day that matchs start-date
    var weekDays = f.find('.weekly-extra .week-days input');
    if (weekDays.are(':checked', { until: 1 })) {
      var date = $(this).datepicker("getDate");
      if (date) {
        weekDays.prop('checked', false);
        weekDays.filter('[value=' + date.getDay() + ']').prop('checked', true);
      }
    }
  });

  // Init:
  repeat.change();
  allday.change();
  repeatFrequency.change();
  // add date pickers
  applyDatePicker();
  // add placeholder support (polyfill)
  f.find(':input').placeholder();
}
},{}],12:[function(require,module,exports){
/**
  Requesting a background check through the backgroundCheckEdit form inside about-you/verifications.
**/
var $ = require('jquery');

/**
  Setup the DOM elements in the container @$c
  with the background-check-request logic.
**/
exports.setupForm = function setupFormBackgroundCheck($c) {

  var selectedItem = null;

  $c.on('click', '.buy-action', function (e) {
    e.preventDefault();
    
    var f = $c.find('.DashboardBackgroundCheck-requestForm');
    var bcid = $(this).data('background-check-id');
    selectedItem = $(this).closest('.DashboardBackgroundCheck-item');
    var ps1 = $c.find('.popup.buy-step-1');

    f.find('[name=BackgroundCheckID]').val(bcid);
    f.find('.main-action').val($(this).text());

    smoothBoxBlock.open(ps1, $c, 'background-check');
  });

  $c.on('ajaxSuccessPost', '.DashboardBackgroundCheck-requestForm', function (e, data, text, jx, ctx) {
    if (data.Code === 110) {
      var ps2 = $c.find('.popup.buy-step-2');
      var box = smoothBoxBlock.open(ps2, $c, 'background-check');
      // Remove from the list the requested item
      selectedItem.remove();
      // Force viewer list reload
      $c.trigger('reloadList');
      // If there is no more items in the list:
      if ($c.find('.DashboardBackgroundCheck-item').length === 0) {
        // the close button on the popup must close the editor too:
        box.find('.close-action').addClass('crudl-cancel');
        // The action box must disappear
        $c.closest('.crudl').find('.BackgroundCheckActionBox').remove();
      }
    }
  });

};
},{}],13:[function(require,module,exports){
/** Availability: Calendar Sync section setup
**/
var $ = require('jquery');

exports.on = function (containerSelector) {
    containerSelector = containerSelector || '.DashboardCalendarSync';
    var container = $(containerSelector),
        fieldSelector = '.DashboardCalendarSync-privateUrlField',
        buttonSelector = '.DashboardCalendarSync-reset-action';

    // Selecting private-url field value on focus and click:
    container.find(fieldSelector).on('focus click', function () {
        this.select();
    });

    // Reseting private-url
    container
  .on('click', buttonSelector, function () {

      var t = $(this),
      url = t.attr('href'),
      field = container.find(fieldSelector);

      field.val('');

      function onerror() {
          field.val(field.data('error-message'));
      }

      $.getJSON(url, function (data) {
          if (data && data.Code === 0) {
              field.val(data.Result).change();
              field[0].select();
          } else {
              onerror();
          }
      }).fail(onerror);

      return false;
  });
};
},{}],14:[function(require,module,exports){
/** changeProfilePhoto, it uses 'uploader' using html5, ajax and a specific page
  to manage server-side upload of a new user profile photo.
**/
var $ = require('jquery');
require('jquery.blockUI');
var smoothBoxBlock = require('LC/smoothBoxBlock');
// TODO: reimplement this and the server-side file to avoid iframes and exposing global functions,
// direct API use without iframe-normal post support (current browser matrix allow us this?)
// TODO: implement as real modular, next are the knowed modules in use but not loading that are expected
// to be in scope right now but must be used with the next code uncommented.
// require('uploader');
// require('LcUrl');
// var blockPresets = require('../LC/blockPresets')
// var ajaxForms = require('../LC/ajaxForms');

exports.on = function (containerSelector) {
    var $c = $(containerSelector),
        userPhotoPopup;

    $c.on('click', '[href="#change-profile-photo"]', function () {
        userPhotoPopup = popup(LcUrl.LangPath + 'dashboard/AboutYou/ChangePhoto/', { width: 700, height: 670 }, null, null, { autoFocus: false });
        return false;
    });

    // NOTE: We are exposing global functions from here because the server page/iframe expects this
    // to work.
    // TODO: refactor to avoid this way.
    window.reloadUserPhoto = function reloadUserPhoto() {
        $c.find('.DashboardPublicBio-photo .avatar').each(function () {
            var src = this.getAttribute('src');
            // avoid cache this time
            src = src + "?v=" + (new Date()).getTime();
            this.setAttribute('src', src);
        });
    };

    window.closePopupUserPhoto = function closePopupUserPhoto() {
        if (userPhotoPopup) {
            userPhotoPopup.find('.close-popup').trigger('click');
        }
    };

    window.deleteUserPhoto = function deleteUserPhoto() {

        $.unblockUI();
        smoothBoxBlock.open($('<div/>').html(LC.blockPresets.loading.message), $('body'), '', { center: 'horizontal' });

        $.ajax({
            url: LcUrl.LangUrl + "dashboard/AboutYou/ChangePhoto/?delete=true",
            method: "GET",
            cache: false,
            dataType: "json",
            success: function (data) {
                var content = (data.Code === 0 ? data.Result : data.Result.ErrorMessage);

                smoothBoxBlock.open($('<div/>').text(content), $('body'), '', { closable: true, center: 'horizontal' });

                reloadUserPhoto();
            },
            error: ajaxErrorPopupHandler
        });
    };

};

},{}],15:[function(require,module,exports){
/** Education page setup for CRUDL use
**/
var $ = require('jquery');
//require('LC/jquery.xtsh');
require('jquery-ui');

// TODO: Replace by real require and not global LC:
//var ajaxForms = require('../LC/ajaxForms');
//var crudl = require('../LC/crudl').setup(ajaxForms.onSuccess, ajaxForms.onError, ajaxForms.onComplete);
//LC.initCrudl = crudl.on;
var initCrudl = LC.initCrudl;

exports.on = function (containerSelector) {
  var $c = $(containerSelector),
    sectionSelector = '.DashboardEducation',
    $section = $c.find(sectionSelector).closest('.DashboardSection-page-section'),
    $others = $section.siblings()
        .add($section.find('.DashboardSection-page-section-introduction'))
        .add($section.closest('.DashboardAboutYou').siblings());

  var crudl = initCrudl(sectionSelector);
  //crudl.settings.effects['show-viewer'] = { effect: 'height', duration: 'slow' };

  crudl.elements
  .on(crudl.settings.events['edit-starts'], function () {
    $others.xhide({ effect: 'height', duration: 'slow' });
  })
  .on(crudl.settings.events['edit-ends'], function () {
    $others.xshow({ effect: 'height', duration: 'slow' });
  })
  .on(crudl.settings.events['editor-ready'], function (e, $editor) {
    // Setup autocomplete
    $editor.find('[name=institution]').autocomplete({
      source: LcUrl.JsonPath + 'GetInstitutions/Autocomplete/',
      autoFocus: false,
      delay: 200,
      minLength: 5
    });
  });
};

},{}],16:[function(require,module,exports){
/**
  generateBookNowButton: with the proper html and form
  regenerates the button source-code and preview automatically.
**/
var $ = require('jquery');

exports.on = function (containerSelector) {
  var c = $(containerSelector);

  function regenerateButtonCode() {
    var
      size = c.find('[name=size]:checked').val(),
      positionid = c.find('[name=positionid]:checked').val(),
      sourceContainer = c.find('[name=button-source-code]'),
      previewContainer = c.find('.DashboardBookNowButton-buttonSizes-preview'),
      buttonTpl = c.find('.DashboardBookNowButton-buttonCode-buttonTemplate').text(),
      linkTpl = c.find('.DashboardBookNowButton-buttonCode-linkTemplate').text(),
      tpl = (size == 'link-only' ? linkTpl : buttonTpl),
      tplVars = $('.DashboardBookNowButton-buttonCode');

    previewContainer.html(tpl);
    previewContainer.find('a').attr('href',
      tplVars.data('base-url') + (positionid ? positionid + '/' : ''));
    previewContainer.find('img').attr('src',
      tplVars.data('base-src') + size);
    sourceContainer.val(previewContainer.html().trim());
  }

  // First generation
  if (c.length > 0) regenerateButtonCode();
  // and on any form change
  c.on('change', 'input', regenerateButtonCode);
};
},{}],17:[function(require,module,exports){
/** Licenses page setup for CRUDL use
**/
var $ = require('jquery');

// TODO: Replace by real require and not global LC:
//var ajaxForms = require('../LC/ajaxForms');
//var crudl = require('../LC/crudl').setup(ajaxForms.onSuccess, ajaxForms.onError, ajaxForms.onComplete);
//LC.initCrudl = crudl.on;
var initCrudl = LC.initCrudl;

exports.on = function (containerSelector) {
  var $c = $(containerSelector),
    licensesSelector = '.DashboardLicenses',
    $licenses = $c.find(licensesSelector).closest('.DashboardSection-page-section'),
    $others = $licenses.siblings()
      .add($licenses.find('.DashboardSection-page-section-introduction'))
      .add($licenses.closest('.DashboardYourWork').siblings());

  var crudl = initCrudl(licensesSelector);

  crudl.elements
  .on(crudl.settings.events['edit-starts'], function () {
    $others.xhide({ effect: 'height', duration: 'slow' });
  })
  .on(crudl.settings.events['edit-ends'], function () {
    $others.xshow({ effect: 'height', duration: 'slow' });
  });
};

},{}],18:[function(require,module,exports){
/** Locations page setup for CRUDL use
**/
var $ = require('jquery');
var mapReady = require('LC/googleMapReady');
// Indirectly used: require('LC/hasConfirmSupport');

// TODO: Replace by real require and not global LC:
//var ajaxForms = require('../LC/ajaxForms');
//var crudl = require('../LC/crudl').setup(ajaxForms.onSuccess, ajaxForms.onError, ajaxForms.onComplete);
//LC.initCrudl = crudl.on;
var initCrudl = LC.initCrudl;

exports.on = function (containerSelector) {
  var $c = $(containerSelector),
    locationsSelector = '.DashboardLocations',
    $locations = $c.find(locationsSelector).closest('.DashboardSection-page-section'),
    $others = $locations.siblings()
      .add($locations.find('.DashboardSection-page-section-introduction'))
      .add($locations.closest('.DashboardYourWork').siblings());

  var crudl = initCrudl(locationsSelector);

  var locationMap;

  crudl.elements
  .on(crudl.settings.events['edit-starts'], function () {
    $others.xhide({ effect: 'height', duration: 'slow' });
  })
  .on(crudl.settings.events['edit-ends'], function () {
    $others.xshow({ effect: 'height', duration: 'slow' });
  })
  .on(crudl.settings.events['editor-ready'], function (e, $editor) {
    //Force execution of the 'has-confirm' script
    $editor.find('fieldset.has-confirm > .confirm input').change();

    setupCopyLocation($editor);

    locationMap = setupGeopositioning($editor);
  })
  .on(crudl.settings.events['editor-showed'], function (e, $editor) {
    if (locationMap)
      mapReady.refreshMap(locationMap);
  });
};

function setupCopyLocation($editor) {
  $editor.find('select.copy-location').change(function () {
    var $t = $(this);
    $t.closest('.crudl-form').reload(function () {
      return (
        $(this).data('ajax-fieldset-action').replace(/LocationID=\d+/gi, 'LocationID=' + $t.val()) +
        '&' + $t.data('extra-query')
      );
    });
  });
}

/** Locate user position or translate address text into a geocode using
  browser and Google Maps services.
**/
function setupGeopositioning($editor) {
  var map;
  mapReady(function () {

    // Register if user selects or writes a position (to not overwrite it with automatic positioning)
    var positionedByUser = false;
    // Some confs
    var detailedZoomLevel = 17;
    var generalZoomLevel = 9;
    var foundLocations = {
      byUser: null,
      byGeolocation: null,
      byGeocode: null,
      original: null
    };

    var l = $editor.find('.location-map');
    var m = l.find('.map-selector > .google-map').get(0);
    var $lat = l.find('[name=latitude]');
    var $lng = l.find('[name=longitude]');

    // Creating position coordinates
    var myLatlng;
    (function () {
      var _lat_value = $lat.val(), _lng_value = $lng.val();
      if (_lat_value && _lng_value) {
        myLatlng = new google.maps.LatLng($lat.val(), $lng.val());
        // We consider as 'positioned by user' when there was a saved value for the position coordinates (we are editing a location)
        positionedByUser = (myLatlng.lat() !== 0 && myLatlng.lng() !== 0);
      } else {
        // Default position when there are not one (San Francisco just now):
        myLatlng = new google.maps.LatLng(37.75334439226298, -122.4254606035156);
      }
    })();
    // Remember original form location
    foundLocations.original = foundLocations.confirmed = myLatlng;

    // Create map
    var mapOptions = {
      zoom: (positionedByUser ? detailedZoomLevel : generalZoomLevel), // Best detail when we already had a location
      center: myLatlng,
      mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    map = new google.maps.Map(m, mapOptions);
    // Create the position marker
    var marker = new google.maps.Marker({
      position: myLatlng,
      map: map,
      draggable: false,
      animation: google.maps.Animation.DROP
    });
    // Listen when user clicks map or move the marker to move marker or set position in the form
    google.maps.event.addListener(marker, 'dragend', saveCoordinates);
    google.maps.event.addListener(map, 'click', function (event) {
      if (!marker.getDraggable()) return;
      placeMarker(event.latLng);
      positionedByUser = true;
      foundLocations.byUser = event.latLng;
    });
    function placeMarker(latlng, dozoom, autosave) {
      marker.setPosition(latlng);
      // Move map
      map.panTo(latlng);
      saveCoordinates(autosave);
      if (dozoom)
      // Set zoom to something more detailed
        map.setZoom(detailedZoomLevel);
      return marker;
    }
    function saveCoordinates(inForm) {
      var latLng = marker.getPosition();
      positionedByUser = true;
      foundLocations.byUser = latLng;
      if (inForm === true) {
        $lat.val(latLng.lat()); //marker.position.Xa
        $lng.val(latLng.lng()); //marker.position.Ya
      }
    }
    // Listen when user changes form coordinates values to update the map
    $lat.change(updateMapMarker);
    $lng.change(updateMapMarker);
    function updateMapMarker() {
      positionedByUser = true;
      var newPos = new google.maps.LatLng($lat.val(), $lng.val());
      // Move marker
      marker.setPosition(newPos);
      // Move map
      map.panTo(newPos);
    }

    /*===================
    * AUTO POSITIONING
    */
    function useGeolocation(force, autosave) {
      var override = force || !positionedByUser;
      // Use browser geolocation support to get an automatic location if there is no a location selected by user
      // Check to see if this browser supports geolocation.
      if (override && navigator.geolocation) {

        // This is the location marker that we will be using
        // on the map. Let's store a reference to it here so
        // that it can be updated in several places.
        var locationMarker = null;

        // Get the location of the user's browser using the
        // native geolocation service. When we invoke this method
        // only the first callback is requied. The second
        // callback - the error handler - and the third
        // argument - our configuration options - are optional.
        navigator.geolocation.getCurrentPosition(
          function (position) {
            // Check to see if there is already a location.
            // There is a bug in FireFox where this gets
            // invoked more than once with a cached result.
            if (locationMarker) {
              return;
            }

            // Move marker to the map using the position, only if user doesn't set a position
            if (override) {
              var latLng = new google.maps.LatLng(
                      position.coords.latitude,
                      position.coords.longitude
                  );
              locationMarker = placeMarker(latLng, true, autosave);
              foundLocations.byGeolocation = latLng;
            }
          },
          function (error) {
            if (console && console.log) console.log("Something went wrong: ", error);
          },
          {
            timeout: (5 * 1000),
            maximumAge: (1000 * 60 * 15),
            enableHighAccuracy: true
          }
        );


        // Now that we have asked for the position of the user,
        // let's watch the position to see if it updates. This
        // can happen if the user physically moves, of if more
        // accurate location information has been found (ex.
        // GPS vs. IP address).
        //
        // NOTE: This acts much like the native setInterval(),
        // invoking the given callback a number of times to
        // monitor the position. As such, it returns a "timer ID"
        // that can be used to later stop the monitoring.
        var positionTimer = navigator.geolocation.watchPosition(
                  function (position) {
                    // Move again to the new or accurated position, if user doesn't set a position
                    if (override) {
                      var latLng = new google.maps.LatLng(
                              position.coords.latitude,
                              position.coords.longitude
                          );
                      locationMarker = placeMarker(latLng, true, autosave);
                      foundLocations.byGeolocation = latLng;
                    } else
                      navigator.geolocation.clearWatch(positionTimer);
                  }
              );

        // If the position hasn't updated within 5 minutes, stop
        // monitoring the position for changes.
        setTimeout(
                  function () {
                    // Clear the position watcher.
                    navigator.geolocation.clearWatch(positionTimer);
                  },
                  (1000 * 60 * 5)
              );
      } // Ends geolocation position
    }
    function useGmapsGeocode(initialLookup, autosave) {
      var geocoder = new google.maps.Geocoder();

      // lookup on address fields changes with complete information
      var $form = $editor.find('.crudl-form'), form = $form.get(0);
      function getFormAddress() {
        var ad = [];
        function add(field) {
          if (form.elements[field].value) ad.push(form.elements[field].value);
        }
        add('addressline1');
        add('addressline2');
        add('city');
        add('postalcode');
        var s = form.elements.state;
        if (s.value) ad.push(s.options[s.selectedIndex].label);
        ad.push('USA');
        // Minimum for valid address: 4 fields filled out
        return ad.length >= 5 ? ad.join(', ') : null;
      }
      $form.on('change', '[name=addressline1], [name=addressline2], [name=city], [name=postalcode], [name=state]', function () {
        var address = getFormAddress();
        if (address)
          geocodeLookup(address, false);
      });

      // Initial lookup
      if (initialLookup) {
        var address = getFormAddress();
        if (address)
          geocodeLookup(address, true);
      }

      function geocodeLookup(address, override) {
        geocoder.geocode({ 'address': address }, function (results, status) {
          if (status == google.maps.GeocoderStatus.OK) {
            var latLng = results[0].geometry.location;
            //console.info('Geocode retrieved: ' + latLng + ' for address "' + address + '"');
            foundLocations.byGeocode = latLng;

            placeMarker(latLng, true, autosave);
          } else {
            if (console && console.error) console.error('Geocode was not successful for the following reason: ' + status + ' on address "' + address + '"');
          }
        });
      }
    }

    // Executing auto positioning (changed to autosave:true to all time save the location):
    //useGeolocation(true, false);
    useGmapsGeocode(false, true);

    // Link options links:
    l.on('click', '.options a', function () {
      var target = $(this).attr('href').substr(1);
      switch (target) {
        case 'geolocation':
          if (foundLocations.byGeolocation)
            placeMarker(foundLocations.byGeolocation, true, true);
          else
            useGeolocation(true, true);
          break;
        case 'geocode':
          if (foundLocations.byGeocode)
            placeMarker(foundLocations.byGeocode, true, true);
          else
            useGmapsGeocode(true, true);
          break;
        case 'confirm':
          saveCoordinates(true);
          marker.setDraggable(false);
          foundLocations.confirmed = marker.getPosition();
          l.find('.gps-lat, .gps-lng, .advice, .find-address-geocode').hide('fast');
          var edit = l.find('.edit-action');
          edit.text(edit.data('edit-label'));
          break;
        case 'editcoordinates':
          var a = l.find('.gps-lat, .gps-lng, .advice, .find-address-geocode');
          var b = !a.is(':visible');
          marker.setDraggable(b);
          var $t = $(this);
          if (b) {
            $t.data('edit-label', $t.text());
            $t.text($t.data('cancel-label'));
          } else {
            $t.text($t.data('edit-label'));
            // Restore location:
            placeMarker(foundLocations.confirmed, true, true);
          }
          a.toggle('fast');
          break;
      }

      return false;
    });
  });

  return map;
}
},{}],19:[function(require,module,exports){
/** UI logic to manage provider photos (your-work/photos).
**/
var $ = require('jquery');
require('jquery-ui');
var smoothBoxBlock = require('LC/smoothBoxBlock');
var changesNotification = require('LC/changesNotification');

var sectionSelector = '.DashboardPhotos';
// On init, the default 'no image' image src will be get it on:
var defaultImgSrc = null;

exports.on = function (containerSelector) {
    var $c = $(containerSelector);

    setupCrudlDelegates($c);

    initElements($c);

    // Any time that the form content html is reloaded,
    // re-initialize elements
    $c.on('ajaxFormReturnedHtml', 'form.ajax', function () {
        initElements($c);
    });
};

function save(data) {
    
    var editPanel = $(sectionSelector);

    return $.ajax({
        url: editPanel.data('ajax-fieldset-action'),
        data: data,
        type: 'post',
        success: function (data) {
            if (data && data.Code < 0) {
                // new error for Promise-attached callbacks
                throw new Error(data.ErrorMessage);
            } else {
                return data;
            }
        },
        error: function (xhr, text, error) {
            // TODO: better error management, saving
            alert('Sorry, there was an error. ' + (error || ''));
        }
    });
}

function saveEditedPhoto($f) {

    var id = $f.find('[name=PhotoID]').val(),
        caption = $f.find('[name=photo-caption]').val(),
        isPrimary = $f.find('[name=is-primary-photo]').val() === 'True';

    if (id && id > 0) {
        // Ajax save
        save({
            PhotoID: id,
            'photo-caption': caption,
            'is-primary-photo': isPrimary,
        });
        // Update cache at gallery item
        var $item = $f.find('.positionphotos-gallery #UserPhoto-' + id);
        if ($item && $item.length) {
            $item.attr('alt', caption);
            if (isPrimary)
                $item.addClass('is-primary-photo');
            else
                $item.removeClass('is-primary-photo');
        }
    }
}

function editSelectedPhoto(form, selected) {

    var editPanel = $('.positionphotos-edit', form);

    // Use given @selected or look for a selected photo in the list
    selected = selected && selected.length ? selected : $('.positionphotos-gallery > ol > li.selected', form);

    // Mark this as selected
    selected.addClass('selected').siblings().removeClass('selected');

    if (selected && selected.length > 0) {
        var selImg = selected.find('img');
        // Moving selected to be edit panel
        var photoID = selected.attr('id').match(/^UserPhoto-(\d+)$/)[1];
        editPanel.find('[name=PhotoID]').val(photoID);
        editPanel.find('img').attr('src', selImg.attr('src') + '?size=normal');
        editPanel.find('[name=photo-caption]').val(selImg.attr('alt'));
        var isPrimaryValue = selected.hasClass('is-primary-photo') ? 'True' : 'False';
        editPanel.find('[name=is-primary-photo]').prop('checked', false);
        editPanel.find('[name=is-primary-photo][value=' + isPrimaryValue + ']').prop('checked', true);
    } else {
        if (form.find('.positionphotos-gallery > ol > li').length === 0) {
            smoothBoxBlock.open(form.find('.no-photos'), editPanel, '', { autofocus: false });
        } else {
            smoothBoxBlock.open(form.find('.no-primary-photo'), editPanel, '', { autofocus: false });
        }
        // No image:
        editPanel.find('img').attr('src', defaultImgSrc);
        // Reset hidden fields manually to avoid browser memory breaking things
        editPanel.find('[name=PhotoID]').val('');
        editPanel.find('[name=photo-caption]').val('');
        editPanel.find('[name=is-primary-photo]').prop('checked', false);
    }
}

/* Setup the code that works on the different CRUDL actions on the photos.
  All this are delegates, only need to be setup once on the page
  (if the container $c is not replaced, only the contents, doesn't need to call again this).
*/
function setupCrudlDelegates($c) {
    $c
    .on('change', '.positionphotos-edit input', function () {
        // Instant saving on user changes to the editing form
        var $f = $(this).closest('.positionphotos-edit');
        saveEditedPhoto($f);
    })
    .on('click', '.positionphotos-tools-upload > a', function () {
        var posID = $(this).closest('form').find('input[name=positionID]').val();
        popup(LcUrl.LangPath + 'dashboard/YourWork/UploadPhoto/?PositionID=' + posID, 'small');
        return false;
    })
    .on('click', '.positionphotos-gallery li a', function () {
        var $t = $(this);
        var form = $t.closest(sectionSelector);
        // Don't lost latest changes:
        saveEditedPhoto(form);

        smoothBoxBlock.closeAll(form);
        // Set this photo as selected
        var selected = $t.closest('li');
        editSelectedPhoto(form, selected);

        return false;
    })
    .on('click', '.positionphotos-edit-delete a', function () {

        var editPanel = $(this).closest('.positionphotos-edit');
        var form = editPanel.closest(sectionSelector);

        var photoID = editPanel.find('[name=PhotoID]').val();
        var $photoItem = form.find('#UserPhoto-' + photoID);

        // Instant saving
        save({
            PhotoID: photoID,
            'delete-photo': 'True',
            result: 'json'
        })
        .then(function () {
            // Remove item
            $photoItem.remove();

            editSelectedPhoto(form);
        });

        return false;
    });
}

/* Initialize the photos elements to be sortables, set the primary photo
  in the highlighted are and initialize the 'delete photo' flag.
  This is required to be executed any time the elements html is replaced
  because needs direct access to the DOM elements.
*/
function initElements(form) {
    // Prepare sortable script
    $(".positionphotos-gallery > ol", form).sortable({
        placeholder: "ui-state-highlight",
        update: function () {
            // Get photo order, a comma separated value of items IDs
            var order = $(this).sortable("toArray").toString();
            // Set order in the form element, to be sent later with the form
            $(this).closest(sectionSelector)
            .find('[name=gallery-order]')
            .val(order)
            // With instant saving, no more notify change for ChangesNotifier, so commenting:
            //.change()
            ;

            // Instant saving
            save({
                'gallery-order': order,
                action: 'order',
                result: 'json'
            });
        }
    });

    defaultImgSrc = form.find('img').attr('src');

    // Set primary photo to be edited
    editSelectedPhoto(form);

    // Reset delete option
    form.find('[name=delete-photo]').val('False');
}

},{}],20:[function(require,module,exports){
/** Availability: Weekly Schedule section setup
**/
var $ = require('jquery');
var availabilityCalendar = require('LC/availabilityCalendar');
var batchEventHandler = require('LC/batchEventHandler');

exports.on = function () {

    var monthlyList = availabilityCalendar.Monthly.enableAll();

    $.each(monthlyList, function (i, v) {
        var monthly = this;

        // Setuping the calendar data field
        var form = monthly.$el.closest('form.ajax,fieldset.ajax');
        var field = form.find('[name=monthly]');
        if (field.length === 0)
            field = $('<input type="hidden" name="monthly" />').insertAfter(monthly.$el);

        // Save when the form is to be submitted
        form.on('presubmit', function () {
            field.val(JSON.stringify(monthly.getUpdatedData()));
        });

        // Updating field on calendar changes (using batch to avoid hurt performance)
        // and raise change event (this fixes the support for changesNotification
        // and instant-saving).
        monthly.events.on('dataChanged', batchEventHandler(function () {
            field
            .val(JSON.stringify(monthly.getUpdatedData()))
            .change();
        }));
    });
};
},{}],21:[function(require,module,exports){
/**
payment: with the proper html and form
regenerates the button source-code and preview automatically.
**/
var $ = require('jquery');
require('jquery.formatter');

exports.on = function onPaymentAccount(containerSelector) {
  var $c = $(containerSelector);

  var finit = function () {

    // Initialize the formatters on page-ready..
    initFormatters($c);

    changePaymentMethod($c);

  };
  $(finit);
  // and any ajax-post of the form that returns new html:
  $c.on('ajaxFormReturnedHtml', 'form.ajax', finit);
};

/** Initialize the field formatters required by the payment-account-form, based
  on the fields names.
**/
function initFormatters($container) {
  $container.find('[name="birthdate"]').formatter({
    'pattern': '{{99}}/{{99}}/{{9999}}',
    'persistent': false
  });
  $container.find('[name="ssn"]').formatter({
    'pattern': '{{999}}-{{99}}-{{9999}}',
    'persistent': false
  });
}

function changePaymentMethod($container) {

  var $bank = $container.find('.DashboardPaymentAccount-bank'),
    $els = $container.find('.DashboardPaymentAccount-changeMethod')
    .add($bank);

  $container.find('.Actions--changePaymentMethod').on('click', function () {
    $els.toggleClass('is-venmoAccount is-bankAccount');

    if ($bank.hasClass('is-venmoAccount')) {
      // Remove and save numbers
      $bank.find('input').val(function (i, v) {
        $(this).data('prev-val', v);
        return '';
      });
    } else {
      // Restore numbers
      $bank.find('input').val(function (i, v) {
        return $(this).data('prev-val');
      });
    }
  });

}
},{}],22:[function(require,module,exports){
/** Pricing page setup for CRUDL use
**/
var $ = require('jquery');
var TimeSpan = require('LC/TimeSpan');
require('LC/TimeSpanExtra').plugIn(TimeSpan);
var updateTooltips = require('LC/tooltips').updateTooltips;

// TODO: Replace by real require and not global LC:
//var ajaxForms = require('../LC/ajaxForms');
//var crudl = require('../LC/crudl').setup(ajaxForms.onSuccess, ajaxForms.onError, ajaxForms.onComplete);
//LC.initCrudl = crudl.on;
var initCrudl = LC.initCrudl;

exports.on = function (pricingSelector) {
  pricingSelector = pricingSelector || '.DashboardPricing';
  var $pricing = $(pricingSelector).closest('.DashboardSection-page-section'),
    $others = $pricing.siblings()
      .add($pricing.find('.DashboardSection-page-section-introduction'))
      .add($pricing.closest('.DashboardYourWork').siblings());

  var crudl = initCrudl(pricingSelector);

  crudl.elements
  .on(crudl.settings.events['edit-starts'], function () {
    $others.xhide({ effect: 'height', duration: 'slow' });
  })
  .on(crudl.settings.events['edit-ends'], function () {
    $others.xshow({ effect: 'height', duration: 'slow' });
  })
  .on(crudl.settings.events['editor-ready'], function (e, $editor) {

    setupNoPriceRateUpdates($editor);
    setupProviderPackageSliders($editor);
    updateTooltips();
    setupShowMoreAttributesLink($editor);

  });
};

/* Handler for change event on 'not to state price rate', updating related price rate fields.
  Its setuped per editor instance, not as an event delegate.
*/
function setupNoPriceRateUpdates($editor) {
  var 
    pr = $editor.find('[name=price-rate],[name=price-rate-unit]'),
    npr = $editor.find('[name=no-price-rate]');
  npr.on('change', function () {
    pr.prop('disabled', npr.prop('checked'));
  });
  // Initial state:
  npr.change();
}

/** Setup the UI Sliders on the editor.
**/
function setupProviderPackageSliders($editor) {

  /* Houseekeeper pricing */
  function updateAverage($c, minutes) {
    $c.find('[name=provider-average-time]').val(minutes);
    minutes = parseInt(minutes);
    $c.find('.preview .time').text(TimeSpan.fromMinutes(minutes).toSmartString());
  }

  $editor.find(".provider-average-time-slider").each(function () {
    var $c = $(this).closest('[data-slider-value]');
    var average = $c.data('slider-value'),
      step = $c.data('slider-step') || 1;
    if (!average) return;
    var setup = {
      range: "min",
      value: average,
      min: average - 3 * step,
      max: average + 3 * step,
      step: step,
      slide: function (event, ui) {
        updateAverage($c, ui.value);
      }
    };
    var slider = $(this).slider(setup);

    $c.find('.provider-average-time').on('click', 'label', function () {
      var $t = $(this);
      if ($t.hasClass('below-average-label'))
        slider.slider('value', setup.min);
      else if ($t.hasClass('average-label'))
        slider.slider('value', setup.value);
      else if ($t.hasClass('above-average-label'))
        slider.slider('value', setup.max);
      updateAverage($c, slider.slider('value'));
    });

    // Setup the input field, hidden and with initial value synchronized with slider
    var field = $c.find('[name=provider-average-time]');
    field.hide();
    var currentValue = field.val() || average;
    updateAverage($c, currentValue);
    slider.slider('value', currentValue);
  });
}

/** The in-editor link #show-more-attributes must show/hide the container of
  extra attributes for the package/pricing-item. This setups the required handler.
**/
function setupShowMoreAttributesLink($editor) {
  // Handler for 'show-more-attributes' button (used only on edit a package)
  $editor.find('.show-more-attributes').on('click', function () {
    var $t = $(this);
    var atts = $t.siblings('.services-not-checked');
    if (atts.is(':visible')) {
      $t.text($t.data('show-text'));
      atts.stop().hide('fast');
    } else {
      $t.text($t.data('hide-text'));
      atts.stop().show('fast');
    }
    return false;
  });
}
},{}],23:[function(require,module,exports){
/**
  privacySettings: Setup for the specific page-form dashboard/privacy/privacysettings
**/
var $ = require('jquery');
// TODO Implement dependencies comming from app.js instead of direct link
//var smoothBoxBlock = require('smoothBoxBlock');
// TODO Replace dom-ressources by i18n.getText

var privacy = {
  accountLinksSelector: '.DashboardPrivacySettings-myAccount a',
  ressourcesSelector: '.DashboardPrivacy-accountRessources'
};

module.exports = privacy;

privacy.on = function (containerSelector) {
  var $c = $(containerSelector);

  $c.on('click', '.cancel-action', function () {
    smoothBoxBlock.close($c);
  });

  $c.on('ajaxSuccessPostMessageClosed', '.ajax-box', function () {
    window.location.reload();
  });
  
  $c.on('click', privacy.accountLinksSelector, function () {

    var b,
      lres = $c.find(privacy.ressourcesSelector);

    switch ($(this).attr('href')) {
      case '#delete-my-account':
        b = smoothBoxBlock.open(lres.children('.delete-message-confirm').clone(), $c);
        break;
      case '#deactivate-my-account':
        b = smoothBoxBlock.open(lres.children('.deactivate-message-confirm').clone(), $c);
        break;
      case '#reactivate-my-account':
        b = smoothBoxBlock.open(lres.children('.reactivate-message-confirm').clone(), $c);
        break;
      default:
        return true;
    }
    if (b) {
      $('html,body').stop(true, true).animate({ scrollTop: b.offset().top }, 500, null);
    }
    return false;
  });

};
},{}],24:[function(require,module,exports){
/** Service Attributes Validation: implements validations through the 
  'customValidation' approach for 'position service attributes'.
  It validates the required attribute category, almost-one or select-one modes.
**/
var $ = require('jquery');
var getText = require('LC/getText');
var vh = require('LC/validationHelper');
var escapeJQuerySelectorValue = require('LC/jqueryUtils').escapeJQuerySelectorValue;

/** Enable validation of required service attributes on
  the form(s) specified by the selector or provided
**/
exports.setup = function setupServiceAttributesValidation(containerSelector, options) {
  var $c = $(containerSelector);
  options = $.extend({
    requiredSelector: '.DashboardServices-attributes-category.is-required',
    selectOneClass: 'js-validationSelectOne',
    groupErrorClass: 'is-error',
    valErrorTextKey: 'required-attribute-category-error'
  }, options);

  $c.each(function validateServiceAttributes() {
    var f = $(this);
    if (!f.is('form,fieldset')) {
      if (console && console.error) console.error('The element to apply validation must be a form or fieldset');
      return;
    }

    f.data('customValidation', {
      validate: function () {
        var valid = true, lastValid = true;
        var v = vh.findValidationSummary(f);

        f.find(options.requiredSelector).each(function () {
          var fs = $(this);
          var cat = fs.children('legend').text();
          // What type of validation apply?
          if (fs.is('.' + options.selectOneClass))
          // if the cat is a 'validation-select-one', a 'select' element with a 'positive'
          // :selected value must be checked
            lastValid = !!(fs.find('option:selected').val());
          else
          // Otherwise, look for 'almost one' checked values:
            lastValid = (fs.find('input:checked').length > 0);

          if (!lastValid) {
            valid = false;
            fs.addClass(options.groupErrorClass);
            var err = getText(options.valErrorTextKey, cat);
            if (v.find('li[title="' + escapeJQuerySelectorValue(cat) + '"]').length === 0)
              v.children('ul').append($('<li/>').text(err).attr('title', cat));
          } else {
            fs.removeClass(options.groupErrorClass);
            v.find('li[title="' + escapeJQuerySelectorValue(cat) + '"]').remove();
          }
        });

        if (valid) {
          vh.setValidationSummaryAsValid(f);
        } else {
          vh.setValidationSummaryAsError(f);
        }
        return valid;
      }
    });

  });
};

},{}],25:[function(require,module,exports){
/** It provides the code for the actions of the Verifications section.
**/
var $ = require('jquery');
require('jquery.blockUI');
//var LcUrl = require('../LC/LcUrl');
//var popup = require('../LC/popup');

var actions = exports.actions = {};

actions.facebook = function () {
  /* Facebook connect */
  var FacebookConnect = require('LC/FacebookConnect');
  var fb = new FacebookConnect({
    resultType: 'json',
    urlSection: 'Verify',
    appId: $('html').data('fb-appid'),
    permissions: 'email,user_about_me',
    loadingText: 'Verifing'
  });
  $(document).on(fb.connectedEvent, function () {
    $(document).on('popup-closed', function () {
      location.reload();
    });
  });
  fb.connect();
};

actions.email = function () {
  popup(LcUrl.LangPath + 'Account/$ResendConfirmationEmail/now/', popup.size('small'));
};

var links = exports.links = {
  '#connect-with-facebook': actions.facebook,
  '#confirm-email': actions.email
};

exports.on = function (containerSelector) {
  var $c = $(containerSelector);

  $c.on('click', 'a', function () {
    // Get the action link or empty
    var link = this.getAttribute('href') || '';

    // Execute the action attached to that link
    var action = links[link] || null;
    if (typeof (action) === 'function') {
      action();
      return false;
    }
  });
};

},{}],26:[function(require,module,exports){
/** Verifications page setup for CRUDL use
**/
var $ = require('jquery');

// TODO: Replace by real require and not global LC:
//var ajaxForms = require('../LC/ajaxForms');
//var crudl = require('../LC/crudl').setup(ajaxForms.onSuccess, ajaxForms.onError, ajaxForms.onComplete);
//LC.initCrudl = crudl.on;
var initCrudl = LC.initCrudl;

exports.on = function (containerSelector) {
  var $c = $(containerSelector),
    sectionSelector = '.DashboardVerifications',
    $section = $c.find(sectionSelector).closest('.DashboardSection-page-section'),
    $others = $section.siblings()
      .add($section.find('.DashboardSection-page-section-introduction'))
      .add($section.closest('.DashboardAboutYou').siblings());

  var crudl = initCrudl(sectionSelector);

  crudl.elements
  .on(crudl.settings.events['edit-starts'], function () {
    $others.xhide({ effect: 'height', duration: 'slow' });
  })
  .on(crudl.settings.events['edit-ends'], function () {
    $others.xshow({ effect: 'height', duration: 'slow' });
  })
  .on(crudl.settings.events['editor-ready'], function (e, $editor) {
    require('./backgroundCheckRequest').setupForm($editor.find('.DashboardBackgroundCheck'));
  });
};

},{"./backgroundCheckRequest":12}],27:[function(require,module,exports){
/** Availability: Weekly Schedule section setup
**/
var $ = require('jquery');
var availabilityCalendar = require('LC/availabilityCalendar');
var batchEventHandler = require('LC/batchEventHandler');

exports.on = function () {

    var workHoursList = availabilityCalendar.WorkHours.enableAll();

    $.each(workHoursList, function (i, v) {
        var workhours = this;

        // Setuping the WorkHours calendar data field
        var form = workhours.$el.closest('form.ajax, fieldset.ajax');
        var field = form.find('[name=workhours]');
        if (field.length === 0)
            field = $('<input type="hidden" name="workhours" />').insertAfter(workhours.$el);

        // Save when the form is to be submitted
        form.on('presubmit', function () {
            field.val(JSON.stringify(workhours.data));
        });

        // Updating field on calendar changes (using batch to avoid hurt performance)
        // and raise change event (this fixes the support for changesNotification
        // and instant-saving).
        workhours.events.on('dataChanged', batchEventHandler(function () {

            field
            .val(JSON.stringify(workhours.data))
            .change();
        }));

        // Disabling calendar on field alltime
        form.find('[name=alltime]').on('change', function () {
            var $t = $(this),
        cl = workhours.classes.disabled;
            if (cl)
                workhours.$el.toggleClass(cl, $t.prop('checked'));
        });

    });
};

},{}]},{},[9])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkM6XFxVc2Vyc1xcSWFnb1xcUHJveGVjdG9zXFxMb2Nvbm9taWNzLmNvbVxcc291cmNlXFx3ZWJcXG5vZGVfbW9kdWxlc1xcZ3J1bnQtYnJvd3NlcmlmeVxcbm9kZV9tb2R1bGVzXFxicm93c2VyaWZ5XFxub2RlX21vZHVsZXNcXGJyb3dzZXItcGFja1xcX3ByZWx1ZGUuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvTGNVcmwuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvUHJvdmlkZXJQb3NpdGlvbi5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9hdXRvRm9jdXMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvanF1ZXJ5Lnh0c2guanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvanF1ZXJ5VXRpbHMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvbW92ZUZvY3VzVG8uanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvc21vb3RoQm94QmxvY2suanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvdG9nZ2xlLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL2FwcC9kYXNoYm9hcmQuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvYXBwL2Rhc2hib2FyZC9hZGRQb3NpdGlvbi5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9hcHAvZGFzaGJvYXJkL2FwcG9pbnRtZW50c0NydWRsLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL2FwcC9kYXNoYm9hcmQvYmFja2dyb3VuZENoZWNrUmVxdWVzdC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9hcHAvZGFzaGJvYXJkL2NhbGVuZGFyU3luYy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9hcHAvZGFzaGJvYXJkL2NoYW5nZVByb2ZpbGVQaG90by5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9hcHAvZGFzaGJvYXJkL2VkdWNhdGlvbkNydWRsLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL2FwcC9kYXNoYm9hcmQvZ2VuZXJhdGVCb29rTm93QnV0dG9uLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL2FwcC9kYXNoYm9hcmQvbGljZW5zZXNDcnVkbC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9hcHAvZGFzaGJvYXJkL2xvY2F0aW9uc0NydWRsLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL2FwcC9kYXNoYm9hcmQvbWFuYWdlUGhvdG9zVUkuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvYXBwL2Rhc2hib2FyZC9tb250aGx5U2NoZWR1bGUuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvYXBwL2Rhc2hib2FyZC9wYXltZW50QWNjb3VudC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9hcHAvZGFzaGJvYXJkL3ByaWNpbmdDcnVkbC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9hcHAvZGFzaGJvYXJkL3ByaXZhY3lTZXR0aW5ncy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9hcHAvZGFzaGJvYXJkL3NlcnZpY2VBdHRyaWJ1dGVzVmFsaWRhdGlvbi5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9hcHAvZGFzaGJvYXJkL3ZlcmlmaWNhdGlvbnNBY3Rpb25zLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL2FwcC9kYXNoYm9hcmQvdmVyaWZpY2F0aW9uc0NydWRsLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL2FwcC9kYXNoYm9hcmQvd2Vla2x5U2NoZWR1bGUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0lBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0tBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdVQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZNQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qKiBJbXBsZW1lbnRzIGEgc2ltaWxhciBMY1VybCBvYmplY3QgbGlrZSB0aGUgc2VydmVyLXNpZGUgb25lLCBiYXNpbmdcclxuICAgIGluIHRoZSBpbmZvcm1hdGlvbiBhdHRhY2hlZCB0byB0aGUgZG9jdW1lbnQgYXQgJ2h0bWwnIHRhZyBpbiB0aGUgXHJcbiAgICAnZGF0YS1iYXNlLXVybCcgYXR0cmlidXRlICh0aGF0cyB2YWx1ZSBpcyB0aGUgZXF1aXZhbGVudCBmb3IgQXBwUGF0aCksXHJcbiAgICBhbmQgdGhlIGxhbmcgaW5mb3JtYXRpb24gYXQgJ2RhdGEtY3VsdHVyZScuXHJcbiAgICBUaGUgcmVzdCBvZiBVUkxzIGFyZSBidWlsdCBmb2xsb3dpbmcgdGhlIHdpbmRvdy5sb2NhdGlvbiBhbmQgc2FtZSBydWxlc1xyXG4gICAgdGhhbiBpbiB0aGUgc2VydmVyLXNpZGUgb2JqZWN0LlxyXG4qKi9cclxuXHJcbnZhciBiYXNlID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1iYXNlLXVybCcpLFxyXG4gICAgbGFuZyA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtY3VsdHVyZScpLFxyXG4gICAgbCA9IHdpbmRvdy5sb2NhdGlvbixcclxuICAgIHVybCA9IGwucHJvdG9jb2wgKyAnLy8nICsgbC5ob3N0O1xyXG4vLyBsb2NhdGlvbi5ob3N0IGluY2x1ZGVzIHBvcnQsIGlmIGlzIG5vdCB0aGUgZGVmYXVsdCwgdnMgbG9jYXRpb24uaG9zdG5hbWVcclxuXHJcbmJhc2UgPSBiYXNlIHx8ICcvJztcclxuXHJcbnZhciBMY1VybCA9IHtcclxuICAgIFNpdGVVcmw6IHVybCxcclxuICAgIEFwcFBhdGg6IGJhc2UsXHJcbiAgICBBcHBVcmw6IHVybCArIGJhc2UsXHJcbiAgICBMYW5nSWQ6IGxhbmcsXHJcbiAgICBMYW5nUGF0aDogYmFzZSArIGxhbmcgKyAnLycsXHJcbiAgICBMYW5nVXJsOiB1cmwgKyBiYXNlICsgbGFuZ1xyXG59O1xyXG5MY1VybC5MYW5nVXJsID0gdXJsICsgTGNVcmwuTGFuZ1BhdGg7XHJcbkxjVXJsLkpzb25QYXRoID0gTGNVcmwuTGFuZ1BhdGggKyAnSlNPTi8nO1xyXG5MY1VybC5Kc29uVXJsID0gdXJsICsgTGNVcmwuSnNvblBhdGg7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IExjVXJsOyIsIi8qKiBQcm92aWRlclBvc2l0aW9uIGNsYXNzXHJcbiAgSXQgcHJvdmlkZXMgbWluaW11biBsaWtlLWpxdWVyeSBldmVudCBsaXN0ZW5lcnNcclxuICB3aXRoIG1ldGhvZHMgJ29uJyBhbmQgJ29mZicsIGFuZCBpbnRlcm5hbGx5ICd0aGlzLmV2ZW50cydcclxuICBiZWluZyBhIGpRdWVyeS5DYWxsYmFja3MuXHJcbioqL1xyXG52YXIgXHJcbiAgJCA9IHJlcXVpcmUoJ2pxdWVyeScpLFxyXG4gIExjVXJsID0gcmVxdWlyZSgnLi9MY1VybCcpLFxyXG4gIHNtb290aEJveEJsb2NrID0gcmVxdWlyZSgnLi9zbW9vdGhCb3hCbG9jaycpLFxyXG4gIGFqYXhDYWxsYmFja3MgPSByZXF1aXJlKCdMQy9hamF4Q2FsbGJhY2tzJyk7XHJcblxyXG4vKiogQ29uc3RydWN0b3JcclxuKiovXHJcbnZhciBQcm92aWRlclBvc2l0aW9uID0gZnVuY3Rpb24gKHBvc2l0aW9uSWQpIHtcclxuICB0aGlzLnBvc2l0aW9uSWQgPSBwb3NpdGlvbklkO1xyXG5cclxuICAvLyBFdmVudHMgc3VwcG9ydCB0aHJvdWdoIGpxdWVyeS5DYWxsYmFja1xyXG4gIHRoaXMuZXZlbnRzID0gJC5DYWxsYmFja3MoKTtcclxuICB0aGlzLm9uID0gZnVuY3Rpb24gKCkgeyB0aGlzLmV2ZW50cy5hZGQuYXBwbHkodGhpcy5ldmVudHMsIEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMCkpOyByZXR1cm4gdGhpczsgfTtcclxuICB0aGlzLm9mZiA9IGZ1bmN0aW9uICgpIHsgdGhpcy5ldmVudHMucmVtb3ZlLmFwcGx5KHRoaXMuZXZlbnRzLCBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDApKTsgcmV0dXJuIHRoaXM7IH07XHJcbn07XHJcblxyXG4vLyBVc2luZyBkZWZhdWx0IGNvbmZpZ3VyYXRpb24gYXMgcHJvdG90eXBlXHJcblByb3ZpZGVyUG9zaXRpb24ucHJvdG90eXBlID0ge1xyXG4gIGRlY2xpbmVkTWVzc2FnZUNsYXNzOiAnaW5mbycsXHJcbiAgZGVjbGluZWRQb3B1cENsYXNzOiAncG9zaXRpb24tc3RhdGUtY2hhbmdlJyxcclxuICBzdGF0ZUNoYW5nZWRFdmVudDogJ3N0YXRlLWNoYW5nZWQnLFxyXG4gIHN0YXRlQ2hhbmdlZERlY2xpbmVkRXZlbnQ6ICdzdGF0ZS1jaGFuZ2VkLWRlY2xpbmVkJyxcclxuICByZW1vdmVGb3JtU2VsZWN0b3I6ICcuZGVsZXRlLW1lc3NhZ2UtY29uZmlybScsXHJcbiAgcmVtb3ZlRm9ybUNvbnRhaW5lcjogJy5EYXNoYm9hcmRTZWN0aW9uLXBhZ2UnLFxyXG4gIHJlbW92ZU1lc3NhZ2VDbGFzczogJ3dhcm5pbmcnLFxyXG4gIHJlbW92ZVBvcHVwQ2xhc3M6ICdwb3NpdGlvbi1zdGF0ZS1jaGFuZ2UnLFxyXG4gIHJlbW92ZWRFdmVudDogJ3JlbW92ZWQnLFxyXG4gIHJlbW92ZUZhaWxlZEV2ZW50OiAncmVtb3ZlLWZhaWxlZCdcclxufTtcclxuXHJcbi8qKiBjaGFuZ2VTdGF0ZSB0byB0aGUgb25lIGdpdmVuLCBpdCB3aWxsIHJhaXNlIGEgc3RhdGVDaGFuZ2VkRXZlbnQgb24gc3VjY2Vzc1xyXG4gIG9yIHN0YXRlQ2hhbmdlZERlY2xpbmVkRXZlbnQgb24gZXJyb3IuXHJcbiAgQHN0YXRlOiAnb24nIG9yICdvZmYnXHJcbioqL1xyXG5Qcm92aWRlclBvc2l0aW9uLnByb3RvdHlwZS5jaGFuZ2VTdGF0ZSA9IGZ1bmN0aW9uIGNoYW5nZVBvc2l0aW9uU3RhdGUoc3RhdGUpIHtcclxuICB2YXIgcGFnZSA9IHN0YXRlID09ICdvbicgPyAnJFJlYWN0aXZhdGUnIDogJyREZWFjdGl2YXRlJztcclxuICB2YXIgJGQgPSAkKCcjbWFpbicpO1xyXG4gIHZhciB0aGF0ID0gdGhpcztcclxuICB2YXIgY3R4ID0geyBmb3JtOiAkZCwgYm94OiAkZCB9O1xyXG4gICQuYWpheCh7XHJcbiAgICB1cmw6IExjVXJsLkxhbmdQYXRoICsgJ2Rhc2hib2FyZC9wb3NpdGlvbi8nICsgcGFnZSArICcvP1Bvc2l0aW9uSUQ9JyArIHRoaXMucG9zaXRpb25JZCxcclxuICAgIGNvbnRleHQ6IGN0eCxcclxuICAgIGVycm9yOiBhamF4Q2FsbGJhY2tzLmVycm9yLFxyXG4gICAgc3VjY2VzczogZnVuY3Rpb24gKGRhdGEsIHRleHQsIGp4KSB7XHJcbiAgICAgICRkLm9uZSgnYWpheFN1Y2Nlc3NQb3N0JywgZnVuY3Rpb24gKGV2ZW50LCBkYXRhLCB0LCBqLCBjdHgpIHtcclxuICAgICAgICBpZiAoZGF0YSAmJiBkYXRhLkNvZGUgPiAxMDApIHtcclxuICAgICAgICAgIGlmIChkYXRhLkNvZGUgPT0gMTAxKSB7XHJcbiAgICAgICAgICAgIHRoYXQuZXZlbnRzLmZpcmUoc3RhdGUpO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgLy8gU2hvdyBtZXNzYWdlOlxyXG4gICAgICAgICAgICB2YXIgbXNnID0gJCgnPGRpdi8+JykuYWRkQ2xhc3ModGhhdC5kZWNsaW5lZE1lc3NhZ2VDbGFzcykuYXBwZW5kKGRhdGEuUmVzdWx0Lk1lc3NhZ2UpO1xyXG4gICAgICAgICAgICBzbW9vdGhCb3hCbG9jay5vcGVuKG1zZywgJGQsIHRoYXQuZGVjbGluZWRQb3B1cENsYXNzLCB7IGNsb3NhYmxlOiB0cnVlLCBjZW50ZXI6IGZhbHNlLCBhdXRvZm9jdXM6IGZhbHNlIH0pO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcbiAgICAgIC8vIFByb2Nlc3MgdGhlIHJlc3VsdCwgdGhhdCBldmVudHVhbGx5IHdpbGwgY2FsbCBhamF4U3VjY2Vzc1Bvc3RcclxuICAgICAgYWpheENhbGxiYWNrcy5kb0pTT05BY3Rpb24oZGF0YSwgdGV4dCwgangsIGN0eCk7XHJcbiAgICB9XHJcbiAgfSk7XHJcbiAgcmV0dXJuIHRoaXM7XHJcbn07XHJcblxyXG4vKipcclxuICAgIERlbGV0ZSBwb3NpdGlvblxyXG4qKi9cclxuUHJvdmlkZXJQb3NpdGlvbi5wcm90b3R5cGUucmVtb3ZlID0gZnVuY3Rpb24gZGVsZXRlUG9zaXRpb24oKSB7XHJcblxyXG4gICAgdmFyIGMgPSAkKHRoaXMucmVtb3ZlRm9ybUNvbnRhaW5lciksXHJcbiAgICAgICAgZiA9IGMuZmluZCh0aGlzLnJlbW92ZUZvcm1TZWxlY3RvcikuZmlyc3QoKSxcclxuICAgICAgICBwb3B1cEZvcm0gPSBmLmNsb25lKCksXHJcbiAgICAgICAgdGhhdCA9IHRoaXM7XHJcblxyXG4gICAgcG9wdXBGb3JtLm9uZSgnYWpheFN1Y2Nlc3NQb3N0JywgJy5hamF4LWJveCcsIGZ1bmN0aW9uIChldmVudCwgZGF0YSkge1xyXG5cclxuICAgICAgICBmdW5jdGlvbiBub3RpZnkoKSB7XHJcbiAgICAgICAgICAgIHN3aXRjaCAoZGF0YS5Db2RlKSB7XHJcbiAgICAgICAgICAgICAgICBjYXNlIDEwMTpcclxuICAgICAgICAgICAgICAgICAgICB0aGF0LmV2ZW50cy5maXJlKHRoYXQucmVtb3ZlZEV2ZW50LCBbZGF0YS5SZXN1bHRdKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIGNhc2UgMTAzOlxyXG4gICAgICAgICAgICAgICAgICAgIHRoYXQuZXZlbnRzLmZpcmUodGhhdC5yZW1vdmVGYWlsZWRFdmVudCwgW2RhdGEuUmVzdWx0XSk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChkYXRhICYmIGRhdGEuQ29kZSkge1xyXG5cclxuICAgICAgICAgICAgaWYgKGRhdGEuUmVzdWx0ICYmIGRhdGEuUmVzdWx0Lk1lc3NhZ2UpIHtcclxuICAgICAgICAgICAgICAgIHZhciBtc2cgPSAkKCc8ZGl2Lz4nKS5hZGRDbGFzcyh0aGF0LnJlbW92ZU1lc3NhZ2VDbGFzcykuYXBwZW5kKGRhdGEuUmVzdWx0Lk1lc3NhZ2UpO1xyXG4gICAgICAgICAgICAgICAgdmFyIGJveCA9IHNtb290aEJveEJsb2NrLm9wZW4obXNnLCBjLCB0aGF0LnJlbW92ZVBvcHVwQ2xhc3MsIHsgY2xvc2FibGU6IHRydWUsIGNlbnRlcjogZmFsc2UsIGF1dG9mb2N1czogZmFsc2UgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgYm94Lm9uKCd4aGlkZScsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICBub3RpZnkoKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgbm90aWZ5KCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gT3BlbiBjb25maXJtYXRpb24gZm9ybVxyXG4gICAgdmFyIGIgPSBzbW9vdGhCb3hCbG9jay5vcGVuKHBvcHVwRm9ybSwgYywgbnVsbCwgeyBjbG9zYWJsZTogdHJ1ZSB9KTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gUHJvdmlkZXJQb3NpdGlvbjsiLCIvKiBGb2N1cyB0aGUgZmlyc3QgZWxlbWVudCBpbiB0aGUgZG9jdW1lbnQgKG9yIGluIEBjb250YWluZXIpXHJcbndpdGggdGhlIGh0bWw1IGF0dHJpYnV0ZSAnYXV0b2ZvY3VzJyAob3IgYWx0ZXJuYXRpdmUgQGNzc1NlbGVjdG9yKS5cclxuSXQncyBmaW5lIGFzIGEgcG9seWZpbGwgYW5kIGZvciBhamF4IGxvYWRlZCBjb250ZW50IHRoYXQgd2lsbCBub3RcclxuZ2V0IHRoZSBicm93c2VyIHN1cHBvcnQgb2YgdGhlIGF0dHJpYnV0ZS5cclxuKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxuXHJcbmZ1bmN0aW9uIGF1dG9Gb2N1cyhjb250YWluZXIsIGNzc1NlbGVjdG9yKSB7XHJcbiAgICBjb250YWluZXIgPSAkKGNvbnRhaW5lciB8fCBkb2N1bWVudCk7XHJcbiAgICBjb250YWluZXIuZmluZChjc3NTZWxlY3RvciB8fCAnW2F1dG9mb2N1c10nKS5mb2N1cygpO1xyXG59XHJcblxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IGF1dG9Gb2N1czsiLCIvKiogRXh0ZW5kZWQgdG9nZ2xlLXNob3ctaGlkZSBmdW50aW9ucy5cclxuICAgIElhZ29TUkxAZ21haWwuY29tXHJcbiAgICBEZXBlbmRlbmNpZXM6IGpxdWVyeVxyXG4gKiovXHJcbihmdW5jdGlvbigpe1xyXG5cclxuICAgIC8qKiBJbXBsZW1lbnRhdGlvbjogcmVxdWlyZSBqUXVlcnkgYW5kIHJldHVybnMgb2JqZWN0IHdpdGggdGhlXHJcbiAgICAgICAgcHVibGljIG1ldGhvZHMuXHJcbiAgICAgKiovXHJcbiAgICBmdW5jdGlvbiB4dHNoKGpRdWVyeSkge1xyXG4gICAgICAgIHZhciAkID0galF1ZXJ5O1xyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBIaWRlIGFuIGVsZW1lbnQgdXNpbmcgalF1ZXJ5LCBhbGxvd2luZyB1c2Ugc3RhbmRhcmQgICdoaWRlJyBhbmQgJ2ZhZGVPdXQnIGVmZmVjdHMsIGV4dGVuZGVkXHJcbiAgICAgICAgICoganF1ZXJ5LXVpIGVmZmVjdHMgKGlzIGxvYWRlZCkgb3IgY3VzdG9tIGFuaW1hdGlvbiB0aHJvdWdoIGpxdWVyeSAnYW5pbWF0ZScuXHJcbiAgICAgICAgICogRGVwZW5kaW5nIG9uIG9wdGlvbnMuZWZmZWN0OlxyXG4gICAgICAgICAqIC0gaWYgbm90IHByZXNlbnQsIGpRdWVyeS5oaWRlKG9wdGlvbnMpXHJcbiAgICAgICAgICogLSAnYW5pbWF0ZSc6IGpRdWVyeS5hbmltYXRlKG9wdGlvbnMucHJvcGVydGllcywgb3B0aW9ucylcclxuICAgICAgICAgKiAtICdmYWRlJzogalF1ZXJ5LmZhZGVPdXRcclxuICAgICAgICAgKi9cclxuICAgICAgICBmdW5jdGlvbiBoaWRlRWxlbWVudChlbGVtZW50LCBvcHRpb25zKSB7XHJcbiAgICAgICAgICAgIHZhciAkZSA9ICQoZWxlbWVudCk7XHJcbiAgICAgICAgICAgIHN3aXRjaCAob3B0aW9ucy5lZmZlY3QpIHtcclxuICAgICAgICAgICAgICAgIGNhc2UgJ2FuaW1hdGUnOlxyXG4gICAgICAgICAgICAgICAgICAgICRlLmFuaW1hdGUob3B0aW9ucy5wcm9wZXJ0aWVzLCBvcHRpb25zKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIGNhc2UgJ2ZhZGUnOlxyXG4gICAgICAgICAgICAgICAgICAgICRlLmZhZGVPdXQob3B0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBjYXNlICdoZWlnaHQnOlxyXG4gICAgICAgICAgICAgICAgICAgICRlLnNsaWRlVXAob3B0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAvLyAnc2l6ZScgdmFsdWUgYW5kIGpxdWVyeS11aSBlZmZlY3RzIGdvIHRvIHN0YW5kYXJkICdoaWRlJ1xyXG4gICAgICAgICAgICAgICAgLy8gY2FzZSAnc2l6ZSc6XHJcbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgICAgICRlLmhpZGUob3B0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgJGUudHJpZ2dlcigneGhpZGUnLCBbb3B0aW9uc10pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgKiBTaG93IGFuIGVsZW1lbnQgdXNpbmcgalF1ZXJ5LCBhbGxvd2luZyB1c2Ugc3RhbmRhcmQgICdzaG93JyBhbmQgJ2ZhZGVJbicgZWZmZWN0cywgZXh0ZW5kZWRcclxuICAgICAgICAqIGpxdWVyeS11aSBlZmZlY3RzIChpcyBsb2FkZWQpIG9yIGN1c3RvbSBhbmltYXRpb24gdGhyb3VnaCBqcXVlcnkgJ2FuaW1hdGUnLlxyXG4gICAgICAgICogRGVwZW5kaW5nIG9uIG9wdGlvbnMuZWZmZWN0OlxyXG4gICAgICAgICogLSBpZiBub3QgcHJlc2VudCwgalF1ZXJ5LmhpZGUob3B0aW9ucylcclxuICAgICAgICAqIC0gJ2FuaW1hdGUnOiBqUXVlcnkuYW5pbWF0ZShvcHRpb25zLnByb3BlcnRpZXMsIG9wdGlvbnMpXHJcbiAgICAgICAgKiAtICdmYWRlJzogalF1ZXJ5LmZhZGVPdXRcclxuICAgICAgICAqL1xyXG4gICAgICAgIGZ1bmN0aW9uIHNob3dFbGVtZW50KGVsZW1lbnQsIG9wdGlvbnMpIHtcclxuICAgICAgICAgICAgdmFyICRlID0gJChlbGVtZW50KTtcclxuICAgICAgICAgICAgLy8gV2UgcGVyZm9ybXMgYSBmaXggb24gc3RhbmRhcmQgalF1ZXJ5IGVmZmVjdHNcclxuICAgICAgICAgICAgLy8gdG8gYXZvaWQgYW4gZXJyb3IgdGhhdCBwcmV2ZW50cyBmcm9tIHJ1bm5pbmdcclxuICAgICAgICAgICAgLy8gZWZmZWN0cyBvbiBlbGVtZW50cyB0aGF0IGFyZSBhbHJlYWR5IHZpc2libGUsXHJcbiAgICAgICAgICAgIC8vIHdoYXQgbGV0cyB0aGUgcG9zc2liaWxpdHkgb2YgZ2V0IGEgbWlkZGxlLWFuaW1hdGVkXHJcbiAgICAgICAgICAgIC8vIGVmZmVjdC5cclxuICAgICAgICAgICAgLy8gV2UganVzdCBjaGFuZ2UgZGlzcGxheTpub25lLCBmb3JjaW5nIHRvICdpcy12aXNpYmxlJyB0b1xyXG4gICAgICAgICAgICAvLyBiZSBmYWxzZSBhbmQgdGhlbiBydW5uaW5nIHRoZSBlZmZlY3QuXHJcbiAgICAgICAgICAgIC8vIFRoZXJlIGlzIG5vIGZsaWNrZXJpbmcgZWZmZWN0LCBiZWNhdXNlIGpRdWVyeSBqdXN0IHJlc2V0c1xyXG4gICAgICAgICAgICAvLyBkaXNwbGF5IG9uIGVmZmVjdCBzdGFydC5cclxuICAgICAgICAgICAgc3dpdGNoIChvcHRpb25zLmVmZmVjdCkge1xyXG4gICAgICAgICAgICAgICAgY2FzZSAnYW5pbWF0ZSc6XHJcbiAgICAgICAgICAgICAgICAgICAgJGUuYW5pbWF0ZShvcHRpb25zLnByb3BlcnRpZXMsIG9wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgY2FzZSAnZmFkZSc6XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gRml4XHJcbiAgICAgICAgICAgICAgICAgICAgJGUuY3NzKCdkaXNwbGF5JywgJ25vbmUnKVxyXG4gICAgICAgICAgICAgICAgICAgIC5mYWRlSW4ob3B0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBjYXNlICdoZWlnaHQnOlxyXG4gICAgICAgICAgICAgICAgICAgIC8vIEZpeFxyXG4gICAgICAgICAgICAgICAgICAgICRlLmNzcygnZGlzcGxheScsICdub25lJylcclxuICAgICAgICAgICAgICAgICAgICAuc2xpZGVEb3duKG9wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgLy8gJ3NpemUnIHZhbHVlIGFuZCBqcXVlcnktdWkgZWZmZWN0cyBnbyB0byBzdGFuZGFyZCAnc2hvdydcclxuICAgICAgICAgICAgICAgIC8vIGNhc2UgJ3NpemUnOlxyXG4gICAgICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgICAgICAvLyBGaXhcclxuICAgICAgICAgICAgICAgICAgICAkZS5jc3MoJ2Rpc3BsYXknLCAnbm9uZScpXHJcbiAgICAgICAgICAgICAgICAgICAgLnNob3cob3B0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgJGUudHJpZ2dlcigneHNob3cnLCBbb3B0aW9uc10pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLyoqIEdlbmVyaWMgdXRpbGl0eSBmb3IgaGlnaGx5IGNvbmZpZ3VyYWJsZSBqUXVlcnkudG9nZ2xlIHdpdGggc3VwcG9ydFxyXG4gICAgICAgICAgICB0byBzcGVjaWZ5IHRoZSB0b2dnbGUgdmFsdWUgZXhwbGljaXR5IGZvciBhbnkga2luZCBvZiBlZmZlY3Q6IGp1c3QgcGFzcyB0cnVlIGFzIHNlY29uZCBwYXJhbWV0ZXIgJ3RvZ2dsZScgdG8gc2hvd1xyXG4gICAgICAgICAgICBhbmQgZmFsc2UgdG8gaGlkZS4gVG9nZ2xlIG11c3QgYmUgc3RyaWN0bHkgYSBCb29sZWFuIHZhbHVlIHRvIGF2b2lkIGF1dG8tZGV0ZWN0aW9uLlxyXG4gICAgICAgICAgICBUb2dnbGUgcGFyYW1ldGVyIGNhbiBiZSBvbWl0dGVkIHRvIGF1dG8tZGV0ZWN0IGl0LCBhbmQgc2Vjb25kIHBhcmFtZXRlciBjYW4gYmUgdGhlIGFuaW1hdGlvbiBvcHRpb25zLlxyXG4gICAgICAgICAgICBBbGwgdGhlIG90aGVycyBiZWhhdmUgZXhhY3RseSBhcyBoaWRlRWxlbWVudCBhbmQgc2hvd0VsZW1lbnQuXHJcbiAgICAgICAgKiovXHJcbiAgICAgICAgZnVuY3Rpb24gdG9nZ2xlRWxlbWVudChlbGVtZW50LCB0b2dnbGUsIG9wdGlvbnMpIHtcclxuICAgICAgICAgICAgLy8gSWYgdG9nZ2xlIGlzIG5vdCBhIGJvb2xlYW5cclxuICAgICAgICAgICAgaWYgKHRvZ2dsZSAhPT0gdHJ1ZSAmJiB0b2dnbGUgIT09IGZhbHNlKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBJZiB0b2dnbGUgaXMgYW4gb2JqZWN0LCB0aGVuIGlzIHRoZSBvcHRpb25zIGFzIHNlY29uZCBwYXJhbWV0ZXJcclxuICAgICAgICAgICAgICAgIGlmICgkLmlzUGxhaW5PYmplY3QodG9nZ2xlKSlcclxuICAgICAgICAgICAgICAgICAgICBvcHRpb25zID0gdG9nZ2xlO1xyXG4gICAgICAgICAgICAgICAgLy8gQXV0by1kZXRlY3QgdG9nZ2xlLCBpdCBjYW4gdmFyeSBvbiBhbnkgZWxlbWVudCBpbiB0aGUgY29sbGVjdGlvbixcclxuICAgICAgICAgICAgICAgIC8vIHRoZW4gZGV0ZWN0aW9uIGFuZCBhY3Rpb24gbXVzdCBiZSBkb25lIHBlciBlbGVtZW50OlxyXG4gICAgICAgICAgICAgICAgJChlbGVtZW50KS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBSZXVzaW5nIGZ1bmN0aW9uLCB3aXRoIGV4cGxpY2l0IHRvZ2dsZSB2YWx1ZVxyXG4gICAgICAgICAgICAgICAgICAgIHRvZ2dsZUVsZW1lbnQodGhpcywgISQodGhpcykuaXMoJzp2aXNpYmxlJyksIG9wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKHRvZ2dsZSlcclxuICAgICAgICAgICAgICAgIHNob3dFbGVtZW50KGVsZW1lbnQsIG9wdGlvbnMpO1xyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICBoaWRlRWxlbWVudChlbGVtZW50LCBvcHRpb25zKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgLyoqIERvIGpRdWVyeSBpbnRlZ3JhdGlvbiBhcyB4dG9nZ2xlLCB4c2hvdywgeGhpZGVcclxuICAgICAgICAgKiovXHJcbiAgICAgICAgZnVuY3Rpb24gcGx1Z0luKGpRdWVyeSkge1xyXG4gICAgICAgICAgICAvKiogdG9nZ2xlRWxlbWVudCBhcyBhIGpRdWVyeSBtZXRob2Q6IHh0b2dnbGVcclxuICAgICAgICAgICAgICoqL1xyXG4gICAgICAgICAgICBqUXVlcnkuZm4ueHRvZ2dsZSA9IGZ1bmN0aW9uIHh0b2dnbGUodG9nZ2xlLCBvcHRpb25zKSB7XHJcbiAgICAgICAgICAgICAgICB0b2dnbGVFbGVtZW50KHRoaXMsIHRvZ2dsZSwgb3B0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIC8qKiBzaG93RWxlbWVudCBhcyBhIGpRdWVyeSBtZXRob2Q6IHhoaWRlXHJcbiAgICAgICAgICAgICoqL1xyXG4gICAgICAgICAgICBqUXVlcnkuZm4ueHNob3cgPSBmdW5jdGlvbiB4c2hvdyhvcHRpb25zKSB7XHJcbiAgICAgICAgICAgICAgICBzaG93RWxlbWVudCh0aGlzLCBvcHRpb25zKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgLyoqIGhpZGVFbGVtZW50IGFzIGEgalF1ZXJ5IG1ldGhvZDogeGhpZGVcclxuICAgICAgICAgICAgICoqL1xyXG4gICAgICAgICAgICBqUXVlcnkuZm4ueGhpZGUgPSBmdW5jdGlvbiB4aGlkZShvcHRpb25zKSB7XHJcbiAgICAgICAgICAgICAgICBoaWRlRWxlbWVudCh0aGlzLCBvcHRpb25zKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gRXhwb3J0aW5nOlxyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIHRvZ2dsZUVsZW1lbnQ6IHRvZ2dsZUVsZW1lbnQsXHJcbiAgICAgICAgICAgIHNob3dFbGVtZW50OiBzaG93RWxlbWVudCxcclxuICAgICAgICAgICAgaGlkZUVsZW1lbnQ6IGhpZGVFbGVtZW50LFxyXG4gICAgICAgICAgICBwbHVnSW46IHBsdWdJblxyXG4gICAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgLy8gTW9kdWxlXHJcbiAgICBpZih0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcclxuICAgICAgICBkZWZpbmUoWydqcXVlcnknXSwgeHRzaCk7XHJcbiAgICB9IGVsc2UgaWYodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpIHtcclxuICAgICAgICB2YXIgalF1ZXJ5ID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSB4dHNoKGpRdWVyeSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIC8vIE5vcm1hbCBzY3JpcHQgbG9hZCwgaWYgalF1ZXJ5IGlzIGdsb2JhbCAoYXQgd2luZG93KSwgaXRzIGV4dGVuZGVkIGF1dG9tYXRpY2FsbHkgICAgICAgIFxyXG4gICAgICAgIGlmICh0eXBlb2Ygd2luZG93LmpRdWVyeSAhPT0gJ3VuZGVmaW5lZCcpXHJcbiAgICAgICAgICAgIHh0c2god2luZG93LmpRdWVyeSkucGx1Z0luKHdpbmRvdy5qUXVlcnkpO1xyXG4gICAgfVxyXG5cclxufSkoKTsiLCIvKiBTb21lIHV0aWxpdGllcyBmb3IgdXNlIHdpdGggalF1ZXJ5IG9yIGl0cyBleHByZXNzaW9uc1xyXG4gICAgdGhhdCBhcmUgbm90IHBsdWdpbnMuXHJcbiovXHJcbmZ1bmN0aW9uIGVzY2FwZUpRdWVyeVNlbGVjdG9yVmFsdWUoc3RyKSB7XHJcbiAgICByZXR1cm4gc3RyLnJlcGxhY2UoLyhbICM7JiwuKyp+XFwnOlwiIV4kW1xcXSgpPT58XFwvXSkvZywgJ1xcXFwkMScpO1xyXG59XHJcblxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgICAgICBlc2NhcGVKUXVlcnlTZWxlY3RvclZhbHVlOiBlc2NhcGVKUXVlcnlTZWxlY3RvclZhbHVlXHJcbiAgICB9O1xyXG4iLCJmdW5jdGlvbiBtb3ZlRm9jdXNUbyhlbCwgb3B0aW9ucykge1xyXG4gICAgb3B0aW9ucyA9ICQuZXh0ZW5kKHtcclxuICAgICAgICBtYXJnaW5Ub3A6IDMwLFxyXG4gICAgICAgIGR1cmF0aW9uOiA1MDBcclxuICAgIH0sIG9wdGlvbnMpO1xyXG4gICAgJCgnaHRtbCxib2R5Jykuc3RvcCh0cnVlLCB0cnVlKS5hbmltYXRlKHsgc2Nyb2xsVG9wOiAkKGVsKS5vZmZzZXQoKS50b3AgLSBvcHRpb25zLm1hcmdpblRvcCB9LCBvcHRpb25zLmR1cmF0aW9uLCBudWxsKTtcclxufVxyXG5cclxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKSB7XHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IG1vdmVGb2N1c1RvO1xyXG59IiwiLyoqIEN1c3RvbSBMb2Nvbm9taWNzICdsaWtlIGJsb2NrVUknIHBvcHVwc1xyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKSxcclxuICAgIGVzY2FwZUpRdWVyeVNlbGVjdG9yVmFsdWUgPSByZXF1aXJlKCcuL2pxdWVyeVV0aWxzJykuZXNjYXBlSlF1ZXJ5U2VsZWN0b3JWYWx1ZSxcclxuICAgIGF1dG9Gb2N1cyA9IHJlcXVpcmUoJy4vYXV0b0ZvY3VzJyksXHJcbiAgICBtb3ZlRm9jdXNUbyA9IHJlcXVpcmUoJy4vbW92ZUZvY3VzVG8nKTtcclxucmVxdWlyZSgnLi9qcXVlcnkueHRzaCcpLnBsdWdJbigkKTtcclxuXHJcbmZ1bmN0aW9uIHNtb290aEJveEJsb2NrKGNvbnRlbnRCb3gsIGJsb2NrZWQsIGFkZGNsYXNzLCBvcHRpb25zKSB7XHJcbiAgICAvLyBMb2FkIG9wdGlvbnMgb3ZlcndyaXRpbmcgZGVmYXVsdHNcclxuICAgIG9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7XHJcbiAgICAgICAgY2xvc2FibGU6IGZhbHNlLFxyXG4gICAgICAgIGNlbnRlcjogZmFsc2UsXHJcbiAgICAgICAgLyogYXMgYSB2YWxpZCBvcHRpb25zIHBhcmFtZXRlciBmb3IgTEMuaGlkZUVsZW1lbnQgZnVuY3Rpb24gKi9cclxuICAgICAgICBjbG9zZU9wdGlvbnM6IHtcclxuICAgICAgICAgICAgZHVyYXRpb246IDYwMCxcclxuICAgICAgICAgICAgZWZmZWN0OiAnZmFkZSdcclxuICAgICAgICB9LFxyXG4gICAgICAgIGF1dG9mb2N1czogdHJ1ZSxcclxuICAgICAgICBhdXRvZm9jdXNPcHRpb25zOiB7IG1hcmdpblRvcDogNjAgfSxcclxuICAgICAgICB3aWR0aDogJ2F1dG8nXHJcbiAgICB9LCBvcHRpb25zKTtcclxuXHJcbiAgICBjb250ZW50Qm94ID0gJChjb250ZW50Qm94KTtcclxuICAgIHZhciBmdWxsID0gZmFsc2U7XHJcbiAgICBpZiAoYmxvY2tlZCA9PSBkb2N1bWVudCB8fCBibG9ja2VkID09IHdpbmRvdykge1xyXG4gICAgICAgIGJsb2NrZWQgPSAkKCdib2R5Jyk7XHJcbiAgICAgICAgZnVsbCA9IHRydWU7XHJcbiAgICB9IGVsc2VcclxuICAgICAgICBibG9ja2VkID0gJChibG9ja2VkKTtcclxuXHJcbiAgICB2YXIgYm94SW5zaWRlQmxvY2tlZCA9ICFibG9ja2VkLmlzKCdib2R5LHRyLHRoZWFkLHRib2R5LHRmb290LHRhYmxlLHVsLG9sLGRsJyk7XHJcblxyXG4gICAgLy8gR2V0dGluZyBib3ggZWxlbWVudCBpZiBleGlzdHMgYW5kIHJlZmVyZW5jaW5nXHJcbiAgICB2YXIgYklEID0gYmxvY2tlZC5kYXRhKCdzbW9vdGgtYm94LWJsb2NrLWlkJyk7XHJcbiAgICBpZiAoIWJJRClcclxuICAgICAgICBiSUQgPSAoY29udGVudEJveC5hdHRyKCdpZCcpIHx8ICcnKSArIChibG9ja2VkLmF0dHIoJ2lkJykgfHwgJycpICsgJy1zbW9vdGhCb3hCbG9jayc7XHJcbiAgICBpZiAoYklEID09ICctc21vb3RoQm94QmxvY2snKSB7XHJcbiAgICAgICAgYklEID0gJ2lkLScgKyBndWlkR2VuZXJhdG9yKCkgKyAnLXNtb290aEJveEJsb2NrJztcclxuICAgIH1cclxuICAgIGJsb2NrZWQuZGF0YSgnc21vb3RoLWJveC1ibG9jay1pZCcsIGJJRCk7XHJcbiAgICB2YXIgYm94ID0gJCgnIycgKyBlc2NhcGVKUXVlcnlTZWxlY3RvclZhbHVlKGJJRCkpO1xyXG4gICAgXHJcbiAgICAvLyBIaWRpbmcvY2xvc2luZyBib3g6XHJcbiAgICBpZiAoY29udGVudEJveC5sZW5ndGggPT09IDApIHtcclxuXHJcbiAgICAgICAgYm94LnhoaWRlKG9wdGlvbnMuY2xvc2VPcHRpb25zKTtcclxuXHJcbiAgICAgICAgLy8gUmVzdG9yaW5nIHRoZSBDU1MgcG9zaXRpb24gYXR0cmlidXRlIG9mIHRoZSBibG9ja2VkIGVsZW1lbnRcclxuICAgICAgICAvLyB0byBhdm9pZCBzb21lIHByb2JsZW1zIHdpdGggbGF5b3V0IG9uIHNvbWUgZWRnZSBjYXNlcyBhbG1vc3RcclxuICAgICAgICAvLyB0aGF0IG1heSBiZSBub3QgYSBwcm9ibGVtIGR1cmluZyBibG9ja2luZyBidXQgd2hlbiB1bmJsb2NrZWQuXHJcbiAgICAgICAgdmFyIHByZXYgPSBibG9ja2VkLmRhdGEoJ3NiYi1wcmV2aW91cy1jc3MtcG9zaXRpb24nKTtcclxuICAgICAgICBibG9ja2VkLmNzcygncG9zaXRpb24nLCBwcmV2IHx8ICcnKTtcclxuICAgICAgICBibG9ja2VkLmRhdGEoJ3NiYi1wcmV2aW91cy1jc3MtcG9zaXRpb24nLCBudWxsKTtcclxuXHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciBib3hjO1xyXG4gICAgaWYgKGJveC5sZW5ndGggPT09IDApIHtcclxuICAgICAgICBib3hjID0gJCgnPGRpdiBjbGFzcz1cInNtb290aC1ib3gtYmxvY2stZWxlbWVudFwiLz4nKTtcclxuICAgICAgICBib3ggPSAkKCc8ZGl2IGNsYXNzPVwic21vb3RoLWJveC1ibG9jay1vdmVybGF5XCI+PC9kaXY+Jyk7XHJcbiAgICAgICAgYm94LmFkZENsYXNzKGFkZGNsYXNzKTtcclxuICAgICAgICBpZiAoZnVsbCkgYm94LmFkZENsYXNzKCdmdWxsLWJsb2NrJyk7XHJcbiAgICAgICAgYm94LmFwcGVuZChib3hjKTtcclxuICAgICAgICBib3guYXR0cignaWQnLCBiSUQpO1xyXG4gICAgICAgIGlmIChib3hJbnNpZGVCbG9ja2VkKVxyXG4gICAgICAgICAgICBibG9ja2VkLmFwcGVuZChib3gpO1xyXG4gICAgICAgIGVsc2VcclxuICAgICAgICAgICAgJCgnYm9keScpLmFwcGVuZChib3gpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBib3hjID0gYm94LmNoaWxkcmVuKCcuc21vb3RoLWJveC1ibG9jay1lbGVtZW50Jyk7XHJcbiAgICB9XHJcbiAgICAvLyBIaWRkZW4gZm9yIHVzZXIsIGJ1dCBhdmFpbGFibGUgdG8gY29tcHV0ZTpcclxuICAgIGNvbnRlbnRCb3guc2hvdygpO1xyXG4gICAgYm94LnNob3coKS5jc3MoJ29wYWNpdHknLCAwKTtcclxuICAgIC8vIFNldHRpbmcgdXAgdGhlIGJveCBhbmQgc3R5bGVzLlxyXG4gICAgYm94Yy5jaGlsZHJlbigpLnJlbW92ZSgpO1xyXG4gICAgaWYgKG9wdGlvbnMuY2xvc2FibGUpXHJcbiAgICAgICAgYm94Yy5hcHBlbmQoJCgnPGEgY2xhc3M9XCJjbG9zZS1wb3B1cCBjbG9zZS1hY3Rpb25cIiBocmVmPVwiI2Nsb3NlLXBvcHVwXCI+WDwvYT4nKSk7XHJcbiAgICBib3guZGF0YSgnbW9kYWwtYm94LW9wdGlvbnMnLCBvcHRpb25zKTtcclxuICAgIGlmICghYm94Yy5kYXRhKCdfY2xvc2UtYWN0aW9uLWFkZGVkJykpXHJcbiAgICAgIGJveGNcclxuICAgICAgICAub24oJ2NsaWNrJywgJy5jbG9zZS1hY3Rpb24nLCBmdW5jdGlvbiAoZSkge1xyXG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgICAgIHNtb290aEJveEJsb2NrKG51bGwsIGJsb2NrZWQsIG51bGwsIGJveC5kYXRhKCdtb2RhbC1ib3gtb3B0aW9ucycpKTtcclxuICAgICAgICB9KVxyXG4gICAgICAgIC5kYXRhKCdfY2xvc2UtYWN0aW9uLWFkZGVkJywgdHJ1ZSk7XHJcbiAgICBib3hjLmFwcGVuZChjb250ZW50Qm94KTtcclxuICAgIGJveGMud2lkdGgob3B0aW9ucy53aWR0aCk7XHJcbiAgICBib3guY3NzKCdwb3NpdGlvbicsICdhYnNvbHV0ZScpO1xyXG4gICAgaWYgKGJveEluc2lkZUJsb2NrZWQpIHtcclxuICAgICAgICAvLyBCb3ggcG9zaXRpb25pbmcgc2V0dXAgd2hlbiBpbnNpZGUgdGhlIGJsb2NrZWQgZWxlbWVudDpcclxuICAgICAgICBib3guY3NzKCd6LWluZGV4JywgYmxvY2tlZC5jc3MoJ3otaW5kZXgnKSArIDEwKTtcclxuICAgICAgICBpZiAoIWJsb2NrZWQuY3NzKCdwb3NpdGlvbicpIHx8IGJsb2NrZWQuY3NzKCdwb3NpdGlvbicpID09ICdzdGF0aWMnKSB7XHJcbiAgICAgICAgICAgIGJsb2NrZWQuZGF0YSgnc2JiLXByZXZpb3VzLWNzcy1wb3NpdGlvbicsIGJsb2NrZWQuY3NzKCdwb3NpdGlvbicpKTtcclxuICAgICAgICAgICAgYmxvY2tlZC5jc3MoJ3Bvc2l0aW9uJywgJ3JlbGF0aXZlJyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vb2ZmcyA9IGJsb2NrZWQucG9zaXRpb24oKTtcclxuICAgICAgICBib3guY3NzKCd0b3AnLCAwKTtcclxuICAgICAgICBib3guY3NzKCdsZWZ0JywgMCk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIC8vIEJveCBwb3NpdGlvbmluZyBzZXR1cCB3aGVuIG91dHNpZGUgdGhlIGJsb2NrZWQgZWxlbWVudCwgYXMgYSBkaXJlY3QgY2hpbGQgb2YgQm9keTpcclxuICAgICAgICBib3guY3NzKCd6LWluZGV4JywgTWF0aC5mbG9vcihOdW1iZXIuTUFYX1ZBTFVFKSk7XHJcbiAgICAgICAgYm94LmNzcyhibG9ja2VkLm9mZnNldCgpKTtcclxuICAgIH1cclxuICAgIC8vIERpbWVuc2lvbnMgbXVzdCBiZSBjYWxjdWxhdGVkIGFmdGVyIGJlaW5nIGFwcGVuZGVkIGFuZCBwb3NpdGlvbiB0eXBlIGJlaW5nIHNldDpcclxuICAgIGJveC53aWR0aChibG9ja2VkLm91dGVyV2lkdGgoKSk7XHJcbiAgICBib3guaGVpZ2h0KGJsb2NrZWQub3V0ZXJIZWlnaHQoKSk7XHJcblxyXG4gICAgaWYgKG9wdGlvbnMuY2VudGVyKSB7XHJcbiAgICAgICAgYm94Yy5jc3MoJ3Bvc2l0aW9uJywgJ2Fic29sdXRlJyk7XHJcbiAgICAgICAgdmFyIGNsLCBjdDtcclxuICAgICAgICBpZiAoZnVsbCkge1xyXG4gICAgICAgICAgICBjdCA9IHNjcmVlbi5oZWlnaHQgLyAyO1xyXG4gICAgICAgICAgICBjbCA9IHNjcmVlbi53aWR0aCAvIDI7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgY3QgPSBib3gub3V0ZXJIZWlnaHQodHJ1ZSkgLyAyO1xyXG4gICAgICAgICAgICBjbCA9IGJveC5vdXRlcldpZHRoKHRydWUpIC8gMjtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKG9wdGlvbnMuY2VudGVyID09PSB0cnVlIHx8IG9wdGlvbnMuY2VudGVyID09PSAndmVydGljYWwnKVxyXG4gICAgICAgICAgICBib3hjLmNzcygndG9wJywgY3QgLSBib3hjLm91dGVySGVpZ2h0KHRydWUpIC8gMik7XHJcbiAgICAgICAgaWYgKG9wdGlvbnMuY2VudGVyID09PSB0cnVlIHx8IG9wdGlvbnMuY2VudGVyID09PSAnaG9yaXpvbnRhbCcpXHJcbiAgICAgICAgICAgIGJveGMuY3NzKCdsZWZ0JywgY2wgLSBib3hjLm91dGVyV2lkdGgodHJ1ZSkgLyAyKTtcclxuICAgIH1cclxuICAgIC8vIExhc3Qgc2V0dXBcclxuICAgIGF1dG9Gb2N1cyhib3gpO1xyXG4gICAgLy8gU2hvdyBibG9ja1xyXG4gICAgYm94LmFuaW1hdGUoeyBvcGFjaXR5OiAxIH0sIDMwMCk7XHJcbiAgICBpZiAob3B0aW9ucy5hdXRvZm9jdXMpXHJcbiAgICAgICAgbW92ZUZvY3VzVG8oY29udGVudEJveCwgb3B0aW9ucy5hdXRvZm9jdXNPcHRpb25zKTtcclxuICAgIHJldHVybiBib3g7XHJcbn1cclxuZnVuY3Rpb24gc21vb3RoQm94QmxvY2tDbG9zZUFsbChjb250YWluZXIpIHtcclxuICAgICQoY29udGFpbmVyIHx8IGRvY3VtZW50KS5maW5kKCcuc21vb3RoLWJveC1ibG9jay1vdmVybGF5JykuaGlkZSgpO1xyXG59XHJcblxyXG4vLyBNb2R1bGVcclxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKVxyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICAgICAgb3Blbjogc21vb3RoQm94QmxvY2ssXHJcbiAgICAgICAgY2xvc2U6IGZ1bmN0aW9uKGJsb2NrZWQsIGFkZGNsYXNzLCBvcHRpb25zKSB7IHNtb290aEJveEJsb2NrKG51bGwsIGJsb2NrZWQsIGFkZGNsYXNzLCBvcHRpb25zKTsgfSxcclxuICAgICAgICBjbG9zZUFsbDogc21vb3RoQm94QmxvY2tDbG9zZUFsbFxyXG4gICAgfTsiLCIvKipcclxuICBJdCB0b2dnbGVzIGEgZ2l2ZW4gdmFsdWUgd2l0aCB0aGUgbmV4dCBpbiB0aGUgZ2l2ZW4gbGlzdCxcclxuICBvciB0aGUgZmlyc3QgaWYgaXMgdGhlIGxhc3Qgb3Igbm90IG1hdGNoZWQuXHJcbiAgVGhlIHJldHVybmVkIGZ1bmN0aW9uIGNhbiBiZSB1c2VkIGRpcmVjdGx5IG9yIFxyXG4gIGNhbiBiZSBhdHRhY2hlZCB0byBhbiBhcnJheSAob3IgYXJyYXkgbGlrZSkgb2JqZWN0IGFzIG1ldGhvZFxyXG4gIChvciB0byBhIHByb3RvdHlwZSBhcyBBcnJheS5wcm90b3R5cGUpIGFuZCB1c2UgaXQgcGFzc2luZ1xyXG4gIG9ubHkgdGhlIGZpcnN0IGFyZ3VtZW50LlxyXG4qKi9cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiB0b2dnbGUoY3VycmVudCwgZWxlbWVudHMpIHtcclxuICBpZiAodHlwZW9mIChlbGVtZW50cykgPT09ICd1bmRlZmluZWQnICYmXHJcbiAgICAgIHR5cGVvZiAodGhpcy5sZW5ndGgpID09PSAnbnVtYmVyJylcclxuICAgIGVsZW1lbnRzID0gdGhpcztcclxuXHJcbiAgdmFyIGkgPSBlbGVtZW50cy5pbmRleE9mKGN1cnJlbnQpO1xyXG4gIGlmIChpID4gLTEgJiYgaSA8IGVsZW1lbnRzLmxlbmd0aCAtIDEpXHJcbiAgICByZXR1cm4gZWxlbWVudHNbaSArIDFdO1xyXG4gIGVsc2VcclxuICAgIHJldHVybiBlbGVtZW50c1swXTtcclxufTtcclxuIiwiLyoqXHJcbiAgICBVc2VyIHByaXZhdGUgZGFzaGJvYXJkIHNlY3Rpb25cclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbnZhciBMY1VybCA9IHJlcXVpcmUoJy4uL0xDL0xjVXJsJyk7XHJcbnZhciBhamF4Rm9ybXMgPSByZXF1aXJlKCdMQy9hamF4Rm9ybXMnKTtcclxuXHJcbi8vIENvZGUgb24gcGFnZSByZWFkeVxyXG4kKGZ1bmN0aW9uICgpIHtcclxuICAgIC8qIFNpZGViYXIgKi9cclxuICAgIHZhciBcclxuICAgIHRvZ2dsZSA9IHJlcXVpcmUoJy4uL0xDL3RvZ2dsZScpLFxyXG4gICAgUHJvdmlkZXJQb3NpdGlvbiA9IHJlcXVpcmUoJy4uL0xDL1Byb3ZpZGVyUG9zaXRpb24nKTtcclxuICAgIC8vIEF0dGFjaGluZyAnY2hhbmdlIHBvc2l0aW9uJyBhY3Rpb24gdG8gdGhlIHNpZGViYXIgbGlua3NcclxuICAgICQoZG9jdW1lbnQpLm9uKCdjbGljaycsICdbaHJlZiA9IFwiI3RvZ2dsZVBvc2l0aW9uU3RhdGVcIl0nLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIFxyXG4gICAgICAkdCA9ICQodGhpcyksXHJcbiAgICAgIHYgPSAkdC50ZXh0KCksXHJcbiAgICAgIG4gPSB0b2dnbGUodiwgWydvbicsICdvZmYnXSksXHJcbiAgICAgIHBvc2l0aW9uSWQgPSAkdC5jbG9zZXN0KCdbZGF0YS1wb3NpdGlvbi1pZF0nKS5kYXRhKCdwb3NpdGlvbi1pZCcpO1xyXG5cclxuICAgICAgICB2YXIgcG9zID0gbmV3IFByb3ZpZGVyUG9zaXRpb24ocG9zaXRpb25JZCk7XHJcbiAgICAgICAgcG9zXHJcbiAgICAub24ocG9zLnN0YXRlQ2hhbmdlZEV2ZW50LCBmdW5jdGlvbiAoc3RhdGUpIHtcclxuICAgICAgICAkdC50ZXh0KHN0YXRlKTtcclxuICAgIH0pXHJcbiAgICAuY2hhbmdlU3RhdGUobik7XHJcblxyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0pXHJcbiAgICAub24oJ2NsaWNrJywgJy5kZWxldGUtcG9zaXRpb24gYScsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgcG9zaXRpb25JZCA9ICQodGhpcykuY2xvc2VzdCgnW2RhdGEtcG9zaXRpb24taWRdJykuZGF0YSgncG9zaXRpb24taWQnKTtcclxuICAgICAgICB2YXIgcG9zID0gbmV3IFByb3ZpZGVyUG9zaXRpb24ocG9zaXRpb25JZCk7XHJcblxyXG4gICAgICAgIHBvc1xyXG4gICAgLm9uKHBvcy5yZW1vdmVkRXZlbnQsIGZ1bmN0aW9uIChtc2cpIHtcclxuICAgICAgICAvLyBDdXJyZW50IHBvc2l0aW9uIHBhZ2UgZG9lc24ndCBleGlzdCBhbnltb3JlLCBvdXQhXHJcbiAgICAgICAgd2luZG93LmxvY2F0aW9uID0gTGNVcmwuTGFuZ1BhdGggKyAnZGFzaGJvYXJkL3lvdXItd29yay8nO1xyXG4gICAgfSlcclxuICAgIC5yZW1vdmUoKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSk7XHJcblxyXG4gICAgLyogUHJvbW90ZSAqL1xyXG4gICAgdmFyIGdlbmVyYXRlQm9va05vd0J1dHRvbiA9IHJlcXVpcmUoJy4vZGFzaGJvYXJkL2dlbmVyYXRlQm9va05vd0J1dHRvbicpO1xyXG4gICAgLy8gTGlzdGVuIG9uIERhc2hib2FyZFByb21vdGUgaW5zdGVhZCBvZiB0aGUgbW9yZSBjbG9zZSBjb250YWluZXIgRGFzaGJvYXJkQm9va05vd0J1dHRvblxyXG4gICAgLy8gYWxsb3dzIHRvIGNvbnRpbnVlIHdvcmtpbmcgd2l0aG91dCByZS1hdHRhY2htZW50IGFmdGVyIGh0bWwtYWpheC1yZWxvYWRzIGZyb20gYWpheEZvcm0uXHJcbiAgICBnZW5lcmF0ZUJvb2tOb3dCdXR0b24ub24oJy5EYXNoYm9hcmRQcm9tb3RlJyk7IC8vJy5EYXNoYm9hcmRCb29rTm93QnV0dG9uJ1xyXG5cclxuICAgIC8qIFByaXZhY3kgKi9cclxuICAgIHZhciBwcml2YWN5U2V0dGluZ3MgPSByZXF1aXJlKCcuL2Rhc2hib2FyZC9wcml2YWN5U2V0dGluZ3MnKTtcclxuICAgIHByaXZhY3lTZXR0aW5ncy5vbignLkRhc2hib2FyZFByaXZhY3knKTtcclxuXHJcbiAgICAvKiBQYXltZW50cyAqL1xyXG4gICAgdmFyIHBheW1lbnRBY2NvdW50ID0gcmVxdWlyZSgnLi9kYXNoYm9hcmQvcGF5bWVudEFjY291bnQnKTtcclxuICAgIHBheW1lbnRBY2NvdW50Lm9uKCcuRGFzaGJvYXJkUGF5bWVudHMnKTtcclxuXHJcbiAgICAvKiBhYm91dC15b3UgKi9cclxuICAgICQoJ2h0bWwnKS5vbignYWpheEZvcm1SZXR1cm5lZEh0bWwnLCAnLkRhc2hib2FyZEFib3V0WW91IGZvcm0uYWpheCcsIGluaXRBYm91dFlvdSk7XHJcbiAgICBpbml0QWJvdXRZb3UoKTtcclxuXHJcbiAgICAvKiBZb3VyIHdvcmsgaW5pdCAqL1xyXG4gICAgJCgnaHRtbCcpLm9uKCdhamF4Rm9ybVJldHVybmVkSHRtbCcsICcuRGFzaGJvYXJkWW91cldvcmsgZm9ybS5hamF4JywgaW5pdFlvdXJXb3JrRG9tKTtcclxuICAgIGluaXRZb3VyV29ya0RvbSgpO1xyXG5cclxuICAgIC8qIEF2YWlsYWJpbHR5ICovXHJcbiAgICBpbml0QXZhaWxhYmlsaXR5KCk7XHJcbiAgICAkKCcuRGFzaGJvYXJkQXZhaWxhYmlsaXR5Jykub24oJ2FqYXhGb3JtUmV0dXJuZWRIdG1sJywgaW5pdEF2YWlsYWJpbGl0eSk7XHJcbn0pO1xyXG5cclxuLyoqXHJcbiAgICBJbnN0YW50IHNhdmluZyBhbmQgY29ycmVjdCBjaGFuZ2VzIHRyYWNraW5nXHJcbioqL1xyXG5mdW5jdGlvbiBzZXRJbnN0YW50U2F2aW5nU2VjdGlvbihzZWN0aW9uU2VsZWN0b3IpIHtcclxuXHJcbiAgICB2YXIgJHNlY3Rpb24gPSAkKHNlY3Rpb25TZWxlY3Rvcik7XHJcblxyXG4gICAgaWYgKCRzZWN0aW9uLmRhdGEoJ2luc3RhbnQtc2F2aW5nJykpIHtcclxuICAgICAgICAkc2VjdGlvbi5vbignY2hhbmdlJywgJzppbnB1dCcsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgYWpheEZvcm1zLmRvSW5zdGFudFNhdmluZygkc2VjdGlvbiwgW3RoaXNdKTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxufVxyXG5cclxuZnVuY3Rpb24gaW5pdEFib3V0WW91KCkge1xyXG4gICAgLyogUHJvZmlsZSBwaG90byAqL1xyXG4gICAgdmFyIGNoYW5nZVByb2ZpbGVQaG90byA9IHJlcXVpcmUoJy4vZGFzaGJvYXJkL2NoYW5nZVByb2ZpbGVQaG90bycpO1xyXG4gICAgY2hhbmdlUHJvZmlsZVBob3RvLm9uKCcuRGFzaGJvYXJkQWJvdXRZb3UnKTtcclxuXHJcbiAgICAvKiBBYm91dCB5b3UgLyBlZHVjYXRpb24gKi9cclxuICAgIHZhciBlZHVjYXRpb24gPSByZXF1aXJlKCcuL2Rhc2hib2FyZC9lZHVjYXRpb25DcnVkbCcpO1xyXG4gICAgZWR1Y2F0aW9uLm9uKCcuRGFzaGJvYXJkQWJvdXRZb3UnKTtcclxuXHJcbiAgICAvKiBBYm91dCB5b3UgLyB2ZXJpZmljYXRpb25zICovXHJcbiAgICByZXF1aXJlKCcuL2Rhc2hib2FyZC92ZXJpZmljYXRpb25zQWN0aW9ucycpLm9uKCcuRGFzaGJvYXJkVmVyaWZpY2F0aW9ucycpO1xyXG4gICAgcmVxdWlyZSgnLi9kYXNoYm9hcmQvdmVyaWZpY2F0aW9uc0NydWRsJykub24oJy5EYXNoYm9hcmRBYm91dFlvdScpO1xyXG5cclxuICAgIC8vIEluc3RhbnQgc2F2aW5nXHJcbiAgICBzZXRJbnN0YW50U2F2aW5nU2VjdGlvbignLkRhc2hib2FyZFB1YmxpY0JpbycpO1xyXG4gICAgc2V0SW5zdGFudFNhdmluZ1NlY3Rpb24oJy5EYXNoYm9hcmRQZXJzb25hbFdlYnNpdGUnKTtcclxufVxyXG5cclxuZnVuY3Rpb24gaW5pdEF2YWlsYWJpbGl0eShlKSB7XHJcbiAgLy8gV2UgbmVlZCB0byBhdm9pZCB0aGlzIGxvZ2ljIHdoZW4gYW4gZXZlbnQgYnViYmxlXHJcbiAgLy8gZnJvbSB0aGUgYW55IGZpZWxkc2V0LmFqYXgsIGJlY2F1c2UgaXRzIGEgc3ViZm9ybSBldmVudFxyXG4gIC8vIGFuZCBtdXN0IG5vdCByZXNldCB0aGUgbWFpbiBmb3JtICgjNTA0KVxyXG4gIGlmIChlICYmIGUudGFyZ2V0ICYmIC9maWVsZHNldC9pLnRlc3QoZS50YXJnZXQubm9kZU5hbWUpKVxyXG4gICAgcmV0dXJuO1xyXG5cclxuICByZXF1aXJlKCcuL2Rhc2hib2FyZC9tb250aGx5U2NoZWR1bGUnKS5vbigpO1xyXG4gIHZhciB3ZWVrbHkgPSByZXF1aXJlKCcuL2Rhc2hib2FyZC93ZWVrbHlTY2hlZHVsZScpLm9uKCk7XHJcbiAgcmVxdWlyZSgnLi9kYXNoYm9hcmQvY2FsZW5kYXJTeW5jJykub24oKTtcclxuICByZXF1aXJlKCcuL2Rhc2hib2FyZC9hcHBvaW50bWVudHNDcnVkbCcpLm9uKCcuRGFzaGJvYXJkQXZhaWxhYmlsaXR5Jyk7XHJcblxyXG4gIC8vIEluc3RhbnQgc2F2aW5nXHJcbiAgc2V0SW5zdGFudFNhdmluZ1NlY3Rpb24oJy5EYXNoYm9hcmRXZWVrbHlTY2hlZHVsZScpO1xyXG4gIHNldEluc3RhbnRTYXZpbmdTZWN0aW9uKCcuRGFzaGJvYXJkTW9udGhseVNjaGVkdWxlJyk7XHJcbiAgc2V0SW5zdGFudFNhdmluZ1NlY3Rpb24oJy5EYXNoYm9hcmRDYWxlbmRhclN5bmMnKTtcclxufVxyXG5cclxuLyoqXHJcbiAgSW5pdGlhbGl6ZSBEb20gZWxlbWVudHMgYW5kIGV2ZW50cyBoYW5kbGVycyBmb3IgWW91ci13b3JrIGxvZ2ljLlxyXG5cclxuICBOT1RFOiAuRGFzaGJvYXJkWW91cldvcmsgaXMgYW4gYWpheC1ib3ggcGFyZW50IG9mIHRoZSBmb3JtLmFqYXgsIGV2ZXJ5IHNlY3Rpb25cclxuICBpcyBpbnNpZGUgdGhlIGZvcm0gYW5kIHJlcGxhY2VkIG9uIGh0bWwgcmV0dXJuZWQgZnJvbSBzZXJ2ZXIuXHJcbioqL1xyXG5mdW5jdGlvbiBpbml0WW91cldvcmtEb20oKSB7XHJcbiAgICAvKiBZb3VyIHdvcmsgLyBwcmljaW5nICovXHJcbiAgICByZXF1aXJlKCcuL2Rhc2hib2FyZC9wcmljaW5nQ3J1ZGwnKS5vbigpO1xyXG5cclxuICAgIC8qIFlvdXIgd29yayAvIHNlcnZpY2VzICovXHJcbiAgICByZXF1aXJlKCcuL2Rhc2hib2FyZC9zZXJ2aWNlQXR0cmlidXRlc1ZhbGlkYXRpb24nKS5zZXR1cCgkKCcuRGFzaGJvYXJkWW91cldvcmsgZm9ybScpKTtcclxuICAgIC8vIEluc3RhbnQgc2F2aW5nIGFuZCBjb3JyZWN0IGNoYW5nZXMgdHJhY2tpbmdcclxuICAgIHNldEluc3RhbnRTYXZpbmdTZWN0aW9uKCcuRGFzaGJvYXJkU2VydmljZXMnKTtcclxuXHJcbiAgICAvKiBZb3VyIHdvcmsgLyBjYW5jZWxsYXRpb24gKi9cclxuICAgIHNldEluc3RhbnRTYXZpbmdTZWN0aW9uKCcuRGFzaGJvYXJkQ2FuY2VsbGF0aW9uUG9saWN5Jyk7XHJcblxyXG4gICAgLyogWW91ciB3b3JrIC8gc2NoZWR1bGluZyAqL1xyXG4gICAgc2V0SW5zdGFudFNhdmluZ1NlY3Rpb24oJy5EYXNoYm9hcmRTY2hlZHVsaW5nT3B0aW9ucycpO1xyXG5cclxuICAgIC8qIFlvdXIgd29yayAvIGxvY2F0aW9ucyAqL1xyXG4gICAgcmVxdWlyZSgnLi9kYXNoYm9hcmQvbG9jYXRpb25zQ3J1ZGwnKS5vbignLkRhc2hib2FyZFlvdXJXb3JrJyk7XHJcblxyXG4gICAgLyogWW91ciB3b3JrIC8gbGljZW5zZXMgKi9cclxuICAgIHJlcXVpcmUoJy4vZGFzaGJvYXJkL2xpY2Vuc2VzQ3J1ZGwnKS5vbignLkRhc2hib2FyZFlvdXJXb3JrJyk7XHJcblxyXG4gICAgLyogWW91ciB3b3JrIC8gcGhvdG9zICovXHJcbiAgICByZXF1aXJlKCcuL2Rhc2hib2FyZC9tYW5hZ2VQaG90b3NVSScpLm9uKCcuRGFzaGJvYXJkUGhvdG9zJyk7XHJcbiAgICAvLyBQaG90b3NVSSBpcyBzcGVjaWFsIGFuZCBjYW5ub3QgZG8gaW5zdGFudC1zYXZpbmcgb24gZm9ybSBjaGFuZ2VzXHJcbiAgICAvLyBiZWNhdXNlIG9mIHRoZSByZS11c2Ugb2YgdGhlIGVkaXRpbmcgZm9ybVxyXG4gICAgLy9zZXRJbnN0YW50U2F2aW5nU2VjdGlvbignLkRhc2hib2FyZFBob3RvcycpO1xyXG5cclxuICAgIC8qIFlvdXIgd29yayAvIHJldmlld3MgKi9cclxuICAgICQoJy5EYXNoYm9hcmRZb3VyV29yaycpLm9uKCdhamF4U3VjY2Vzc1Bvc3QnLCAnZm9ybScsIGZ1bmN0aW9uIChldmVudCwgZGF0YSkge1xyXG4gICAgICAgIC8vIFJlc2V0aW5nIHRoZSBlbWFpbCBhZGRyZXNzZXMgb24gc3VjY2VzcyB0byBhdm9pZCByZXNlbmQgYWdhaW4gbWVzc2FnZXMgYmVjYXVzZVxyXG4gICAgICAgIC8vIG1pc3Rha2Ugb2YgYSBzZWNvbmQgc3VibWl0LlxyXG4gICAgICAgIHZhciB0YiA9ICQoJy5EYXNoYm9hcmRSZXZpZXdzIFtuYW1lPWNsaWVudHNlbWFpbHNdJyk7XHJcbiAgICAgICAgLy8gT25seSBpZiB0aGVyZSB3YXMgYSB2YWx1ZTpcclxuICAgICAgICBpZiAodGIudmFsKCkpIHtcclxuICAgICAgICAgICAgdGJcclxuICAgICAgLnZhbCgnJylcclxuICAgICAgLmF0dHIoJ3BsYWNlaG9sZGVyJywgdGIuZGF0YSgnc3VjY2Vzcy1tZXNzYWdlJykpXHJcbiAgICAgICAgICAgIC8vIHN1cHBvcnQgZm9yIElFLCAnbm9uLXBsYWNlaG9sZGVyLWJyb3dzZXJzJ1xyXG4gICAgICAucGxhY2Vob2xkZXIoKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICAvKiBZb3VyIHdvcmsgLyBhZGQtcG9zaXRpb24gKi9cclxuICAgIHZhciBhZGRQb3NpdGlvbiA9IHJlcXVpcmUoJy4vZGFzaGJvYXJkL2FkZFBvc2l0aW9uJyk7XHJcbiAgICBhZGRQb3NpdGlvbi5pbml0KCcuRGFzaGJvYXJkQWRkUG9zaXRpb24nKTtcclxuICAgICQoJ2JvZHknKS5vbignYWpheEZvcm1SZXR1cm5lZEh0bWwnLCAnLkRhc2hib2FyZEFkZFBvc2l0aW9uJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGFkZFBvc2l0aW9uLmluaXQoKTtcclxuICAgIH0pO1xyXG59IiwiLyoqXHJcbiogQWRkIFBvc2l0aW9uOiBsb2dpYyBmb3IgdGhlIGFkZC1wb3NpdGlvbiBwYWdlIHVuZGVyIC9kYXNoYm9hcmQveW91ci13b3JrLzAvLFxyXG4gIHdpdGggYXV0b2NvbXBsZXRlLCBwb3NpdGlvbiBkZXNjcmlwdGlvbiBhbmQgJ2FkZGVkIHBvc2l0aW9ucycgbGlzdC5cclxuXHJcbiAgVE9ETzogQ2hlY2sgaWYgaXMgbW9yZSBjb252ZW5pZW50IGEgcmVmYWN0b3IgYXMgcGFydCBvZiBMQy9Qcm92aWRlclBvc2l0aW9uLmpzXHJcbiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbnZhciBzZWxlY3RvcnMgPSB7XHJcbiAgbGlzdDogJy5EYXNoYm9hcmRBZGRQb3NpdGlvbi1wb3NpdGlvbnNMaXN0JyxcclxuICBzZWxlY3RQb3NpdGlvbjogJy5EYXNoYm9hcmRBZGRQb3NpdGlvbi1zZWxlY3RQb3NpdGlvbicsXHJcbiAgZGVzYzogJy5EYXNoYm9hcmRBZGRQb3NpdGlvbi1zZWxlY3RQb3NpdGlvbi1kZXNjcmlwdGlvbidcclxufTtcclxuXHJcbmV4cG9ydHMuaW5pdCA9IGZ1bmN0aW9uIGluaXRBZGRQb3NpdGlvbihzZWxlY3Rvcikge1xyXG4gIHNlbGVjdG9yID0gc2VsZWN0b3IgfHwgJy5EYXNoYm9hcmRBZGRQb3NpdGlvbic7XHJcbiAgdmFyIGMgPSAkKHNlbGVjdG9yKTtcclxuXHJcbiAgLy8gVGVtcGxhdGUgcG9zaXRpb24gaXRlbSB2YWx1ZSBtdXN0IGJlIHJlc2V0IG9uIGluaXQgKGJlY2F1c2Ugc29tZSBmb3JtLXJlY292ZXJpbmcgYnJvd3NlciBmZWF0dXJlcyB0aGF0IHB1dCBvbiBpdCBiYWQgdmFsdWVzKVxyXG4gIGMuZmluZChzZWxlY3RvcnMubGlzdCArICcgbGkuaXMtdGVtcGxhdGUgW25hbWU9cG9zaXRpb25dJykudmFsKCcnKTtcclxuXHJcbiAgLy8gQXV0b2NvbXBsZXRlIHBvc2l0aW9ucyBhbmQgYWRkIHRvIHRoZSBsaXN0XHJcbiAgdmFyIHBvc2l0aW9uc0xpc3QgPSBudWxsLCB0cGwgPSBudWxsO1xyXG4gIHZhciBwb3NpdGlvbnNBdXRvY29tcGxldGUgPSBjLmZpbmQoJy5EYXNoYm9hcmRBZGRQb3NpdGlvbi1zZWxlY3RQb3NpdGlvbi1zZWFyY2gnKS5hdXRvY29tcGxldGUoe1xyXG4gICAgc291cmNlOiBMY1VybC5Kc29uUGF0aCArICdHZXRQb3NpdGlvbnMvQXV0b2NvbXBsZXRlLycsXHJcbiAgICBhdXRvRm9jdXM6IGZhbHNlLFxyXG4gICAgbWluTGVuZ3RoOiAwLFxyXG4gICAgc2VsZWN0OiBmdW5jdGlvbiAoZXZlbnQsIHVpKSB7XHJcblxyXG4gICAgICBwb3NpdGlvbnNMaXN0ID0gcG9zaXRpb25zTGlzdCB8fCBjLmZpbmQoc2VsZWN0b3JzLmxpc3QgKyAnID4gdWwnKTtcclxuICAgICAgdHBsID0gdHBsIHx8IHBvc2l0aW9uc0xpc3QuY2hpbGRyZW4oJy5pcy10ZW1wbGF0ZTplcSgwKScpO1xyXG4gICAgICAvLyBObyB2YWx1ZSwgbm8gYWN0aW9uIDooXHJcbiAgICAgIGlmICghdWkgfHwgIXVpLml0ZW0gfHwgIXVpLml0ZW0udmFsdWUpIHJldHVybjtcclxuXHJcbiAgICAgIC8vIEFkZCBpZiBub3QgZXhpc3RzIGluIHRoZSBsaXN0XHJcbiAgICAgIGlmIChwb3NpdGlvbnNMaXN0LmNoaWxkcmVuKCkuZmlsdGVyKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4gJCh0aGlzKS5kYXRhKCdwb3NpdGlvbi1pZCcpID09IHVpLml0ZW0udmFsdWU7XHJcbiAgICAgIH0pLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgIC8vIENyZWF0ZSBpdGVtIGZyb20gdGVtcGxhdGU6XHJcbiAgICAgICAgcG9zaXRpb25zTGlzdC5hcHBlbmQodHBsLmNsb25lKClcclxuICAgICAgICAgICAgICAgICAgICAucmVtb3ZlQ2xhc3MoJ2lzLXRlbXBsYXRlJylcclxuICAgICAgICAgICAgICAgICAgICAuZGF0YSgncG9zaXRpb24taWQnLCB1aS5pdGVtLnZhbHVlKVxyXG4gICAgICAgICAgICAgICAgICAgIC5jaGlsZHJlbignLm5hbWUnKS50ZXh0KHVpLml0ZW0ucG9zaXRpb25TaW5ndWxhcikgLy8gLmxhYmVsXHJcbiAgICAgICAgICAgICAgICAgICAgLmVuZCgpLmNoaWxkcmVuKCdbbmFtZT1wb3NpdGlvbl0nKS52YWwodWkuaXRlbS52YWx1ZSlcclxuICAgICAgICAgICAgICAgICAgICAuZW5kKCkpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBjLmZpbmQoc2VsZWN0b3JzLmRlc2MgKyAnID4gdGV4dGFyZWEnKS52YWwodWkuaXRlbS5kZXNjcmlwdGlvbik7XHJcblxyXG4gICAgICAvLyBXZSB3YW50IHNob3cgdGhlIGxhYmVsIChwb3NpdGlvbiBuYW1lKSBpbiB0aGUgdGV4dGJveCwgbm90IHRoZSBpZC12YWx1ZVxyXG4gICAgICAkKHRoaXMpLnZhbCh1aS5pdGVtLnBvc2l0aW9uU2luZ3VsYXIpO1xyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9LFxyXG4gICAgZm9jdXM6IGZ1bmN0aW9uIChldmVudCwgdWkpIHtcclxuICAgICAgaWYgKCF1aSB8fCAhdWkuaXRlbSB8fCAhdWkuaXRlbS5wb3NpdGlvblNpbmd1bGFyKTtcclxuICAgICAgLy8gV2Ugd2FudCB0aGUgbGFiZWwgaW4gdGV4dGJveCwgbm90IHRoZSB2YWx1ZVxyXG4gICAgICAkKHRoaXMpLnZhbCh1aS5pdGVtLnBvc2l0aW9uU2luZ3VsYXIpO1xyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcbiAgfSk7XHJcblxyXG4gIC8vIExvYWQgYWxsIHBvc2l0aW9ucyBpbiBiYWNrZ3JvdW5kIHRvIHJlcGxhY2UgdGhlIGF1dG9jb21wbGV0ZSBzb3VyY2UgKGF2b2lkaW5nIG11bHRpcGxlLCBzbG93IGxvb2stdXBzKVxyXG4gIC8qJC5nZXRKU09OKExjVXJsLkpzb25QYXRoICsgJ0dldFBvc2l0aW9ucy9BdXRvY29tcGxldGUvJyxcclxuICBmdW5jdGlvbiAoZGF0YSkge1xyXG4gIHBvc2l0aW9uc0F1dG9jb21wbGV0ZS5hdXRvY29tcGxldGUoJ29wdGlvbicsICdzb3VyY2UnLCBkYXRhKTtcclxuICB9XHJcbiAgKTsqL1xyXG5cclxuICAvLyBTaG93IGF1dG9jb21wbGV0ZSBvbiAncGx1cycgYnV0dG9uXHJcbiAgYy5maW5kKHNlbGVjdG9ycy5zZWxlY3RQb3NpdGlvbiArICcgLmFkZC1hY3Rpb24nKS5jbGljayhmdW5jdGlvbiAoKSB7XHJcbiAgICBwb3NpdGlvbnNBdXRvY29tcGxldGUuYXV0b2NvbXBsZXRlKCdzZWFyY2gnLCAnJyk7XHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbiAgfSk7XHJcblxyXG4gIC8vIFJlbW92ZSBwb3NpdGlvbnMgZnJvbSB0aGUgbGlzdFxyXG4gIGMuZmluZChzZWxlY3RvcnMubGlzdCArICcgPiB1bCcpLm9uKCdjbGljaycsICdsaSA+IGEnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICB2YXIgJHQgPSAkKHRoaXMpO1xyXG4gICAgaWYgKCR0LmF0dHIoJ2hyZWYnKSA9PSAnI3JlbW92ZS1wb3NpdGlvbicpIHtcclxuICAgICAgLy8gUmVtb3ZlIGNvbXBsZXRlIGVsZW1lbnQgZnJvbSB0aGUgbGlzdCAobGFiZWwgYW5kIGhpZGRlbiBmb3JtIHZhbHVlKVxyXG4gICAgICAkdC5wYXJlbnQoKS5yZW1vdmUoKTtcclxuICAgIH1cclxuICAgIHJldHVybiBmYWxzZTtcclxuICB9KTtcclxufTtcclxuIiwiLyoqIEF2YWlsYWJpbGl0eTogY2FsZW5kYXIgYXBwb2ludG1lbnRzIHBhZ2Ugc2V0dXAgZm9yIENSVURMIHVzZVxyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxuXHJcbi8vIFRPRE86IFJlcGxhY2UgYnkgcmVhbCByZXF1aXJlIGFuZCBub3QgZ2xvYmFsIExDOlxyXG4vL3ZhciBhamF4Rm9ybXMgPSByZXF1aXJlKCcuLi9MQy9hamF4Rm9ybXMnKTtcclxuLy92YXIgY3J1ZGwgPSByZXF1aXJlKCcuLi9MQy9jcnVkbCcpLnNldHVwKGFqYXhGb3Jtcy5vblN1Y2Nlc3MsIGFqYXhGb3Jtcy5vbkVycm9yLCBhamF4Rm9ybXMub25Db21wbGV0ZSk7XHJcbi8vTEMuaW5pdENydWRsID0gY3J1ZGwub247XHJcbnZhciBpbml0Q3J1ZGwgPSBMQy5pbml0Q3J1ZGw7XHJcblxyXG5leHBvcnRzLm9uID0gZnVuY3Rpb24gKGNvbnRhaW5lclNlbGVjdG9yKSB7XHJcblxyXG4gIHZhciAkYyA9ICQoY29udGFpbmVyU2VsZWN0b3IpLFxyXG4gICAgY3J1ZGxTZWxlY3RvciA9ICcuRGFzaGJvYXJkQXBwb2ludG1lbnRzJyxcclxuICAgICRjcnVkbENvbnRhaW5lciA9ICRjLmZpbmQoY3J1ZGxTZWxlY3RvcikuY2xvc2VzdCgnLkRhc2hib2FyZFNlY3Rpb24tcGFnZS1zZWN0aW9uJyksXHJcbiAgICAkb3RoZXJzID0gJGNydWRsQ29udGFpbmVyLnNpYmxpbmdzKClcclxuICAgICAgICAuYWRkKCRjcnVkbENvbnRhaW5lci5maW5kKCcuRGFzaGJvYXJkU2VjdGlvbi1wYWdlLXNlY3Rpb24taW50cm9kdWN0aW9uJykpXHJcbiAgICAgICAgLmFkZCgkY3J1ZGxDb250YWluZXIuY2xvc2VzdCgnLkRhc2hib2FyZEF2YWlsYWJpbGl0eScpLnNpYmxpbmdzKCkpO1xyXG5cclxuICB2YXIgY3J1ZGwgPSBpbml0Q3J1ZGwoY3J1ZGxTZWxlY3Rvcik7XHJcblxyXG4gIGNydWRsLmVsZW1lbnRzXHJcbiAgLm9uKGNydWRsLnNldHRpbmdzLmV2ZW50c1snZWRpdC1zdGFydHMnXSwgZnVuY3Rpb24gKCkge1xyXG4gICAgJG90aGVycy54aGlkZSh7IGVmZmVjdDogJ2hlaWdodCcsIGR1cmF0aW9uOiAnc2xvdycgfSk7XHJcbiAgfSlcclxuICAub24oY3J1ZGwuc2V0dGluZ3MuZXZlbnRzWydlZGl0LWVuZHMnXSwgZnVuY3Rpb24gKCkge1xyXG4gICAgJG90aGVycy54c2hvdyh7IGVmZmVjdDogJ2hlaWdodCcsIGR1cmF0aW9uOiAnc2xvdycgfSk7XHJcbiAgfSlcclxuICAub24oY3J1ZGwuc2V0dGluZ3MuZXZlbnRzWydlZGl0b3ItcmVhZHknXSwgZnVuY3Rpb24gKGUsIGVkaXRvcikge1xyXG4gICAgLy8gRG9uZSBhZnRlciBhIHNtYWxsIGRlbGF5IHRvIGxldCB0aGUgZWRpdG9yIGJlIHZpc2libGVcclxuICAgIC8vIGFuZCBzZXR1cCB3b3JrIGFzIGV4cGVjdGVkXHJcbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcclxuICAgICAgZWRpdEZvcm1TZXR1cChlZGl0b3IpO1xyXG4gICAgfSwgMTAwKTtcclxuICB9KTtcclxuXHJcbn07XHJcblxyXG5mdW5jdGlvbiBlZGl0Rm9ybVNldHVwKGYpIHtcclxuICB2YXIgcmVwZWF0ID0gZi5maW5kKCdbbmFtZT1yZXBlYXRdJykuY2hhbmdlKGZ1bmN0aW9uICgpIHtcclxuICAgIHZhciBhID0gZi5maW5kKCcucmVwZWF0LW9wdGlvbnMnKTtcclxuICAgIGlmICh0aGlzLmNoZWNrZWQpXHJcbiAgICAgIGEuc2xpZGVEb3duKCdmYXN0Jyk7XHJcbiAgICBlbHNlXHJcbiAgICAgIGEuc2xpZGVVcCgnZmFzdCcpO1xyXG4gIH0pO1xyXG4gIHZhciBhbGxkYXkgPSBmLmZpbmQoJ1tuYW1lPWFsbGRheV0nKS5jaGFuZ2UoZnVuY3Rpb24gKCkge1xyXG4gICAgdmFyIGEgPSBmXHJcbiAgICAuZmluZCgnW25hbWU9c3RhcnR0aW1lXSxbbmFtZT1lbmR0aW1lXScpXHJcbiAgICAucHJvcCgnZGlzYWJsZWQnLCB0aGlzLmNoZWNrZWQpO1xyXG4gICAgaWYgKHRoaXMuY2hlY2tlZClcclxuICAgICAgYS5oaWRlKCdmYXN0Jyk7XHJcbiAgICBlbHNlXHJcbiAgICAgIGEuc2hvdygnZmFzdCcpO1xyXG4gIH0pO1xyXG4gIHZhciByZXBlYXRGcmVxdWVuY3kgPSBmLmZpbmQoJ1tuYW1lPXJlcGVhdC1mcmVxdWVuY3ldJykuY2hhbmdlKGZ1bmN0aW9uICgpIHtcclxuICAgIHZhciBmcmVxID0gJCh0aGlzKS5jaGlsZHJlbignOnNlbGVjdGVkJyk7XHJcbiAgICB2YXIgdW5pdCA9IGZyZXEuZGF0YSgndW5pdCcpO1xyXG4gICAgZlxyXG4gICAgLmZpbmQoJy5yZXBlYXQtZnJlcXVlbmN5LXVuaXQnKVxyXG4gICAgLnRleHQodW5pdCk7XHJcbiAgICAvLyBJZiB0aGVyZSBpcyBubyB1bml0LCB0aGVyZSBpcyBub3QgaW50ZXJ2YWwvcmVwZWF0LWV2ZXJ5IGZpZWxkOlxyXG4gICAgdmFyIGludGVydmFsID0gZi5maW5kKCcucmVwZWF0LWV2ZXJ5Jyk7XHJcbiAgICBpZiAodW5pdClcclxuICAgICAgaW50ZXJ2YWwuc2hvdygnZmFzdCcpO1xyXG4gICAgZWxzZVxyXG4gICAgICBpbnRlcnZhbC5oaWRlKCdmYXN0Jyk7XHJcbiAgICAvLyBTaG93IGZyZXF1ZW5jeS1leHRyYSwgaWYgdGhlcmUgaXMgc29tZW9uZVxyXG4gICAgZi5maW5kKCcuZnJlcXVlbmN5LWV4dHJhLScgKyBmcmVxLnZhbCgpKS5zbGlkZURvd24oJ2Zhc3QnKTtcclxuICAgIC8vIEhpZGUgYWxsIG90aGVyIGZyZXF1ZW5jeS1leHRyYVxyXG4gICAgZi5maW5kKCcuZnJlcXVlbmN5LWV4dHJhOm5vdCguZnJlcXVlbmN5LWV4dHJhLScgKyBmcmVxLnZhbCgpICsgJyknKS5zbGlkZVVwKCdmYXN0Jyk7XHJcbiAgfSk7XHJcbiAgLy8gYXV0by1zZWxlY3Qgc29tZSBvcHRpb25zIHdoZW4gaXRzIHZhbHVlIGNoYW5nZVxyXG4gIGYuZmluZCgnW25hbWU9cmVwZWF0LW9jdXJyZW5jZXNdJykuY2hhbmdlKGZ1bmN0aW9uICgpIHtcclxuICAgIGYuZmluZCgnW25hbWU9cmVwZWF0LWVuZHNdW3ZhbHVlPW9jdXJyZW5jZXNdJykucHJvcCgnY2hlY2tlZCcsIHRydWUpO1xyXG4gIH0pO1xyXG4gIGYuZmluZCgnW25hbWU9cmVwZWF0LWVuZC1kYXRlXScpLmNoYW5nZShmdW5jdGlvbiAoKSB7XHJcbiAgICBmLmZpbmQoJ1tuYW1lPXJlcGVhdC1lbmRzXVt2YWx1ZT1kYXRlXScpLnByb3AoJ2NoZWNrZWQnLCB0cnVlKTtcclxuICB9KTtcclxuICAvLyBzdGFydC1kYXRlIHRyaWdnZXJcclxuICBmLmZpbmQoJ1tuYW1lPXN0YXJ0ZGF0ZV0nKS5vbignY2hhbmdlJywgZnVuY3Rpb24gKCkge1xyXG4gICAgLy8gYXV0byBmaWxsIGVuZGRhdGUgd2l0aCBzdGFydGRhdGUgd2hlbiB0aGlzIGxhc3QgaXMgdXBkYXRlZFxyXG4gICAgZi5maW5kKCdbbmFtZT1lbmRkYXRlXScpLnZhbCh0aGlzLnZhbHVlKTtcclxuICAgIC8vIGlmIG5vIHdlZWstZGF5cyBvciBvbmx5IG9uZSwgYXV0by1zZWxlY3QgdGhlIGRheSB0aGF0IG1hdGNocyBzdGFydC1kYXRlXHJcbiAgICB2YXIgd2Vla0RheXMgPSBmLmZpbmQoJy53ZWVrbHktZXh0cmEgLndlZWstZGF5cyBpbnB1dCcpO1xyXG4gICAgaWYgKHdlZWtEYXlzLmFyZSgnOmNoZWNrZWQnLCB7IHVudGlsOiAxIH0pKSB7XHJcbiAgICAgIHZhciBkYXRlID0gJCh0aGlzKS5kYXRlcGlja2VyKFwiZ2V0RGF0ZVwiKTtcclxuICAgICAgaWYgKGRhdGUpIHtcclxuICAgICAgICB3ZWVrRGF5cy5wcm9wKCdjaGVja2VkJywgZmFsc2UpO1xyXG4gICAgICAgIHdlZWtEYXlzLmZpbHRlcignW3ZhbHVlPScgKyBkYXRlLmdldERheSgpICsgJ10nKS5wcm9wKCdjaGVja2VkJywgdHJ1ZSk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9KTtcclxuXHJcbiAgLy8gSW5pdDpcclxuICByZXBlYXQuY2hhbmdlKCk7XHJcbiAgYWxsZGF5LmNoYW5nZSgpO1xyXG4gIHJlcGVhdEZyZXF1ZW5jeS5jaGFuZ2UoKTtcclxuICAvLyBhZGQgZGF0ZSBwaWNrZXJzXHJcbiAgYXBwbHlEYXRlUGlja2VyKCk7XHJcbiAgLy8gYWRkIHBsYWNlaG9sZGVyIHN1cHBvcnQgKHBvbHlmaWxsKVxyXG4gIGYuZmluZCgnOmlucHV0JykucGxhY2Vob2xkZXIoKTtcclxufSIsIi8qKlxyXG4gIFJlcXVlc3RpbmcgYSBiYWNrZ3JvdW5kIGNoZWNrIHRocm91Z2ggdGhlIGJhY2tncm91bmRDaGVja0VkaXQgZm9ybSBpbnNpZGUgYWJvdXQteW91L3ZlcmlmaWNhdGlvbnMuXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5cclxuLyoqXHJcbiAgU2V0dXAgdGhlIERPTSBlbGVtZW50cyBpbiB0aGUgY29udGFpbmVyIEAkY1xyXG4gIHdpdGggdGhlIGJhY2tncm91bmQtY2hlY2stcmVxdWVzdCBsb2dpYy5cclxuKiovXHJcbmV4cG9ydHMuc2V0dXBGb3JtID0gZnVuY3Rpb24gc2V0dXBGb3JtQmFja2dyb3VuZENoZWNrKCRjKSB7XHJcblxyXG4gIHZhciBzZWxlY3RlZEl0ZW0gPSBudWxsO1xyXG5cclxuICAkYy5vbignY2xpY2snLCAnLmJ1eS1hY3Rpb24nLCBmdW5jdGlvbiAoZSkge1xyXG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgXHJcbiAgICB2YXIgZiA9ICRjLmZpbmQoJy5EYXNoYm9hcmRCYWNrZ3JvdW5kQ2hlY2stcmVxdWVzdEZvcm0nKTtcclxuICAgIHZhciBiY2lkID0gJCh0aGlzKS5kYXRhKCdiYWNrZ3JvdW5kLWNoZWNrLWlkJyk7XHJcbiAgICBzZWxlY3RlZEl0ZW0gPSAkKHRoaXMpLmNsb3Nlc3QoJy5EYXNoYm9hcmRCYWNrZ3JvdW5kQ2hlY2staXRlbScpO1xyXG4gICAgdmFyIHBzMSA9ICRjLmZpbmQoJy5wb3B1cC5idXktc3RlcC0xJyk7XHJcblxyXG4gICAgZi5maW5kKCdbbmFtZT1CYWNrZ3JvdW5kQ2hlY2tJRF0nKS52YWwoYmNpZCk7XHJcbiAgICBmLmZpbmQoJy5tYWluLWFjdGlvbicpLnZhbCgkKHRoaXMpLnRleHQoKSk7XHJcblxyXG4gICAgc21vb3RoQm94QmxvY2sub3BlbihwczEsICRjLCAnYmFja2dyb3VuZC1jaGVjaycpO1xyXG4gIH0pO1xyXG5cclxuICAkYy5vbignYWpheFN1Y2Nlc3NQb3N0JywgJy5EYXNoYm9hcmRCYWNrZ3JvdW5kQ2hlY2stcmVxdWVzdEZvcm0nLCBmdW5jdGlvbiAoZSwgZGF0YSwgdGV4dCwgangsIGN0eCkge1xyXG4gICAgaWYgKGRhdGEuQ29kZSA9PT0gMTEwKSB7XHJcbiAgICAgIHZhciBwczIgPSAkYy5maW5kKCcucG9wdXAuYnV5LXN0ZXAtMicpO1xyXG4gICAgICB2YXIgYm94ID0gc21vb3RoQm94QmxvY2sub3BlbihwczIsICRjLCAnYmFja2dyb3VuZC1jaGVjaycpO1xyXG4gICAgICAvLyBSZW1vdmUgZnJvbSB0aGUgbGlzdCB0aGUgcmVxdWVzdGVkIGl0ZW1cclxuICAgICAgc2VsZWN0ZWRJdGVtLnJlbW92ZSgpO1xyXG4gICAgICAvLyBGb3JjZSB2aWV3ZXIgbGlzdCByZWxvYWRcclxuICAgICAgJGMudHJpZ2dlcigncmVsb2FkTGlzdCcpO1xyXG4gICAgICAvLyBJZiB0aGVyZSBpcyBubyBtb3JlIGl0ZW1zIGluIHRoZSBsaXN0OlxyXG4gICAgICBpZiAoJGMuZmluZCgnLkRhc2hib2FyZEJhY2tncm91bmRDaGVjay1pdGVtJykubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgLy8gdGhlIGNsb3NlIGJ1dHRvbiBvbiB0aGUgcG9wdXAgbXVzdCBjbG9zZSB0aGUgZWRpdG9yIHRvbzpcclxuICAgICAgICBib3guZmluZCgnLmNsb3NlLWFjdGlvbicpLmFkZENsYXNzKCdjcnVkbC1jYW5jZWwnKTtcclxuICAgICAgICAvLyBUaGUgYWN0aW9uIGJveCBtdXN0IGRpc2FwcGVhclxyXG4gICAgICAgICRjLmNsb3Nlc3QoJy5jcnVkbCcpLmZpbmQoJy5CYWNrZ3JvdW5kQ2hlY2tBY3Rpb25Cb3gnKS5yZW1vdmUoKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH0pO1xyXG5cclxufTsiLCIvKiogQXZhaWxhYmlsaXR5OiBDYWxlbmRhciBTeW5jIHNlY3Rpb24gc2V0dXBcclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcblxyXG5leHBvcnRzLm9uID0gZnVuY3Rpb24gKGNvbnRhaW5lclNlbGVjdG9yKSB7XHJcbiAgICBjb250YWluZXJTZWxlY3RvciA9IGNvbnRhaW5lclNlbGVjdG9yIHx8ICcuRGFzaGJvYXJkQ2FsZW5kYXJTeW5jJztcclxuICAgIHZhciBjb250YWluZXIgPSAkKGNvbnRhaW5lclNlbGVjdG9yKSxcclxuICAgICAgICBmaWVsZFNlbGVjdG9yID0gJy5EYXNoYm9hcmRDYWxlbmRhclN5bmMtcHJpdmF0ZVVybEZpZWxkJyxcclxuICAgICAgICBidXR0b25TZWxlY3RvciA9ICcuRGFzaGJvYXJkQ2FsZW5kYXJTeW5jLXJlc2V0LWFjdGlvbic7XHJcblxyXG4gICAgLy8gU2VsZWN0aW5nIHByaXZhdGUtdXJsIGZpZWxkIHZhbHVlIG9uIGZvY3VzIGFuZCBjbGljazpcclxuICAgIGNvbnRhaW5lci5maW5kKGZpZWxkU2VsZWN0b3IpLm9uKCdmb2N1cyBjbGljaycsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB0aGlzLnNlbGVjdCgpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gUmVzZXRpbmcgcHJpdmF0ZS11cmxcclxuICAgIGNvbnRhaW5lclxyXG4gIC5vbignY2xpY2snLCBidXR0b25TZWxlY3RvciwgZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgdmFyIHQgPSAkKHRoaXMpLFxyXG4gICAgICB1cmwgPSB0LmF0dHIoJ2hyZWYnKSxcclxuICAgICAgZmllbGQgPSBjb250YWluZXIuZmluZChmaWVsZFNlbGVjdG9yKTtcclxuXHJcbiAgICAgIGZpZWxkLnZhbCgnJyk7XHJcblxyXG4gICAgICBmdW5jdGlvbiBvbmVycm9yKCkge1xyXG4gICAgICAgICAgZmllbGQudmFsKGZpZWxkLmRhdGEoJ2Vycm9yLW1lc3NhZ2UnKSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgICQuZ2V0SlNPTih1cmwsIGZ1bmN0aW9uIChkYXRhKSB7XHJcbiAgICAgICAgICBpZiAoZGF0YSAmJiBkYXRhLkNvZGUgPT09IDApIHtcclxuICAgICAgICAgICAgICBmaWVsZC52YWwoZGF0YS5SZXN1bHQpLmNoYW5nZSgpO1xyXG4gICAgICAgICAgICAgIGZpZWxkWzBdLnNlbGVjdCgpO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICBvbmVycm9yKCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgIH0pLmZhaWwob25lcnJvcik7XHJcblxyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgfSk7XHJcbn07IiwiLyoqIGNoYW5nZVByb2ZpbGVQaG90bywgaXQgdXNlcyAndXBsb2FkZXInIHVzaW5nIGh0bWw1LCBhamF4IGFuZCBhIHNwZWNpZmljIHBhZ2VcclxuICB0byBtYW5hZ2Ugc2VydmVyLXNpZGUgdXBsb2FkIG9mIGEgbmV3IHVzZXIgcHJvZmlsZSBwaG90by5cclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbnJlcXVpcmUoJ2pxdWVyeS5ibG9ja1VJJyk7XHJcbnZhciBzbW9vdGhCb3hCbG9jayA9IHJlcXVpcmUoJ0xDL3Ntb290aEJveEJsb2NrJyk7XHJcbi8vIFRPRE86IHJlaW1wbGVtZW50IHRoaXMgYW5kIHRoZSBzZXJ2ZXItc2lkZSBmaWxlIHRvIGF2b2lkIGlmcmFtZXMgYW5kIGV4cG9zaW5nIGdsb2JhbCBmdW5jdGlvbnMsXHJcbi8vIGRpcmVjdCBBUEkgdXNlIHdpdGhvdXQgaWZyYW1lLW5vcm1hbCBwb3N0IHN1cHBvcnQgKGN1cnJlbnQgYnJvd3NlciBtYXRyaXggYWxsb3cgdXMgdGhpcz8pXHJcbi8vIFRPRE86IGltcGxlbWVudCBhcyByZWFsIG1vZHVsYXIsIG5leHQgYXJlIHRoZSBrbm93ZWQgbW9kdWxlcyBpbiB1c2UgYnV0IG5vdCBsb2FkaW5nIHRoYXQgYXJlIGV4cGVjdGVkXHJcbi8vIHRvIGJlIGluIHNjb3BlIHJpZ2h0IG5vdyBidXQgbXVzdCBiZSB1c2VkIHdpdGggdGhlIG5leHQgY29kZSB1bmNvbW1lbnRlZC5cclxuLy8gcmVxdWlyZSgndXBsb2FkZXInKTtcclxuLy8gcmVxdWlyZSgnTGNVcmwnKTtcclxuLy8gdmFyIGJsb2NrUHJlc2V0cyA9IHJlcXVpcmUoJy4uL0xDL2Jsb2NrUHJlc2V0cycpXHJcbi8vIHZhciBhamF4Rm9ybXMgPSByZXF1aXJlKCcuLi9MQy9hamF4Rm9ybXMnKTtcclxuXHJcbmV4cG9ydHMub24gPSBmdW5jdGlvbiAoY29udGFpbmVyU2VsZWN0b3IpIHtcclxuICAgIHZhciAkYyA9ICQoY29udGFpbmVyU2VsZWN0b3IpLFxyXG4gICAgICAgIHVzZXJQaG90b1BvcHVwO1xyXG5cclxuICAgICRjLm9uKCdjbGljaycsICdbaHJlZj1cIiNjaGFuZ2UtcHJvZmlsZS1waG90b1wiXScsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB1c2VyUGhvdG9Qb3B1cCA9IHBvcHVwKExjVXJsLkxhbmdQYXRoICsgJ2Rhc2hib2FyZC9BYm91dFlvdS9DaGFuZ2VQaG90by8nLCB7IHdpZHRoOiA3MDAsIGhlaWdodDogNjcwIH0sIG51bGwsIG51bGwsIHsgYXV0b0ZvY3VzOiBmYWxzZSB9KTtcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBOT1RFOiBXZSBhcmUgZXhwb3NpbmcgZ2xvYmFsIGZ1bmN0aW9ucyBmcm9tIGhlcmUgYmVjYXVzZSB0aGUgc2VydmVyIHBhZ2UvaWZyYW1lIGV4cGVjdHMgdGhpc1xyXG4gICAgLy8gdG8gd29yay5cclxuICAgIC8vIFRPRE86IHJlZmFjdG9yIHRvIGF2b2lkIHRoaXMgd2F5LlxyXG4gICAgd2luZG93LnJlbG9hZFVzZXJQaG90byA9IGZ1bmN0aW9uIHJlbG9hZFVzZXJQaG90bygpIHtcclxuICAgICAgICAkYy5maW5kKCcuRGFzaGJvYXJkUHVibGljQmlvLXBob3RvIC5hdmF0YXInKS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgdmFyIHNyYyA9IHRoaXMuZ2V0QXR0cmlidXRlKCdzcmMnKTtcclxuICAgICAgICAgICAgLy8gYXZvaWQgY2FjaGUgdGhpcyB0aW1lXHJcbiAgICAgICAgICAgIHNyYyA9IHNyYyArIFwiP3Y9XCIgKyAobmV3IERhdGUoKSkuZ2V0VGltZSgpO1xyXG4gICAgICAgICAgICB0aGlzLnNldEF0dHJpYnV0ZSgnc3JjJywgc3JjKTtcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcblxyXG4gICAgd2luZG93LmNsb3NlUG9wdXBVc2VyUGhvdG8gPSBmdW5jdGlvbiBjbG9zZVBvcHVwVXNlclBob3RvKCkge1xyXG4gICAgICAgIGlmICh1c2VyUGhvdG9Qb3B1cCkge1xyXG4gICAgICAgICAgICB1c2VyUGhvdG9Qb3B1cC5maW5kKCcuY2xvc2UtcG9wdXAnKS50cmlnZ2VyKCdjbGljaycpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgd2luZG93LmRlbGV0ZVVzZXJQaG90byA9IGZ1bmN0aW9uIGRlbGV0ZVVzZXJQaG90bygpIHtcclxuXHJcbiAgICAgICAgJC51bmJsb2NrVUkoKTtcclxuICAgICAgICBzbW9vdGhCb3hCbG9jay5vcGVuKCQoJzxkaXYvPicpLmh0bWwoTEMuYmxvY2tQcmVzZXRzLmxvYWRpbmcubWVzc2FnZSksICQoJ2JvZHknKSwgJycsIHsgY2VudGVyOiAnaG9yaXpvbnRhbCcgfSk7XHJcblxyXG4gICAgICAgICQuYWpheCh7XHJcbiAgICAgICAgICAgIHVybDogTGNVcmwuTGFuZ1VybCArIFwiZGFzaGJvYXJkL0Fib3V0WW91L0NoYW5nZVBob3RvLz9kZWxldGU9dHJ1ZVwiLFxyXG4gICAgICAgICAgICBtZXRob2Q6IFwiR0VUXCIsXHJcbiAgICAgICAgICAgIGNhY2hlOiBmYWxzZSxcclxuICAgICAgICAgICAgZGF0YVR5cGU6IFwianNvblwiLFxyXG4gICAgICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbiAoZGF0YSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGNvbnRlbnQgPSAoZGF0YS5Db2RlID09PSAwID8gZGF0YS5SZXN1bHQgOiBkYXRhLlJlc3VsdC5FcnJvck1lc3NhZ2UpO1xyXG5cclxuICAgICAgICAgICAgICAgIHNtb290aEJveEJsb2NrLm9wZW4oJCgnPGRpdi8+JykudGV4dChjb250ZW50KSwgJCgnYm9keScpLCAnJywgeyBjbG9zYWJsZTogdHJ1ZSwgY2VudGVyOiAnaG9yaXpvbnRhbCcgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgcmVsb2FkVXNlclBob3RvKCk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGVycm9yOiBhamF4RXJyb3JQb3B1cEhhbmRsZXJcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcblxyXG59O1xyXG4iLCIvKiogRWR1Y2F0aW9uIHBhZ2Ugc2V0dXAgZm9yIENSVURMIHVzZVxyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxuLy9yZXF1aXJlKCdMQy9qcXVlcnkueHRzaCcpO1xyXG5yZXF1aXJlKCdqcXVlcnktdWknKTtcclxuXHJcbi8vIFRPRE86IFJlcGxhY2UgYnkgcmVhbCByZXF1aXJlIGFuZCBub3QgZ2xvYmFsIExDOlxyXG4vL3ZhciBhamF4Rm9ybXMgPSByZXF1aXJlKCcuLi9MQy9hamF4Rm9ybXMnKTtcclxuLy92YXIgY3J1ZGwgPSByZXF1aXJlKCcuLi9MQy9jcnVkbCcpLnNldHVwKGFqYXhGb3Jtcy5vblN1Y2Nlc3MsIGFqYXhGb3Jtcy5vbkVycm9yLCBhamF4Rm9ybXMub25Db21wbGV0ZSk7XHJcbi8vTEMuaW5pdENydWRsID0gY3J1ZGwub247XHJcbnZhciBpbml0Q3J1ZGwgPSBMQy5pbml0Q3J1ZGw7XHJcblxyXG5leHBvcnRzLm9uID0gZnVuY3Rpb24gKGNvbnRhaW5lclNlbGVjdG9yKSB7XHJcbiAgdmFyICRjID0gJChjb250YWluZXJTZWxlY3RvciksXHJcbiAgICBzZWN0aW9uU2VsZWN0b3IgPSAnLkRhc2hib2FyZEVkdWNhdGlvbicsXHJcbiAgICAkc2VjdGlvbiA9ICRjLmZpbmQoc2VjdGlvblNlbGVjdG9yKS5jbG9zZXN0KCcuRGFzaGJvYXJkU2VjdGlvbi1wYWdlLXNlY3Rpb24nKSxcclxuICAgICRvdGhlcnMgPSAkc2VjdGlvbi5zaWJsaW5ncygpXHJcbiAgICAgICAgLmFkZCgkc2VjdGlvbi5maW5kKCcuRGFzaGJvYXJkU2VjdGlvbi1wYWdlLXNlY3Rpb24taW50cm9kdWN0aW9uJykpXHJcbiAgICAgICAgLmFkZCgkc2VjdGlvbi5jbG9zZXN0KCcuRGFzaGJvYXJkQWJvdXRZb3UnKS5zaWJsaW5ncygpKTtcclxuXHJcbiAgdmFyIGNydWRsID0gaW5pdENydWRsKHNlY3Rpb25TZWxlY3Rvcik7XHJcbiAgLy9jcnVkbC5zZXR0aW5ncy5lZmZlY3RzWydzaG93LXZpZXdlciddID0geyBlZmZlY3Q6ICdoZWlnaHQnLCBkdXJhdGlvbjogJ3Nsb3cnIH07XHJcblxyXG4gIGNydWRsLmVsZW1lbnRzXHJcbiAgLm9uKGNydWRsLnNldHRpbmdzLmV2ZW50c1snZWRpdC1zdGFydHMnXSwgZnVuY3Rpb24gKCkge1xyXG4gICAgJG90aGVycy54aGlkZSh7IGVmZmVjdDogJ2hlaWdodCcsIGR1cmF0aW9uOiAnc2xvdycgfSk7XHJcbiAgfSlcclxuICAub24oY3J1ZGwuc2V0dGluZ3MuZXZlbnRzWydlZGl0LWVuZHMnXSwgZnVuY3Rpb24gKCkge1xyXG4gICAgJG90aGVycy54c2hvdyh7IGVmZmVjdDogJ2hlaWdodCcsIGR1cmF0aW9uOiAnc2xvdycgfSk7XHJcbiAgfSlcclxuICAub24oY3J1ZGwuc2V0dGluZ3MuZXZlbnRzWydlZGl0b3ItcmVhZHknXSwgZnVuY3Rpb24gKGUsICRlZGl0b3IpIHtcclxuICAgIC8vIFNldHVwIGF1dG9jb21wbGV0ZVxyXG4gICAgJGVkaXRvci5maW5kKCdbbmFtZT1pbnN0aXR1dGlvbl0nKS5hdXRvY29tcGxldGUoe1xyXG4gICAgICBzb3VyY2U6IExjVXJsLkpzb25QYXRoICsgJ0dldEluc3RpdHV0aW9ucy9BdXRvY29tcGxldGUvJyxcclxuICAgICAgYXV0b0ZvY3VzOiBmYWxzZSxcclxuICAgICAgZGVsYXk6IDIwMCxcclxuICAgICAgbWluTGVuZ3RoOiA1XHJcbiAgICB9KTtcclxuICB9KTtcclxufTtcclxuIiwiLyoqXHJcbiAgZ2VuZXJhdGVCb29rTm93QnV0dG9uOiB3aXRoIHRoZSBwcm9wZXIgaHRtbCBhbmQgZm9ybVxyXG4gIHJlZ2VuZXJhdGVzIHRoZSBidXR0b24gc291cmNlLWNvZGUgYW5kIHByZXZpZXcgYXV0b21hdGljYWxseS5cclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcblxyXG5leHBvcnRzLm9uID0gZnVuY3Rpb24gKGNvbnRhaW5lclNlbGVjdG9yKSB7XHJcbiAgdmFyIGMgPSAkKGNvbnRhaW5lclNlbGVjdG9yKTtcclxuXHJcbiAgZnVuY3Rpb24gcmVnZW5lcmF0ZUJ1dHRvbkNvZGUoKSB7XHJcbiAgICB2YXJcclxuICAgICAgc2l6ZSA9IGMuZmluZCgnW25hbWU9c2l6ZV06Y2hlY2tlZCcpLnZhbCgpLFxyXG4gICAgICBwb3NpdGlvbmlkID0gYy5maW5kKCdbbmFtZT1wb3NpdGlvbmlkXTpjaGVja2VkJykudmFsKCksXHJcbiAgICAgIHNvdXJjZUNvbnRhaW5lciA9IGMuZmluZCgnW25hbWU9YnV0dG9uLXNvdXJjZS1jb2RlXScpLFxyXG4gICAgICBwcmV2aWV3Q29udGFpbmVyID0gYy5maW5kKCcuRGFzaGJvYXJkQm9va05vd0J1dHRvbi1idXR0b25TaXplcy1wcmV2aWV3JyksXHJcbiAgICAgIGJ1dHRvblRwbCA9IGMuZmluZCgnLkRhc2hib2FyZEJvb2tOb3dCdXR0b24tYnV0dG9uQ29kZS1idXR0b25UZW1wbGF0ZScpLnRleHQoKSxcclxuICAgICAgbGlua1RwbCA9IGMuZmluZCgnLkRhc2hib2FyZEJvb2tOb3dCdXR0b24tYnV0dG9uQ29kZS1saW5rVGVtcGxhdGUnKS50ZXh0KCksXHJcbiAgICAgIHRwbCA9IChzaXplID09ICdsaW5rLW9ubHknID8gbGlua1RwbCA6IGJ1dHRvblRwbCksXHJcbiAgICAgIHRwbFZhcnMgPSAkKCcuRGFzaGJvYXJkQm9va05vd0J1dHRvbi1idXR0b25Db2RlJyk7XHJcblxyXG4gICAgcHJldmlld0NvbnRhaW5lci5odG1sKHRwbCk7XHJcbiAgICBwcmV2aWV3Q29udGFpbmVyLmZpbmQoJ2EnKS5hdHRyKCdocmVmJyxcclxuICAgICAgdHBsVmFycy5kYXRhKCdiYXNlLXVybCcpICsgKHBvc2l0aW9uaWQgPyBwb3NpdGlvbmlkICsgJy8nIDogJycpKTtcclxuICAgIHByZXZpZXdDb250YWluZXIuZmluZCgnaW1nJykuYXR0cignc3JjJyxcclxuICAgICAgdHBsVmFycy5kYXRhKCdiYXNlLXNyYycpICsgc2l6ZSk7XHJcbiAgICBzb3VyY2VDb250YWluZXIudmFsKHByZXZpZXdDb250YWluZXIuaHRtbCgpLnRyaW0oKSk7XHJcbiAgfVxyXG5cclxuICAvLyBGaXJzdCBnZW5lcmF0aW9uXHJcbiAgaWYgKGMubGVuZ3RoID4gMCkgcmVnZW5lcmF0ZUJ1dHRvbkNvZGUoKTtcclxuICAvLyBhbmQgb24gYW55IGZvcm0gY2hhbmdlXHJcbiAgYy5vbignY2hhbmdlJywgJ2lucHV0JywgcmVnZW5lcmF0ZUJ1dHRvbkNvZGUpO1xyXG59OyIsIi8qKiBMaWNlbnNlcyBwYWdlIHNldHVwIGZvciBDUlVETCB1c2VcclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcblxyXG4vLyBUT0RPOiBSZXBsYWNlIGJ5IHJlYWwgcmVxdWlyZSBhbmQgbm90IGdsb2JhbCBMQzpcclxuLy92YXIgYWpheEZvcm1zID0gcmVxdWlyZSgnLi4vTEMvYWpheEZvcm1zJyk7XHJcbi8vdmFyIGNydWRsID0gcmVxdWlyZSgnLi4vTEMvY3J1ZGwnKS5zZXR1cChhamF4Rm9ybXMub25TdWNjZXNzLCBhamF4Rm9ybXMub25FcnJvciwgYWpheEZvcm1zLm9uQ29tcGxldGUpO1xyXG4vL0xDLmluaXRDcnVkbCA9IGNydWRsLm9uO1xyXG52YXIgaW5pdENydWRsID0gTEMuaW5pdENydWRsO1xyXG5cclxuZXhwb3J0cy5vbiA9IGZ1bmN0aW9uIChjb250YWluZXJTZWxlY3Rvcikge1xyXG4gIHZhciAkYyA9ICQoY29udGFpbmVyU2VsZWN0b3IpLFxyXG4gICAgbGljZW5zZXNTZWxlY3RvciA9ICcuRGFzaGJvYXJkTGljZW5zZXMnLFxyXG4gICAgJGxpY2Vuc2VzID0gJGMuZmluZChsaWNlbnNlc1NlbGVjdG9yKS5jbG9zZXN0KCcuRGFzaGJvYXJkU2VjdGlvbi1wYWdlLXNlY3Rpb24nKSxcclxuICAgICRvdGhlcnMgPSAkbGljZW5zZXMuc2libGluZ3MoKVxyXG4gICAgICAuYWRkKCRsaWNlbnNlcy5maW5kKCcuRGFzaGJvYXJkU2VjdGlvbi1wYWdlLXNlY3Rpb24taW50cm9kdWN0aW9uJykpXHJcbiAgICAgIC5hZGQoJGxpY2Vuc2VzLmNsb3Nlc3QoJy5EYXNoYm9hcmRZb3VyV29yaycpLnNpYmxpbmdzKCkpO1xyXG5cclxuICB2YXIgY3J1ZGwgPSBpbml0Q3J1ZGwobGljZW5zZXNTZWxlY3Rvcik7XHJcblxyXG4gIGNydWRsLmVsZW1lbnRzXHJcbiAgLm9uKGNydWRsLnNldHRpbmdzLmV2ZW50c1snZWRpdC1zdGFydHMnXSwgZnVuY3Rpb24gKCkge1xyXG4gICAgJG90aGVycy54aGlkZSh7IGVmZmVjdDogJ2hlaWdodCcsIGR1cmF0aW9uOiAnc2xvdycgfSk7XHJcbiAgfSlcclxuICAub24oY3J1ZGwuc2V0dGluZ3MuZXZlbnRzWydlZGl0LWVuZHMnXSwgZnVuY3Rpb24gKCkge1xyXG4gICAgJG90aGVycy54c2hvdyh7IGVmZmVjdDogJ2hlaWdodCcsIGR1cmF0aW9uOiAnc2xvdycgfSk7XHJcbiAgfSk7XHJcbn07XHJcbiIsIi8qKiBMb2NhdGlvbnMgcGFnZSBzZXR1cCBmb3IgQ1JVREwgdXNlXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG52YXIgbWFwUmVhZHkgPSByZXF1aXJlKCdMQy9nb29nbGVNYXBSZWFkeScpO1xyXG4vLyBJbmRpcmVjdGx5IHVzZWQ6IHJlcXVpcmUoJ0xDL2hhc0NvbmZpcm1TdXBwb3J0Jyk7XHJcblxyXG4vLyBUT0RPOiBSZXBsYWNlIGJ5IHJlYWwgcmVxdWlyZSBhbmQgbm90IGdsb2JhbCBMQzpcclxuLy92YXIgYWpheEZvcm1zID0gcmVxdWlyZSgnLi4vTEMvYWpheEZvcm1zJyk7XHJcbi8vdmFyIGNydWRsID0gcmVxdWlyZSgnLi4vTEMvY3J1ZGwnKS5zZXR1cChhamF4Rm9ybXMub25TdWNjZXNzLCBhamF4Rm9ybXMub25FcnJvciwgYWpheEZvcm1zLm9uQ29tcGxldGUpO1xyXG4vL0xDLmluaXRDcnVkbCA9IGNydWRsLm9uO1xyXG52YXIgaW5pdENydWRsID0gTEMuaW5pdENydWRsO1xyXG5cclxuZXhwb3J0cy5vbiA9IGZ1bmN0aW9uIChjb250YWluZXJTZWxlY3Rvcikge1xyXG4gIHZhciAkYyA9ICQoY29udGFpbmVyU2VsZWN0b3IpLFxyXG4gICAgbG9jYXRpb25zU2VsZWN0b3IgPSAnLkRhc2hib2FyZExvY2F0aW9ucycsXHJcbiAgICAkbG9jYXRpb25zID0gJGMuZmluZChsb2NhdGlvbnNTZWxlY3RvcikuY2xvc2VzdCgnLkRhc2hib2FyZFNlY3Rpb24tcGFnZS1zZWN0aW9uJyksXHJcbiAgICAkb3RoZXJzID0gJGxvY2F0aW9ucy5zaWJsaW5ncygpXHJcbiAgICAgIC5hZGQoJGxvY2F0aW9ucy5maW5kKCcuRGFzaGJvYXJkU2VjdGlvbi1wYWdlLXNlY3Rpb24taW50cm9kdWN0aW9uJykpXHJcbiAgICAgIC5hZGQoJGxvY2F0aW9ucy5jbG9zZXN0KCcuRGFzaGJvYXJkWW91cldvcmsnKS5zaWJsaW5ncygpKTtcclxuXHJcbiAgdmFyIGNydWRsID0gaW5pdENydWRsKGxvY2F0aW9uc1NlbGVjdG9yKTtcclxuXHJcbiAgdmFyIGxvY2F0aW9uTWFwO1xyXG5cclxuICBjcnVkbC5lbGVtZW50c1xyXG4gIC5vbihjcnVkbC5zZXR0aW5ncy5ldmVudHNbJ2VkaXQtc3RhcnRzJ10sIGZ1bmN0aW9uICgpIHtcclxuICAgICRvdGhlcnMueGhpZGUoeyBlZmZlY3Q6ICdoZWlnaHQnLCBkdXJhdGlvbjogJ3Nsb3cnIH0pO1xyXG4gIH0pXHJcbiAgLm9uKGNydWRsLnNldHRpbmdzLmV2ZW50c1snZWRpdC1lbmRzJ10sIGZ1bmN0aW9uICgpIHtcclxuICAgICRvdGhlcnMueHNob3coeyBlZmZlY3Q6ICdoZWlnaHQnLCBkdXJhdGlvbjogJ3Nsb3cnIH0pO1xyXG4gIH0pXHJcbiAgLm9uKGNydWRsLnNldHRpbmdzLmV2ZW50c1snZWRpdG9yLXJlYWR5J10sIGZ1bmN0aW9uIChlLCAkZWRpdG9yKSB7XHJcbiAgICAvL0ZvcmNlIGV4ZWN1dGlvbiBvZiB0aGUgJ2hhcy1jb25maXJtJyBzY3JpcHRcclxuICAgICRlZGl0b3IuZmluZCgnZmllbGRzZXQuaGFzLWNvbmZpcm0gPiAuY29uZmlybSBpbnB1dCcpLmNoYW5nZSgpO1xyXG5cclxuICAgIHNldHVwQ29weUxvY2F0aW9uKCRlZGl0b3IpO1xyXG5cclxuICAgIGxvY2F0aW9uTWFwID0gc2V0dXBHZW9wb3NpdGlvbmluZygkZWRpdG9yKTtcclxuICB9KVxyXG4gIC5vbihjcnVkbC5zZXR0aW5ncy5ldmVudHNbJ2VkaXRvci1zaG93ZWQnXSwgZnVuY3Rpb24gKGUsICRlZGl0b3IpIHtcclxuICAgIGlmIChsb2NhdGlvbk1hcClcclxuICAgICAgbWFwUmVhZHkucmVmcmVzaE1hcChsb2NhdGlvbk1hcCk7XHJcbiAgfSk7XHJcbn07XHJcblxyXG5mdW5jdGlvbiBzZXR1cENvcHlMb2NhdGlvbigkZWRpdG9yKSB7XHJcbiAgJGVkaXRvci5maW5kKCdzZWxlY3QuY29weS1sb2NhdGlvbicpLmNoYW5nZShmdW5jdGlvbiAoKSB7XHJcbiAgICB2YXIgJHQgPSAkKHRoaXMpO1xyXG4gICAgJHQuY2xvc2VzdCgnLmNydWRsLWZvcm0nKS5yZWxvYWQoZnVuY3Rpb24gKCkge1xyXG4gICAgICByZXR1cm4gKFxyXG4gICAgICAgICQodGhpcykuZGF0YSgnYWpheC1maWVsZHNldC1hY3Rpb24nKS5yZXBsYWNlKC9Mb2NhdGlvbklEPVxcZCsvZ2ksICdMb2NhdGlvbklEPScgKyAkdC52YWwoKSkgK1xyXG4gICAgICAgICcmJyArICR0LmRhdGEoJ2V4dHJhLXF1ZXJ5JylcclxuICAgICAgKTtcclxuICAgIH0pO1xyXG4gIH0pO1xyXG59XHJcblxyXG4vKiogTG9jYXRlIHVzZXIgcG9zaXRpb24gb3IgdHJhbnNsYXRlIGFkZHJlc3MgdGV4dCBpbnRvIGEgZ2VvY29kZSB1c2luZ1xyXG4gIGJyb3dzZXIgYW5kIEdvb2dsZSBNYXBzIHNlcnZpY2VzLlxyXG4qKi9cclxuZnVuY3Rpb24gc2V0dXBHZW9wb3NpdGlvbmluZygkZWRpdG9yKSB7XHJcbiAgdmFyIG1hcDtcclxuICBtYXBSZWFkeShmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgLy8gUmVnaXN0ZXIgaWYgdXNlciBzZWxlY3RzIG9yIHdyaXRlcyBhIHBvc2l0aW9uICh0byBub3Qgb3ZlcndyaXRlIGl0IHdpdGggYXV0b21hdGljIHBvc2l0aW9uaW5nKVxyXG4gICAgdmFyIHBvc2l0aW9uZWRCeVVzZXIgPSBmYWxzZTtcclxuICAgIC8vIFNvbWUgY29uZnNcclxuICAgIHZhciBkZXRhaWxlZFpvb21MZXZlbCA9IDE3O1xyXG4gICAgdmFyIGdlbmVyYWxab29tTGV2ZWwgPSA5O1xyXG4gICAgdmFyIGZvdW5kTG9jYXRpb25zID0ge1xyXG4gICAgICBieVVzZXI6IG51bGwsXHJcbiAgICAgIGJ5R2VvbG9jYXRpb246IG51bGwsXHJcbiAgICAgIGJ5R2VvY29kZTogbnVsbCxcclxuICAgICAgb3JpZ2luYWw6IG51bGxcclxuICAgIH07XHJcblxyXG4gICAgdmFyIGwgPSAkZWRpdG9yLmZpbmQoJy5sb2NhdGlvbi1tYXAnKTtcclxuICAgIHZhciBtID0gbC5maW5kKCcubWFwLXNlbGVjdG9yID4gLmdvb2dsZS1tYXAnKS5nZXQoMCk7XHJcbiAgICB2YXIgJGxhdCA9IGwuZmluZCgnW25hbWU9bGF0aXR1ZGVdJyk7XHJcbiAgICB2YXIgJGxuZyA9IGwuZmluZCgnW25hbWU9bG9uZ2l0dWRlXScpO1xyXG5cclxuICAgIC8vIENyZWF0aW5nIHBvc2l0aW9uIGNvb3JkaW5hdGVzXHJcbiAgICB2YXIgbXlMYXRsbmc7XHJcbiAgICAoZnVuY3Rpb24gKCkge1xyXG4gICAgICB2YXIgX2xhdF92YWx1ZSA9ICRsYXQudmFsKCksIF9sbmdfdmFsdWUgPSAkbG5nLnZhbCgpO1xyXG4gICAgICBpZiAoX2xhdF92YWx1ZSAmJiBfbG5nX3ZhbHVlKSB7XHJcbiAgICAgICAgbXlMYXRsbmcgPSBuZXcgZ29vZ2xlLm1hcHMuTGF0TG5nKCRsYXQudmFsKCksICRsbmcudmFsKCkpO1xyXG4gICAgICAgIC8vIFdlIGNvbnNpZGVyIGFzICdwb3NpdGlvbmVkIGJ5IHVzZXInIHdoZW4gdGhlcmUgd2FzIGEgc2F2ZWQgdmFsdWUgZm9yIHRoZSBwb3NpdGlvbiBjb29yZGluYXRlcyAod2UgYXJlIGVkaXRpbmcgYSBsb2NhdGlvbilcclxuICAgICAgICBwb3NpdGlvbmVkQnlVc2VyID0gKG15TGF0bG5nLmxhdCgpICE9PSAwICYmIG15TGF0bG5nLmxuZygpICE9PSAwKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICAvLyBEZWZhdWx0IHBvc2l0aW9uIHdoZW4gdGhlcmUgYXJlIG5vdCBvbmUgKFNhbiBGcmFuY2lzY28ganVzdCBub3cpOlxyXG4gICAgICAgIG15TGF0bG5nID0gbmV3IGdvb2dsZS5tYXBzLkxhdExuZygzNy43NTMzNDQzOTIyNjI5OCwgLTEyMi40MjU0NjA2MDM1MTU2KTtcclxuICAgICAgfVxyXG4gICAgfSkoKTtcclxuICAgIC8vIFJlbWVtYmVyIG9yaWdpbmFsIGZvcm0gbG9jYXRpb25cclxuICAgIGZvdW5kTG9jYXRpb25zLm9yaWdpbmFsID0gZm91bmRMb2NhdGlvbnMuY29uZmlybWVkID0gbXlMYXRsbmc7XHJcblxyXG4gICAgLy8gQ3JlYXRlIG1hcFxyXG4gICAgdmFyIG1hcE9wdGlvbnMgPSB7XHJcbiAgICAgIHpvb206IChwb3NpdGlvbmVkQnlVc2VyID8gZGV0YWlsZWRab29tTGV2ZWwgOiBnZW5lcmFsWm9vbUxldmVsKSwgLy8gQmVzdCBkZXRhaWwgd2hlbiB3ZSBhbHJlYWR5IGhhZCBhIGxvY2F0aW9uXHJcbiAgICAgIGNlbnRlcjogbXlMYXRsbmcsXHJcbiAgICAgIG1hcFR5cGVJZDogZ29vZ2xlLm1hcHMuTWFwVHlwZUlkLlJPQURNQVBcclxuICAgIH07XHJcbiAgICBtYXAgPSBuZXcgZ29vZ2xlLm1hcHMuTWFwKG0sIG1hcE9wdGlvbnMpO1xyXG4gICAgLy8gQ3JlYXRlIHRoZSBwb3NpdGlvbiBtYXJrZXJcclxuICAgIHZhciBtYXJrZXIgPSBuZXcgZ29vZ2xlLm1hcHMuTWFya2VyKHtcclxuICAgICAgcG9zaXRpb246IG15TGF0bG5nLFxyXG4gICAgICBtYXA6IG1hcCxcclxuICAgICAgZHJhZ2dhYmxlOiBmYWxzZSxcclxuICAgICAgYW5pbWF0aW9uOiBnb29nbGUubWFwcy5BbmltYXRpb24uRFJPUFxyXG4gICAgfSk7XHJcbiAgICAvLyBMaXN0ZW4gd2hlbiB1c2VyIGNsaWNrcyBtYXAgb3IgbW92ZSB0aGUgbWFya2VyIHRvIG1vdmUgbWFya2VyIG9yIHNldCBwb3NpdGlvbiBpbiB0aGUgZm9ybVxyXG4gICAgZ29vZ2xlLm1hcHMuZXZlbnQuYWRkTGlzdGVuZXIobWFya2VyLCAnZHJhZ2VuZCcsIHNhdmVDb29yZGluYXRlcyk7XHJcbiAgICBnb29nbGUubWFwcy5ldmVudC5hZGRMaXN0ZW5lcihtYXAsICdjbGljaycsIGZ1bmN0aW9uIChldmVudCkge1xyXG4gICAgICBpZiAoIW1hcmtlci5nZXREcmFnZ2FibGUoKSkgcmV0dXJuO1xyXG4gICAgICBwbGFjZU1hcmtlcihldmVudC5sYXRMbmcpO1xyXG4gICAgICBwb3NpdGlvbmVkQnlVc2VyID0gdHJ1ZTtcclxuICAgICAgZm91bmRMb2NhdGlvbnMuYnlVc2VyID0gZXZlbnQubGF0TG5nO1xyXG4gICAgfSk7XHJcbiAgICBmdW5jdGlvbiBwbGFjZU1hcmtlcihsYXRsbmcsIGRvem9vbSwgYXV0b3NhdmUpIHtcclxuICAgICAgbWFya2VyLnNldFBvc2l0aW9uKGxhdGxuZyk7XHJcbiAgICAgIC8vIE1vdmUgbWFwXHJcbiAgICAgIG1hcC5wYW5UbyhsYXRsbmcpO1xyXG4gICAgICBzYXZlQ29vcmRpbmF0ZXMoYXV0b3NhdmUpO1xyXG4gICAgICBpZiAoZG96b29tKVxyXG4gICAgICAvLyBTZXQgem9vbSB0byBzb21ldGhpbmcgbW9yZSBkZXRhaWxlZFxyXG4gICAgICAgIG1hcC5zZXRab29tKGRldGFpbGVkWm9vbUxldmVsKTtcclxuICAgICAgcmV0dXJuIG1hcmtlcjtcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIHNhdmVDb29yZGluYXRlcyhpbkZvcm0pIHtcclxuICAgICAgdmFyIGxhdExuZyA9IG1hcmtlci5nZXRQb3NpdGlvbigpO1xyXG4gICAgICBwb3NpdGlvbmVkQnlVc2VyID0gdHJ1ZTtcclxuICAgICAgZm91bmRMb2NhdGlvbnMuYnlVc2VyID0gbGF0TG5nO1xyXG4gICAgICBpZiAoaW5Gb3JtID09PSB0cnVlKSB7XHJcbiAgICAgICAgJGxhdC52YWwobGF0TG5nLmxhdCgpKTsgLy9tYXJrZXIucG9zaXRpb24uWGFcclxuICAgICAgICAkbG5nLnZhbChsYXRMbmcubG5nKCkpOyAvL21hcmtlci5wb3NpdGlvbi5ZYVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICAvLyBMaXN0ZW4gd2hlbiB1c2VyIGNoYW5nZXMgZm9ybSBjb29yZGluYXRlcyB2YWx1ZXMgdG8gdXBkYXRlIHRoZSBtYXBcclxuICAgICRsYXQuY2hhbmdlKHVwZGF0ZU1hcE1hcmtlcik7XHJcbiAgICAkbG5nLmNoYW5nZSh1cGRhdGVNYXBNYXJrZXIpO1xyXG4gICAgZnVuY3Rpb24gdXBkYXRlTWFwTWFya2VyKCkge1xyXG4gICAgICBwb3NpdGlvbmVkQnlVc2VyID0gdHJ1ZTtcclxuICAgICAgdmFyIG5ld1BvcyA9IG5ldyBnb29nbGUubWFwcy5MYXRMbmcoJGxhdC52YWwoKSwgJGxuZy52YWwoKSk7XHJcbiAgICAgIC8vIE1vdmUgbWFya2VyXHJcbiAgICAgIG1hcmtlci5zZXRQb3NpdGlvbihuZXdQb3MpO1xyXG4gICAgICAvLyBNb3ZlIG1hcFxyXG4gICAgICBtYXAucGFuVG8obmV3UG9zKTtcclxuICAgIH1cclxuXHJcbiAgICAvKj09PT09PT09PT09PT09PT09PT1cclxuICAgICogQVVUTyBQT1NJVElPTklOR1xyXG4gICAgKi9cclxuICAgIGZ1bmN0aW9uIHVzZUdlb2xvY2F0aW9uKGZvcmNlLCBhdXRvc2F2ZSkge1xyXG4gICAgICB2YXIgb3ZlcnJpZGUgPSBmb3JjZSB8fCAhcG9zaXRpb25lZEJ5VXNlcjtcclxuICAgICAgLy8gVXNlIGJyb3dzZXIgZ2VvbG9jYXRpb24gc3VwcG9ydCB0byBnZXQgYW4gYXV0b21hdGljIGxvY2F0aW9uIGlmIHRoZXJlIGlzIG5vIGEgbG9jYXRpb24gc2VsZWN0ZWQgYnkgdXNlclxyXG4gICAgICAvLyBDaGVjayB0byBzZWUgaWYgdGhpcyBicm93c2VyIHN1cHBvcnRzIGdlb2xvY2F0aW9uLlxyXG4gICAgICBpZiAob3ZlcnJpZGUgJiYgbmF2aWdhdG9yLmdlb2xvY2F0aW9uKSB7XHJcblxyXG4gICAgICAgIC8vIFRoaXMgaXMgdGhlIGxvY2F0aW9uIG1hcmtlciB0aGF0IHdlIHdpbGwgYmUgdXNpbmdcclxuICAgICAgICAvLyBvbiB0aGUgbWFwLiBMZXQncyBzdG9yZSBhIHJlZmVyZW5jZSB0byBpdCBoZXJlIHNvXHJcbiAgICAgICAgLy8gdGhhdCBpdCBjYW4gYmUgdXBkYXRlZCBpbiBzZXZlcmFsIHBsYWNlcy5cclxuICAgICAgICB2YXIgbG9jYXRpb25NYXJrZXIgPSBudWxsO1xyXG5cclxuICAgICAgICAvLyBHZXQgdGhlIGxvY2F0aW9uIG9mIHRoZSB1c2VyJ3MgYnJvd3NlciB1c2luZyB0aGVcclxuICAgICAgICAvLyBuYXRpdmUgZ2VvbG9jYXRpb24gc2VydmljZS4gV2hlbiB3ZSBpbnZva2UgdGhpcyBtZXRob2RcclxuICAgICAgICAvLyBvbmx5IHRoZSBmaXJzdCBjYWxsYmFjayBpcyByZXF1aWVkLiBUaGUgc2Vjb25kXHJcbiAgICAgICAgLy8gY2FsbGJhY2sgLSB0aGUgZXJyb3IgaGFuZGxlciAtIGFuZCB0aGUgdGhpcmRcclxuICAgICAgICAvLyBhcmd1bWVudCAtIG91ciBjb25maWd1cmF0aW9uIG9wdGlvbnMgLSBhcmUgb3B0aW9uYWwuXHJcbiAgICAgICAgbmF2aWdhdG9yLmdlb2xvY2F0aW9uLmdldEN1cnJlbnRQb3NpdGlvbihcclxuICAgICAgICAgIGZ1bmN0aW9uIChwb3NpdGlvbikge1xyXG4gICAgICAgICAgICAvLyBDaGVjayB0byBzZWUgaWYgdGhlcmUgaXMgYWxyZWFkeSBhIGxvY2F0aW9uLlxyXG4gICAgICAgICAgICAvLyBUaGVyZSBpcyBhIGJ1ZyBpbiBGaXJlRm94IHdoZXJlIHRoaXMgZ2V0c1xyXG4gICAgICAgICAgICAvLyBpbnZva2VkIG1vcmUgdGhhbiBvbmNlIHdpdGggYSBjYWNoZWQgcmVzdWx0LlxyXG4gICAgICAgICAgICBpZiAobG9jYXRpb25NYXJrZXIpIHtcclxuICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIE1vdmUgbWFya2VyIHRvIHRoZSBtYXAgdXNpbmcgdGhlIHBvc2l0aW9uLCBvbmx5IGlmIHVzZXIgZG9lc24ndCBzZXQgYSBwb3NpdGlvblxyXG4gICAgICAgICAgICBpZiAob3ZlcnJpZGUpIHtcclxuICAgICAgICAgICAgICB2YXIgbGF0TG5nID0gbmV3IGdvb2dsZS5tYXBzLkxhdExuZyhcclxuICAgICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uLmNvb3Jkcy5sYXRpdHVkZSxcclxuICAgICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uLmNvb3Jkcy5sb25naXR1ZGVcclxuICAgICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICBsb2NhdGlvbk1hcmtlciA9IHBsYWNlTWFya2VyKGxhdExuZywgdHJ1ZSwgYXV0b3NhdmUpO1xyXG4gICAgICAgICAgICAgIGZvdW5kTG9jYXRpb25zLmJ5R2VvbG9jYXRpb24gPSBsYXRMbmc7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICBmdW5jdGlvbiAoZXJyb3IpIHtcclxuICAgICAgICAgICAgaWYgKGNvbnNvbGUgJiYgY29uc29sZS5sb2cpIGNvbnNvbGUubG9nKFwiU29tZXRoaW5nIHdlbnQgd3Jvbmc6IFwiLCBlcnJvcik7XHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICB0aW1lb3V0OiAoNSAqIDEwMDApLFxyXG4gICAgICAgICAgICBtYXhpbXVtQWdlOiAoMTAwMCAqIDYwICogMTUpLFxyXG4gICAgICAgICAgICBlbmFibGVIaWdoQWNjdXJhY3k6IHRydWVcclxuICAgICAgICAgIH1cclxuICAgICAgICApO1xyXG5cclxuXHJcbiAgICAgICAgLy8gTm93IHRoYXQgd2UgaGF2ZSBhc2tlZCBmb3IgdGhlIHBvc2l0aW9uIG9mIHRoZSB1c2VyLFxyXG4gICAgICAgIC8vIGxldCdzIHdhdGNoIHRoZSBwb3NpdGlvbiB0byBzZWUgaWYgaXQgdXBkYXRlcy4gVGhpc1xyXG4gICAgICAgIC8vIGNhbiBoYXBwZW4gaWYgdGhlIHVzZXIgcGh5c2ljYWxseSBtb3Zlcywgb2YgaWYgbW9yZVxyXG4gICAgICAgIC8vIGFjY3VyYXRlIGxvY2F0aW9uIGluZm9ybWF0aW9uIGhhcyBiZWVuIGZvdW5kIChleC5cclxuICAgICAgICAvLyBHUFMgdnMuIElQIGFkZHJlc3MpLlxyXG4gICAgICAgIC8vXHJcbiAgICAgICAgLy8gTk9URTogVGhpcyBhY3RzIG11Y2ggbGlrZSB0aGUgbmF0aXZlIHNldEludGVydmFsKCksXHJcbiAgICAgICAgLy8gaW52b2tpbmcgdGhlIGdpdmVuIGNhbGxiYWNrIGEgbnVtYmVyIG9mIHRpbWVzIHRvXHJcbiAgICAgICAgLy8gbW9uaXRvciB0aGUgcG9zaXRpb24uIEFzIHN1Y2gsIGl0IHJldHVybnMgYSBcInRpbWVyIElEXCJcclxuICAgICAgICAvLyB0aGF0IGNhbiBiZSB1c2VkIHRvIGxhdGVyIHN0b3AgdGhlIG1vbml0b3JpbmcuXHJcbiAgICAgICAgdmFyIHBvc2l0aW9uVGltZXIgPSBuYXZpZ2F0b3IuZ2VvbG9jYXRpb24ud2F0Y2hQb3NpdGlvbihcclxuICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gKHBvc2l0aW9uKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gTW92ZSBhZ2FpbiB0byB0aGUgbmV3IG9yIGFjY3VyYXRlZCBwb3NpdGlvbiwgaWYgdXNlciBkb2Vzbid0IHNldCBhIHBvc2l0aW9uXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKG92ZXJyaWRlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICB2YXIgbGF0TG5nID0gbmV3IGdvb2dsZS5tYXBzLkxhdExuZyhcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcG9zaXRpb24uY29vcmRzLmxhdGl0dWRlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbi5jb29yZHMubG9uZ2l0dWRlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgICAgICAgIGxvY2F0aW9uTWFya2VyID0gcGxhY2VNYXJrZXIobGF0TG5nLCB0cnVlLCBhdXRvc2F2ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICBmb3VuZExvY2F0aW9ucy5ieUdlb2xvY2F0aW9uID0gbGF0TG5nO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZVxyXG4gICAgICAgICAgICAgICAgICAgICAgbmF2aWdhdG9yLmdlb2xvY2F0aW9uLmNsZWFyV2F0Y2gocG9zaXRpb25UaW1lcik7XHJcbiAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICApO1xyXG5cclxuICAgICAgICAvLyBJZiB0aGUgcG9zaXRpb24gaGFzbid0IHVwZGF0ZWQgd2l0aGluIDUgbWludXRlcywgc3RvcFxyXG4gICAgICAgIC8vIG1vbml0b3JpbmcgdGhlIHBvc2l0aW9uIGZvciBjaGFuZ2VzLlxyXG4gICAgICAgIHNldFRpbWVvdXQoXHJcbiAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBDbGVhciB0aGUgcG9zaXRpb24gd2F0Y2hlci5cclxuICAgICAgICAgICAgICAgICAgICBuYXZpZ2F0b3IuZ2VvbG9jYXRpb24uY2xlYXJXYXRjaChwb3NpdGlvblRpbWVyKTtcclxuICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgKDEwMDAgKiA2MCAqIDUpXHJcbiAgICAgICAgICAgICAgKTtcclxuICAgICAgfSAvLyBFbmRzIGdlb2xvY2F0aW9uIHBvc2l0aW9uXHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiB1c2VHbWFwc0dlb2NvZGUoaW5pdGlhbExvb2t1cCwgYXV0b3NhdmUpIHtcclxuICAgICAgdmFyIGdlb2NvZGVyID0gbmV3IGdvb2dsZS5tYXBzLkdlb2NvZGVyKCk7XHJcblxyXG4gICAgICAvLyBsb29rdXAgb24gYWRkcmVzcyBmaWVsZHMgY2hhbmdlcyB3aXRoIGNvbXBsZXRlIGluZm9ybWF0aW9uXHJcbiAgICAgIHZhciAkZm9ybSA9ICRlZGl0b3IuZmluZCgnLmNydWRsLWZvcm0nKSwgZm9ybSA9ICRmb3JtLmdldCgwKTtcclxuICAgICAgZnVuY3Rpb24gZ2V0Rm9ybUFkZHJlc3MoKSB7XHJcbiAgICAgICAgdmFyIGFkID0gW107XHJcbiAgICAgICAgZnVuY3Rpb24gYWRkKGZpZWxkKSB7XHJcbiAgICAgICAgICBpZiAoZm9ybS5lbGVtZW50c1tmaWVsZF0udmFsdWUpIGFkLnB1c2goZm9ybS5lbGVtZW50c1tmaWVsZF0udmFsdWUpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBhZGQoJ2FkZHJlc3NsaW5lMScpO1xyXG4gICAgICAgIGFkZCgnYWRkcmVzc2xpbmUyJyk7XHJcbiAgICAgICAgYWRkKCdjaXR5Jyk7XHJcbiAgICAgICAgYWRkKCdwb3N0YWxjb2RlJyk7XHJcbiAgICAgICAgdmFyIHMgPSBmb3JtLmVsZW1lbnRzLnN0YXRlO1xyXG4gICAgICAgIGlmIChzLnZhbHVlKSBhZC5wdXNoKHMub3B0aW9uc1tzLnNlbGVjdGVkSW5kZXhdLmxhYmVsKTtcclxuICAgICAgICBhZC5wdXNoKCdVU0EnKTtcclxuICAgICAgICAvLyBNaW5pbXVtIGZvciB2YWxpZCBhZGRyZXNzOiA0IGZpZWxkcyBmaWxsZWQgb3V0XHJcbiAgICAgICAgcmV0dXJuIGFkLmxlbmd0aCA+PSA1ID8gYWQuam9pbignLCAnKSA6IG51bGw7XHJcbiAgICAgIH1cclxuICAgICAgJGZvcm0ub24oJ2NoYW5nZScsICdbbmFtZT1hZGRyZXNzbGluZTFdLCBbbmFtZT1hZGRyZXNzbGluZTJdLCBbbmFtZT1jaXR5XSwgW25hbWU9cG9zdGFsY29kZV0sIFtuYW1lPXN0YXRlXScsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgYWRkcmVzcyA9IGdldEZvcm1BZGRyZXNzKCk7XHJcbiAgICAgICAgaWYgKGFkZHJlc3MpXHJcbiAgICAgICAgICBnZW9jb2RlTG9va3VwKGFkZHJlc3MsIGZhbHNlKTtcclxuICAgICAgfSk7XHJcblxyXG4gICAgICAvLyBJbml0aWFsIGxvb2t1cFxyXG4gICAgICBpZiAoaW5pdGlhbExvb2t1cCkge1xyXG4gICAgICAgIHZhciBhZGRyZXNzID0gZ2V0Rm9ybUFkZHJlc3MoKTtcclxuICAgICAgICBpZiAoYWRkcmVzcylcclxuICAgICAgICAgIGdlb2NvZGVMb29rdXAoYWRkcmVzcywgdHJ1ZSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGZ1bmN0aW9uIGdlb2NvZGVMb29rdXAoYWRkcmVzcywgb3ZlcnJpZGUpIHtcclxuICAgICAgICBnZW9jb2Rlci5nZW9jb2RlKHsgJ2FkZHJlc3MnOiBhZGRyZXNzIH0sIGZ1bmN0aW9uIChyZXN1bHRzLCBzdGF0dXMpIHtcclxuICAgICAgICAgIGlmIChzdGF0dXMgPT0gZ29vZ2xlLm1hcHMuR2VvY29kZXJTdGF0dXMuT0spIHtcclxuICAgICAgICAgICAgdmFyIGxhdExuZyA9IHJlc3VsdHNbMF0uZ2VvbWV0cnkubG9jYXRpb247XHJcbiAgICAgICAgICAgIC8vY29uc29sZS5pbmZvKCdHZW9jb2RlIHJldHJpZXZlZDogJyArIGxhdExuZyArICcgZm9yIGFkZHJlc3MgXCInICsgYWRkcmVzcyArICdcIicpO1xyXG4gICAgICAgICAgICBmb3VuZExvY2F0aW9ucy5ieUdlb2NvZGUgPSBsYXRMbmc7XHJcblxyXG4gICAgICAgICAgICBwbGFjZU1hcmtlcihsYXRMbmcsIHRydWUsIGF1dG9zYXZlKTtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGlmIChjb25zb2xlICYmIGNvbnNvbGUuZXJyb3IpIGNvbnNvbGUuZXJyb3IoJ0dlb2NvZGUgd2FzIG5vdCBzdWNjZXNzZnVsIGZvciB0aGUgZm9sbG93aW5nIHJlYXNvbjogJyArIHN0YXR1cyArICcgb24gYWRkcmVzcyBcIicgKyBhZGRyZXNzICsgJ1wiJyk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBFeGVjdXRpbmcgYXV0byBwb3NpdGlvbmluZyAoY2hhbmdlZCB0byBhdXRvc2F2ZTp0cnVlIHRvIGFsbCB0aW1lIHNhdmUgdGhlIGxvY2F0aW9uKTpcclxuICAgIC8vdXNlR2VvbG9jYXRpb24odHJ1ZSwgZmFsc2UpO1xyXG4gICAgdXNlR21hcHNHZW9jb2RlKGZhbHNlLCB0cnVlKTtcclxuXHJcbiAgICAvLyBMaW5rIG9wdGlvbnMgbGlua3M6XHJcbiAgICBsLm9uKCdjbGljaycsICcub3B0aW9ucyBhJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICB2YXIgdGFyZ2V0ID0gJCh0aGlzKS5hdHRyKCdocmVmJykuc3Vic3RyKDEpO1xyXG4gICAgICBzd2l0Y2ggKHRhcmdldCkge1xyXG4gICAgICAgIGNhc2UgJ2dlb2xvY2F0aW9uJzpcclxuICAgICAgICAgIGlmIChmb3VuZExvY2F0aW9ucy5ieUdlb2xvY2F0aW9uKVxyXG4gICAgICAgICAgICBwbGFjZU1hcmtlcihmb3VuZExvY2F0aW9ucy5ieUdlb2xvY2F0aW9uLCB0cnVlLCB0cnVlKTtcclxuICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgdXNlR2VvbG9jYXRpb24odHJ1ZSwgdHJ1ZSk7XHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlICdnZW9jb2RlJzpcclxuICAgICAgICAgIGlmIChmb3VuZExvY2F0aW9ucy5ieUdlb2NvZGUpXHJcbiAgICAgICAgICAgIHBsYWNlTWFya2VyKGZvdW5kTG9jYXRpb25zLmJ5R2VvY29kZSwgdHJ1ZSwgdHJ1ZSk7XHJcbiAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHVzZUdtYXBzR2VvY29kZSh0cnVlLCB0cnVlKTtcclxuICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2UgJ2NvbmZpcm0nOlxyXG4gICAgICAgICAgc2F2ZUNvb3JkaW5hdGVzKHRydWUpO1xyXG4gICAgICAgICAgbWFya2VyLnNldERyYWdnYWJsZShmYWxzZSk7XHJcbiAgICAgICAgICBmb3VuZExvY2F0aW9ucy5jb25maXJtZWQgPSBtYXJrZXIuZ2V0UG9zaXRpb24oKTtcclxuICAgICAgICAgIGwuZmluZCgnLmdwcy1sYXQsIC5ncHMtbG5nLCAuYWR2aWNlLCAuZmluZC1hZGRyZXNzLWdlb2NvZGUnKS5oaWRlKCdmYXN0Jyk7XHJcbiAgICAgICAgICB2YXIgZWRpdCA9IGwuZmluZCgnLmVkaXQtYWN0aW9uJyk7XHJcbiAgICAgICAgICBlZGl0LnRleHQoZWRpdC5kYXRhKCdlZGl0LWxhYmVsJykpO1xyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSAnZWRpdGNvb3JkaW5hdGVzJzpcclxuICAgICAgICAgIHZhciBhID0gbC5maW5kKCcuZ3BzLWxhdCwgLmdwcy1sbmcsIC5hZHZpY2UsIC5maW5kLWFkZHJlc3MtZ2VvY29kZScpO1xyXG4gICAgICAgICAgdmFyIGIgPSAhYS5pcygnOnZpc2libGUnKTtcclxuICAgICAgICAgIG1hcmtlci5zZXREcmFnZ2FibGUoYik7XHJcbiAgICAgICAgICB2YXIgJHQgPSAkKHRoaXMpO1xyXG4gICAgICAgICAgaWYgKGIpIHtcclxuICAgICAgICAgICAgJHQuZGF0YSgnZWRpdC1sYWJlbCcsICR0LnRleHQoKSk7XHJcbiAgICAgICAgICAgICR0LnRleHQoJHQuZGF0YSgnY2FuY2VsLWxhYmVsJykpO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgJHQudGV4dCgkdC5kYXRhKCdlZGl0LWxhYmVsJykpO1xyXG4gICAgICAgICAgICAvLyBSZXN0b3JlIGxvY2F0aW9uOlxyXG4gICAgICAgICAgICBwbGFjZU1hcmtlcihmb3VuZExvY2F0aW9ucy5jb25maXJtZWQsIHRydWUsIHRydWUpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgYS50b2dnbGUoJ2Zhc3QnKTtcclxuICAgICAgICAgIGJyZWFrO1xyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9KTtcclxuICB9KTtcclxuXHJcbiAgcmV0dXJuIG1hcDtcclxufSIsIi8qKiBVSSBsb2dpYyB0byBtYW5hZ2UgcHJvdmlkZXIgcGhvdG9zICh5b3VyLXdvcmsvcGhvdG9zKS5cclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbnJlcXVpcmUoJ2pxdWVyeS11aScpO1xyXG52YXIgc21vb3RoQm94QmxvY2sgPSByZXF1aXJlKCdMQy9zbW9vdGhCb3hCbG9jaycpO1xyXG52YXIgY2hhbmdlc05vdGlmaWNhdGlvbiA9IHJlcXVpcmUoJ0xDL2NoYW5nZXNOb3RpZmljYXRpb24nKTtcclxuXHJcbnZhciBzZWN0aW9uU2VsZWN0b3IgPSAnLkRhc2hib2FyZFBob3Rvcyc7XHJcbi8vIE9uIGluaXQsIHRoZSBkZWZhdWx0ICdubyBpbWFnZScgaW1hZ2Ugc3JjIHdpbGwgYmUgZ2V0IGl0IG9uOlxyXG52YXIgZGVmYXVsdEltZ1NyYyA9IG51bGw7XHJcblxyXG5leHBvcnRzLm9uID0gZnVuY3Rpb24gKGNvbnRhaW5lclNlbGVjdG9yKSB7XHJcbiAgICB2YXIgJGMgPSAkKGNvbnRhaW5lclNlbGVjdG9yKTtcclxuXHJcbiAgICBzZXR1cENydWRsRGVsZWdhdGVzKCRjKTtcclxuXHJcbiAgICBpbml0RWxlbWVudHMoJGMpO1xyXG5cclxuICAgIC8vIEFueSB0aW1lIHRoYXQgdGhlIGZvcm0gY29udGVudCBodG1sIGlzIHJlbG9hZGVkLFxyXG4gICAgLy8gcmUtaW5pdGlhbGl6ZSBlbGVtZW50c1xyXG4gICAgJGMub24oJ2FqYXhGb3JtUmV0dXJuZWRIdG1sJywgJ2Zvcm0uYWpheCcsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBpbml0RWxlbWVudHMoJGMpO1xyXG4gICAgfSk7XHJcbn07XHJcblxyXG5mdW5jdGlvbiBzYXZlKGRhdGEpIHtcclxuICAgIFxyXG4gICAgdmFyIGVkaXRQYW5lbCA9ICQoc2VjdGlvblNlbGVjdG9yKTtcclxuXHJcbiAgICByZXR1cm4gJC5hamF4KHtcclxuICAgICAgICB1cmw6IGVkaXRQYW5lbC5kYXRhKCdhamF4LWZpZWxkc2V0LWFjdGlvbicpLFxyXG4gICAgICAgIGRhdGE6IGRhdGEsXHJcbiAgICAgICAgdHlwZTogJ3Bvc3QnLFxyXG4gICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uIChkYXRhKSB7XHJcbiAgICAgICAgICAgIGlmIChkYXRhICYmIGRhdGEuQ29kZSA8IDApIHtcclxuICAgICAgICAgICAgICAgIC8vIG5ldyBlcnJvciBmb3IgUHJvbWlzZS1hdHRhY2hlZCBjYWxsYmFja3NcclxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihkYXRhLkVycm9yTWVzc2FnZSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZGF0YTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgZXJyb3I6IGZ1bmN0aW9uICh4aHIsIHRleHQsIGVycm9yKSB7XHJcbiAgICAgICAgICAgIC8vIFRPRE86IGJldHRlciBlcnJvciBtYW5hZ2VtZW50LCBzYXZpbmdcclxuICAgICAgICAgICAgYWxlcnQoJ1NvcnJ5LCB0aGVyZSB3YXMgYW4gZXJyb3IuICcgKyAoZXJyb3IgfHwgJycpKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gc2F2ZUVkaXRlZFBob3RvKCRmKSB7XHJcblxyXG4gICAgdmFyIGlkID0gJGYuZmluZCgnW25hbWU9UGhvdG9JRF0nKS52YWwoKSxcclxuICAgICAgICBjYXB0aW9uID0gJGYuZmluZCgnW25hbWU9cGhvdG8tY2FwdGlvbl0nKS52YWwoKSxcclxuICAgICAgICBpc1ByaW1hcnkgPSAkZi5maW5kKCdbbmFtZT1pcy1wcmltYXJ5LXBob3RvXScpLnZhbCgpID09PSAnVHJ1ZSc7XHJcblxyXG4gICAgaWYgKGlkICYmIGlkID4gMCkge1xyXG4gICAgICAgIC8vIEFqYXggc2F2ZVxyXG4gICAgICAgIHNhdmUoe1xyXG4gICAgICAgICAgICBQaG90b0lEOiBpZCxcclxuICAgICAgICAgICAgJ3Bob3RvLWNhcHRpb24nOiBjYXB0aW9uLFxyXG4gICAgICAgICAgICAnaXMtcHJpbWFyeS1waG90byc6IGlzUHJpbWFyeSxcclxuICAgICAgICB9KTtcclxuICAgICAgICAvLyBVcGRhdGUgY2FjaGUgYXQgZ2FsbGVyeSBpdGVtXHJcbiAgICAgICAgdmFyICRpdGVtID0gJGYuZmluZCgnLnBvc2l0aW9ucGhvdG9zLWdhbGxlcnkgI1VzZXJQaG90by0nICsgaWQpO1xyXG4gICAgICAgIGlmICgkaXRlbSAmJiAkaXRlbS5sZW5ndGgpIHtcclxuICAgICAgICAgICAgJGl0ZW0uYXR0cignYWx0JywgY2FwdGlvbik7XHJcbiAgICAgICAgICAgIGlmIChpc1ByaW1hcnkpXHJcbiAgICAgICAgICAgICAgICAkaXRlbS5hZGRDbGFzcygnaXMtcHJpbWFyeS1waG90bycpO1xyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICAkaXRlbS5yZW1vdmVDbGFzcygnaXMtcHJpbWFyeS1waG90bycpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuZnVuY3Rpb24gZWRpdFNlbGVjdGVkUGhvdG8oZm9ybSwgc2VsZWN0ZWQpIHtcclxuXHJcbiAgICB2YXIgZWRpdFBhbmVsID0gJCgnLnBvc2l0aW9ucGhvdG9zLWVkaXQnLCBmb3JtKTtcclxuXHJcbiAgICAvLyBVc2UgZ2l2ZW4gQHNlbGVjdGVkIG9yIGxvb2sgZm9yIGEgc2VsZWN0ZWQgcGhvdG8gaW4gdGhlIGxpc3RcclxuICAgIHNlbGVjdGVkID0gc2VsZWN0ZWQgJiYgc2VsZWN0ZWQubGVuZ3RoID8gc2VsZWN0ZWQgOiAkKCcucG9zaXRpb25waG90b3MtZ2FsbGVyeSA+IG9sID4gbGkuc2VsZWN0ZWQnLCBmb3JtKTtcclxuXHJcbiAgICAvLyBNYXJrIHRoaXMgYXMgc2VsZWN0ZWRcclxuICAgIHNlbGVjdGVkLmFkZENsYXNzKCdzZWxlY3RlZCcpLnNpYmxpbmdzKCkucmVtb3ZlQ2xhc3MoJ3NlbGVjdGVkJyk7XHJcblxyXG4gICAgaWYgKHNlbGVjdGVkICYmIHNlbGVjdGVkLmxlbmd0aCA+IDApIHtcclxuICAgICAgICB2YXIgc2VsSW1nID0gc2VsZWN0ZWQuZmluZCgnaW1nJyk7XHJcbiAgICAgICAgLy8gTW92aW5nIHNlbGVjdGVkIHRvIGJlIGVkaXQgcGFuZWxcclxuICAgICAgICB2YXIgcGhvdG9JRCA9IHNlbGVjdGVkLmF0dHIoJ2lkJykubWF0Y2goL15Vc2VyUGhvdG8tKFxcZCspJC8pWzFdO1xyXG4gICAgICAgIGVkaXRQYW5lbC5maW5kKCdbbmFtZT1QaG90b0lEXScpLnZhbChwaG90b0lEKTtcclxuICAgICAgICBlZGl0UGFuZWwuZmluZCgnaW1nJykuYXR0cignc3JjJywgc2VsSW1nLmF0dHIoJ3NyYycpICsgJz9zaXplPW5vcm1hbCcpO1xyXG4gICAgICAgIGVkaXRQYW5lbC5maW5kKCdbbmFtZT1waG90by1jYXB0aW9uXScpLnZhbChzZWxJbWcuYXR0cignYWx0JykpO1xyXG4gICAgICAgIHZhciBpc1ByaW1hcnlWYWx1ZSA9IHNlbGVjdGVkLmhhc0NsYXNzKCdpcy1wcmltYXJ5LXBob3RvJykgPyAnVHJ1ZScgOiAnRmFsc2UnO1xyXG4gICAgICAgIGVkaXRQYW5lbC5maW5kKCdbbmFtZT1pcy1wcmltYXJ5LXBob3RvXScpLnByb3AoJ2NoZWNrZWQnLCBmYWxzZSk7XHJcbiAgICAgICAgZWRpdFBhbmVsLmZpbmQoJ1tuYW1lPWlzLXByaW1hcnktcGhvdG9dW3ZhbHVlPScgKyBpc1ByaW1hcnlWYWx1ZSArICddJykucHJvcCgnY2hlY2tlZCcsIHRydWUpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBpZiAoZm9ybS5maW5kKCcucG9zaXRpb25waG90b3MtZ2FsbGVyeSA+IG9sID4gbGknKS5sZW5ndGggPT09IDApIHtcclxuICAgICAgICAgICAgc21vb3RoQm94QmxvY2sub3Blbihmb3JtLmZpbmQoJy5uby1waG90b3MnKSwgZWRpdFBhbmVsLCAnJywgeyBhdXRvZm9jdXM6IGZhbHNlIH0pO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHNtb290aEJveEJsb2NrLm9wZW4oZm9ybS5maW5kKCcubm8tcHJpbWFyeS1waG90bycpLCBlZGl0UGFuZWwsICcnLCB7IGF1dG9mb2N1czogZmFsc2UgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIE5vIGltYWdlOlxyXG4gICAgICAgIGVkaXRQYW5lbC5maW5kKCdpbWcnKS5hdHRyKCdzcmMnLCBkZWZhdWx0SW1nU3JjKTtcclxuICAgICAgICAvLyBSZXNldCBoaWRkZW4gZmllbGRzIG1hbnVhbGx5IHRvIGF2b2lkIGJyb3dzZXIgbWVtb3J5IGJyZWFraW5nIHRoaW5nc1xyXG4gICAgICAgIGVkaXRQYW5lbC5maW5kKCdbbmFtZT1QaG90b0lEXScpLnZhbCgnJyk7XHJcbiAgICAgICAgZWRpdFBhbmVsLmZpbmQoJ1tuYW1lPXBob3RvLWNhcHRpb25dJykudmFsKCcnKTtcclxuICAgICAgICBlZGl0UGFuZWwuZmluZCgnW25hbWU9aXMtcHJpbWFyeS1waG90b10nKS5wcm9wKCdjaGVja2VkJywgZmFsc2UpO1xyXG4gICAgfVxyXG59XHJcblxyXG4vKiBTZXR1cCB0aGUgY29kZSB0aGF0IHdvcmtzIG9uIHRoZSBkaWZmZXJlbnQgQ1JVREwgYWN0aW9ucyBvbiB0aGUgcGhvdG9zLlxyXG4gIEFsbCB0aGlzIGFyZSBkZWxlZ2F0ZXMsIG9ubHkgbmVlZCB0byBiZSBzZXR1cCBvbmNlIG9uIHRoZSBwYWdlXHJcbiAgKGlmIHRoZSBjb250YWluZXIgJGMgaXMgbm90IHJlcGxhY2VkLCBvbmx5IHRoZSBjb250ZW50cywgZG9lc24ndCBuZWVkIHRvIGNhbGwgYWdhaW4gdGhpcykuXHJcbiovXHJcbmZ1bmN0aW9uIHNldHVwQ3J1ZGxEZWxlZ2F0ZXMoJGMpIHtcclxuICAgICRjXHJcbiAgICAub24oJ2NoYW5nZScsICcucG9zaXRpb25waG90b3MtZWRpdCBpbnB1dCcsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAvLyBJbnN0YW50IHNhdmluZyBvbiB1c2VyIGNoYW5nZXMgdG8gdGhlIGVkaXRpbmcgZm9ybVxyXG4gICAgICAgIHZhciAkZiA9ICQodGhpcykuY2xvc2VzdCgnLnBvc2l0aW9ucGhvdG9zLWVkaXQnKTtcclxuICAgICAgICBzYXZlRWRpdGVkUGhvdG8oJGYpO1xyXG4gICAgfSlcclxuICAgIC5vbignY2xpY2snLCAnLnBvc2l0aW9ucGhvdG9zLXRvb2xzLXVwbG9hZCA+IGEnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIHBvc0lEID0gJCh0aGlzKS5jbG9zZXN0KCdmb3JtJykuZmluZCgnaW5wdXRbbmFtZT1wb3NpdGlvbklEXScpLnZhbCgpO1xyXG4gICAgICAgIHBvcHVwKExjVXJsLkxhbmdQYXRoICsgJ2Rhc2hib2FyZC9Zb3VyV29yay9VcGxvYWRQaG90by8/UG9zaXRpb25JRD0nICsgcG9zSUQsICdzbWFsbCcpO1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0pXHJcbiAgICAub24oJ2NsaWNrJywgJy5wb3NpdGlvbnBob3Rvcy1nYWxsZXJ5IGxpIGEnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyICR0ID0gJCh0aGlzKTtcclxuICAgICAgICB2YXIgZm9ybSA9ICR0LmNsb3Nlc3Qoc2VjdGlvblNlbGVjdG9yKTtcclxuICAgICAgICAvLyBEb24ndCBsb3N0IGxhdGVzdCBjaGFuZ2VzOlxyXG4gICAgICAgIHNhdmVFZGl0ZWRQaG90byhmb3JtKTtcclxuXHJcbiAgICAgICAgc21vb3RoQm94QmxvY2suY2xvc2VBbGwoZm9ybSk7XHJcbiAgICAgICAgLy8gU2V0IHRoaXMgcGhvdG8gYXMgc2VsZWN0ZWRcclxuICAgICAgICB2YXIgc2VsZWN0ZWQgPSAkdC5jbG9zZXN0KCdsaScpO1xyXG4gICAgICAgIGVkaXRTZWxlY3RlZFBob3RvKGZvcm0sIHNlbGVjdGVkKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSlcclxuICAgIC5vbignY2xpY2snLCAnLnBvc2l0aW9ucGhvdG9zLWVkaXQtZGVsZXRlIGEnLCBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgIHZhciBlZGl0UGFuZWwgPSAkKHRoaXMpLmNsb3Nlc3QoJy5wb3NpdGlvbnBob3Rvcy1lZGl0Jyk7XHJcbiAgICAgICAgdmFyIGZvcm0gPSBlZGl0UGFuZWwuY2xvc2VzdChzZWN0aW9uU2VsZWN0b3IpO1xyXG5cclxuICAgICAgICB2YXIgcGhvdG9JRCA9IGVkaXRQYW5lbC5maW5kKCdbbmFtZT1QaG90b0lEXScpLnZhbCgpO1xyXG4gICAgICAgIHZhciAkcGhvdG9JdGVtID0gZm9ybS5maW5kKCcjVXNlclBob3RvLScgKyBwaG90b0lEKTtcclxuXHJcbiAgICAgICAgLy8gSW5zdGFudCBzYXZpbmdcclxuICAgICAgICBzYXZlKHtcclxuICAgICAgICAgICAgUGhvdG9JRDogcGhvdG9JRCxcclxuICAgICAgICAgICAgJ2RlbGV0ZS1waG90byc6ICdUcnVlJyxcclxuICAgICAgICAgICAgcmVzdWx0OiAnanNvbidcclxuICAgICAgICB9KVxyXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgLy8gUmVtb3ZlIGl0ZW1cclxuICAgICAgICAgICAgJHBob3RvSXRlbS5yZW1vdmUoKTtcclxuXHJcbiAgICAgICAgICAgIGVkaXRTZWxlY3RlZFBob3RvKGZvcm0pO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9KTtcclxufVxyXG5cclxuLyogSW5pdGlhbGl6ZSB0aGUgcGhvdG9zIGVsZW1lbnRzIHRvIGJlIHNvcnRhYmxlcywgc2V0IHRoZSBwcmltYXJ5IHBob3RvXHJcbiAgaW4gdGhlIGhpZ2hsaWdodGVkIGFyZSBhbmQgaW5pdGlhbGl6ZSB0aGUgJ2RlbGV0ZSBwaG90bycgZmxhZy5cclxuICBUaGlzIGlzIHJlcXVpcmVkIHRvIGJlIGV4ZWN1dGVkIGFueSB0aW1lIHRoZSBlbGVtZW50cyBodG1sIGlzIHJlcGxhY2VkXHJcbiAgYmVjYXVzZSBuZWVkcyBkaXJlY3QgYWNjZXNzIHRvIHRoZSBET00gZWxlbWVudHMuXHJcbiovXHJcbmZ1bmN0aW9uIGluaXRFbGVtZW50cyhmb3JtKSB7XHJcbiAgICAvLyBQcmVwYXJlIHNvcnRhYmxlIHNjcmlwdFxyXG4gICAgJChcIi5wb3NpdGlvbnBob3Rvcy1nYWxsZXJ5ID4gb2xcIiwgZm9ybSkuc29ydGFibGUoe1xyXG4gICAgICAgIHBsYWNlaG9sZGVyOiBcInVpLXN0YXRlLWhpZ2hsaWdodFwiLFxyXG4gICAgICAgIHVwZGF0ZTogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAvLyBHZXQgcGhvdG8gb3JkZXIsIGEgY29tbWEgc2VwYXJhdGVkIHZhbHVlIG9mIGl0ZW1zIElEc1xyXG4gICAgICAgICAgICB2YXIgb3JkZXIgPSAkKHRoaXMpLnNvcnRhYmxlKFwidG9BcnJheVwiKS50b1N0cmluZygpO1xyXG4gICAgICAgICAgICAvLyBTZXQgb3JkZXIgaW4gdGhlIGZvcm0gZWxlbWVudCwgdG8gYmUgc2VudCBsYXRlciB3aXRoIHRoZSBmb3JtXHJcbiAgICAgICAgICAgICQodGhpcykuY2xvc2VzdChzZWN0aW9uU2VsZWN0b3IpXHJcbiAgICAgICAgICAgIC5maW5kKCdbbmFtZT1nYWxsZXJ5LW9yZGVyXScpXHJcbiAgICAgICAgICAgIC52YWwob3JkZXIpXHJcbiAgICAgICAgICAgIC8vIFdpdGggaW5zdGFudCBzYXZpbmcsIG5vIG1vcmUgbm90aWZ5IGNoYW5nZSBmb3IgQ2hhbmdlc05vdGlmaWVyLCBzbyBjb21tZW50aW5nOlxyXG4gICAgICAgICAgICAvLy5jaGFuZ2UoKVxyXG4gICAgICAgICAgICA7XHJcblxyXG4gICAgICAgICAgICAvLyBJbnN0YW50IHNhdmluZ1xyXG4gICAgICAgICAgICBzYXZlKHtcclxuICAgICAgICAgICAgICAgICdnYWxsZXJ5LW9yZGVyJzogb3JkZXIsXHJcbiAgICAgICAgICAgICAgICBhY3Rpb246ICdvcmRlcicsXHJcbiAgICAgICAgICAgICAgICByZXN1bHQ6ICdqc29uJ1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICBkZWZhdWx0SW1nU3JjID0gZm9ybS5maW5kKCdpbWcnKS5hdHRyKCdzcmMnKTtcclxuXHJcbiAgICAvLyBTZXQgcHJpbWFyeSBwaG90byB0byBiZSBlZGl0ZWRcclxuICAgIGVkaXRTZWxlY3RlZFBob3RvKGZvcm0pO1xyXG5cclxuICAgIC8vIFJlc2V0IGRlbGV0ZSBvcHRpb25cclxuICAgIGZvcm0uZmluZCgnW25hbWU9ZGVsZXRlLXBob3RvXScpLnZhbCgnRmFsc2UnKTtcclxufVxyXG4iLCIvKiogQXZhaWxhYmlsaXR5OiBXZWVrbHkgU2NoZWR1bGUgc2VjdGlvbiBzZXR1cFxyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxudmFyIGF2YWlsYWJpbGl0eUNhbGVuZGFyID0gcmVxdWlyZSgnTEMvYXZhaWxhYmlsaXR5Q2FsZW5kYXInKTtcclxudmFyIGJhdGNoRXZlbnRIYW5kbGVyID0gcmVxdWlyZSgnTEMvYmF0Y2hFdmVudEhhbmRsZXInKTtcclxuXHJcbmV4cG9ydHMub24gPSBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgdmFyIG1vbnRobHlMaXN0ID0gYXZhaWxhYmlsaXR5Q2FsZW5kYXIuTW9udGhseS5lbmFibGVBbGwoKTtcclxuXHJcbiAgICAkLmVhY2gobW9udGhseUxpc3QsIGZ1bmN0aW9uIChpLCB2KSB7XHJcbiAgICAgICAgdmFyIG1vbnRobHkgPSB0aGlzO1xyXG5cclxuICAgICAgICAvLyBTZXR1cGluZyB0aGUgY2FsZW5kYXIgZGF0YSBmaWVsZFxyXG4gICAgICAgIHZhciBmb3JtID0gbW9udGhseS4kZWwuY2xvc2VzdCgnZm9ybS5hamF4LGZpZWxkc2V0LmFqYXgnKTtcclxuICAgICAgICB2YXIgZmllbGQgPSBmb3JtLmZpbmQoJ1tuYW1lPW1vbnRobHldJyk7XHJcbiAgICAgICAgaWYgKGZpZWxkLmxlbmd0aCA9PT0gMClcclxuICAgICAgICAgICAgZmllbGQgPSAkKCc8aW5wdXQgdHlwZT1cImhpZGRlblwiIG5hbWU9XCJtb250aGx5XCIgLz4nKS5pbnNlcnRBZnRlcihtb250aGx5LiRlbCk7XHJcblxyXG4gICAgICAgIC8vIFNhdmUgd2hlbiB0aGUgZm9ybSBpcyB0byBiZSBzdWJtaXR0ZWRcclxuICAgICAgICBmb3JtLm9uKCdwcmVzdWJtaXQnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGZpZWxkLnZhbChKU09OLnN0cmluZ2lmeShtb250aGx5LmdldFVwZGF0ZWREYXRhKCkpKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgLy8gVXBkYXRpbmcgZmllbGQgb24gY2FsZW5kYXIgY2hhbmdlcyAodXNpbmcgYmF0Y2ggdG8gYXZvaWQgaHVydCBwZXJmb3JtYW5jZSlcclxuICAgICAgICAvLyBhbmQgcmFpc2UgY2hhbmdlIGV2ZW50ICh0aGlzIGZpeGVzIHRoZSBzdXBwb3J0IGZvciBjaGFuZ2VzTm90aWZpY2F0aW9uXHJcbiAgICAgICAgLy8gYW5kIGluc3RhbnQtc2F2aW5nKS5cclxuICAgICAgICBtb250aGx5LmV2ZW50cy5vbignZGF0YUNoYW5nZWQnLCBiYXRjaEV2ZW50SGFuZGxlcihmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGZpZWxkXHJcbiAgICAgICAgICAgIC52YWwoSlNPTi5zdHJpbmdpZnkobW9udGhseS5nZXRVcGRhdGVkRGF0YSgpKSlcclxuICAgICAgICAgICAgLmNoYW5nZSgpO1xyXG4gICAgICAgIH0pKTtcclxuICAgIH0pO1xyXG59OyIsIi8qKlxyXG5wYXltZW50OiB3aXRoIHRoZSBwcm9wZXIgaHRtbCBhbmQgZm9ybVxyXG5yZWdlbmVyYXRlcyB0aGUgYnV0dG9uIHNvdXJjZS1jb2RlIGFuZCBwcmV2aWV3IGF1dG9tYXRpY2FsbHkuXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5yZXF1aXJlKCdqcXVlcnkuZm9ybWF0dGVyJyk7XHJcblxyXG5leHBvcnRzLm9uID0gZnVuY3Rpb24gb25QYXltZW50QWNjb3VudChjb250YWluZXJTZWxlY3Rvcikge1xyXG4gIHZhciAkYyA9ICQoY29udGFpbmVyU2VsZWN0b3IpO1xyXG5cclxuICB2YXIgZmluaXQgPSBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgLy8gSW5pdGlhbGl6ZSB0aGUgZm9ybWF0dGVycyBvbiBwYWdlLXJlYWR5Li5cclxuICAgIGluaXRGb3JtYXR0ZXJzKCRjKTtcclxuXHJcbiAgICBjaGFuZ2VQYXltZW50TWV0aG9kKCRjKTtcclxuXHJcbiAgfTtcclxuICAkKGZpbml0KTtcclxuICAvLyBhbmQgYW55IGFqYXgtcG9zdCBvZiB0aGUgZm9ybSB0aGF0IHJldHVybnMgbmV3IGh0bWw6XHJcbiAgJGMub24oJ2FqYXhGb3JtUmV0dXJuZWRIdG1sJywgJ2Zvcm0uYWpheCcsIGZpbml0KTtcclxufTtcclxuXHJcbi8qKiBJbml0aWFsaXplIHRoZSBmaWVsZCBmb3JtYXR0ZXJzIHJlcXVpcmVkIGJ5IHRoZSBwYXltZW50LWFjY291bnQtZm9ybSwgYmFzZWRcclxuICBvbiB0aGUgZmllbGRzIG5hbWVzLlxyXG4qKi9cclxuZnVuY3Rpb24gaW5pdEZvcm1hdHRlcnMoJGNvbnRhaW5lcikge1xyXG4gICRjb250YWluZXIuZmluZCgnW25hbWU9XCJiaXJ0aGRhdGVcIl0nKS5mb3JtYXR0ZXIoe1xyXG4gICAgJ3BhdHRlcm4nOiAne3s5OX19L3t7OTl9fS97ezk5OTl9fScsXHJcbiAgICAncGVyc2lzdGVudCc6IGZhbHNlXHJcbiAgfSk7XHJcbiAgJGNvbnRhaW5lci5maW5kKCdbbmFtZT1cInNzblwiXScpLmZvcm1hdHRlcih7XHJcbiAgICAncGF0dGVybic6ICd7ezk5OX19LXt7OTl9fS17ezk5OTl9fScsXHJcbiAgICAncGVyc2lzdGVudCc6IGZhbHNlXHJcbiAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGNoYW5nZVBheW1lbnRNZXRob2QoJGNvbnRhaW5lcikge1xyXG5cclxuICB2YXIgJGJhbmsgPSAkY29udGFpbmVyLmZpbmQoJy5EYXNoYm9hcmRQYXltZW50QWNjb3VudC1iYW5rJyksXHJcbiAgICAkZWxzID0gJGNvbnRhaW5lci5maW5kKCcuRGFzaGJvYXJkUGF5bWVudEFjY291bnQtY2hhbmdlTWV0aG9kJylcclxuICAgIC5hZGQoJGJhbmspO1xyXG5cclxuICAkY29udGFpbmVyLmZpbmQoJy5BY3Rpb25zLS1jaGFuZ2VQYXltZW50TWV0aG9kJykub24oJ2NsaWNrJywgZnVuY3Rpb24gKCkge1xyXG4gICAgJGVscy50b2dnbGVDbGFzcygnaXMtdmVubW9BY2NvdW50IGlzLWJhbmtBY2NvdW50Jyk7XHJcblxyXG4gICAgaWYgKCRiYW5rLmhhc0NsYXNzKCdpcy12ZW5tb0FjY291bnQnKSkge1xyXG4gICAgICAvLyBSZW1vdmUgYW5kIHNhdmUgbnVtYmVyc1xyXG4gICAgICAkYmFuay5maW5kKCdpbnB1dCcpLnZhbChmdW5jdGlvbiAoaSwgdikge1xyXG4gICAgICAgICQodGhpcykuZGF0YSgncHJldi12YWwnLCB2KTtcclxuICAgICAgICByZXR1cm4gJyc7XHJcbiAgICAgIH0pO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgLy8gUmVzdG9yZSBudW1iZXJzXHJcbiAgICAgICRiYW5rLmZpbmQoJ2lucHV0JykudmFsKGZ1bmN0aW9uIChpLCB2KSB7XHJcbiAgICAgICAgcmV0dXJuICQodGhpcykuZGF0YSgncHJldi12YWwnKTtcclxuICAgICAgfSk7XHJcbiAgICB9XHJcbiAgfSk7XHJcblxyXG59IiwiLyoqIFByaWNpbmcgcGFnZSBzZXR1cCBmb3IgQ1JVREwgdXNlXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG52YXIgVGltZVNwYW4gPSByZXF1aXJlKCdMQy9UaW1lU3BhbicpO1xyXG5yZXF1aXJlKCdMQy9UaW1lU3BhbkV4dHJhJykucGx1Z0luKFRpbWVTcGFuKTtcclxudmFyIHVwZGF0ZVRvb2x0aXBzID0gcmVxdWlyZSgnTEMvdG9vbHRpcHMnKS51cGRhdGVUb29sdGlwcztcclxuXHJcbi8vIFRPRE86IFJlcGxhY2UgYnkgcmVhbCByZXF1aXJlIGFuZCBub3QgZ2xvYmFsIExDOlxyXG4vL3ZhciBhamF4Rm9ybXMgPSByZXF1aXJlKCcuLi9MQy9hamF4Rm9ybXMnKTtcclxuLy92YXIgY3J1ZGwgPSByZXF1aXJlKCcuLi9MQy9jcnVkbCcpLnNldHVwKGFqYXhGb3Jtcy5vblN1Y2Nlc3MsIGFqYXhGb3Jtcy5vbkVycm9yLCBhamF4Rm9ybXMub25Db21wbGV0ZSk7XHJcbi8vTEMuaW5pdENydWRsID0gY3J1ZGwub247XHJcbnZhciBpbml0Q3J1ZGwgPSBMQy5pbml0Q3J1ZGw7XHJcblxyXG5leHBvcnRzLm9uID0gZnVuY3Rpb24gKHByaWNpbmdTZWxlY3Rvcikge1xyXG4gIHByaWNpbmdTZWxlY3RvciA9IHByaWNpbmdTZWxlY3RvciB8fCAnLkRhc2hib2FyZFByaWNpbmcnO1xyXG4gIHZhciAkcHJpY2luZyA9ICQocHJpY2luZ1NlbGVjdG9yKS5jbG9zZXN0KCcuRGFzaGJvYXJkU2VjdGlvbi1wYWdlLXNlY3Rpb24nKSxcclxuICAgICRvdGhlcnMgPSAkcHJpY2luZy5zaWJsaW5ncygpXHJcbiAgICAgIC5hZGQoJHByaWNpbmcuZmluZCgnLkRhc2hib2FyZFNlY3Rpb24tcGFnZS1zZWN0aW9uLWludHJvZHVjdGlvbicpKVxyXG4gICAgICAuYWRkKCRwcmljaW5nLmNsb3Nlc3QoJy5EYXNoYm9hcmRZb3VyV29yaycpLnNpYmxpbmdzKCkpO1xyXG5cclxuICB2YXIgY3J1ZGwgPSBpbml0Q3J1ZGwocHJpY2luZ1NlbGVjdG9yKTtcclxuXHJcbiAgY3J1ZGwuZWxlbWVudHNcclxuICAub24oY3J1ZGwuc2V0dGluZ3MuZXZlbnRzWydlZGl0LXN0YXJ0cyddLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAkb3RoZXJzLnhoaWRlKHsgZWZmZWN0OiAnaGVpZ2h0JywgZHVyYXRpb246ICdzbG93JyB9KTtcclxuICB9KVxyXG4gIC5vbihjcnVkbC5zZXR0aW5ncy5ldmVudHNbJ2VkaXQtZW5kcyddLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAkb3RoZXJzLnhzaG93KHsgZWZmZWN0OiAnaGVpZ2h0JywgZHVyYXRpb246ICdzbG93JyB9KTtcclxuICB9KVxyXG4gIC5vbihjcnVkbC5zZXR0aW5ncy5ldmVudHNbJ2VkaXRvci1yZWFkeSddLCBmdW5jdGlvbiAoZSwgJGVkaXRvcikge1xyXG5cclxuICAgIHNldHVwTm9QcmljZVJhdGVVcGRhdGVzKCRlZGl0b3IpO1xyXG4gICAgc2V0dXBQcm92aWRlclBhY2thZ2VTbGlkZXJzKCRlZGl0b3IpO1xyXG4gICAgdXBkYXRlVG9vbHRpcHMoKTtcclxuICAgIHNldHVwU2hvd01vcmVBdHRyaWJ1dGVzTGluaygkZWRpdG9yKTtcclxuXHJcbiAgfSk7XHJcbn07XHJcblxyXG4vKiBIYW5kbGVyIGZvciBjaGFuZ2UgZXZlbnQgb24gJ25vdCB0byBzdGF0ZSBwcmljZSByYXRlJywgdXBkYXRpbmcgcmVsYXRlZCBwcmljZSByYXRlIGZpZWxkcy5cclxuICBJdHMgc2V0dXBlZCBwZXIgZWRpdG9yIGluc3RhbmNlLCBub3QgYXMgYW4gZXZlbnQgZGVsZWdhdGUuXHJcbiovXHJcbmZ1bmN0aW9uIHNldHVwTm9QcmljZVJhdGVVcGRhdGVzKCRlZGl0b3IpIHtcclxuICB2YXIgXHJcbiAgICBwciA9ICRlZGl0b3IuZmluZCgnW25hbWU9cHJpY2UtcmF0ZV0sW25hbWU9cHJpY2UtcmF0ZS11bml0XScpLFxyXG4gICAgbnByID0gJGVkaXRvci5maW5kKCdbbmFtZT1uby1wcmljZS1yYXRlXScpO1xyXG4gIG5wci5vbignY2hhbmdlJywgZnVuY3Rpb24gKCkge1xyXG4gICAgcHIucHJvcCgnZGlzYWJsZWQnLCBucHIucHJvcCgnY2hlY2tlZCcpKTtcclxuICB9KTtcclxuICAvLyBJbml0aWFsIHN0YXRlOlxyXG4gIG5wci5jaGFuZ2UoKTtcclxufVxyXG5cclxuLyoqIFNldHVwIHRoZSBVSSBTbGlkZXJzIG9uIHRoZSBlZGl0b3IuXHJcbioqL1xyXG5mdW5jdGlvbiBzZXR1cFByb3ZpZGVyUGFja2FnZVNsaWRlcnMoJGVkaXRvcikge1xyXG5cclxuICAvKiBIb3VzZWVrZWVwZXIgcHJpY2luZyAqL1xyXG4gIGZ1bmN0aW9uIHVwZGF0ZUF2ZXJhZ2UoJGMsIG1pbnV0ZXMpIHtcclxuICAgICRjLmZpbmQoJ1tuYW1lPXByb3ZpZGVyLWF2ZXJhZ2UtdGltZV0nKS52YWwobWludXRlcyk7XHJcbiAgICBtaW51dGVzID0gcGFyc2VJbnQobWludXRlcyk7XHJcbiAgICAkYy5maW5kKCcucHJldmlldyAudGltZScpLnRleHQoVGltZVNwYW4uZnJvbU1pbnV0ZXMobWludXRlcykudG9TbWFydFN0cmluZygpKTtcclxuICB9XHJcblxyXG4gICRlZGl0b3IuZmluZChcIi5wcm92aWRlci1hdmVyYWdlLXRpbWUtc2xpZGVyXCIpLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgdmFyICRjID0gJCh0aGlzKS5jbG9zZXN0KCdbZGF0YS1zbGlkZXItdmFsdWVdJyk7XHJcbiAgICB2YXIgYXZlcmFnZSA9ICRjLmRhdGEoJ3NsaWRlci12YWx1ZScpLFxyXG4gICAgICBzdGVwID0gJGMuZGF0YSgnc2xpZGVyLXN0ZXAnKSB8fCAxO1xyXG4gICAgaWYgKCFhdmVyYWdlKSByZXR1cm47XHJcbiAgICB2YXIgc2V0dXAgPSB7XHJcbiAgICAgIHJhbmdlOiBcIm1pblwiLFxyXG4gICAgICB2YWx1ZTogYXZlcmFnZSxcclxuICAgICAgbWluOiBhdmVyYWdlIC0gMyAqIHN0ZXAsXHJcbiAgICAgIG1heDogYXZlcmFnZSArIDMgKiBzdGVwLFxyXG4gICAgICBzdGVwOiBzdGVwLFxyXG4gICAgICBzbGlkZTogZnVuY3Rpb24gKGV2ZW50LCB1aSkge1xyXG4gICAgICAgIHVwZGF0ZUF2ZXJhZ2UoJGMsIHVpLnZhbHVlKTtcclxuICAgICAgfVxyXG4gICAgfTtcclxuICAgIHZhciBzbGlkZXIgPSAkKHRoaXMpLnNsaWRlcihzZXR1cCk7XHJcblxyXG4gICAgJGMuZmluZCgnLnByb3ZpZGVyLWF2ZXJhZ2UtdGltZScpLm9uKCdjbGljaycsICdsYWJlbCcsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgdmFyICR0ID0gJCh0aGlzKTtcclxuICAgICAgaWYgKCR0Lmhhc0NsYXNzKCdiZWxvdy1hdmVyYWdlLWxhYmVsJykpXHJcbiAgICAgICAgc2xpZGVyLnNsaWRlcigndmFsdWUnLCBzZXR1cC5taW4pO1xyXG4gICAgICBlbHNlIGlmICgkdC5oYXNDbGFzcygnYXZlcmFnZS1sYWJlbCcpKVxyXG4gICAgICAgIHNsaWRlci5zbGlkZXIoJ3ZhbHVlJywgc2V0dXAudmFsdWUpO1xyXG4gICAgICBlbHNlIGlmICgkdC5oYXNDbGFzcygnYWJvdmUtYXZlcmFnZS1sYWJlbCcpKVxyXG4gICAgICAgIHNsaWRlci5zbGlkZXIoJ3ZhbHVlJywgc2V0dXAubWF4KTtcclxuICAgICAgdXBkYXRlQXZlcmFnZSgkYywgc2xpZGVyLnNsaWRlcigndmFsdWUnKSk7XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBTZXR1cCB0aGUgaW5wdXQgZmllbGQsIGhpZGRlbiBhbmQgd2l0aCBpbml0aWFsIHZhbHVlIHN5bmNocm9uaXplZCB3aXRoIHNsaWRlclxyXG4gICAgdmFyIGZpZWxkID0gJGMuZmluZCgnW25hbWU9cHJvdmlkZXItYXZlcmFnZS10aW1lXScpO1xyXG4gICAgZmllbGQuaGlkZSgpO1xyXG4gICAgdmFyIGN1cnJlbnRWYWx1ZSA9IGZpZWxkLnZhbCgpIHx8IGF2ZXJhZ2U7XHJcbiAgICB1cGRhdGVBdmVyYWdlKCRjLCBjdXJyZW50VmFsdWUpO1xyXG4gICAgc2xpZGVyLnNsaWRlcigndmFsdWUnLCBjdXJyZW50VmFsdWUpO1xyXG4gIH0pO1xyXG59XHJcblxyXG4vKiogVGhlIGluLWVkaXRvciBsaW5rICNzaG93LW1vcmUtYXR0cmlidXRlcyBtdXN0IHNob3cvaGlkZSB0aGUgY29udGFpbmVyIG9mXHJcbiAgZXh0cmEgYXR0cmlidXRlcyBmb3IgdGhlIHBhY2thZ2UvcHJpY2luZy1pdGVtLiBUaGlzIHNldHVwcyB0aGUgcmVxdWlyZWQgaGFuZGxlci5cclxuKiovXHJcbmZ1bmN0aW9uIHNldHVwU2hvd01vcmVBdHRyaWJ1dGVzTGluaygkZWRpdG9yKSB7XHJcbiAgLy8gSGFuZGxlciBmb3IgJ3Nob3ctbW9yZS1hdHRyaWJ1dGVzJyBidXR0b24gKHVzZWQgb25seSBvbiBlZGl0IGEgcGFja2FnZSlcclxuICAkZWRpdG9yLmZpbmQoJy5zaG93LW1vcmUtYXR0cmlidXRlcycpLm9uKCdjbGljaycsIGZ1bmN0aW9uICgpIHtcclxuICAgIHZhciAkdCA9ICQodGhpcyk7XHJcbiAgICB2YXIgYXR0cyA9ICR0LnNpYmxpbmdzKCcuc2VydmljZXMtbm90LWNoZWNrZWQnKTtcclxuICAgIGlmIChhdHRzLmlzKCc6dmlzaWJsZScpKSB7XHJcbiAgICAgICR0LnRleHQoJHQuZGF0YSgnc2hvdy10ZXh0JykpO1xyXG4gICAgICBhdHRzLnN0b3AoKS5oaWRlKCdmYXN0Jyk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAkdC50ZXh0KCR0LmRhdGEoJ2hpZGUtdGV4dCcpKTtcclxuICAgICAgYXR0cy5zdG9wKCkuc2hvdygnZmFzdCcpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG4gIH0pO1xyXG59IiwiLyoqXHJcbiAgcHJpdmFjeVNldHRpbmdzOiBTZXR1cCBmb3IgdGhlIHNwZWNpZmljIHBhZ2UtZm9ybSBkYXNoYm9hcmQvcHJpdmFjeS9wcml2YWN5c2V0dGluZ3NcclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbi8vIFRPRE8gSW1wbGVtZW50IGRlcGVuZGVuY2llcyBjb21taW5nIGZyb20gYXBwLmpzIGluc3RlYWQgb2YgZGlyZWN0IGxpbmtcclxuLy92YXIgc21vb3RoQm94QmxvY2sgPSByZXF1aXJlKCdzbW9vdGhCb3hCbG9jaycpO1xyXG4vLyBUT0RPIFJlcGxhY2UgZG9tLXJlc3NvdXJjZXMgYnkgaTE4bi5nZXRUZXh0XHJcblxyXG52YXIgcHJpdmFjeSA9IHtcclxuICBhY2NvdW50TGlua3NTZWxlY3RvcjogJy5EYXNoYm9hcmRQcml2YWN5U2V0dGluZ3MtbXlBY2NvdW50IGEnLFxyXG4gIHJlc3NvdXJjZXNTZWxlY3RvcjogJy5EYXNoYm9hcmRQcml2YWN5LWFjY291bnRSZXNzb3VyY2VzJ1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBwcml2YWN5O1xyXG5cclxucHJpdmFjeS5vbiA9IGZ1bmN0aW9uIChjb250YWluZXJTZWxlY3Rvcikge1xyXG4gIHZhciAkYyA9ICQoY29udGFpbmVyU2VsZWN0b3IpO1xyXG5cclxuICAkYy5vbignY2xpY2snLCAnLmNhbmNlbC1hY3Rpb24nLCBmdW5jdGlvbiAoKSB7XHJcbiAgICBzbW9vdGhCb3hCbG9jay5jbG9zZSgkYyk7XHJcbiAgfSk7XHJcblxyXG4gICRjLm9uKCdhamF4U3VjY2Vzc1Bvc3RNZXNzYWdlQ2xvc2VkJywgJy5hamF4LWJveCcsIGZ1bmN0aW9uICgpIHtcclxuICAgIHdpbmRvdy5sb2NhdGlvbi5yZWxvYWQoKTtcclxuICB9KTtcclxuICBcclxuICAkYy5vbignY2xpY2snLCBwcml2YWN5LmFjY291bnRMaW5rc1NlbGVjdG9yLCBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgdmFyIGIsXHJcbiAgICAgIGxyZXMgPSAkYy5maW5kKHByaXZhY3kucmVzc291cmNlc1NlbGVjdG9yKTtcclxuXHJcbiAgICBzd2l0Y2ggKCQodGhpcykuYXR0cignaHJlZicpKSB7XHJcbiAgICAgIGNhc2UgJyNkZWxldGUtbXktYWNjb3VudCc6XHJcbiAgICAgICAgYiA9IHNtb290aEJveEJsb2NrLm9wZW4obHJlcy5jaGlsZHJlbignLmRlbGV0ZS1tZXNzYWdlLWNvbmZpcm0nKS5jbG9uZSgpLCAkYyk7XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICAgIGNhc2UgJyNkZWFjdGl2YXRlLW15LWFjY291bnQnOlxyXG4gICAgICAgIGIgPSBzbW9vdGhCb3hCbG9jay5vcGVuKGxyZXMuY2hpbGRyZW4oJy5kZWFjdGl2YXRlLW1lc3NhZ2UtY29uZmlybScpLmNsb25lKCksICRjKTtcclxuICAgICAgICBicmVhaztcclxuICAgICAgY2FzZSAnI3JlYWN0aXZhdGUtbXktYWNjb3VudCc6XHJcbiAgICAgICAgYiA9IHNtb290aEJveEJsb2NrLm9wZW4obHJlcy5jaGlsZHJlbignLnJlYWN0aXZhdGUtbWVzc2FnZS1jb25maXJtJykuY2xvbmUoKSwgJGMpO1xyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgICBkZWZhdWx0OlxyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfVxyXG4gICAgaWYgKGIpIHtcclxuICAgICAgJCgnaHRtbCxib2R5Jykuc3RvcCh0cnVlLCB0cnVlKS5hbmltYXRlKHsgc2Nyb2xsVG9wOiBiLm9mZnNldCgpLnRvcCB9LCA1MDAsIG51bGwpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG4gIH0pO1xyXG5cclxufTsiLCIvKiogU2VydmljZSBBdHRyaWJ1dGVzIFZhbGlkYXRpb246IGltcGxlbWVudHMgdmFsaWRhdGlvbnMgdGhyb3VnaCB0aGUgXHJcbiAgJ2N1c3RvbVZhbGlkYXRpb24nIGFwcHJvYWNoIGZvciAncG9zaXRpb24gc2VydmljZSBhdHRyaWJ1dGVzJy5cclxuICBJdCB2YWxpZGF0ZXMgdGhlIHJlcXVpcmVkIGF0dHJpYnV0ZSBjYXRlZ29yeSwgYWxtb3N0LW9uZSBvciBzZWxlY3Qtb25lIG1vZGVzLlxyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxudmFyIGdldFRleHQgPSByZXF1aXJlKCdMQy9nZXRUZXh0Jyk7XHJcbnZhciB2aCA9IHJlcXVpcmUoJ0xDL3ZhbGlkYXRpb25IZWxwZXInKTtcclxudmFyIGVzY2FwZUpRdWVyeVNlbGVjdG9yVmFsdWUgPSByZXF1aXJlKCdMQy9qcXVlcnlVdGlscycpLmVzY2FwZUpRdWVyeVNlbGVjdG9yVmFsdWU7XHJcblxyXG4vKiogRW5hYmxlIHZhbGlkYXRpb24gb2YgcmVxdWlyZWQgc2VydmljZSBhdHRyaWJ1dGVzIG9uXHJcbiAgdGhlIGZvcm0ocykgc3BlY2lmaWVkIGJ5IHRoZSBzZWxlY3RvciBvciBwcm92aWRlZFxyXG4qKi9cclxuZXhwb3J0cy5zZXR1cCA9IGZ1bmN0aW9uIHNldHVwU2VydmljZUF0dHJpYnV0ZXNWYWxpZGF0aW9uKGNvbnRhaW5lclNlbGVjdG9yLCBvcHRpb25zKSB7XHJcbiAgdmFyICRjID0gJChjb250YWluZXJTZWxlY3Rvcik7XHJcbiAgb3B0aW9ucyA9ICQuZXh0ZW5kKHtcclxuICAgIHJlcXVpcmVkU2VsZWN0b3I6ICcuRGFzaGJvYXJkU2VydmljZXMtYXR0cmlidXRlcy1jYXRlZ29yeS5pcy1yZXF1aXJlZCcsXHJcbiAgICBzZWxlY3RPbmVDbGFzczogJ2pzLXZhbGlkYXRpb25TZWxlY3RPbmUnLFxyXG4gICAgZ3JvdXBFcnJvckNsYXNzOiAnaXMtZXJyb3InLFxyXG4gICAgdmFsRXJyb3JUZXh0S2V5OiAncmVxdWlyZWQtYXR0cmlidXRlLWNhdGVnb3J5LWVycm9yJ1xyXG4gIH0sIG9wdGlvbnMpO1xyXG5cclxuICAkYy5lYWNoKGZ1bmN0aW9uIHZhbGlkYXRlU2VydmljZUF0dHJpYnV0ZXMoKSB7XHJcbiAgICB2YXIgZiA9ICQodGhpcyk7XHJcbiAgICBpZiAoIWYuaXMoJ2Zvcm0sZmllbGRzZXQnKSkge1xyXG4gICAgICBpZiAoY29uc29sZSAmJiBjb25zb2xlLmVycm9yKSBjb25zb2xlLmVycm9yKCdUaGUgZWxlbWVudCB0byBhcHBseSB2YWxpZGF0aW9uIG11c3QgYmUgYSBmb3JtIG9yIGZpZWxkc2V0Jyk7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBmLmRhdGEoJ2N1c3RvbVZhbGlkYXRpb24nLCB7XHJcbiAgICAgIHZhbGlkYXRlOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIHZhbGlkID0gdHJ1ZSwgbGFzdFZhbGlkID0gdHJ1ZTtcclxuICAgICAgICB2YXIgdiA9IHZoLmZpbmRWYWxpZGF0aW9uU3VtbWFyeShmKTtcclxuXHJcbiAgICAgICAgZi5maW5kKG9wdGlvbnMucmVxdWlyZWRTZWxlY3RvcikuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICB2YXIgZnMgPSAkKHRoaXMpO1xyXG4gICAgICAgICAgdmFyIGNhdCA9IGZzLmNoaWxkcmVuKCdsZWdlbmQnKS50ZXh0KCk7XHJcbiAgICAgICAgICAvLyBXaGF0IHR5cGUgb2YgdmFsaWRhdGlvbiBhcHBseT9cclxuICAgICAgICAgIGlmIChmcy5pcygnLicgKyBvcHRpb25zLnNlbGVjdE9uZUNsYXNzKSlcclxuICAgICAgICAgIC8vIGlmIHRoZSBjYXQgaXMgYSAndmFsaWRhdGlvbi1zZWxlY3Qtb25lJywgYSAnc2VsZWN0JyBlbGVtZW50IHdpdGggYSAncG9zaXRpdmUnXHJcbiAgICAgICAgICAvLyA6c2VsZWN0ZWQgdmFsdWUgbXVzdCBiZSBjaGVja2VkXHJcbiAgICAgICAgICAgIGxhc3RWYWxpZCA9ICEhKGZzLmZpbmQoJ29wdGlvbjpzZWxlY3RlZCcpLnZhbCgpKTtcclxuICAgICAgICAgIGVsc2VcclxuICAgICAgICAgIC8vIE90aGVyd2lzZSwgbG9vayBmb3IgJ2FsbW9zdCBvbmUnIGNoZWNrZWQgdmFsdWVzOlxyXG4gICAgICAgICAgICBsYXN0VmFsaWQgPSAoZnMuZmluZCgnaW5wdXQ6Y2hlY2tlZCcpLmxlbmd0aCA+IDApO1xyXG5cclxuICAgICAgICAgIGlmICghbGFzdFZhbGlkKSB7XHJcbiAgICAgICAgICAgIHZhbGlkID0gZmFsc2U7XHJcbiAgICAgICAgICAgIGZzLmFkZENsYXNzKG9wdGlvbnMuZ3JvdXBFcnJvckNsYXNzKTtcclxuICAgICAgICAgICAgdmFyIGVyciA9IGdldFRleHQob3B0aW9ucy52YWxFcnJvclRleHRLZXksIGNhdCk7XHJcbiAgICAgICAgICAgIGlmICh2LmZpbmQoJ2xpW3RpdGxlPVwiJyArIGVzY2FwZUpRdWVyeVNlbGVjdG9yVmFsdWUoY2F0KSArICdcIl0nKS5sZW5ndGggPT09IDApXHJcbiAgICAgICAgICAgICAgdi5jaGlsZHJlbigndWwnKS5hcHBlbmQoJCgnPGxpLz4nKS50ZXh0KGVycikuYXR0cigndGl0bGUnLCBjYXQpKTtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGZzLnJlbW92ZUNsYXNzKG9wdGlvbnMuZ3JvdXBFcnJvckNsYXNzKTtcclxuICAgICAgICAgICAgdi5maW5kKCdsaVt0aXRsZT1cIicgKyBlc2NhcGVKUXVlcnlTZWxlY3RvclZhbHVlKGNhdCkgKyAnXCJdJykucmVtb3ZlKCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGlmICh2YWxpZCkge1xyXG4gICAgICAgICAgdmguc2V0VmFsaWRhdGlvblN1bW1hcnlBc1ZhbGlkKGYpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICB2aC5zZXRWYWxpZGF0aW9uU3VtbWFyeUFzRXJyb3IoZik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB2YWxpZDtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gIH0pO1xyXG59O1xyXG4iLCIvKiogSXQgcHJvdmlkZXMgdGhlIGNvZGUgZm9yIHRoZSBhY3Rpb25zIG9mIHRoZSBWZXJpZmljYXRpb25zIHNlY3Rpb24uXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5yZXF1aXJlKCdqcXVlcnkuYmxvY2tVSScpO1xyXG4vL3ZhciBMY1VybCA9IHJlcXVpcmUoJy4uL0xDL0xjVXJsJyk7XHJcbi8vdmFyIHBvcHVwID0gcmVxdWlyZSgnLi4vTEMvcG9wdXAnKTtcclxuXHJcbnZhciBhY3Rpb25zID0gZXhwb3J0cy5hY3Rpb25zID0ge307XHJcblxyXG5hY3Rpb25zLmZhY2Vib29rID0gZnVuY3Rpb24gKCkge1xyXG4gIC8qIEZhY2Vib29rIGNvbm5lY3QgKi9cclxuICB2YXIgRmFjZWJvb2tDb25uZWN0ID0gcmVxdWlyZSgnTEMvRmFjZWJvb2tDb25uZWN0Jyk7XHJcbiAgdmFyIGZiID0gbmV3IEZhY2Vib29rQ29ubmVjdCh7XHJcbiAgICByZXN1bHRUeXBlOiAnanNvbicsXHJcbiAgICB1cmxTZWN0aW9uOiAnVmVyaWZ5JyxcclxuICAgIGFwcElkOiAkKCdodG1sJykuZGF0YSgnZmItYXBwaWQnKSxcclxuICAgIHBlcm1pc3Npb25zOiAnZW1haWwsdXNlcl9hYm91dF9tZScsXHJcbiAgICBsb2FkaW5nVGV4dDogJ1ZlcmlmaW5nJ1xyXG4gIH0pO1xyXG4gICQoZG9jdW1lbnQpLm9uKGZiLmNvbm5lY3RlZEV2ZW50LCBmdW5jdGlvbiAoKSB7XHJcbiAgICAkKGRvY3VtZW50KS5vbigncG9wdXAtY2xvc2VkJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICBsb2NhdGlvbi5yZWxvYWQoKTtcclxuICAgIH0pO1xyXG4gIH0pO1xyXG4gIGZiLmNvbm5lY3QoKTtcclxufTtcclxuXHJcbmFjdGlvbnMuZW1haWwgPSBmdW5jdGlvbiAoKSB7XHJcbiAgcG9wdXAoTGNVcmwuTGFuZ1BhdGggKyAnQWNjb3VudC8kUmVzZW5kQ29uZmlybWF0aW9uRW1haWwvbm93LycsIHBvcHVwLnNpemUoJ3NtYWxsJykpO1xyXG59O1xyXG5cclxudmFyIGxpbmtzID0gZXhwb3J0cy5saW5rcyA9IHtcclxuICAnI2Nvbm5lY3Qtd2l0aC1mYWNlYm9vayc6IGFjdGlvbnMuZmFjZWJvb2ssXHJcbiAgJyNjb25maXJtLWVtYWlsJzogYWN0aW9ucy5lbWFpbFxyXG59O1xyXG5cclxuZXhwb3J0cy5vbiA9IGZ1bmN0aW9uIChjb250YWluZXJTZWxlY3Rvcikge1xyXG4gIHZhciAkYyA9ICQoY29udGFpbmVyU2VsZWN0b3IpO1xyXG5cclxuICAkYy5vbignY2xpY2snLCAnYScsIGZ1bmN0aW9uICgpIHtcclxuICAgIC8vIEdldCB0aGUgYWN0aW9uIGxpbmsgb3IgZW1wdHlcclxuICAgIHZhciBsaW5rID0gdGhpcy5nZXRBdHRyaWJ1dGUoJ2hyZWYnKSB8fCAnJztcclxuXHJcbiAgICAvLyBFeGVjdXRlIHRoZSBhY3Rpb24gYXR0YWNoZWQgdG8gdGhhdCBsaW5rXHJcbiAgICB2YXIgYWN0aW9uID0gbGlua3NbbGlua10gfHwgbnVsbDtcclxuICAgIGlmICh0eXBlb2YgKGFjdGlvbikgPT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgYWN0aW9uKCk7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuICB9KTtcclxufTtcclxuIiwiLyoqIFZlcmlmaWNhdGlvbnMgcGFnZSBzZXR1cCBmb3IgQ1JVREwgdXNlXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5cclxuLy8gVE9ETzogUmVwbGFjZSBieSByZWFsIHJlcXVpcmUgYW5kIG5vdCBnbG9iYWwgTEM6XHJcbi8vdmFyIGFqYXhGb3JtcyA9IHJlcXVpcmUoJy4uL0xDL2FqYXhGb3JtcycpO1xyXG4vL3ZhciBjcnVkbCA9IHJlcXVpcmUoJy4uL0xDL2NydWRsJykuc2V0dXAoYWpheEZvcm1zLm9uU3VjY2VzcywgYWpheEZvcm1zLm9uRXJyb3IsIGFqYXhGb3Jtcy5vbkNvbXBsZXRlKTtcclxuLy9MQy5pbml0Q3J1ZGwgPSBjcnVkbC5vbjtcclxudmFyIGluaXRDcnVkbCA9IExDLmluaXRDcnVkbDtcclxuXHJcbmV4cG9ydHMub24gPSBmdW5jdGlvbiAoY29udGFpbmVyU2VsZWN0b3IpIHtcclxuICB2YXIgJGMgPSAkKGNvbnRhaW5lclNlbGVjdG9yKSxcclxuICAgIHNlY3Rpb25TZWxlY3RvciA9ICcuRGFzaGJvYXJkVmVyaWZpY2F0aW9ucycsXHJcbiAgICAkc2VjdGlvbiA9ICRjLmZpbmQoc2VjdGlvblNlbGVjdG9yKS5jbG9zZXN0KCcuRGFzaGJvYXJkU2VjdGlvbi1wYWdlLXNlY3Rpb24nKSxcclxuICAgICRvdGhlcnMgPSAkc2VjdGlvbi5zaWJsaW5ncygpXHJcbiAgICAgIC5hZGQoJHNlY3Rpb24uZmluZCgnLkRhc2hib2FyZFNlY3Rpb24tcGFnZS1zZWN0aW9uLWludHJvZHVjdGlvbicpKVxyXG4gICAgICAuYWRkKCRzZWN0aW9uLmNsb3Nlc3QoJy5EYXNoYm9hcmRBYm91dFlvdScpLnNpYmxpbmdzKCkpO1xyXG5cclxuICB2YXIgY3J1ZGwgPSBpbml0Q3J1ZGwoc2VjdGlvblNlbGVjdG9yKTtcclxuXHJcbiAgY3J1ZGwuZWxlbWVudHNcclxuICAub24oY3J1ZGwuc2V0dGluZ3MuZXZlbnRzWydlZGl0LXN0YXJ0cyddLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAkb3RoZXJzLnhoaWRlKHsgZWZmZWN0OiAnaGVpZ2h0JywgZHVyYXRpb246ICdzbG93JyB9KTtcclxuICB9KVxyXG4gIC5vbihjcnVkbC5zZXR0aW5ncy5ldmVudHNbJ2VkaXQtZW5kcyddLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAkb3RoZXJzLnhzaG93KHsgZWZmZWN0OiAnaGVpZ2h0JywgZHVyYXRpb246ICdzbG93JyB9KTtcclxuICB9KVxyXG4gIC5vbihjcnVkbC5zZXR0aW5ncy5ldmVudHNbJ2VkaXRvci1yZWFkeSddLCBmdW5jdGlvbiAoZSwgJGVkaXRvcikge1xyXG4gICAgcmVxdWlyZSgnLi9iYWNrZ3JvdW5kQ2hlY2tSZXF1ZXN0Jykuc2V0dXBGb3JtKCRlZGl0b3IuZmluZCgnLkRhc2hib2FyZEJhY2tncm91bmRDaGVjaycpKTtcclxuICB9KTtcclxufTtcclxuIiwiLyoqIEF2YWlsYWJpbGl0eTogV2Vla2x5IFNjaGVkdWxlIHNlY3Rpb24gc2V0dXBcclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbnZhciBhdmFpbGFiaWxpdHlDYWxlbmRhciA9IHJlcXVpcmUoJ0xDL2F2YWlsYWJpbGl0eUNhbGVuZGFyJyk7XHJcbnZhciBiYXRjaEV2ZW50SGFuZGxlciA9IHJlcXVpcmUoJ0xDL2JhdGNoRXZlbnRIYW5kbGVyJyk7XHJcblxyXG5leHBvcnRzLm9uID0gZnVuY3Rpb24gKCkge1xyXG5cclxuICAgIHZhciB3b3JrSG91cnNMaXN0ID0gYXZhaWxhYmlsaXR5Q2FsZW5kYXIuV29ya0hvdXJzLmVuYWJsZUFsbCgpO1xyXG5cclxuICAgICQuZWFjaCh3b3JrSG91cnNMaXN0LCBmdW5jdGlvbiAoaSwgdikge1xyXG4gICAgICAgIHZhciB3b3JraG91cnMgPSB0aGlzO1xyXG5cclxuICAgICAgICAvLyBTZXR1cGluZyB0aGUgV29ya0hvdXJzIGNhbGVuZGFyIGRhdGEgZmllbGRcclxuICAgICAgICB2YXIgZm9ybSA9IHdvcmtob3Vycy4kZWwuY2xvc2VzdCgnZm9ybS5hamF4LCBmaWVsZHNldC5hamF4Jyk7XHJcbiAgICAgICAgdmFyIGZpZWxkID0gZm9ybS5maW5kKCdbbmFtZT13b3JraG91cnNdJyk7XHJcbiAgICAgICAgaWYgKGZpZWxkLmxlbmd0aCA9PT0gMClcclxuICAgICAgICAgICAgZmllbGQgPSAkKCc8aW5wdXQgdHlwZT1cImhpZGRlblwiIG5hbWU9XCJ3b3JraG91cnNcIiAvPicpLmluc2VydEFmdGVyKHdvcmtob3Vycy4kZWwpO1xyXG5cclxuICAgICAgICAvLyBTYXZlIHdoZW4gdGhlIGZvcm0gaXMgdG8gYmUgc3VibWl0dGVkXHJcbiAgICAgICAgZm9ybS5vbigncHJlc3VibWl0JywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBmaWVsZC52YWwoSlNPTi5zdHJpbmdpZnkod29ya2hvdXJzLmRhdGEpKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgLy8gVXBkYXRpbmcgZmllbGQgb24gY2FsZW5kYXIgY2hhbmdlcyAodXNpbmcgYmF0Y2ggdG8gYXZvaWQgaHVydCBwZXJmb3JtYW5jZSlcclxuICAgICAgICAvLyBhbmQgcmFpc2UgY2hhbmdlIGV2ZW50ICh0aGlzIGZpeGVzIHRoZSBzdXBwb3J0IGZvciBjaGFuZ2VzTm90aWZpY2F0aW9uXHJcbiAgICAgICAgLy8gYW5kIGluc3RhbnQtc2F2aW5nKS5cclxuICAgICAgICB3b3JraG91cnMuZXZlbnRzLm9uKCdkYXRhQ2hhbmdlZCcsIGJhdGNoRXZlbnRIYW5kbGVyKGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgICAgIGZpZWxkXHJcbiAgICAgICAgICAgIC52YWwoSlNPTi5zdHJpbmdpZnkod29ya2hvdXJzLmRhdGEpKVxyXG4gICAgICAgICAgICAuY2hhbmdlKCk7XHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICAvLyBEaXNhYmxpbmcgY2FsZW5kYXIgb24gZmllbGQgYWxsdGltZVxyXG4gICAgICAgIGZvcm0uZmluZCgnW25hbWU9YWxsdGltZV0nKS5vbignY2hhbmdlJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICB2YXIgJHQgPSAkKHRoaXMpLFxyXG4gICAgICAgIGNsID0gd29ya2hvdXJzLmNsYXNzZXMuZGlzYWJsZWQ7XHJcbiAgICAgICAgICAgIGlmIChjbClcclxuICAgICAgICAgICAgICAgIHdvcmtob3Vycy4kZWwudG9nZ2xlQ2xhc3MoY2wsICR0LnByb3AoJ2NoZWNrZWQnKSk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgfSk7XHJcbn07XHJcbiJdfQ==
