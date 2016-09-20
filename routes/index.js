'use strict';
var express = require('express');
var router = express.Router();
var logstash = require(__dirname + '/../lib/logstash')();

/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('index', {title: 'DevCamp Karlsruhe 2016 Session'});
    next();
});

// Performance measurement
router.use(logstash.send);

module.exports = router;
