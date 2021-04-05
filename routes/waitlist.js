var express = require('express');
var router = express.Router();

// Require controller modules
var session_controller = require('../controllers/sessionController');

/// SESSION ROUTES ///

// GET waitlist home page
router.get('/', session_controller.dummyHome);

router.get('/gravlaxisnotalaxative', session_controller.index); // This actually maps to /waitlist/ because we import the route with a /waitlist prefix

// GET request for creating a Session. NOTE This must come before routes that display Session (uses id).
router.get('/session/create', session_controller.session_create_get);

// POST request for creating Session
router.post('/session/create', session_controller.session_create_post);

// GET request for creating Session (FOR GUEST)
router.get('/guest/create', session_controller.session_create_get_guest);

// POST request for creating Session (FOR GUEST)
router.post('/guest/create', session_controller.session_create_post_guest);

// GET request to delete Session
router.get('/session/:id/delete', session_controller.session_delete_get);

// POST request to delete Session
router.post('/session/:id/delete', session_controller.session_delete_post);

// GET request to delete Session (GUEST)
router.get('/guest/:id/remove', session_controller.session_delete_guest_get);

// POST request to delete Session (GUEST)
router.post('/guest/:id/remove', session_controller.session_delete_guest_post);

// GET request to update Session
router.get('/session/:id/update', session_controller.session_update_get);

// POST request to update Session
router.post('/session/:id/update', session_controller.session_update_post);

// GET request to update Session (FOR GUEST)
router.get('/guest/:id/update', session_controller.session_update_get_guest);

// POST request to update Session (FOR GUEST)
router.post('/guest/:id/update', session_controller.session_update_post_guest);

// GET request to notify Session by SMS
// router.get('/session/:id/notify', session_controller.session_notify_get);

// GET request to notify Session by Phone
router.get('/session/:id/notifyphone', session_controller.session_phonedGuest_get);

// POST request to notify Session by Phone
router.post('/session/:id/notifyphone', session_controller.session_phonedGuest_post);

// GET request for one Session
router.get('/session/:id', session_controller.session_detail);

// POST request to notify Session by SMS
router.post('/session/:id', session_controller.session_notify_post);

// GET request for one Session's position-in-line
router.get('/guest/:id/position', session_controller.session_position);

// POST request to confirm Session
router.post('/guest/:id/position', session_controller.session_confirm_post);

// GET request for list of 'all' Sessions
router.get('/sessions', session_controller.session_list_all); 

// GET request for list of 'waiting' Sessions
router.get('/sessions/waiting', session_controller.session_list_waiting); 

// GET request for list of 'notified' Sessions
router.get('/sessions/notified', session_controller.session_list_notified); 

// GET request for list of 'confirmed' Sessions
router.get('/sessions/confirmed', session_controller.session_list_confirmed); 

// GET request to list of 'Archived' Sessions
router.get('/sessions/archived', session_controller.session_list_archived);

// GET request to archive Confirmed Sessions
router.get('/sessions/archive-request-confirmed', session_controller.session_archiveRequestConfirmed_get);

// POST request to archive Confirmed Sessions
router.post('/sessions/archive-request-confirmed', session_controller.session_archiveRequestConfirmed_post);

// GET request to archive Notified Sessions
router.get('/sessions/archive-request-notified', session_controller.session_archiveRequest_get);

// POST request to archive Notified Sessions
router.post('/sessions/archive-request-notified', session_controller.session_archiveRequest_post);

// GET request to archive Waiting Sessions
router.get('/sessions/archive-request-waiting', session_controller.session_archiveRequestWaiting_get);

// POST request to archive Waiting Sessions
router.post('/sessions/archive-request-waiting', session_controller.session_archiveRequestWaiting_post);

// GET request to notify ALL Waiting Sessions
router.get('/sessions/notify-all', session_controller.session_notifyAll_get);

// POST request to notify ALL Waiting Sessions
router.post('/sessions/notify-all', session_controller.session_notifyAll_post);

module.exports = router;