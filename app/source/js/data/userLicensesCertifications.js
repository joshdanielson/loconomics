/**
 * Management of the user license certifications (part of public listing),
 * local and remote.
 */
// TODO store-jsdocs
// TODO Move file-upload request code into a driver
'use strict';

var UserLicenseCertification = require('../models/UserLicenseCertification');
var GroupListRemoteModel = require('./helpers/GroupListRemoteModel');
var photoTools = require('../utils/photoTools');
var $ = require('jquery');
var extend = $.extend;
var session = require('./session');
var remote = require('./drivers/restClient');

var baseUrl = 'me/licenses-certifications/';
var api = new GroupListRemoteModel({
    // Conservative cache, just 1 minute
    listTtl: { minutes: 1 },
    groupIdField: 'jobTitleID',
    itemIdField: 'userLicenseCertificationID',
    Model: UserLicenseCertification
});
module.exports = api;

api.addLocalforageSupport('userLicensesCertifications/');
api.addRestSupport(remote, baseUrl);

session.on.cacheCleaningRequested.subscribe(function() {
    api.clearCache();
});

// Here we have the special case of upload files, that needs use different component than just
// ajax/rest client.
// We replace default:
var pushJustBasicDataToRemote = api.pushItemToRemote.bind(api);
// With a file-uploader logic
var photoUploadFieldName = 'photo';
var pushWithoutFile = function(data) {
    // On new photos, the photo is required!
    if (data.userLicenseCertificationID === 0) {
        return Promise.reject('An image of the license/certification is required');
    }
    else {
        // Standard upload
        return pushJustBasicDataToRemote(data);
    }
};
// Support for Native Apps (via Cordova FileTransfer)
var nativeUploadFile = function pushToRemote(data, options) {
    // If no file to upload:
    if (!data.localTempFilePath) {
        return pushWithoutFile(data);
    }
    else {
        // Upload with FileTransfer
        var uploadSettings = {
            fileKey: photoUploadFieldName,
            //mimeType: 'image/jpeg',
            httpMethod: options.method,
            params: data,
            headers: extend(true, {}, remote.extraHeaders)
        };
        return photoTools.uploadLocalFileJson(data.localTempFilePath, options.url, uploadSettings);
    }
}.bind(api);
// Support for Web upload (via input[type=file] and jquery.uploader)
var webUploadFile = function(data, options) {
    if (!data.localTempFileData) {
        return pushWithoutFile(data);
    }
    else {
        var fd = data.localTempFileData;
        if (!fd) return Promise.resolve(null);
        fd.url = options.url;
        fd.type = options.method;
        fd.paramName = photoUploadFieldName;
        fd.formData = Object.keys(data)
        .filter(function(k) {
            return !/^local/.test(k);
        })
        .map(function(k) {
            return {
                name: k,
                value: data[k]
            };
        });
        fd.headers = $.extend(true, {}, remote.extraHeaders);
        return Promise.resolve(fd.submit());
    }
};

api.pushItemToRemote = function pushToRemote(data) {
    // Standard ID and URL code
    var groupID = data[this.settings.groupIdField];
    var itemID = data[this.settings.itemIdField];
    var options = {
        method: itemID ? 'put' : 'post',
        url: remote.baseUrl + baseUrl + groupID + (itemID ? '/' + itemID : '')
    };

    var after = function(serverData) {
        api._pushItemToCache(serverData);
        return serverData;
    };

    if (photoTools.takePhotoSupported()) {
        return nativeUploadFile(data, options).then(after);
    }
    else {
        return webUploadFile(data, options).then(after);
    }
}.bind(api);
