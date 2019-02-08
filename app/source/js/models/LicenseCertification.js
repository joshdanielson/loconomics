/** LicenseCertification model **/
'use strict';

var Model = require('./Model');

function LicenseCertification(values) {

    Model(this);

    this.model.defProperties({
        licenseCertificationID: 0,
        name: '',
        description: '',
        authority: null,
        verificationWebsiteUrl: null,
        howToGetLicensedUrl: null,
        createdDate: null, // Autofilled by server
        updatedDate: null, // Autofilled by server
        language: ''
    }, values);

    this.model.defID(['licenseCertificationID']);
}

module.exports = LicenseCertification;
