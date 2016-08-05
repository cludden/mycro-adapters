'use strict';

const fp = require('lodash/fp');

module.exports = function(mycro) {
    /**
     * Wrapper function around adapter's registerConnection hook for handling
     * registration errors.
     * @param  {String} name - the connection name
     * @param  {Object} connection - the connection object
     * @param  {Function} done
     */
    return function processConnection(name, connection, done) {
        const adapter = connection.adapter;
        const config = fp.isFunction(connection.config) ? connection.config() : connection.config;

        adapter.registerConnection(config, function(err, c) {
            if (err) {
                mycro.log('error', `[mycro-adapters] Error processing connection: ${name}`);
                return done(err);
            }
            connection.connection = c;
            done(undefined, connection);
        });
    };
};
