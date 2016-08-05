'use strict';

const fp = require('lodash/fp');

function createUuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
    });
}

function log(...args) {
    fp.noop.apply(null, args);
}

function Model(connection, config) {
    this.id = createUuid();
    this.connection = fp.get('connection.id', connection);
    this.config = config;
}

function Connection(config) {
    this.id = createUuid();
    this.config = config;
}

function Adapter(name) {
    this.name = name;
}


Adapter.prototype.processModels = function(config, models, done) {
    process.nextTick(done.bind(null, null, models));
};

Adapter.prototype.registerConnection = function(config, done) {
    const connection = new Connection(config);
    process.nextTick(done.bind(null, null, connection));
};

Adapter.prototype.registerModel = function(connection, model, done) {
    const processed = new Model(connection, model);
    process.nextTick(done.bind(null, null, processed));
};

module.exports = {
    Adapter,
    Connection,
    Model,
    log
};
