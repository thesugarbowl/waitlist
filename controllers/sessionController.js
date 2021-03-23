var Session = require('../models/session');
var async = require('async');
const {body,validationResult} = require('express-validator');
require('dotenv').config();

// Email & SMS requirements
const nodemailer = require('nodemailer');
const { google } = require('googleapis');
const { get } = require('../routes');

const OAuth2 = google.auth.OAuth2;

const oauth2Client = new OAuth2(
    '724968912542-0ardha27iqoqfmsa4jg5eraqh06afe0m.apps.googleusercontent.com', // Client ID
    process.env.CLIENT_SECRET, // Client Secret
    'https://developers.google.com/oauthplayground' // Redirect URL
);

oauth2Client.setCredentials({
    refresh_token: process.env.REFRESH_TOKEN
});
const accessToken = oauth2Client.getAccessToken()

const smtpTransport = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        type: 'OAuth2',
        user: 'thesugarbowledmonton@gmail.com',
        clientId: '724968912542-0ardha27iqoqfmsa4jg5eraqh06afe0m.apps.googleusercontent.com',
        clientSecret: 'Q0vi8uFrrpoyonCa1JVTDQ_t',
        refreshToken: '1//04oOgDv91rrBoCgYIARAAGAQSNwF-L9Ir6hPEXJPCN2dy8wh1SExBToNcbW6gXbq-NrOCM8VlTS4Hwn1ZAw0KTpfBO2laep7STG4',
        accessToken: accessToken
    }
});

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
        sessions_all: function(callback) {
            Session.find().where('status').ne('Archived')
                .sort([['createdAt', -1], ['first_name', 1]])
                .exec(callback)
        },
    }, function(err, results) {
        if (err) { return next(err); } // Error in API usage
        // Success, so render
        res.render('sessions_all', {title: 'Active Sessions', sessions_waitCount: results.sessions_waitCount, sessions_notifiedCount: results.sessions_notifiedCount, sessions_all: results.sessions_all});
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
                .sort([['createdAt'], ['first_name']])
                .exec(callback)
        },
    }, function(err, results) {
        if (err) { return next(err); } // Error in API usage
        // Success, so render
        res.render('sessions_notified', {title: "'Notified' Sessions", sessions_notifiedCount: results.sessions_notifiedCount, sessions_notified: results.sessions_notified});
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
            var midnight = d.setHours(0,0,0);
            Session.find({ status: 'Archived' , createdAt: { $gt: midnight }})
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

// Display Session create form on GET
exports.session_create_get = function(req, res, next) {
        res.render('session_form', {title: "Join Sugarbowl's Waitlist"});
};

// Display Session create on POST
exports.session_create_post = [
    // Validate and sanitise fields
    body('first_name').trim().isLength({min:1}).escape().withMessage('First name required.')
        .isAlphanumeric().withMessage('First name has non-alphanumeric characters.'),
    body('last_name').trim().isLength({min:1}).escape().withMessage('Last name or initial is required')
        .withMessage('Last name has non-alphanumeric characters.'),
    body('party_num', 'Number of people required').trim().escape(),
    body('seating').escape(),
    body('cell_num', 'Phone number required').trim().escape(),
    body('cell_provider', 'Wireless provider required').escape(),
    body('email', 'Invalid email address!').optional({ checkFalsy: true }).isEmail(),

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
                    cell_num: req.body.cell_num,
                    cell_provider: req.body.cell_provider,
                    email: req.body.email
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
                
                    // Send Guest SMS & Email
                    var name = session.first_name;
                    var cell_num = session.cell_num;
                    var cell_provider = session.cell_provider.toString();
            
                    var cell_dict = {
                        bell_canada : 'txt.bell.ca',
                        bell_mts : 'text.mts.net',
                        fido_solutions : 'fido.ca',
                        freedom_mobile : 'txt.freedommobile.ca',
                        koodoo_mobile : 'msg.telus.com',
                        pc_mobile : 'mobiletxt.ca',
                        rogers_communications : 'pcs.rogers.com',
                        sasktel : 'sms.sasktel.com',
                        telus : 'msg.telus.com'
                    };
            
                    if (session.email) {
                        var mailOptions_email = {
                            from: 'thesugarbowledmonton@gmail.ca',
                            to: session.email,
                            subject: 'Sugarbowl Waitlist',
                            text: `Hi ${name}! You are ${i} of ${waitingCount} in line. When we're ready, we'll text and email you to come in. Thank you!`
                        };
                        // Email
                        smtpTransport.sendMail(mailOptions_email, (error, response) => {
                            error ? console.log(error) : console.log(response);
                            smtpTransport.close();
                        });
                    }; 
            
                    var mailOptions_sms = {
                        from: 'thesugarbowledmonton@gmail.ca',
                        to: cell_num + '@' + cell_dict[cell_provider],
                        subject: 'Sugarbowl Waitlist',
                        text: `: Hi ${name}! You are ${i} of ${waitingCount} in line. We will text you again to come in!`
                    };
                    // console.log(cell_num + '@' + cell_dict[cell_provider]);

                    // SMS
                    smtpTransport.sendMail(mailOptions_sms, (error) => {
                        if (error) { return next(error); }
                        else {smtpTransport.close();}
                    });
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
    body('cell_provider', 'Wireless provider required').escape(),
    body('email', 'Invalid email address!').optional({ checkFalsy: true }).isEmail(),

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
                    cell_num: req.body.cell_num,
                    cell_provider: req.body.cell_provider,
                    email: req.body.email
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
                
                    // Send Guest SMS & Email
                    var name = session.first_name;
                    var cell_num = session.cell_num;
                    var cell_provider = session.cell_provider.toString();
            
                    var cell_dict = {
                        bell_canada : 'txt.bell.ca',
                        bell_mts : 'text.mts.net',
                        fido_solutions : 'fido.ca',
                        freedom_mobile : 'txt.freedommobile.ca',
                        koodoo_mobile : 'msg.telus.com',
                        pc_mobile : 'mobiletxt.ca',
                        rogers_communications : 'pcs.rogers.com',
                        sasktel : 'sms.sasktel.com',
                        telus : 'msg.telus.com'
                    };
            
                    if (session.email) {
                        var mailOptions_email = {
                            from: 'thesugarbowledmonton@gmail.ca',
                            to: session.email,
                            subject: 'Sugarbowl Waitlist',
                            text: `Hi ${name}! You are ${i} of ${waitingCount} in line. When we're ready, we'll text and email you to come in. Thank you!`
                        };
                        // Email
                        smtpTransport.sendMail(mailOptions_email, (error, response) => {
                            error ? console.log(error) : console.log(response);
                            smtpTransport.close();
                        });
                    }; 
            
                    var mailOptions_sms = {
                        from: 'thesugarbowledmonton@gmail.ca',
                        to: cell_num + '@' + cell_dict[cell_provider],
                        subject: 'Sugarbowl Waitlist',
                        text: ` Hi ${name}! You are ${i} of ${waitingCount} in line. We will text you again to come in!`
                    };
                    // console.log(cell_num + '@' + cell_dict[cell_provider]);

                    // SMS
                    smtpTransport.sendMail(mailOptions_sms, (error) => {
                        if (error) { return next(error); }
                        else {smtpTransport.close();}
                    });
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
    body('cell_provider', 'Wireless provider required').escape(),
    body('email', 'Invalid email address!').optional({ checkFalsy: true }).isEmail(),

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
                cell_provider: req.body.cell_provider,
                email: req.body.email,
                _id: req.params.id, // This is required, or a new ID will be assigned!
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
    body('cell_provider', 'Wireless provider required').escape(),
    body('email', 'Invalid email address!').optional({ checkFalsy: true }).isEmail(),

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
                cell_provider: req.body.cell_provider,
                email: req.body.email,
                _id: req.params.id, // This is required, or a new ID will be assigned!
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
        var cell_provider = session.cell_provider.toString();
 
        var cell_dict = {
            bell_canada : 'txt.bell.ca',
            bell_mts : 'text.mts.net',
            fido_solutions : 'fido.ca',
            freedom_mobile : 'txt.freedommobile.ca',
            koodoo_mobile : 'msg.telus.com',
            pc_mobile : 'mobiletxt.ca',
            rogers_communications : 'pcs.rogers.com',
            sasktel : 'sms.sasktel.com',
            telus : 'msg.telus.com'
        };

        if (session.email) {
            var mailOptions_email = {
                from: 'thesugarbowledmonton@gmail.ca',
                to: session.email,
                subject: 'Sugarbowl Waitlist',
                text: `Hi ${name}! We have a table for you! Please come in.`
            };
            // Email
            smtpTransport.sendMail(mailOptions_email, (error, response) => {
                error ? console.log(error) : console.log(response);
                smtpTransport.close();
            });
        }; 

        var mailOptions_sms = {
            from: 'thesugarbowledmonton@gmail.ca',
            to: cell_num + '@' + cell_dict[cell_provider],
            subject: 'Sugarbowl Waitlist',
            text: ` Hi ${name}! We have a table for you! Please come in.`
        };

        // SMS
        smtpTransport.sendMail(mailOptions_sms, (error, response) => {
            if (error) { return next(error); }
            else {
                // Update the record
                var notify_total = session.notify_total;
                // console.log(notify_total);
                notify_total = ++notify_total;
                // console.log(notify_total);

                Session.findByIdAndUpdate(req.params.id, 
                    {status: 'Notified', wait_end: new Date(), notify_total: notify_total}, 
                    {new: true}, 
                    function (err, results) {
                        if (err) { return next(err); }
                        else {
                            res.render('successful_sms.pug', {title: 'Notification Confirmation', response: response, results:results});
                           
                            // console.log(`Session for ${results.name} was updated:`);
                            // console.log(`status: ${results.status}`);
                            // console.log(`wait_end: ${results.wait_end}`);

                            smtpTransport.close();
                        }
                    }
                );
            }  
        });

    });
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