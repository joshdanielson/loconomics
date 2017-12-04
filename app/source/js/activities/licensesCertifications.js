/**
    LicensesCertifications activity
**/
'use strict';

var ko = require('knockout'),
    $ = require('jquery'),
    Activity = require('../components/Activity');
var onboarding = require('../data/onboarding');
var jobTitles = require('../data/jobTitles');
var userLicensesCertifications = require('../data/userLicensesCertifications');
var jobTitleLicenses = require('../data/jobTitleLicenses');
var DEFAULT_BACK_LINK = '/listingEditor';
var DEFAULT_BACK_TEXT = 'Back';
var showError = require('../modals/error').show;

var A = Activity.extend(function LicensesCertificationsActivity() {

    Activity.apply(this, arguments);

    this.accessLevel = this.app.UserType.serviceProfessional;
    this.viewModel = new ViewModel(this.app);
    // Defaults settings for navBar.

    this.navBar = Activity.createSubsectionNavBar(DEFAULT_BACK_TEXT, {
        backLink: DEFAULT_BACK_LINK, helpLink: this.viewModel.helpLink
    });
    this.title('Professional credentials');

    this.defaultNavBar = this.navBar.model.toPlainObject(true);

    // On changing jobTitleID:
    // - load job title name
    this.registerHandler({
        target: this.viewModel.jobTitleID,
        handler: function(jobTitleID) {

            if (jobTitleID) {

                ////////////
                // Job Title
                // Get data for the Job title ID
                jobTitles.getJobTitle(jobTitleID)
                .then(function(jobTitle) {
                    // Fill in job title name
                    this.viewModel.jobTitleName(jobTitle.singularName());
                    this.updateNavBarState();
                }.bind(this))
                .catch(function(err) {
                    showError({
                        title: 'Unable to load listing details.',
                        error: err
                    });
                });

                // Get data for the Job title ID
                userLicensesCertifications.getList(jobTitleID)
                .then(function(list) {
                    // Save for use in the view
                    this.viewModel.submittedUserLicensesCertifications(userLicensesCertifications.asModel(list));
                }.bind(this))
                .catch(function (err) {
                    showError({
                        title: 'Unable to load submitted licenses and credentials.',
                        error: err
                    });
                });

                // Get required licenses for the Job title ID - an object, not a list
                jobTitleLicenses.getItem(jobTitleID)
                .then(function(item) {
                    // Save for use in the view
                    this.viewModel.jobTitleApplicableLicences(item);
                    // SPECIAL CASE:
                    // If we are in onboarding and there are no required licenses applicable to the job title,
                    // we automatically jump to next step (we just check if the condition to continue is matched)
                    if (this.viewModel.onboardingNextReady()) {
                        this.viewModel.goNext();
                    }
                }.bind(this))
                .catch(function (err) {
                    showError({
                        title: 'Unable to load license requirements.',
                        error: err
                    });
                });

                // Fix URL
                // If the URL didn't included the jobTitleID, or is different,
                // we put it to avoid reload/resume problems
                var found = /licensesCertifications\/(\d+)/i.exec(window.location);
                var urlID = found && found[1] |0;
                if (urlID !== jobTitleID) {
                    var url = '/licensesCertifications/' + jobTitleID;
                    this.app.shell.replaceState(null, null, url);
                }
            }
            else {
                this.viewModel.jobTitleName('Job Title');
                this.viewModel.submittedUserLicensesCertifications([]);
                this.viewModel.jobTitleApplicableLicences(null);
                this.updateNavBarState();
            }
        }.bind(this)
    });
});
exports.init = A.init;

A.prototype.useJobTitleInNavBar = function() {
    // First, reset
    this.navBar.model.updateWith(this.defaultNavBar, true);

    // Apply job title name and link
    var text = this.viewModel.jobTitleName() || DEFAULT_BACK_TEXT;
    var id = this.viewModel.jobTitleID();
    var link = id ? DEFAULT_BACK_LINK + '/' + id : DEFAULT_BACK_LINK;
    // Use job title name and ID for back link
    this.navBar.leftAction().model.updateWith({
        text: text,
        link: link
    });
};

A.prototype.updateNavBarState = function updateNavBarState() {
    // Onboarding takes precence, then mustReturn, then default
    // navbar with jobtitle
    var done = onboarding.updateNavBar(this.navBar);
    if (!done) {
        done = this.app.applyNavbarMustReturn(this.requestData);
    }
    if (!done) {
        this.useJobTitleInNavBar();
    }
};

A.prototype.show = function show(options) {
    // Reset
    this.viewModel.jobTitleID(0);

    Activity.prototype.show.call(this, options);

    this.updateNavBarState();

    var params = options && options.route && options.route.segments;
    var jobTitleID = params[0] |0;
    this.viewModel.jobTitleID(jobTitleID);
    if (!jobTitleID) {
        // Load titles to display for selection
        this.viewModel.jobTitles.sync();
    }
};

var UserJobProfile = require('../viewmodels/UserJobProfile');

function ViewModel(app) {
    this.helpLink = '/help/relatedArticles/201967966-adding-credentials';

    this.isInOnboarding = onboarding.inProgress;

    this.jobTitleID = ko.observable(0);
    this.submittedUserLicensesCertifications = ko.observableArray([]);
    //is an object that happens to have arrays
    this.jobTitleApplicableLicences = ko.observable(null);
    this.jobTitleName = ko.observable('Job Title');

    this.isSyncing = userLicensesCertifications.state.isSyncing();
    this.isLoading = userLicensesCertifications.state.isLoading();

    this.jobTitles = new UserJobProfile(app);
    this.jobTitles.baseUrl('/licensesCertifications');
    this.jobTitles.selectJobTitle = function(jobTitle) {

        this.jobTitleID(jobTitle.jobTitleID());

        return false;
    }.bind(this);

    this.addNew = function(item) {
        var url = '#!licensesCertificationsForm/' + this.jobTitleID() + '/0?licenseCertificationID=' + item.licenseCertificationID(),
            cancelUrl = app.shell.currentRoute.url;
        var request = $.extend({}, this.requestData, {
            cancelLink: cancelUrl
        });
        app.shell.go(url, request);
    }.bind(this);

    this.selectItem = function(item) {
        var url = '/licensesCertificationsForm/' + this.jobTitleID() + '/' +
            item.userLicenseCertificationID() + '?mustReturn=' +
            encodeURIComponent(app.shell.currentRoute.url) +
            '&returnText=' + encodeURIComponent('Licenses/certifications');
        app.shell.go(url, this.requestData);
    }.bind(this);

    this.onboardingNextReady = ko.computed(function() {
        if (!onboarding.inProgress()) return false;
        var groups = this.jobTitleApplicableLicences();
        if (!groups) return false;

        //If at some point the user credential status need to be checked, this
        // utility can be used (lines commented inside the other function too
        //var userCredentials = this.submittedUserLicensesCertifications();
        /*var findUserCredential = function(credentialID) {
            var found = null;
            userCredentials.some(function(uc) {
                if (uc.licenseCertificationID() == credentialID) {
                    found = uc;
                    // stop loop
                    return true;
                }
            });
            return found;
        };*/
        var hasAllRequiredOfGroup = function(group) {
            if (!group || !group.length) return true;
            var allAccomplished = !group.some(function(credential) {
                // IMPORTANT: The credential record holds a special field, 'submitted',
                // that tell us already if the userCredential for that was submitted and then pass
                // the requirement, so we do not need to search and check the userCredential.
                // Still, sample code was wrote for that if in a future something more like the status
                // needs to be checked (but the status, initially -in the onboarding- will be not-reviewed)
                /*if (credential.required()) {
                    var userCredential = findUserCredential(credential.licenseCertificationID());
                    return (userCredential && userCredential.statusID() === ???);
                }*/

                if (credential.required()) {
                    // NOTE: It returns the negated result, that means that when a required credential
                    // is not fullfilled, returning true we stop immediately the loop and know the requirements
                    // are not accomplished.
                    return !credential.submitted();
                }
            });
            return allAccomplished;
        };

        return (
            hasAllRequiredOfGroup(groups.municipality()) &&
            hasAllRequiredOfGroup(groups.county()) &&
            hasAllRequiredOfGroup(groups.stateProvince()) &&
            hasAllRequiredOfGroup(groups.country())
        );
    }, this);

    this.goNext = function() {
        if (onboarding.inProgress()) {
            // Ensure we keep the same jobTitleID in next steps as here:
            onboarding.selectedJobTitleID(this.jobTitleID());
            onboarding.goNext();
        }
    }.bind(this);
}
