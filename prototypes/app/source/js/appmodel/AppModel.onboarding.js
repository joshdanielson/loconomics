/**
    Onboarding tracking information
**/
'use strict';

var OnboardingProgress = require('../viewmodels/OnboardingProgress'),
    NavAction = require('../viewmodels/NavAction');

exports.create = function create(appModel) {
    
    // Onboarding management and state, initially empty so no progress
    var api = new OnboardingProgress();
    
    // Extended with new methods

    // Set the correct onboarding progress and step given a step reference
    // (usually from database)
    api.setStep = function(stepReference) {
        if (stepReference) {
            var stepItems = stepReference.split(':', 2),
                group = stepItems[0],
                // step is the second part, or just the same as
                // the full name (that happens for the first steps that share
                // name with the group and only need to define the group name)
                step = stepItems[1] || group;

            // Try to set current step, follow to look for group if does not success
            if (this.setStepByName(step)) {
                return true;
            }
            // else:
            // Look for a group that matches
            var groupSteps = OnboardingProgress.predefinedStepGroups[group];
            if (groupSteps) {
                this.steps(groupSteps);
                this.group(group);
                if (this.setStepByName(step)) {
                    return true;
                }
            }
        }
        // No progress:
        this.model.reset();
        return false;
    };

    // Update the given navbar with the current onboarding information (only if in progress)
    api.updateNavBar = function(navBar) {
        var yep = this.inProgress();
        if (yep) {
            navBar.leftAction(NavAction.goBack.model.clone());
            navBar.title(this.progressText());
        }
        return yep;
    };
    
    api.goNext = function goNext(app) {
        var current = this.stepNumber();

        current++;

        if (current >= this.totalSteps()) {
            // It ended!!
            this.stepNumber(-1);
            appModel.userProfile.saveOnboardingStep(null);
            app.shell.go('/');
        }
        else {
            // Get next step
            this.stepNumber(current);
            appModel.userProfile.saveOnboardingStep(this.stepReference());
            app.shell.go(this.stepUrl());
        }
    };
    
    return api;
};
