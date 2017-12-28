/**
    Keeps a date availability object that includes a list of appointments
    that fills all the times in the date (following the weekDaySchedule and free/unavailable
    times) and summary of the availability status of the date.
    Updating the main properties: appointmentsList, date, weekDaySchedule, the complete
    list and summaries auto calculate to show the proper listing.
**/
'use strict';

var Model = require('../models/Model');
var Appointment = require('../models/Appointment');
var WeeklySchedule = require('../models/WeeklySchedule');
var SchedulingPreferences = require('../models/SchedulingPreferences');
var moment = require('moment');
var ko = require('knockout');
var availabilityCalculation = require('../utils/availabilityCalculation');
var getDateWithoutTime = require('../utils/getDateWithoutTime');

function DateAvailability(values) {

    Model(this);

    this.model.defProperties({
        date: null, // Date
        weeklySchedule: {
            Model: WeeklySchedule
        },
        appointmentsList: {
            isArray: true,
            Model: Appointment
        },
        schedulingPreferences: {
            Model: SchedulingPreferences
        }
    }, values);

    this.freeScheduleSlots = ko.pureComputed(function () {
        var d = this.date();
        var w = this.weeklySchedule();
        return availabilityCalculation.createFreeScheduleSlots(d, w);
    }, this)
    .extend({ rateLimit: { method: 'notifyWhenChangesStop', timeout: 20 } });

    /**
        :array<Appointment> List of appointments for all the times in the date.
        It introduces free and unavailable appointments using appointmentsList as base
        for actual *busy* appointments and the rules of weekDaySchedule
    **/
    this.list = ko.pureComputed(function() {
        return availabilityCalculation.fillDayAvailability(
            this.date(), this.appointmentsList(), this.freeScheduleSlots(), this.schedulingPreferences()
        );
    }, this);

    /**
        :int
        Number of minutes scheduled for work in a generic/empty day
        based on the information at freeScheduleSlots.
    **/
    this.workDayMinutes = ko.pureComputed(function() {
        var free = this.freeScheduleSlots();
        return free.reduce(function(v, next) {
            return v + moment(next.end).diff(next.start, 'minutes');
        }, 0);
    }, this);

    /**
        :int
        Number of minutes available to be scheduled in this date
        inside the work time.
        It's the sum of all 'Free' appointments in the date.
    **/
    this.availableMinutes = ko.pureComputed(function() {
        return this.list().reduce(function(minutes, apt) {
            if (apt.id() === Appointment.specialIds.free) {
                var et = moment(apt.endTime());
                var st = moment(apt.startTime());
                minutes += et.diff(st, 'minutes');
            }
            return minutes;
        }, 0);
    }, this);

    /**
        :int
        Percentage number from 0 to 100 of time
        available time in the date (availableMinutes / workDayMinutes)
    **/
    this.availablePercent = ko.pureComputed(function() {
        return (Math.round((this.availableMinutes() / this.workDayMinutes()) * 100));
    }, this);

    /**
        :string
        A text value from an enumeration that represents
            ranges of availablePercent, suitable for high level use as CSS classes.
            Special case on past date-time, when it returns 'past' rather than the
            availability, since past times are not availabile for anything new (can't change the past! ;-)
            Can be: 'none', 'low', 'medium', 'full', 'past'
    **/
    this.availableTag = ko.pureComputed(function() {
        var perc = this.availablePercent();
        var date = this.date();
        var today = getDateWithoutTime();

        if (date < today)
            return 'past';
        else if (perc >= 100)
            return 'full';
        else if (perc >= 50)
            return 'medium';
        else if (perc > 0)
            return 'low';
        else // <= 0
            return 'none';
    }, this);

    /**
        Retrieve a list of date-times that are free, available to be used,
        in this date with a separation between each of the given slotSize
        in minutes or using the default from the scheduling preferences
        included in the object.

        The parameter 'duration' (in minutes) allows that returned slots
        are free almost for the given duration. This allows to choose times
        that fit the needed service duration.
    **/
    var createTimeSlots = require('../utils/createTimeSlots');
    this.getFreeTimeSlots = function getFreeTimeSlots(duration, slotSizeMinutes) {

        slotSizeMinutes = slotSizeMinutes || this.schedulingPreferences().incrementsSizeInMinutes();

        if (!duration)
            duration = slotSizeMinutes;

        var date = this.date();
        var today = getDateWithoutTime();

        // Quick return if with empty list when
        // - past date (no time)
        // - no available time (already computed)
        if (date < today ||
            this.availableMinutes() <= 0) {
            return [];
        }
        else {
            return createTimeSlots.forList(this.getFreeAvailableSlots(), slotSizeMinutes, duration, true);
        }
    };

    /**
        Returns a list of objects of type AvailableSlot
        ( { startTime:Date, endTime:Date, availability:'free' } )
        for every free/available time range in the date
    **/
    this.getFreeAvailableSlots = function getFreeAvailableSlots() {

        var date = this.date();
        var today = getDateWithoutTime();

        // Quick return with empty list when
        // - past date (no time)
        // - no available time (already computed)
        if (date < today ||
            this.availableMinutes() <= 0) {
            return [];
        }
        else {
            var slots = [];
            // Iterate every free appointment
            this.list().forEach(function (apt) {
                if (apt.id() === Appointment.specialIds.free) {
                    slots.push({
                        availability: 'free',
                        startTime: apt.startTime(),
                        endTime: apt.endTime()
                    });
                }
            });
            return slots;
        }
    };
}

module.exports = DateAvailability;
