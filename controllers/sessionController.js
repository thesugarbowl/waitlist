var Session = require('../models/session');
var async = require('async');
const {body,validationResult} = require('express-validator');
require('dotenv').config();


// Amazon SNS
// Import required AWS SDK clients and commands for Node.js
const { SNSClient, PublishCommand } = require("@aws-sdk/client-sns");

// Set the AWS Region
const REGION = "ca-central-1";

// Create SNS service object
const sns = new SNSClient({ region: REGION });


// Display dummy home
exports.dummyHome = function(req, res) {
    res.render('dummyHome');
};

// Display index page
exports.index = function(req, res) {
    res.render('index', {title: 'Sugarbowl Waitlist Form'});
};

// Display list of all sessions
exports.session_list_all = function(req, res, next) {

    async.parallel({
        sessions_waitCount: function(callback) {
            Session.countDocuments({ status: 'Waiting'})
                .exec(callback)
        },
        sessions_notifiedCount: function(callback) {
            Session.countDocuments({ status: 'Notified'})
                .exec(callback)
        },
        sessions_confirmedCount: function(callback) {
            Session.countDocuments({ status: 'Confirmed'})
                .exec(callback)
        },
        sessions_all: function(callback) {
            Session.find({status: {$nin: ['Archived', 'Removed']}})
                .sort([['createdAt', 1]])
                .exec(callback)
        },
    }, function(err, results) {
        if (err) { return next(err); } // Error in API usage
        // Success, so render
        res.render('sessions_all', {title: 'Active Sessions', sessions_waitCount: results.sessions_waitCount, sessions_notifiedCount: results.sessions_notifiedCount, sessions_confirmedCount: results.sessions_confirmedCount, sessions_all: results.sessions_all});
    });
};

// Display list of 'waiting' sessions
exports.session_list_waiting = function(req, res, next) {

    async.parallel({
        sessions_waitCount: function(callback) {
            Session.countDocuments({ status: 'Waiting'})
                .exec(callback)
        },
        sessions_waiting: function(callback) {
            Session.find({ status: 'Waiting' })
                .sort([['createdAt'], ['first_name']])
                .exec(callback)
        },
    }, function(err, results) {
        if (err) { return next(err); } // Error in API usage
        // Success, so render
        res.render('sessions_waiting', {title: "'Waiting' Sessions", sessions_waitCount: results.sessions_waitCount, sessions_waiting: results.sessions_waiting});
    });
};

// Display list of 'notified' sessions
exports.session_list_notified = function(req, res, next) {

    async.parallel({
        sessions_notifiedCount: function(callback) {
            Session.countDocuments({ status: 'Notified' })
                .exec(callback)
        },
        sessions_notified: function(callback) {
            Session.find({ status: 'Notified' })
                .sort([['wait_end', 1], ['first_name']])
                .exec(callback)
        },
    }, function(err, results) {
        if (err) { return next(err); } // Error in API usage
        // Success, so render
        res.render('sessions_notified', {title: "'Notified' Sessions", sessions_notifiedCount: results.sessions_notifiedCount, sessions_notified: results.sessions_notified});
    });
};

// Display list of 'confirmed' sessions
exports.session_list_confirmed = function(req, res, next) {

    async.parallel({
        sessions_confirmedCount: function(callback) {
            Session.countDocuments({ status: 'Confirmed' })
                .exec(callback)
        },
        sessions_confirmed: function(callback) {
            Session.find({ status: 'Confirmed' })
                .sort([['wait_end', 1], ['first_name']])
                .exec(callback)
        },
    }, function (err, results) {
        if (err) { return next(err);} // Error in API usage
        // Success, so render
        res.render('sessions_confirmed', {title: "'Confirmed' Sessions", sessions_confirmedCount: results.sessions_confirmedCount, sessions_confirmed: results.sessions_confirmed});
    });
};

// Display list of 'archived' sessions
exports.session_list_archived = function(req, res, next) {

    async.parallel({
        sessions_archivedCount: function(callback) {
            Session.countDocuments({ status: 'Archived' })
                .exec(callback)
        },
        sessions_archived: function(callback) {
            var d = new Date();
            var timeMidnightEdmonton = d.setHours(-6,0,0);
            Session.find({ status: 'Archived' , createdAt: { $gt: timeMidnightEdmonton }})
                .sort([['createdAt', -1], ['first_name']])
                .exec(callback)
        },
    }, function (err, results) {
        if (err) { return next(err);} // Error in API usage
        // Success, so render
        res.render('sessions_archived', {title: "'Archived' Sessions", sessions_archivedCount: results.sessions_archivedCount, sessions_archived: results.sessions_archived});
    });
};

// Display detail page for a specific Session
exports.session_detail = function(req, res, next) {

    async.parallel({
        session: function(callback) {
            Session.findById(req.params.id)
            .exec(callback)
        },
        waitStartArray: function(callback) {
            Session.find({status: 'Waiting'}, '_id createdAt')
                .sort([['createdAt']])
                .exec(callback)
        },
        waitingCount: function(callback) {
            Session.countDocuments({status: 'Waiting'})
                .exec(callback)
        },
    }, function(err, results) {
        if (err) { return next(err); } // Error in API usage
        // Success, so render
        res.render('session_detail', {title: 'Session Details', session: results.session, waitStartArray: results.waitStartArray, waitingCount: results.waitingCount});
    });
};

// Display position-in-line page for a specific Session
exports.session_position = function(req, res, next) {

    async.parallel({
        session: function(callback) {
            Session.findById(req.params.id)
            .exec(callback)
        },
        waitStartArray: function(callback) {
            Session.find({status: 'Waiting'}, '_id createdAt')
                .sort([['createdAt']])
                .exec(callback)
        },
        waitingCount: function(callback) {
            Session.countDocuments({status: 'Waiting'})
                .exec(callback)
        },
    }, function(err, results) {
        if (err) { return next(err); } // Error in API usage
        // Success, so render
        res.render('session_position', {title: 'Sugarbowl Waitlist', session: results.session, waitStartArray: results.waitStartArray, waitingCount: results.waitingCount});
    });

};

// Display Session create form on GET (by STAFF)
exports.session_create_get = function(req, res, next) {
        res.render('session_form', {title: "Join Sugarbowl's Waitlist"});
};

// Display Session create on POST (by STAFF)
exports.session_create_post = [
    // Validate and sanitise fields
    body('first_name').trim().isLength({min:1}).escape().withMessage('First name required.')
        .isAlphanumeric().withMessage('First name has non-alphanumeric characters.'),
    body('last_name').trim().isLength({min:1}).escape().withMessage('Last name or initial is required')
        .withMessage('Last name has non-alphanumeric characters.'),
    body('party_num', 'Number of people required').trim().escape(),
    body('seating').escape(),
    body('has_cell').escape(),
    body('cell_num', 'Phone number required').trim().escape(),

    // Process request after validation and sanitization
    (req, res, next) => {
        // Extract the validation errors from a request
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values and error messages.
            res.render('session_form', {title: "Join Sugarbowl's Waitlist", session: req.body, errors: errors.array()});
            return;
        }
        else {
            // Data from form is valid

            // Create a Session object with escaped and trimmed data.
            var session = new Session(
                {   
                    first_name: req.body.first_name,
                    last_name: req.body.last_name,
                    party_num: req.body.party_num,
                    seating: req.body.seating,
                    has_cell: req.body.has_cell,
                    cell_num: req.body.cell_num
                });
            session.save(function (err) {
                if (err) { return next(err); }
                // Successful - redirect to new session record
                res.redirect(session.urlDetails);

                async.parallel({
                    waitStartArray: function(callback) {
                        Session.find({status: 'Waiting'}, '_id createdAt')
                            .sort([['createdAt']])
                            .exec(callback)
                    },
                    waitingCount: function(callback) {
                        Session.countDocuments({status: 'Waiting'})
                            .exec(callback)
                    },
                }, function(err, results) {
                    if (err) { return next(err); } // Error in API usage
                    // Success
                    var waitStartArray = results.waitStartArray;
                    var waitingCount = results.waitingCount;
                    
                    for (var i = 0; i < waitStartArray.length; i++)
                        if (waitStartArray[i]['_id'] == session['_id']) {var position = parseInt(i);}
                    
                    // Add position in line
                    Session.findByIdAndUpdate(session._id, {$set:{position:i}}, {new:true}, function(err, results) {
                        if (err) {return next(err);}
                    });
                
                    // Because of the cost of SMS, only 1 SMS will be sent to the Guest (notifying them to come in)
                    // // Send Guest SMS
                    // var name = session.first_name;
                    // var cell_num = session.cell_num;

                    // // Set the parameters
                    // const params = {
                    //     Message: `Hi ${name}! This is Sugarbowl. You are ${i} of ${waitingCount} in line. We will text you again to come in!` /* required */,
                    //     PhoneNumber: `+1${cell_num}` //PHONE_NUMBER, in the E.164 phone number structure
                    // };

                    // const run = async () => {
                    //     try {
                    //       const data = await sns.send(new PublishCommand(params));
                    //     //   console.log("Success, message published. MessageID is " + data.MessageId);
                    //     } catch (err) {
                    //       console.error(err, err.stack);
                    //     }
                    // };
                    // run();
                });
            });
        }
    }
];

// Display Session create form on GET (FOR GUEST)
exports.session_create_get_guest = function(req, res, next) {
    res.render('session_form_guest', {title: "Join Sugarbowl's Waitlist"});
};

// Display Session create on POST (FOR GUEST)
exports.session_create_post_guest = [
    // Validate and sanitise fields
    body('first_name').trim().isLength({min:1}).escape().withMessage('First name required.')
        .isAlphanumeric().withMessage('First name has non-alphanumeric characters.'),
    body('last_name').trim().isLength({min:1}).escape().withMessage('Last name or initial is required')
        .withMessage('Last name has non-alphanumeric characters.'),
    body('party_num', 'Number of people required').trim().escape(),
    body('seating').escape(),
    body('cell_num', 'Phone number required').trim().escape(),

    // Process request after validation and sanitization
    (req, res, next) => {
        // Extract the validation errors from a request
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values and error messages.
            res.render('session_form_guest', {title: "Join Sugarbowl's Waitlist", session: req.body, errors: errors.array()});
            return;
        }
        else {
            // Data from form is valid

            // Create a Session object with escaped and trimmed data.
            var session = new Session(
                {   
                    first_name: req.body.first_name,
                    last_name: req.body.last_name,
                    party_num: req.body.party_num,
                    seating: req.body.seating,
                    cell_num: req.body.cell_num
                });
            session.save(function (err) {
                if (err) { return next(err); }
                // Successful - redirect to new session record
                res.redirect(session.urlPosition);

                async.parallel({
                    waitStartArray: function(callback) {
                        Session.find({status: 'Waiting'}, '_id createdAt')
                            .sort([['createdAt']])
                            .exec(callback)
                    },
                    waitingCount: function(callback) {
                        Session.countDocuments({status: 'Waiting'})
                            .exec(callback)
                    },
                }, function(err, results) {
                    if (err) { return next(err); } // Error in API usage
                    // Success
                    var waitStartArray = results.waitStartArray;
                    var waitingCount = results.waitingCount;
                    
                    for (var i = 0; i < waitStartArray.length; i++)
                        if (waitStartArray[i]['_id'] == session['_id']) {var position = parseInt(i);}
                    
                    // Add position in line
                    Session.findByIdAndUpdate(session._id, {$set:{position:i}}, {new:true}, function(err, results) {
                        if (err) {return next(err);}
                    });
                
                    // Because of AWS SNS cost, only 1 SMS will be sent to Guest, asking them to come in to the restaurant.
                    // // Send Guest SMS & Email
                    // var name = session.first_name;
                    // var cell_num = session.cell_num;
  
                    // // Set the parameters
                    // const params = {
                    //     Message: `Hi ${name}! This is Sugarbowl. You are ${i} of ${waitingCount} in line. We will text you again to come in!` /* required */,
                    //     PhoneNumber: `+1${cell_num}` //PHONE_NUMBER, in the E.164 phone number structure
                    // };

                    // const run = async () => {
                    //     try {
                    //         const data = await sns.send(new PublishCommand(params));
                    //         // console.log("Success, message published. MessageID is " + data.MessageId);
                    //     } catch (err) {
                    //         console.error(err, err.stack);
                    //     }
                    // };
                    // run();
                });
            });
        }
    }
];

// Display Session delete form on GET
exports.session_delete_get = function(req, res, next) {
    Session.findById(req.params.id, function(err, session) {
        if (err) {return next(err);}
        if (session==null) { // No results
            res.redirect('/waitlist/sessions');
        }
        // Successful, so render
        res.render('session_delete', { title: 'Delete Session', session: session });
    });
};

// Display Session delete on POST
exports.session_delete_post = function(req, res, next) {
    Session.findById(req.body.sessionId, function(err, results) {
        if (err) { return next(err); }
        // Success
        Session.findByIdAndRemove(req.body.sessionId, function deleteSession(err) {
            if (err) { return next(err); }
            // Success - go to sessions list
            res.redirect('/waitlist/sessions')
        });
    });
};

// Display Session delete form on GET (GUEST)
exports.session_delete_guest_get = function(req, res, next) {
    Session.findById(req.params.id, function(err, session) {
        if (err) {return next(err);}
        if (session==null) { // No results
            res.redirect('/waitlist/guest/create');
        }
        // Successful, so render
        res.render('session_delete_guest', { title: 'Leave The Waitlist', session: session });
    });
};

// Display Session delete on POST (GUEST)
exports.session_delete_guest_post = function(req, res, next) {
    Session.findByIdAndUpdate(req.body.sessionId, 
        {status: 'Removed', removedAt: new Date()}, 
        {new: true}, 
        function (err, results) {
            if (err) { return next(err); }
            else {
                res.redirect('/waitlist/guest/create');
            }
        }
    );
};

// Display Session update form on GET
exports.session_update_get = function(req, res, next) {
    // Get session for form
    Session.findById(req.params.id, function(err, session) {
        if (err) { return next(err); }
        if (session == null) { // No results.
            var err = new Error('Session not found');
            err.status = 404;
            return next(err);
        }
        // Success
        res.render('session_form', {title: 'Update Session', session: session});
    });
};

// Display Session update on POST
exports.session_update_post = [
    // Validate and sanitize fields
    body('first_name').trim().isLength({min:1}).escape().withMessage('First name required.'),
    body('last_name').trim().isLength({min:1}).escape().withMessage('Last name or initial is required'),
    body('party_num', 'Number of people required').trim().escape(),
    body('seating').escape(),
    body('cell_num', 'Phone number required').trim().escape(),

    // Process request after validation and sanitization
    (req, res, next) => {
        
        // Extract the validation errors from a request
        const errors = validationResult(req);

        // Create a Session object with escaped/trimmed data and old id
        var session = new Session(
            {
                first_name: req.body.first_name,
                last_name: req.body.last_name,
                party_num: req.body.party_num,
                seating: req.body.seating,
                cell_num: req.body.cell_num,
                _id: req.params.id // This is required, or a new ID will be assigned!
            }
        );
        
        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values/error messages.
            res.render('session_form', {title: 'Update Session', session: session, errors: errors.array()});
            return;
        }
        else {
            // Data from form is valid. Update the record.
            Session.findByIdAndUpdate(req.params.id, session, {}, function (err, session) {
                if (err) { return next(err); }
                // Successful - redirect to session detail page
                res.redirect(session.urlDetails);
            });
        }   
    }
];

// Display Session update form on GET (GUEST)
exports.session_update_get_guest = function(req, res, next) {
    // Get session for form
    Session.findById(req.params.id, function(err, session) {
        if (err) { return next(err); }
        if (session == null) { // No results.
            var err = new Error('Session not found');
            err.status = 404;
            return next(err);
        }
        // Success
        res.render('session_form_guest', {title: 'Update Session', session: session});
    });
};

// Display Session update on POST (FOR GUEST)
exports.session_update_post_guest = [
    // Validate and sanitize fields
    body('first_name').trim().isLength({min:1}).escape().withMessage('First name required.'),
    body('last_name').trim().isLength({min:1}).escape().withMessage('Last name or initial is required'),
    body('party_num', 'Number of people required').trim().escape(),
    body('seating').escape(),
    body('cell_num', 'Phone number required').trim().escape(),

    // Process request after validation and sanitization
    (req, res, next) => {
        
        // Extract the validation errors from a request
        const errors = validationResult(req);

        // Create a Session object with escaped/trimmed data and old id
        var session = new Session(
            {
                first_name: req.body.first_name,
                last_name: req.body.last_name,
                party_num: req.body.party_num,
                seating: req.body.seating,
                cell_num: req.body.cell_num,
                _id: req.params.id // This is required, or a new ID will be assigned!
            }
        );
        
        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values/error messages.
            res.render('session_form_guest', {title: 'Update Session', session: session, errors: errors.array()});
            return;
        }
        else {
            // Data from form is valid. Update the record.
            Session.findByIdAndUpdate(req.params.id, session, {}, function (err, session) {
                if (err) { return next(err); }
                // Successful - redirect to session detail page
                res.redirect(session.urlPosition);
            });
        }   
    }
];

// Display Session notify form on GET
exports.session_notify_get = function(req, res, next) {
    // Get session for form
    Session.findById(req.params.id, function(err, session) {
        if (err) { return next(err); }
        if (session == null) { // No results.
            var err = new Error('Session not found');
            err.status = 404;
            return next(err);
        }
        // Success
        res.render('session_notify_waitEnd', {title: "Notify Guest", session: session});
    });
};

// Display Session notify on POST
exports.session_notify_post = function(req, res, next) {
    // Get session
    Session.findById(req.body.sessionId, function(err, session) {
        if (err) { return next(err); }
        if (session == null) { // No results.
            var err = new Error('Session not found');
            err.status = 404;
            return next(err);
        }
        // Success - send guest SMS and Email
        var name = session.first_name;
        var cell_num = session.cell_num;

        // Set the parameters
        const params = {
            Message: ` Hi ${name}! This is Sugarbowl. We have a table for you! Please come in.` /* required */,
            PhoneNumber: `+1${cell_num}` //PHONE_NUMBER, in the E.164 phone number structure
        };

        const run = async () => {
            try {
                const data = await sns.send(new PublishCommand(params));

                // Update the record
                var notify_total = session.notify_total;
                // console.log(notify_total);
                notify_total = ++notify_total;
                // console.log(notify_total);

                if (session.wait_end) {
                    var first_waitEnd = session.wait_end
                } else {
                    first_waitEnd = new Date();
                }

                Session.findByIdAndUpdate(req.params.id, 
                    {status: 'Notified', wait_end: first_waitEnd, notify_total: notify_total}, 
                    {new: true}, 
                    function (err, results) {
                        if (err) { return next(err); }
                        else {
                            res.render('successful_sms.pug', {title: 'Notification Attempted', response: data.MessageId, results:results});
                           
                            // console.log(`Session for ${results.name} was updated:`);
                            // console.log(`status: ${results.status}`);
                            // console.log(`wait_end: ${results.wait_end}`);
                        }
                    }
                );
                // console.log("Success, message published. MessageID is " + data.MessageId);
            } catch (err) {
                console.error(err, err.stack);
            }
        };
        run();

    });
};

// Already phoned Guest on GET
exports.session_phonedGuest_get = function(req, res, next) {
    // Get session for form
    Session.findById(req.params.id, function(err, session) {
        if (err) { return next(err); }
        if (session == null) { // No results.
            var err = new Error('Session not found');
            err.status = 404;
            return next(err);
        }
        // Success
        res.render('session_notify_phoned', {title: "Transfer Guest?", session: session});
    });
};

// Already phoned Guest on POST
exports.session_phonedGuest_post = function(req, res, next) {
    if (req.body.phonedGuest == 'true') {
        Session.findById(req.params.id, function(err, session) {
            if (err) { return next(err); }
            if (session == null) { // No results.
                var err = new Error('Session not found');
                err.status = 404;
                return next(err);
            }
            // Successful, so...
            // Update the record
            var notify_total = session.notify_total;
            // console.log(notify_total);
            notify_total = ++notify_total;
            // console.log(notify_total);

            if (session.wait_end) {
                var first_waitEnd = session.wait_end
            } else {
                first_waitEnd = new Date();
            }

            Session.findByIdAndUpdate(req.params.id, {status: 'Notified', wait_end: first_waitEnd, notify_total: notify_total}, {new: true},
                function (err, session) {
                    if (err) {return next(err);}
                    else {
                        res.redirect(session.urlDetails);
                    }
                }
            );
        });
    }
};

// Archive request for Confirmed Sessions on GET
exports.session_archiveRequestConfirmed_get = function(req, res, next) {
    res.render('sessions_archive_request_confirmed', {title: 'Archive Sessions Request'})
};

// Archive request for Confirmed Sessions on POST
exports.session_archiveRequestConfirmed_post = function(req, res, next) {
    var date_iso = new Date(Date.now() - 3600000).toISOString() // Minus 1h in milliseconds; is date 1h ago in msec

    if (req.body.archiveSessions == 'true') {
        Session.updateMany({status: 'Confirmed', wait_end: { $lt: date_iso }}, {status: 'Archived'}, {new: true},
            function (err, results) {
                if (err) {return next(err);}
                else {
                    res.redirect('/waitlist/sessions/confirmed');
                }
            }
        );
    }
    
};

// Archive request for Notified Sessions on GET
exports.session_archiveRequest_get = function(req, res, next) {
    res.render('sessions_archive_request', {title: 'Archive Sessions Request'})
};

// Archive request for Notified Sessions on POST
exports.session_archiveRequest_post = function(req, res, next) {
    var date_iso = new Date(Date.now() - 3600000).toISOString() // Minus 1h in milliseconds; is date 1h ago in msec

    if (req.body.archiveSessions == 'true') {
        Session.updateMany({status: 'Notified', wait_end: { $lt: date_iso }}, {status: 'Archived'}, {new: true},
            function (err, results) {
                if (err) {return next(err);}
                else {
                    res.redirect('/waitlist/sessions/notified');
                }
            }
        );
    }
    
};

// Archive request for Waiting Sessions on GET
exports.session_archiveRequestWaiting_get = function(req, res) {
    res.render('sessions_archive_request_waiting', {title: 'Archive Sessions Request'})
};

// Archive request for Waiting Sessions on POST
exports.session_archiveRequestWaiting_post = function(req, res, next) {
    var date_iso = new Date(Date.now() - 7200000).toISOString() // Minus 2h in milliseconds; is date 2h ago in msec

    if (req.body.archiveSessions == 'true') {
        Session.updateMany({status: 'Waiting', createdAt: { $lt: date_iso }}, {status: 'Archived'}, {new: true},
            function (err, results) {
                if (err) {return next(err);}
                else {
                    res.redirect('/waitlist/sessions/waiting');
                }
            }
        );
    }
    
};

// Notify ALL request for Waiting Sessions on GET
exports.session_notifyAll_get = function(req, res) {
    res.render('notify_all_request', {title: "Notify ALL Request"})
};

// Notify ALL request for Waiting Sessions on POST
exports.session_notifyAll_post = function(req, res, next) {
    if (req.body.notifyAll == 'true') {

        Session.updateMany({status: 'Waiting'}, {status: 'Notified', wait_end: new Date(), notify_total: 1}, {new: true},
            function (err, results) {
                if (err) {return next(err);}
                else {
                    res.redirect('/waitlist/sessions/waiting');
                }
            }
        );
        
    }
};

// Confirming a session on POST
exports.session_confirm_post = function(req, res, next) {

    if (req.body.confirmSession == 'true') {
        Session.findByIdAndUpdate(req.params.id, {status: 'Confirmed'}, {new: true},
            function (err, session) {
                if (err) {return next(err);}
                else {
                    res.redirect(session.urlPosition);
                }
            }
        );
    }
    
};