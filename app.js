var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
// var helmet = require('helmet');
var session = require('cookie-session');
var compression = require('compression');
require('dotenv').config();

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var waitlistRouter = require('./routes/waitlist'); // Import routes for "waitlist" area of site

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// cookie-session code for production-only (still able to run in development mode though)
app.set('trust proxy', 1) // trust first proxy

// app.use(helmet());
app.use(session({
  name: 'session',
  keys: ['eric', 'cartman'],
  cookie: {
    secret: 'gravlaxisnotalaxative',
    secure: true,
    httpOnly: true,
    resave: false,
    saveUninitialized: false
  }
}));
// cookies-session code for production-only (END)

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(compression()); // compress all routes
app.use(express.static(path.join(__dirname, 'public')));


app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/waitlist', waitlistRouter); // Add waitlist routes to middleware chain

// Set up mongoose connection
var mongoose = require('mongoose');
const { response } = require('express');
dev_db_url='mongodb+srv://patricialan:development@cluster0.vxl0f.mongodb.net/waitlist-development?retryWrites=true&w=majority'
var mongoDB = process.env.MONGODB_URI || dev_db_url;
mongoose.connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true });
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
