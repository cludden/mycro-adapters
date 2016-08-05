'use strict';

const async = require('async');
const fp = require('lodash/fp');

module.exports = function(mycro) {
    /**
     * Iterate through models, locate the corresponding connection, and delegate
     * initialization to the adapter's #registerModel hook.
     * @param  {Function} done
     */
    return function(done) {
        const findConnection = createFindConnection(mycro);
        const models = fp.isObject(mycro.models) ? mycro.models : {};
        const keys = Object.keys(models);
        if (keys.length === 0) {
            return process.nextTick(done);
        }
        async.each(keys, function(key, next) {
            const connection = findConnection(key);
            if (!connection) {
                mycro.log('info', `[mycro-adapters] Unable to locate connection for model: ${key}`);
                return async.setImmediate(next.bind(null, new Error(`Unable to locate connection for model: ${key}`)));
            }
            const registerModel = connection.adapter.registerModel;
            registerModel(connection.connection, models[key], function(err, model) {
                if (err) {
                    mycro.log('error', `[mycro-adapters] Error registering model: ${key}`);
                    return next(err);
                }
                mycro.models[key] = model;
                next();
            });
        }, done);
    };
};


/**
 * Create a function for locating a connection based on the model name.
 * @param  {Object} mycro - the mycro instance
 * @return {Function} _findConnection
 */
function createFindConnection(mycro) {

    /**
     * Instance specific finder function. Locate's an adapter based on the
     * connections configuration. A connection should either be the only
     * connection available, specifically implement a "default" attribute,
     * or define a "models" array with either string names or regex tests.
     * @param  {String} name - the model name
     * @return {Object|Null}
     */
    return function _findConnection(name) {
        const connections = mycro.connections;
        const keys = Object.keys(connections);
        if (keys.length === 1) {
            const connection = connections[keys[0]];
            registerConnectionModel(connection, name);
            return connections[keys[0]];
        }
        let defaultConnection = null;
        const connection = fp.find(function(key) {
            const connection = connections[key];
            if (connection.default === true && defaultConnection === null) {
                defaultConnection = key;
            }
            const models = fp.isArray(connection.models) ? connection.models : [];
            const found = fp.find(function(test) {
                if (fp.isString(test)) {
                    return test === name;
                }
                if (fp.isRegExp(test)) {
                    return test.test(name);
                }
                return false;
            }, models);
            if (found) {
                registerConnectionModel(connection, name);
            }
            return found;
        }, Object.keys(connections));
        if (connection !== undefined) {
            return connections[connection];
        }
        if (defaultConnection !== null) {
            registerConnectionModel(connections[defaultConnection], name);
            return connections[defaultConnection];
        }
        return null;
    };
}


/**
 * Register
 * @param  {[type]} connection [description]
 * @param  {[type]} key        [description]
 * @return {[type]}            [description]
 */
function registerConnectionModel(connection, key) {
    connection._models = fp.isArray(connection._models) ? connection._models : [];
    connection._models.push(key);
}
