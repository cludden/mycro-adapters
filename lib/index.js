'use strict';

const async = require('async');
const fp = require('lodash/fp');
const initConnections = require('./init-connections');
const initModels = require('./init-models');
const processModels = require('./process-models');


/**
 * Adapters hook function for initializing connections, initializing models, and
 * any post processing of models.
 * @param  {Function} done
 * @this mycro
 */
module.exports = function adapters(done) {
    const mycro = this;

    if (!fp.isObject(mycro.connections) || Object.keys(mycro.connections).length === 0) {
        return process.nextTick(done);
    }

    async.series([
        initConnections(mycro),
        initModels(mycro),
        processModels(mycro)
    ], done);
};
