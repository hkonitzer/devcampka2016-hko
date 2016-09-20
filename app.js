'use strict';
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');
var apiRoutes = require('./routes/cards');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Performance Monitoring START: store timings on request start
// Beware: sequence matters, this have to be the first .use
app.use(function(req, res, next) {
    // you should use the internal field res._startAt (as this is more accurate) and skip this app.use, but this stays
    // here for demonstration purposes
    req.hrstart = process.hrtime();
    next();
});

app.use('/', routes);
app.use('/api', apiRoutes);

module.exports = app;
