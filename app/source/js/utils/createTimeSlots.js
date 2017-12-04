/**
    It creates slots between the given times and size for each one.
    Past times are avoided, because are not available
**/
//jshint maxparams:7
'use strict';

var moment = require('moment');

/**
    Returns a list of beggining time slots between the range of given times (from-to)
    with a size and that fit in a given duration.
    @param from Date or ISO datetime string
    @param to Date or ISO datetime string
    @param size:int Size in minutes of the slots to generate.
    @param duration:int Amount of consecutive time required for slots to be useful (aka time required)
    @param roundUp:bool Require to roundUp the 'from' time to time fragments of 'size'.
        This basically converts a range like: 10:12 - 10:42 - and so on
        into this: 10:15 - 10:45 (if size 15), 10:30 - 11:00 (if size 30) or 11:00 - 12:00 (if size 60)
    @param includeEndTime:bool By default (false), means the end time (@to) is not included as slot.
        Pass in true for this parameter to include the end time too.
**/
exports.forRange = function forRange(from, to, size, duration, roundUp, includeEndTime) {
    //jshint maxcomplexity:10
    from = new Date(from);
    to = new Date(to);
    if (!duration) {
        throw new Error('forRange: Duration is required');
   }
    var i = moment(from),
        d,
        slots = [],
        now = new Date(),
        enought;

    // Round up if required
    if (roundUp) {
        var r = moment(from);
        var minutes = r.minutes();
        // Calculate the minutes of the hour we must set
        // substracting the excess of minutes per size and adding the size
        // to go the next fraction.
        // But only in case we are not already at an exact point (rest is zero)
        var rest = minutes % size;
        if (rest)
           minutes = minutes - (rest) + size;
        // set the minutes, without seconds:
        from = r.minutes(minutes).seconds(0).toDate();
        i = r;
    }

    // end time included?
    if (includeEndTime) {
        // Since the later 'while loop' will stop before reach 'to',
        // just add the size time to 'to' to ensure gets included.
        to = moment(to).add(size, 'minutes').toDate();
    }

    // Shortcut if bad 'to' (avoid infinite loop)
    if (to <= from)
        return slots;

    while(i.toDate() < to) {
        d = i.clone().toDate();
        enought = i.clone().add(duration, 'minutes').toDate();
        // Check that:
        // - is not a past date
        // - it has enought time in advance to fill the expected duration
        if (d >= now &&
            enought <= to)
            slots.push(d);
        // Next slot
        i.add(size, 'minutes');
    }

    return slots;
};

/**
    Returns a list of beggining time slots with a size and that fits in a given
    duration for all the AvailabilitSlots in the list with availability 'free'
    Source list as a consecutive, sorted, non-overlapping list of availabilitySlots
**/
exports.forList = function forList(list, size, duration, roundUp, includeEndTime) {
    var slots = [];
    // Iterate every free time range/AvailabilitySlot
    list.forEach(function (item) {
        if (item.availability === 'free') {
            slots.push.apply(slots, exports.forRange(item.startTime, item.endTime, size, duration, roundUp, includeEndTime));
        }
    });
    return slots;
};


/// Next Much needed Utilities maybe are better in another module, or a different name
/// for this one.

exports.getTotalFreeMinutes = function getTotalFreeMinutes(list) {
    return list.reduce(function (count, item) {
        if (item.availability === 'free') {
            var s = moment(item.startTime),
                e = moment(item.endTime);
            return count + e.diff(s, 'minutes');
        }
        else return count;
    }, 0);
};

/**
    Get the availability tag for the given list of availabilitySlots
    based on a workday of 8 hours.

    TODO Availabile time must be based not on fixed 8 hours but on real
    proffesional availability; that needs the weeklySchedule, this solution
    is too simplistic, prone to errors;
    - the 'tags' are not precise.
    - is not possible to clearly denote 100% free
    - is not possible to clearly states not-available (none, as of no free
        time regularly on this date, so different from all day scheduled)
**/
exports.getAvailabilityTag = function(list) {
    //jshint maxcomplexity:11
    if (!list || list.length === 0)
        return 'none'; // not availability

    var minutes = exports.getTotalFreeMinutes(list);

    var perc = (minutes / (8*60)) * 100,
        date = moment(list[0].startTime).startOf('day').toDate(),
        today = moment().startOf('day').toDate();

    if (date < today)
        return 'past';
    else if (perc <= 0)
        return 'full'; // fully scheduled
    else if (perc < 50)
        return 'medium'; // medium scheduled
    else // if (perc >= 50)
        return 'low'; // low scheduled or completely free
};

/**
    Source list as a consecutive, sorted, non-overlapping list of availabilitySlots
    @param list AvailabilitySlot Array from the /availability/times API, the times
        included (startTime, endTime) comes as strings in ISO datetime
**/
exports.filterListBy = function filterListBy(list, start, end) {
    var nstart = new Date(start);
    var nend = new Date(end);
    var result = [];

    list.some(function(timeRange) {
        var ts = new Date(timeRange.startTime);
        var te = new Date(timeRange.endTime);
        // It's after the wanted range, stop iterating
        if (ts >= nend)
            return true;
        // It's inside the wanted range and not before it starts
        if (te > nstart) {
            if (ts < nstart) {
                // Beggining needs to be cut
                result.push({
                    startTime: nstart.toISOString(),
                    // Be carefull with looong timeRanges, that can go from before starting to after ending:
                    endTime: (te > nend ? nend : te).toISOString(),
                    availability: timeRange.availability
                });
            }
            else if (te > nend) {
                // Ending needs to be cut
                result.push({
                    startTime: ts.toISOString(),
                    endTime: nend.toISOString(),
                    availability: timeRange.availability
                });
            }
            else {
                result.push(timeRange);
            }
        }
        // else continue iterating until reach something in the wanted range
    });

    return result;
};

/**
    Creates and returns an object with local isodate as key and including
    each one a filtered list of availabilitySlots from the source list for
    that date.
    Source list as a consecutive, sorted, non-overlapping list of availabilitySlots
**/
exports.splitListInLocalDates = function filterListBy(list) {
    var isodateFormat = 'YYYY-MM-DD';
    var lastIsodate,
        group;
    var result = {};

    list.forEach(function(timeRange) {
        var start = moment(timeRange.startTime);
        var isostart = start.format(isodateFormat);
        // Register new group
        if (isostart !== lastIsodate) {
            group = result[isostart] = [];
            lastIsodate = isostart;
        }

        var end = moment(timeRange.endTime),
            endJustDate = end.startOf('day'),
            isoend = end.format(isodateFormat),
            nextDayStart = start.clone().startOf('day').add(1, 'day');

        // Checks if different dates, but discard when ending is just
        // the beggining of next date because that's correct for a range
        // that goes to the end of the date (start of next date, to include last minutes)
        if (isostart !== isoend &&
            end.format() !== nextDayStart.format()) {
            // Belongs to different dates, needs to be splitted
            // First fragment, from start to the start of next date.
            group.push({
                startTime: start.format(),
                endTime: nextDayStart.format(),
                availability: timeRange.availability
            });

            // Next fragments must be aware that the end can be next day or
            // a further date, so we need to create the in-between, full day,
            // time ranges, that creates new groups for the dates.
            // And lately, update the lastIsodate and group to the one of the end date.
            var idate = nextDayStart.clone();
            // By compare this way (next day less than ending) we iterate only
            // full day ranges and never the next date, that is managed after the
            // loop the same way if there was something or not in between.
            while (idate < endJustDate) {
                var idateIso = idate.format(isodateFormat),
                    idatetimeIso = idate.format();
                // Mutate iteration date to next day
                idate.add(1, 'day');
                // New date group with single item list of full-day range:
                result[idateIso] = [{
                    startTime: idatetimeIso,
                    endTime: idate.format(),
                    availability: timeRange.availability
                }];
            }
            // Last fragment, from day beginning to the range ending
            result[idate.format(isodateFormat)] = [{
                startTime: idate.format(),
                endTime: end.format(),
                availability: timeRange.availability
            }];
        }
        else {
            // The range is inside same date, just add it to the group list:
            group.push(timeRange);
        }
    });

    return result;
};