/** Home Address
**/
'use strict';

var Address = require('../models/Address'),
    ko = require('knockout'),
    localforage = require('localforage'),
    CacheControl = require('../utils/CacheControl');

function createIndex(list, byField) {
    var index = {};
    
    list.forEach(function(item, itemIndex) {
        index[item[byField]] = itemIndex;
    });

    return index;
}

exports.create = function create(appModel) {
    var api = {
        state: {
            isLoading: ko.observable(false),
            isSyncing: ko.observable(false),
            isSaving: ko.observable(false)
        }
    };
    var cache = {};
    
    api.state.isLocked = ko.pureComputed(function() {
        return this.isLoading() || this.isSaving();
    }, api.state);
    
    function newCacheEntry(list) {
        return {
            control: new CacheControl({ ttl: { minutes: 1 } }),
            list: list || null,
            index: list && createIndex(list, 'addressID') || {}
        };
    }

    function setJobTitleCache(jobTitleID, list) {
        var cacheEntry = cache[jobTitleID];
        if (cacheEntry) {
            cacheEntry.list = list || [];
            cacheEntry.index = createIndex(list || [], 'addressID');
        }
        else {
            cacheEntry = cache[jobTitleID] = newCacheEntry(list);
        }
        cacheEntry.control.latest = new Date();
    }
    
    function getJobTitleCache(jobTitleID) {
        var cacheEntry = cache[jobTitleID];
        return cacheEntry || newCacheEntry();
    }
    
    function getItemFromCache(groupID, itemID) {
        var cacheEntry = cache[groupID];
        if (cacheEntry) {
            return cacheEntry.list[cacheEntry.index[itemID]] || null;
        }
        else {
            return null;
        }
    }
    
    function setItemCache(groupID, itemID, item) {
        var cacheEntry = cache[groupID] || newCacheEntry([]),
            itemIndex = -1;
        
        // Check if exists, so is update or insertion
        var exists = cacheEntry.index[itemID] >= 0;
        if (exists) {
            // Update entry
            itemIndex = cacheEntry.index[itemID];
            cacheEntry.list[itemIndex] = item;
        }
        else {
            // Add to the list
            itemIndex = cacheEntry.list.push(item) - 1;
            cacheEntry.index[itemID] = itemIndex;
        }
    }
    
    function delItemCache(groupID, itemID) {
        var cacheEntry = cache[groupID] || null;
        if (cacheEntry) {
            var itemIndex = cacheEntry.index[itemID];
            // Update list removing the element in place, without holes
            cacheEntry.splice(itemIndex, 1);
            // Update index by:
            // - Remove itemID entry
            delete cacheEntry.index[itemID];
            // - Update every entry with an ID greater than the updated,
            // since they are now one position less in the updated list
            Object.keys(cacheEntry.index).forEach(function(key) {
                if (cacheEntry.index[key] > itemIndex)
                    cacheEntry.index[key]--;
            });
        }
    }
    
    function fetchFromLocal(jobTitleID) {
        return localforage.getItem('addresses/service/' + jobTitleID);
    }
    
    function fetchFromRemote(jobTitleID) {
        return appModel.rest.get('addresses/service/' + jobTitleID);
    }

    api.getList = function getList(jobTitleID) {
        var cacheEntry = getJobTitleCache(jobTitleID);

        if (cacheEntry.control.mustRevalidate()) {
            // No cache data, is first load, try from local
            if (!cacheEntry.list) {
                api.state.isLoading(true);
                // From local
                return fetchFromLocal(jobTitleID)
                .then(function(data) {
                    // launch remote for sync
                    var remotePromise = fetchFromRemote(jobTitleID);
                    // Remote fallback: If no local, wait for remote
                    return data ? data : remotePromise;
                })
                .then(function(data) {
                    setJobTitleCache(jobTitleID, data);
                    pushToLocal(jobTitleID, data);
                    api.state.isLoading(false);
                    api.state.isSyncing(false);
                    
                    return data;
                })
                .catch(function(err) {
                    api.state.isLoading(false);
                    api.state.isSyncing(false);
                    // rethrow error
                    return err;
                });
            } else {
                api.state.isSyncing(true);
                // From remote
                return fetchFromRemote(jobTitleID)
                .then(function(data) {
                    setJobTitleCache(jobTitleID, data);
                    pushToLocal(jobTitleID, data);
                    api.state.isLoading(false);
                    api.state.isSyncing(false);
                    
                    return data;
                })
                .catch(function(err) {
                    api.state.isLoading(false);
                    api.state.isSyncing(false);
                    // rethrow error
                    return err;
                });
            }
        }
        else {
            // From cache
            return Promise.resolve(cacheEntry.list);
        }
    };
    
    api.getItem = function getItem(jobTitleID, addressID) {
        // IMPORTANT: To simplify, load all the list (is a short list)
        // and look from its cached index
        // TODO Implement item server look-up. Be careful with cache update,
        // list sorting and state flags.
        return api.getList(jobTitleID)
        .then(function() {
            // Get from cached index
            var cacheItem = getItemFromCache(jobTitleID, addressID);

            // TODO: Enhance on future with actual look-up by API addressID
            // if not cached, throwing not found from the server (just to avoid
            // minor cases when a new item is not still in the cache if linked
            // from other app data). And keep updated list cache with that
            // items lookup
            if (!cacheItem) throw new Error('Not Found');
            return cacheItem;
        });
    };
    
    function pushToLocal(jobTitleID, data) {
        return localforage.setItem('addresses/service/' + jobTitleID, data);
    }
    
    function pushToRemote(data) {
        
        var method = data.addressID ? 'put' : 'post';
        var url = 'addresses/service/' + data.jobTitleID + (
            data.addressID ? '/' + data.addressID : ''
        );
        return appModel.rest[method](url, data);
    }

    /**
        Save an item in cache, local and remote.
        Can be new or updated.
        The IDs goes with all the other data, being
        jobTitleID required, addressID required for updates
        but falsy for insertions.
        @param data:object Plain object
    **/
    api.setItem = function setItem(data) {
        api.state.isSaving(true);
        // Send to remote first
        return pushToRemote(data)
        .then(function(serverData) {
            // Success! update local copy with returned data
            // IMPORTANT: to use server data here so we get values set
            // by the server, as updates dates and addressID when creating
            // a new address.
            if (serverData) {
                // Save in cache
                setItemCache(serverData.jobTitleID, serverData.addressID, serverData);
                // Save in local storage
                // In local need to be saved all the grouped data, not just
                // the item; since we have the cache list updated, use that
                // full list to save local
                pushToLocal(serverData.jobTitleID, getJobTitleCache(serverData.jobTitleID).list);
            }
            api.state.isSaving(false);

            return serverData;
        })
        .catch(function(err) {
            api.state.isSaving(false);
            // Rethrow error
            return err;
        });
    };
    
    function removeFromRemote(jobTitleID, addressID) {
        return appModel.rest.delete('addresses/service/' + jobTitleID + '/' + addressID);
    }
    
    api.delItem = function delItem(jobTitleID, addressID) {
        // Remove in remote first
        return removeFromRemote(jobTitleID, addressID)
        .then(function(/*removedData*/) {
            // Update cache
            delItemCache(jobTitleID, addressID);
            // Save in local storage
            // In local need to be saved all the grouped data;
            // since we have the cache list updated, use that
            // full list to save local
            pushToLocal(jobTitleID, getJobTitleCache(jobTitleID).list);
        });
    };
    
    /** Some Utils **/
    
    api.asModel = function asModel(object) {
        // if is an array, return a list of models
        if (Array.isArray(object)) {
            return object.map(function(item) {
                return new Address(item);
            });
        }
        else {
            return new Address(object);
        }
    };
    
    api.getItemModel = function getItemModel(jobTitleID, addressID) {
        return api.getItem(jobTitleID, addressID)
        .then(function(data) {
            return data ? api.asModel(data) : null;
        });
    };
    
    var ModelVersion = require('../utils/ModelVersion');
    api.getItemVersion = function getItemVersion(jobTitleID, addressID) {
        return api.getItemModel(jobTitleID, addressID)
        .then(function(model) {
            return model ? new ModelVersion(model) : null;
        });
    };
    
    api.newItemVersion = function newItemVersion(values) {
        // New original and version for the model
        var version = new ModelVersion(new Address(values));
        // To be sure that the version appear as something 'new', unsaved,
        // we update its timestamp to be different to the original.
        version.version.model.touch();
        return version;
    };
    
    return api;
};
