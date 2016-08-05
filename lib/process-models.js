'use strict';

const async = require('async');
const fp = require('lodash/fp');

module.exports = function(mycro) {
    /**
     * Iterate connections, and allow adapters to perform post processing of
     * models that belong to the corresponding connection.
     * @param  {Function} done
     */
    return function processModels(done) {
        const keys = Object.keys(mycro.connections);

        async.each(keys, function(key, next) {
            const connection = mycro.connections[key];
            const _processModels = connection.adapter.processModels;

            if (!connection._models || !connection._models.length || !fp.isFunction(_processModels)) {
                return process.nextTick(next);
            }

            const adapterModels = fp.pick(connection._models, mycro.models);
            _processModels(connection.connection, adapterModels, function(err, processed) {
                if (err) {
                    mycro.log('error', `Error processing models for connection: ${key}`);
                    return next(err);
                }
                Object.assign(mycro.models, processed);
                next();
            });
        }, done);
    };
};
