'use strict';

const hook = require('../../lib');
const test = require('tape-catch');
const td = require('testdouble');
const utils = require('../utils');

const Adapter = utils.Adapter;
const Connection = utils.Connection;
const Model = utils.Model;
const log = utils.log;

test('should hand off each connection to adapter\'s #registerConnection hook', function(t) {
    const mongoAdapter = new Adapter('mongo');
    const mysqlAdapter = new Adapter('mysql');
    const mongoConfig = { adapter: mongoAdapter, config: { foo: 'bar' }};
    const mysqlConfig = { adapter: mysqlAdapter, config: { bar: 'baz' }};

    [mongoAdapter, mysqlAdapter].forEach(function(adapter) {
        td.replace(adapter, 'registerConnection');
        td.when(adapter.registerConnection(td.matchers.anything())).thenCallback(null, new Connection());
    });

    const mycro = { log, connections: { mongodb: mongoConfig, mysql: mysqlConfig } };

    hook.call(mycro, function(err) {
        t.equal(err, null, 'should not error');
        Object.keys(mycro.connections).forEach(function(key) {
            const connection = mycro.connections[key];
            const adapter = connection.adapter;
            t.error(td.verify(adapter.registerConnection(td.matchers.isA(Object), td.matchers.isA(Function))), 'should call adapter\'s #registerConnection hook');
            t.equal(typeof connection.connection, 'object', 'has property connection');
            t.ok(connection.connection instanceof Connection, 'should include a connection object');
        });
        td.reset();
        t.end();
    });
});

test('should allow for connection configuration to a function that is executed at runtime', function(t) {
    const adapter = new Adapter('test');
    const getConfig = td.function();
    const config = { adapter: adapter, config: getConfig };

    td.when(getConfig()).thenReturn({ foo: 'bar' });

    const mycro = { log, connections: { mongodb: config } };

    hook.call(mycro, function(err) {
        t.equal(err, null, 'should not error');
        t.equal(mycro.connections.mongodb.connection.config.foo, 'bar', 'should call connections\'s #config function');
        td.reset();
        t.end();
    });
});


test('should fail if an error is returned from an adapter\'s #registerConnection hook', function(t) {
    const adapter = new Adapter('mongo');
    const config = { adapter, config: { foo: 'bar' }};

    td.replace(adapter, 'registerConnection');
    td.when(adapter.registerConnection(td.matchers.anything())).thenCallback(new Error('something unexpected'));

    const mycro = { log , connections: { mongo: config }};

    hook.call(mycro, function(err) {
        t.ok(err instanceof Error, 'should error');
        t.error(td.verify(adapter.registerConnection(td.matchers.anything(), td.matchers.isA(Function))), 'should call adapter\'s #registerConnection hook');
        td.reset();
        t.end();
    });
});


test('should hand off each model to adapter\'s #registerModel hook', function(t) {
    const adapter = new Adapter('mongo');
    const config = { adapter, config: { foo: 'bar' }};

    td.replace(adapter, 'registerModel');
    td.when(adapter.registerModel(td.matchers.isA(Object), td.matchers.anything())).thenCallback(null, new Model());

    const mycro = { log, connections: { mongo: config }, models: { foo: 'bar' }};

    hook.call(mycro, function(err) {
        t.equal(err, null, 'should not error');
        t.error(td.verify(adapter.registerModel(td.matchers.isA(Object), td.matchers.anything(), td.matchers.isA(Function))), 'should call adapter\'s #registerModel hook');
        t.ok(mycro.models.foo instanceof Model, 'should process models');
        td.reset();
        t.end();
    });
});


test('should find model adapter by string equality', function(t) {
    const mongoAdapter = new Adapter('mongo');
    const mysqlAdapter = new Adapter('mysql');
    const mongoConfig = { adapter: mongoAdapter, config: { foo: 'bar' }, models: [ 'random', 'post', 'blog' ]};
    const mysqlConfig = { adapter: mysqlAdapter, config: { bar: 'baz' }, models: [ 'other', 'user' ]};
    const mycro = {
        log,
        connections: {
            mongo: mongoConfig,
            mysql: mysqlConfig
        },
        models: {
            user: { goo: 'daz' },
            post: { doo: 'dat' },
            blog: { fee: 'fum' }
        }
    };
    hook.call(mycro, function(err) {
        t.equal(err, null, 'should not error');
        t.ok(mycro.connections.mongo._models.indexOf('post') !== -1, 'should register "post" model with "mongo" connection');
        t.ok(mycro.connections.mongo._models.indexOf('blog') !== -1, 'should register "blog" model with "mongo" connection');
        t.ok(mycro.connections.mysql._models.indexOf('user') !== -1, 'should register "user" model with "mysql" connection');
        t.end();
    });
});


test('should find model adapter by regex test', function(t) {
    const mongoAdapter = new Adapter('mongo');
    const mysqlAdapter = new Adapter('mysql');
    const mongoConfig = { adapter: mongoAdapter, config: { foo: 'bar' }, models: [ /^a/, /^p/ ]};
    const mysqlConfig = { adapter: mysqlAdapter, config: { bar: 'baz' }, models: [ /^b/, /^u/ ]};
    const mycro = {
        log,
        connections: {
            mongo: mongoConfig,
            mysql: mysqlConfig
        },
        models: {
            user: { goo: 'daz' },
            post: { doo: 'dat' }
        }
    };
    hook.call(mycro, function(err) {
        t.equal(err, null, 'should not error');
        t.ok(mycro.connections.mongo._models.indexOf('post') !== -1, 'should register "post" model with "mongo" connection');
        t.ok(mycro.connections.mysql._models.indexOf('user') !== -1, 'should register "user" model with "mysql" connection');
        t.end();
    });
});


test('should find model adapter by connection default flag', function(t) {
    const mongoAdapter = new Adapter('mongo');
    const mysqlAdapter = new Adapter('mysql');
    const mongoConfig = { adapter: mongoAdapter, config: { foo: 'bar' }, models: [ /^a/, /^p/ ]};
    const mysqlConfig = { adapter: mysqlAdapter, config: { bar: 'baz' }, default: true };
    const mycro = {
        log,
        connections: {
            mongo: mongoConfig,
            mysql: mysqlConfig
        },
        models: {
            user: { goo: 'daz' },
            post: { doo: 'dat' }
        }
    };
    hook.call(mycro, function(err) {
        t.equal(err, null, 'should not error');
        t.ok(mycro.connections.mongo._models.indexOf('post') !== -1, 'should register "post" model with "mongo" connection');
        t.ok(mycro.connections.mysql._models.indexOf('user') !== -1, 'should register "user" model with "mysql" connection');
        t.end();
    });
});


test('should fail if model adapter cannot be found', function(t) {
    const mongoAdapter = new Adapter('mongo');
    const mysqlAdapter = new Adapter('mysql');
    const mongoConfig = { adapter: mongoAdapter, config: { foo: 'bar' }, models: [ /^z/ ]};
    const mysqlConfig = { adapter: mysqlAdapter, config: { bar: 'baz' }, models: [1]};
    const mycro = {
        log,
        connections: {
            mongo: mongoConfig,
            mysql: mysqlConfig
        },
        models: {
            user: { goo: 'daz' },
            post: { doo: 'dat' }
        }
    };
    hook.call(mycro, function(err) {
        t.ok(err instanceof Error, 'should error');
        t.end();
    });
});


test('should fail if an error is returned from an adapter\'s #registerModel hook', function(t) {
    const adapter = new Adapter('test');
    const config = { adapter, config: { foo: 'bar' }};

    td.replace(adapter, 'registerModel');
    td.when(adapter.registerModel(td.matchers.anything(), td.matchers.anything())).thenCallback(new Error('something unexpected'));

    const mycro = { log, connections: { mongo: config }, models: { foo: { bar: 'baz' }}};

    hook.call(mycro, function(err) {
        t.ok(err instanceof Error, 'should error');
        t.error(td.verify(adapter.registerModel(mycro.connections.mongo.connection, mycro.models.foo, td.matchers.isA(Function))), 'should call adapter\'s #registerModel hook');
        td.reset();
        t.end();
    });
});


test('should allow adapter\'s to implement a #processModels hook that receives the connection and appropriate model subset', function(t) {
    const adapter = new Adapter('test');
    const config = { adapter, config: { foo: 'bar' }};

    td.replace(adapter, 'processModels');
    td.when(adapter.processModels(td.matchers.anything(), td.matchers.anything())).thenCallback(null, { foo: new Model() });

    const mycro = { log, connections: { mongo: config }, models: { foo: { bar: 'baz' }}};

    hook.call(mycro, function(err) {
        t.equal(err, null, 'should not error');
        t.error(td.verify(adapter.processModels(mycro.connections.mongo.connection, td.matchers.isA(Object), td.matchers.isA(Function))), 'should call adapter\'s #processsModels hook');
        td.reset();
        t.end();
    });
});


test('should not error if the adapter does not implement a #processModels hook', function(t) {
    const adapter = new Adapter('test');
    delete adapter.processModels;

    const config = { adapter, config: { foo: 'bar' }};
    const mycro = { log, connections: { mongo: config }, models: { foo: { bar: 'baz' }}};

    hook.call(mycro, function(err) {
        t.equal(err, null, 'should not error');
        t.end();
    });
});


test('should fail if an error is returned from an adapter\'s #processModels hook', function(t) {
    const adapter = new Adapter('test');
    const config = { adapter, config: { foo: 'bar' }};

    td.replace(adapter, 'processModels');
    td.when(adapter.processModels(td.matchers.anything(), td.matchers.anything())).thenCallback(new Error('something unexpected'));

    const mycro = { log, connections: { mongo: config }, models: { foo: { bar: 'baz' }}};

    hook.call(mycro, function(err) {
        t.ok(err instanceof Error, 'should error');
        t.error(td.verify(adapter.processModels(mycro.connections.mongo.connection, td.matchers.isA(Object), td.matchers.isA(Function))), 'should call adapter\'s #processsModels hook');
        td.reset();
        t.end();
    });
});
