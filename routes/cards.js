'use strict';
var express = require('express');
var cards = require(__dirname + '/../lib/cards');
var router = express.Router();
var logstash = require(__dirname + '/../lib/logstash')();

var nQuestions = cards.questions.length,
    nAnswers = cards.answers.length;
var question = function question() {
    return cards.questions[Math.floor(Math.random() * nQuestions)];
};
var answer = function answer() {
    return cards.answers[Math.floor(Math.random() * nAnswers)];
};
var pick = function pick() {
    return { question: question(), answer: answer() };
};

// Middleware for /api endpoints
router.use(function(req, res, next) {
    res.type('json'); // sets the response http header: Content-Type with application/json; charset=utf-8
    next();
});

// API endpoints - requests goes here
router.get('/:endpoint', function(req, res, next) {
    if (req.params.endpoint === 'question') {
        res.status(200).send({ question: question() });
    } else if (req.params.endpoint === 'answer') {
        res.status(200).send({ answer: answer() });
    } else if (req.params.endpoint === 'pick') {
        res.status(200).send(pick());
    } else {
        res.status(404).send({ error: 'Not found' })
    }
    next();
});

module.exports = router;
