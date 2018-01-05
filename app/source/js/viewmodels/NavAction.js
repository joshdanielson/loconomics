/**
 * NavAction view model.
 * It allows set-up per activity for the AppNav action button.
 * @module viewmodels/NavAction
 */
var Model = require('../models/Model');

function NavAction(values) {

    Model(this);

    this.model.defProperties({
        link: '',
        icon: '',
        text: '',
        // 'Test' is the header title but placed in the button/action
        isTitle: false,
        // 'Link' is the element ID of a modal (starts with a #)
        isModal: false,
        // 'Link' is a Shell command, like 'goBack 2'
        isShell: false,
        // Set if the element is a menu button, in that case 'link'
        // will be the ID of the menu (contained in the page; without the hash), using
        // the text and icon but special meaning for the text value 'menu'
        // on icon property that will use the standard menu icon.
        isMenu: false,
        // Custom function as event handler for button click.
        // The standard link gets disabled with this
        handler: null
    }, values);

    this.runHandler = function runHandler(obj, event) {
        var handler = this.handler();
        if (handler) {
            event.stopImmediatePropagation();
            event.preventDefault();
            handler.call(this, event, obj);
        }
    }.bind(this);
}

module.exports = NavAction;

// Set of view utilities to get the link for the expected html attributes

NavAction.prototype.getHref = function getHref() {
    return (
        (this.handler() || this.isMenu() || this.isModal() || this.isShell()) ?
        '#' :
        this.link()
    );
};

NavAction.prototype.getModalTarget = function getModalTarget() {
    return (
        (this.handler() || this.isMenu() || !this.isModal() || this.isShell()) ?
        '' :
        this.link()
    );
};

NavAction.prototype.getShellCommand = function getShellCommand() {
    return (
        (this.handler() || this.isMenu() || !this.isShell()) ?
        '' :
        this.link()
    );
};

NavAction.prototype.getMenuID = function getMenuID() {
    return (
        (this.handler() || !this.isMenu()) ?
        '' :
        this.link()
    );
};

NavAction.prototype.getMenuLink = function getMenuLink() {
    return (
        (this.handler() || !this.isMenu()) ?
        '' :
        '#' + this.link()
    );
};

/** Static, shared actions **/
NavAction.goHome = new NavAction({
    link: '/',
    icon: 'fa ion ion-stats-bars'
});

NavAction.goBack = new NavAction({
    link: 'goBack',
    icon: 'fa ion ion-ios-arrow-left',
    isShell: true
});

NavAction.menuIn = new NavAction({
    link: 'menuIn',
    icon: 'menu',
    isMenu: true
});

NavAction.menuNewItem = new NavAction({
    link: 'menuNewItem',
    icon: 'fa ion ion-ios-plus-empty',
    isMenu: true
});

NavAction.goMarketplace = new NavAction({
    link: '/home',
    icon: 'fa ion ion-ios-cart-outline'
});

NavAction.goHelpIndex = new NavAction({
    link: '/contactForm/general?mustReturn=true',
    text: 'Contact us',
    isModal: false
});

NavAction.goLogin = new NavAction({
    link: '/login',
    text: 'Sign in'
});

NavAction.goLogout = new NavAction({
    link: '/logout',
    text: 'Sign out'
});

NavAction.goSignup = new NavAction({
    link: '/signup',
    text: 'Sign up'
});