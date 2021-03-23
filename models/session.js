var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var SessionSchema = new Schema(
    {
        first_name: {type: String, required: [true, 'First name required']},
        last_name: {type: String, required: [true, 'Last name required']},
        party_num: {type: Number, min: 1, required: [true, 'Number of people required']},
        seating: {
            type: String,
            default: 'No Preference'
        },
        has_cell: {
            type: String
        },
        cell_num: {
            type: String,
            required: [true, 'Phone number required']
        },
        cell_provider: {
            type: String,
            enum: ['bell_canada', 'bell_mts', 'fido_solutions', 'freedom_mobile', 'koodo_mobile', 'pc_mobile','rogers_communications','sasktel','telus'],
            required: [true, 'Mobile provider required']
        },
        email: {type: String},
        status: {
            type: String,
            required: true,
            enum: ['Waiting', 'Notified', 'Archived'],
            default: 'Waiting'
        },
        position: {type: Number, min: 1},
        notify_total: {type: Number, required: true, default: 0}, 
        wait_end: {type: Date}

    },
    {timestamps: {createdAt: true, updatedAt: false}}
);

// Virtual for customer's full name
SessionSchema
.virtual('name')
.get(function() {
    return this.first_name + ' ' + this.last_name;
});

// Virtual for customer's local wait start time
SessionSchema
.virtual('waitStart_localTime')
.get(function() {
    return this.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
});

// Virtual for customer's local wait end time
SessionSchema
.virtual('waitEnd_localTime')
.get(function() {
    return this.wait_end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
});

// Virtual for customer's wait_duration
SessionSchema
.virtual('wait_duration')
.get(function() {
    return (Math.round((Date.now() - this.createdAt.getTime())/60000)).toString();
});

// Virtual for customer's wait_completed
SessionSchema
.virtual('wait_completed')
.get(function() {
    return (Math.round((this.wait_end.getTime() - this.createdAt.getTime())/60000)).toString();
});

// Virtual for session's URL for guests to see position
SessionSchema
.virtual('urlPosition')
.get(function() {
    return '/waitlist/guest/' + this._id + '/position';
});

// Virtual for session's URL for guests to update
SessionSchema
.virtual('urlGuestUpdate')
.get(function() {
    return '/waitlist/guest/' + this._id + '/update';
});

// Virtual for session's URL for staff
SessionSchema
.virtual('urlDetails')
.get(function() {
    return '/waitlist/session/' + this._id;
});

// Export model
module.exports = mongoose.model('Session', SessionSchema);
