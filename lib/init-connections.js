'use strict';

const async = require('async');
const registerConnection = require('./register-connections');
const validateConnection = require('./validate-connection');

module.exports = function loadConnections(mycro) {
    /**
     * Iterate through connections, validating adapter signatures, and delegate
     * connection initialization to the corresponding adapter's
     * registerConnection hook.
     * @param  {Function} done
     */
    return function(done) {
        const connections =mycro.connections;
        const keys = Object.keys(connections);

        async.each(keys, function(key, next) {
            const options = connections[key];
            async.waterfall([
                validateConnection(options, key),
                registerConnection(mycro)
            ], function(err, connection) {
                if (err) {
                    return next(err);
                }
                mycro.connections[key] = connection;
                next();
            });
        }, done);
    };
};
