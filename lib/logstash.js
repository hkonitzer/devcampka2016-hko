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
 * acts as flag and as duration indicator (time since last error)
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
    debug('Logstash TCP client connected to %s:%s', client.remoteAddress, client.remotePort);
    LOGSTASH_useClient = true;
    LOGSTASH_error = 0; // reset
};

var errorCallback = function (exception) {
    if (exception !== null) {
        debug('Logstash TCP client error', exception);
    } else {
        debug('Logstash TCP client timeout');
    }
    LOGSTASH_error = Date.now();
};

// init tcp connection client
client = new net.Socket();
client.setEncoding('utf8');
client.setNoDelay(true); // Disables the Nagle algorithm. By default TCP connections use the Nagle algorithm,
                        // they buffer data before sending it off. Setting true for noDelay will immediately
                        // fire off data each time socket.write() is called.
client.connect(LOGSTASH_PORT, LOGSTASH_HOST, connectCallback);

// error handler for the connection to logstash
client.on('error', errorCallback);

// Intercept timeout (connection loss) to logstash and sets the internal error count
// Emitted if the socket times out from inactivity. This is only to notify that the socket has been idle.
client.on('timeout', errorCallback);


var os = require('os');

module.exports = function() {

    /**
     * The standard message object for the elastic search index
     * @param req
     * @param res
     * @returns {{request_start: (string|String), request_method: (*|string), request_uri: *, response_statuscode: (*|number), user_agent: *, duration: (number|*), host: *, type: string}}
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
        duration = (hrend[0]*1000) + (hrend[1]/1000000); // duration is: milliseconds
        return {
            request_start: res._startTime.toJSON(),
            request_method: req.method,
            request_uri: req.path,
            response_statuscode: res.statusCode,
            user_agent: req.headers['user-agent'],
            duration: duration,
            host: os.hostname(),
            type: 'demoapi'
        }
    };

    /**
     * Writing a JSON Message to Logstash
     * @param message as JSON
     * @param callback function
     * @private
     */
    var _send = function (message, callback) {
        if (LOGSTASH_useClient) { // client can be used
            if (LOGSTASH_error === 0) { // because there are no errors at the moment
                // write the message to logstash as string. beware: \n is needed, see https://github.com/elastic/logstash/issues/3857
                client.write(JSON.stringify(message) + '\n', callback);
            } else {
                // error encountered (connection issue)
                if ((Date.now() - LOGSTASH_error) > 60000) {
                    debug('Trying to reconnect to Logstash');
                    client.connect(LOGSTASH_PORT, LOGSTASH_HOST, connectCallback);
                }
                if (typeof callback === 'function') {
                    callback();
                }
            }
        }
    };

    return {
        /**
         * Sends a message to logstash, needs the current response and request object to retrieve various information
         * @param req
         * @param res
         * @param next
         */
        send: function(req, res, next) {
            res.on('finish', function() { // wait for "finish" event, because when req emit end event, res header is not set yet.
                var message = new Message(req, res);
                _send(message);
            });
            next();
        }
    }
};