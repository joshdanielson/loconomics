/**
 * An input with accessible and customizable autocomplete feature.
 *
 * The component allows to provide custom templates for the isBusy and suggestions
 * content, displayed in a listBox.
 * For a suggestions template, each element that represents an item from the data
 * MUST have the SUGGESTION_ATTR_NAME attribute, and the value can be empty or the text
 * to be used as input value when selected; when empty, the text content of the
 * element will be used.
 * Too, each of that elements MUST HAVE a unique ID attribute.
 *
 * @module kocomponents/input-autocomplete
 * @example
 * Basic usage:
 * <input-autocomplete data-params="value: searchTerm, suggestions: searchResults,
 * id: 'searchInput', name: 's', icon: 'ion-ios-search'"></input-autocomplete>
 *
 * Custom templates:
 * <input-autocomplete params="value: searchTerm, suggestions: searchResults,
 * id: 'searchInput', name: 's', icon: 'ion-ios-search'">
 *     <template name="isBusy">
 *         <span class="some-external-class">Searching...</span>
 *     </template>
 *     <template name="suggestions">
 *         <ul data-bind="foreach: $data">
 *             <li data-bind="attr: {
 *                     id: 'searchInput-suggestion-' + $index(),
 *                     'data-input-autocomplete-suggestion': itemValue
 *                 }">
 *                 <strong data-bind="text: itemValue"></strong>
 *                 <em data-bind="text: itemDescription"></em>
 *             </li>
 *         </ul>
 *     </template>
 * </input-autocomplete>
 */
'use strict';

var TAG_NAME = 'input-autocomplete';
var TEMPLATE = require('../../html/kocomponents/input-autocomplete.html');
var CSS_CLASS = 'InputAutocomplete';
//require-styl '../../css/components/InputAutocomplete.styl'
var SUGGESTION_ATTR_NAME = 'data-input-autocomplete-suggestion';
var SUGGESTION_ATTR_NAME_SELECTOR = '[' + SUGGESTION_ATTR_NAME + ']';

var ko = require('knockout');
var getObservable = require('../utils/getObservable');

/**
 * @interface SuggestionsBase Base class or interface that externally
 * provided suggestions object must meet.
 * @member {(number|KnockoutObservable<number>)} length Number of elements
 */

/**
 * Utility class to manage the suggestion DOM elements and how to change
 * the active one. It's use by the component ViewModel to performs the actions
 * from keyboard interactions.
 * @class ActiveSuggestionManager
 * @param {KnockoutObservable<HTMLElement} activeSuggestionElement From the
 * ViewModel, holds the element that is active and will be updated by this
 * class methods.
 * @param {HTMLElement} root The component HTMLElement instance
 */
function ActiveSuggestionManager(activeSuggestionElement, root) {
    return {
        /**
         * Reference to the viewModel observable that keeps track of which
         * DOM element is now the active one.
         * This is updated and accessed by the manager methods.
         * @member {KnockoutObservable<HTMLElement>}
         */
        activeSuggestionElement: activeSuggestionElement,
        /**
         * Remove any attribute or state from the given element that could
         * previously being the active suggestion.
         * Does NOT touch the observable (a call to 'set' with a new element
         * must be performed)
         * @param {HTMLElement} element
         */
        unset: function(element) {
            // replaced 'element instanceof HTMLElement' because of unknow support
            if (element && element.removeAttribute) {
                element.removeAttribute('aria-selected');
            }
        },
        /**
         * Set the given element as the active suggestion element, adding any
         * attribute or state to it.
         * @param {HTMLElement} element
         */
        set: function(element) {
            this.unset(this.activeSuggestionElement());
            // replaced 'element instanceof HTMLElement' because of unknow support
            if (element && element.setAttribute) {
                element.setAttribute('aria-selected', 'true');
            }
            this.activeSuggestionElement(element || null);
        },
        /**
         * Given and index and total of elements, returns the index if is in
         * the boundaries or makes a circular movement when out (when before
         * first returns last, after last returns first).
         * @private
         * @param {number} index The proposed index that need to be checked
         * or fixed
         * @param {number} total Number of elements. The index goes between
         * zero and (total - 1).
         * @returns {number} A correct index.
         */
        fixIndex: function(index, total) {
            if (index < 0) {
                return total - 1;
            }
            else if (index >= total) {
                return 0;
            }
            else {
                return index;
            }
        },
        /**
         * Changes the active suggestion by changing the index of the current one
         * by a given offset.
         * A couple of constants are provided representing the needed offset
         * to move to next or previous element.
         * @param {number} offset Amount of positions from current index to shift
         * the current active suggestion. 1 to select next, -1 for previous.
         */
        shiftTo: function(offset) {
            var el = this.activeSuggestionElement();
            var suggestions = root.querySelectorAll(SUGGESTION_ATTR_NAME_SELECTOR);
            // Make it an array
            suggestions = Array.prototype.slice.call(suggestions);
            // Look for the current index
            var activeIndex = suggestions.indexOf(el);
            // If is valid
            if (activeIndex > -1) {
                // Go
                var newIndex = this.fixIndex(activeIndex + offset, suggestions.length);
                var newEl = suggestions[newIndex];
                this.set(newEl);
            }
            else {
                // Select the first one
                this.set(suggestions[0]);
            }
        },
        SHIFT_TO_NEXT: 1,
        SHIFT_TO_PREVIOUS: -1,
        /**
         * Makes that no element is registered as active at the moment.
         */
        clear: function() {
            this.unset(this.activeSuggestionElement());
            this.activeSuggestionElement(null);
        }
    };
}

/**
 * The component view model
 * @class
 * @param {Object} params
 * @param {KnockoutObservable<string>} params.id
 * @param {KnockoutObservable<string>} params.name
 * @param {KnockoutObservable<string>} params.icon
 * @param {KnockoutObservable<string>} [params.placeholder]
 * @param {KnockoutObservable<string>} params.value It holds the user typed
 * text at the input element 'realtime'.
 * @param {KnockoutObservable<SuggestionsBase>} params.suggestions
 * @param {KnockoutObservable<boolean>} params.isBusy Let's know the state of
 * the external load of suggestions data (search/filtering)
 * @param {Function<string, object, void>} [params.onSelect] Callback triggered
 * when the user selects a suggestion from the listBox, providing as parameters
 * the text value and the context data of the suggestion. Any provided function
 * will replace the default onSelect handler, that automatically sets the
 * autocomplete value (params.value) as the selected text value; if that
 * behavior is still wanted, must be done by the new callback.
 * @param {Object} refs Set of references to generated elements meant to be
 * provided internally by the creator of the component.
 * @param {HTMLElement} refs.root Reference to the component instance element,
 * the root of any other elements inside it.
 * @param {Object} children Set of named children giving externally and
 * filtered by the creator of the component.
 * @param {HTMLElement} [children.isBusyTemplate] Element used as template for the
 * item that notifies the isBusy state.
 * @param {HTMLElement} children.suggestionsTemplate Element used as template for the
 * suggestions object. A template is required, but optional for externally
 * provided template (here must be the external or the default template).
 */
function ViewModel(params, refs, children) {
    //jshint maxstatements:40
    /// Members from input params
    /**
     * @member {KnockoutObservable<string>} id
     */
    this.id = getObservable(params.id);
    /**
     * @member {KnockoutObservable<name>} name
     */
    this.name = getObservable(params.name);
    /**
     * @member {KnockoutObservable<string>} icon
     */
    this.icon = getObservable(params.icon);
    /**
     * @member {KnockoutObservable<string>} [placeholder]
     */
    this.placeholder = getObservable(params.placeholder);
    /**
     * @member {KnockoutObservable<string>} value
     */
    this.value = getObservable(params.value);
    /**
     * @member {KnockoutObservable<SuggestionsBase>} suggestions
     */
    this.suggestions = getObservable(params.suggestions);
    /**
     * @member {KnockoutObservable<boolean>} isBusy
     */
    this.isBusy = getObservable(params.isBusy);
    /**
     * Default implementation for the onSelect handler, replaced for any
     * function given as params.onSelect.
     * @member {Function<string, object, void>} onSelect
     */
    this.onSelect = function(textValue/*, contextData*/) {
        this.value(textValue);
    };
    if (typeof(params.onSelect) === 'function') {
        this.onSelect = params.onSelect;
    }

    /// Internal members
    /**
     * @member {KnockoutObservable<string>} notificationText Provides text
     * for assistive technologies, through an aria-live region, to notify
     * interactive changes.
     */
    this.notificationText = ko.observable('');
    /**
     * @member {KnockoutObservable<HTMLElement>} activeSuggestionElement Holds the
     * element that represents an input-autocomplete-suggestion and is
     * currently active (highlighted) with keyboard.
     * Used for accessibility and styling, at the element and at the input.
     */
    this.activeSuggestionElement = ko.observable(null);
    /**
     * @member {KnockoutObservable<boolean>} collapsedRequested Forces the
     * listbox to be collapsed when value is 'true', even if there are
     * data/state to show up the list; otherwise is just left the listbox to
     * be collapsed or expanded depending on the availability of data or
     * current state.
     * This is needed to be able to:
     * - close/hide the list of suggestions when
     * one was already selected (so there is data at 'suggestions' but does
     * not need to be displayed --one value was picked already)
     * - allow user to request to hide it even without select one (press Esc
     * key)
     * - allow user to show it again (by pressing Ctrl+Alt+Space)
     * - automatically close when moving focus away from the input
     * - automatically open when moving focus to the input (and has suggestions)
     * - automatically re-open when the value changed even if collapse was
     * required (reset this flag)
     */
    this.collapsedRequested = ko.observable(false);

    /// Computed side-effects / Observable subcriptions
    /**
     * Automaticall re-open the listbox when the value changed (reset the
     * collapsedRequested flag)
     */
    this.value.subscribe(function() {
        this.collapsedRequested(false);
    }.bind(this));

    /// Computed properties
    /**
     * @member {KnockoutComputed<boolean>} isExpanded Let's know if the
     * suggestions listBox must be expanded (AKA opened).
     */
    this.isExpanded = ko.pureComputed(function() {
        return !this.collapsedRequested() && (this.isBusy() || ko.unwrap(this.suggestions().length));
    }, this);
    /**
     * @member {KnockoutComputed<string>} listBoxID Generated identifier for the
     * listBox element, required to create a relationship between elements
     * and state.
     */
    this.listBoxID = ko.pureComputed(function() {
        return this.id() + '-input-autocomplete-listBox';
    }, this);
    /**
     * @member {KnockoutComputed} activeSuggestionData Holds the data value/object
     * that generates the suggestion item currently active
     */
    this.activeSuggestionData = ko.pureComputed(function() {
        var el = this.activeSuggestionElement();
        return el ? ko.dataFor(el) : null;
    }, this);
    /**
     * @member {KnockoutObservable<string>} activeSuggestionID Holds the string ID of
     * the suggestion item currently active.
     */
    this.activeSuggestionID = ko.pureComputed(function() {
        var el = this.activeSuggestionElement();
        var id = el ? el.getAttribute('id') : null;
        if (el && !id) {
            console.error('input-autocomplete: an active suggestion element has not a required ID attribute value', el);
        }
        return id;
    }, this);
    /**
     * @member {KnockoutObservable<string>} activeSuggestionValue Give access to the
     * text value of the active suggestion.
     */
    this.activeSuggestionValue = ko.pureComputed(function() {
        var el = this.activeSuggestionElement();
        if (el && el.getAttribute) {
            // A suggestion is active
            // Get attribute value if any
            var valEl = el.getAttribute(SUGGESTION_ATTR_NAME);
            if (valEl) {
                return valEl;
            }
            else {
                // Or get the literal text content of the element.
                valEl.innerText;
            }
        }
        else {
            return null;
        }
    }, this);

    /// Children / Elements injected
    /**
     * @member {HTMLElement} children.isBusyTemplate
     */
    this.isBusyTemplate = children.isBusyTemplate;
    /**
     * @member {HTMLElement} children.suggestionsTemplate
     */
    this.suggestionsTemplate = children.suggestionsTemplate;

    /// Management of active suggestion element (mainly for accessibility)
    var activeSuggestionManager = new ActiveSuggestionManager(this.activeSuggestionElement, refs.root);

    /// Methods
    /**
     * Gets the value from the active suggestion and put it in the input value.
     */
    this.selectActiveSuggestion = function() {
        var textValue = this.activeSuggestionValue();
        if (textValue) {
            // Notify the onSelect handler; it will put the new value as the
            // autocomplete value by default.
            var contextData = this.activeSuggestionData();
            this.onSelect(textValue, contextData);
            // Remove as active element
            activeSuggestionManager.clear();
            // Close list (must be last step, since a value change at onSelect
            // make this flag to turn off).
            this.collapsedRequested(true);
        }
    }.bind(this);

    /// Events
    var KEY_ENTER = 13;
    var KEY_UP = 38;
    var KEY_DOWN = 40;
    var KEY_SPACE = 32;
    var KEY_ESC = 27;
    /**
     * Detects standard key press for 'display autocomplete' and force to
     * expand the list of available options, if any.
     * Standard autocompletes collapse on focus out, when selecting an item,
     * and when focus enters the input again, the list can be manually expanded.
     * Alternatives are to keep it expanded on focus out (not recommended)
     * or auto-expand when getting focus again (if there is data).
     * @param {Event} e Keypress event
     * @private
     */
    var pressExpand = function(e) {
        // Press Ctrl+Alt+Space: Show up the autocomplete list, if data
        if (e.ctrlKey && e.altKey && e.which === KEY_SPACE) {
            this.collapsedRequested(false);
            // managed
            return true;
        }
    }.bind(this);
    /**
     * Detects standard key press for 'hide autocomplete' and force to
     * collapse the list, even if has data.
     * Standard behavior dictates that if is already collapsed, or there are
     * no results, pressing the key forces to clean the user input.
     */
    var pressCollapse = function(e) {
        // Press Esc
        if (e.which === KEY_ESC) {
            if (this.isExpanded()) {
                // hide the autocomplete list even with data
                this.collapsedRequested(true);
            }
            else {
                // already collapsed, clean user input
                this.value('');
            }
            // managed
            return true;
        }
    }.bind(this);
    /**
     * Detects standard key press for 'move/active next item (from the
     * autocomplete suggestions list)'.
     * @param {Event} e Keypress event
     */
    var pressNext = function(e) {
        if (e.which === KEY_DOWN) {
            activeSuggestionManager.shiftTo(activeSuggestionManager.SHIFT_TO_NEXT);
            // Show up list
            this.collapsedRequested(false);
            // managed
            return true;
        }
    }.bind(this);
    /**
     * Detects standard key press for 'move/active previous item (from the
     * autocomplete suggestions list)'.
     * @param {Event} e Keypress event
     */
    var pressPrevious = function(e) {
        if (e.which === KEY_UP) {
            activeSuggestionManager.shiftTo(activeSuggestionManager.SHIFT_TO_PREVIOUS);
            // Show up list
            this.collapsedRequested(false);
            // managed
            return true;
        }
    }.bind(this);
    /**
     * Detects standard key press for 'select element as input value (from the
     * autocomplete suggestions list)'.
     * Do not confuse this with the 'active item' that is just an item
     * hightlighed from the list when navigating with the keyboard, but is not
     * copied as the input value when active.
     * @param {Event} e Keypress event
     */
    var pressSelect = function(e) {
        if (e.which === KEY_ENTER) {
            this.selectActiveSuggestion();
            // managed
            return true;
        }
    }.bind(this);
    /**
     * On input keypress handler, supports:
     * - select a suggestion with keyboard (the one made active after use
     * down/up keys onKeyDown)
     */
    this.onKeyPress = function(data, e) {
        e = e.originalEvent || e;
        if (pressSelect(e)) return;
        // Allow default behavior, or will get blocked by Knockout:
        return true;
    };
    /**
     * On suggestion click handler, supports:
     * - select a suggestion with a pointer device (mouse, touch)
     */
    this.onClick = function(d, e) {
        // Only valid on an actual suggestion:
        var el = e.target.closest(SUGGESTION_ATTR_NAME_SELECTOR);
        if (el) {
            // We reuse logic by locating this and setting the active suggestion..
            this.activeSuggestionElement(el);
            // and immediately calling to select it
            this.selectActiveSuggestion();
        }
        else {
            // Left default behavior to continue
            return true;
        }
    };
    /**
     * On input keydown handler, supports:
     * - expand/collapse listbox by user preference
     * - navigate the list of available suggestions (make next/previous the
     * active one)
     */
    this.onKeyDown = function(data, e) {
        e = e.originalEvent || e;
        if (pressExpand(e)) return;
        if (pressCollapse(e)) return;
        if (pressNext(e)) return;
        if (pressPrevious(e)) return;
        // Allow default behavior, or will get blocked by Knockout:
        return true;
    };
    /**
     * On input blur/focus out handler, supports:
     * - hide the listbox
     */
    this.onBlur = function() {
        this.collapsedRequested(true);
    }.bind(this);
    /**
     * On input focus in handler, supports:
     * - show the listbox (if there is data)
     */
    this.onFocus = function() {
        this.collapsedRequested(false);
    }.bind(this);
}

/**
 * Factory for the component view model instances that has access
 * to the component instance DOM elements.
 * @param {object} params Component parameters to pass it to ViewModel
 * @param {object} componentInfo Instance DOM elements
 * @param {HTMLElement} componentInfo.element the component element
 * @param {Array<HTMLElement>} componentInfo.templateNodes elements passed in
 * to the component by place them as children.
 * Allowed children:
 * <template name="isBusy">..</template>
 * <template name="suggestions">..</template>
 */
var create = function(params, componentInfo) {
    // We set the class name directly in the component
    componentInfo.element.classList.add(CSS_CLASS);
    // Get the provided template for the suggestions and state
    var isBusyTemplate;
    var suggestionsTemplate;
    componentInfo.templateNodes.forEach(function(node) {
        var slot = node.getAttribute && node.getAttribute('name');
        switch (slot) {
            case 'isBusy':
                isBusyTemplate = node.content || node;
                break;
            case 'suggestions':
                suggestionsTemplate = node.content || node;
                break;
        }
    });
    // Both isBusy and suggestions templates are optional; if no isBusy,
    // nothing will be used, but if not suggestions, we will use a default
    // template from the component definition.
    if (!suggestionsTemplate) {
        suggestionsTemplate = componentInfo.element.querySelector('template[name=defaultSuggestions]');
    }
    var refs = {
        root: componentInfo.element
    };
    var children = {
        isBusyTemplate: isBusyTemplate,
        suggestionsTemplate: suggestionsTemplate
    };
    return new ViewModel(params, refs, children);
};

ko.components.register(TAG_NAME, {
    template: TEMPLATE,
    viewModel: { createViewModel: create },
    synchronous: true
});
