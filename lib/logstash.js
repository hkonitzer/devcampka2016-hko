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
var LOGSTASH_PORT = 3516;

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
var client = new net.Socket();
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
/**
 * Writing a JSON Message to Logstash
 * @param messageObject as JSON
 */
module.exports = function (messageObject) {
    if (LOGSTASH_useClient) {
        if (LOGSTASH_error === 0) {
            client.write(messageObject);
        } else {
            if ((Date.now() - LOGSTASH_error) > 60000) {
                debug('Trying to reconnect to Logstash');
                client.connect(LOGSTASH_PORT, LOGSTASH_HOST, connectCallback);
            }
        }
    }
};