/**
    SearchJobTitle activity
**/
'use strict';

var ServiceProfessionalSearchResult = require('../models/ServiceProfessionalSearchResult');
var ko = require('knockout');
var Activity = require('../components/Activity');
var search = require('../data/search');
var user = require('../data/userProfile').data;
require('../kocomponents/lead-generation/newsletter');
require('../kocomponents/lead-generation/refer');

var A = Activity.extend(function SearchJobTitleActivity() {

    Activity.apply(this, arguments);

    this.accessLevel = null;
    //pass in the app model so the view model can use it
    this.viewModel = new ViewModel();
    this.navBar = Activity.createSubsectionNavBar('Back');
    this.title = ko.computed(function() {
        var result = this.jobTitleSearchResult();
        return result && result.pluralName;
    }, this.viewModel);
});

exports.init = A.init;

// get jobTitleID from the URL that's passed in from the search results preview
A.prototype.show = function show(options) {
    Activity.prototype.show.call(this, options);
    var params = this.requestData.route.segments || [];
    var jobTitleID = params[0] || '';
    var origLat = params[1] || '';
    var origLong = params[2] || '';
    var searchDistance = params[3] || '';
    this.viewModel.loadJobTitleData(jobTitleID, origLat, origLong, searchDistance);
    this.viewModel.loadData(jobTitleID, origLat, origLong, searchDistance);
};

function ViewModel() {
    this.isAnonymous = user.isAnonymous;
    this.isLoading = ko.observable(false);
    this.isJobTitleLoading = ko.observable(false);
    //create an observable variable to hold the search term
    this.jobTitleID = ko.observable();
    //create an observable variable to hold the search term
    this.origLat = ko.observable();
    //create an observable variable to hold the search term
    this.origLong = ko.observable();
    //create an observable variable to hold the search term
    this.searchDistance = ko.observable();
    //create an object named ServiceProfessionalSearchResult to hold the search results returned from the API
    this.serviceProfessionalSearchResult = ko.observableArray();
    this.jobTitleSearchResult = ko.observable();

    this.loadJobTitleData = function(jobTitleID, origLat, origLong, searchDistance){
        this.isJobTitleLoading(true);

        return search.getJobTitle(jobTitleID, origLat, origLong, searchDistance)
        .then(function(data) {
            this.jobTitleSearchResult(data);
            this.isJobTitleLoading(false);
        }.bind(this))
        .catch(function(/*err*/) {
            this.isJobTitleLoading(false);
        }.bind(this));
    };
    this.loadData = function(jobTitleID, origLat, origLong, searchDistance) {
        this.isLoading(true);

        return search.serviceProfessionalsByJobTitle(jobTitleID, origLat, origLong, searchDistance)
        .then(function(list) {
            //since service professional result has objects with objects (star ratings, verifications), we need to create a more complex model using list.map to convert every record
            var listAsModel = list.map(function(item) {
                return new ServiceProfessionalSearchResult(item);
            });
            this.serviceProfessionalSearchResult(listAsModel);
            this.isLoading(false);
        }.bind(this))
        .catch(function(/*err*/) {
            this.isLoading(false);
        }.bind(this));
    };
    this.searchFailureMessage = ko.computed(function() {
        var result = this.jobTitleSearchResult();
        var name = result && ko.unwrap(result.pluralName);
        return result && "We don't yet have " + name + ' in your area. Help us grow by introducing us to professionals or signing up for our newsletter.';
    },this);
}
