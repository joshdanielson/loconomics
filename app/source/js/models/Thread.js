/** Thread model.

    Describes a thread of messages.
 **/
'use strict';

var Model = require('./Model');
var Message = require('./Message');

function Thread(values) {
    
    Model(this);

    this.model.defProperties({
        threadID: 0,
        
        clientUserID: null,
        serviceProfessionalUserID: null,
        jobTitleID: null,
        statusID: null,
        subject: null,
        
        messages: {
            isArray: true,
            Model: Message
        },
        
        createdDate: null,
        updatedDate: null        
    }, values);
}

module.exports = Thread;
