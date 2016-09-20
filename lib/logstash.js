'use strict';
var debug = require('debug')('devcampka2016-hko:logstash');
var net = require('net');

/**
 * Host of the logstash installation
 * @type {string}
 */
var LOGSTASH_HOST = 'localhost';

/**
 * Port of the logstash installation, see the input section in your pipeline configuration f
 * @type {number}
 */
var LOGSTASH_PORT = 3515;

/**
 * indicates that the logstash client is in use - will be false if no connection can be made or the connection gets lost
 * @type {boolean}
 */
var LOGSTASH_useClient = false;

/**
 * Timestamp of the last error encounterd within the logstash connection, used to reconnect to the logstash server
 * after 60000ms
 * @type {number}
 */
var LOGSTASH_error = 0;

/**
 * The tcp client
 */
var client;
debug('Starting Logstash TCP client on port %s', LOGSTASH_PORT);


/**
 * Callback function for the TCP connection to logstash
 */
var connectCallback = function () {
    debug('Logstash TCP client connected to %s:%s', LOGSTASH_HOST, LOGSTASH_PORT);
    LOGSTASH_useClient = true;
    LOGSTASH_error = 0; // reset
};

// init tcp connection client
client = new net.Socket();
client.setEncoding('utf8');
client.setNoDelay(true);
client.connect(LOGSTASH_PORT, LOGSTASH_HOST, connectCallback);



// Add a 'close' event handler for the client socket
client.on('error', function (exception) {
    debug('Logstash TCP client error', exception);
    LOGSTASH_error = Date.now();
});

// Intercept timeout (connection loss) to logstash and sets the internal error count
client.on('timeout', function () {
    debug('Logstash TCP client timeout');
    LOGSTASH_error = Date.now();
});


var os = require('os');

module.exports = function() {

    /**
     * The standard message object for the elastic search index
     * @param req
     * @param res
     * @returns {{startTime: (string|String), request_method: (string|*), request_uri: *, response_statuscode: (number|*), user_agent: *, type: string, duration: (number|*), host: *}}
     * @constructor
     */
    var Message = function(req, res) {
        var hrend, duration;
        // measure the running time
        if (req.hrstart) {
            hrend = process.hrtime(req.hrstart);
        } else {
            hrend = process.hrtime(req._startAt); // fallback
        }
        duration = (hrend[0]*1000) + (hrend[1]/1000000);
        return {
            startTime: res._startTime.toJSON(), request_method: req.method, request_uri: req.path, response_statuscode: res.statusCode, user_agent: req.headers['user-agent'], type: 'demoapi', duration: duration, host: os.hostname()
        }
    };

    /**
     * Writing a JSON Message to Logstash
     * @param messageObject as JSON
     * @private
     */
    var _send = function (messageObject) {
        if (LOGSTASH_useClient) {
            if (LOGSTASH_error === 0) {
                client.write(JSON.stringify(messageObject) + '\n');
            } else {
                if ((Date.now() - LOGSTASH_error) > 60000) {
                    debug('Trying to reconnect to Logstash');
                    client.connect(LOGSTASH_PORT, LOGSTASH_HOST, connectCallback);
                }
            }
        }
    };

    return {
        send: function(req, res, next) {
            var message = new Message(req, res);
            _send(message);
            next();
        }
    }
};