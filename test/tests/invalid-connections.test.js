'use strict';

const fp = require('lodash/fp');
const hook = require('../../lib');
const test = require('tape-catch');
const utils = require('../utils');

const invalidConnections = getInvalidConnections();

invalidConnections.forEach(function(conn) {
    test(`should fail with invalid connection: ${conn.desc}`, function(t) {
        const mycro = { log: utils.log, connections: conn.connections };
        hook.call(mycro, function(err) {
            fp.attempt(function() {
                t.ok(err instanceof Error, 'should error');
            });
            t.end();
        });
    });
});

function getInvalidConnections() {
    return [{
        desc: 'missing adapter',
        connections: {
            mongo: {
                config: {
                    url: 'mongodb://mongo:27017'
                }
            }
        }
    },{
        desc: 'invalid adapter (missing #registerConnection)',
        connections: {
            mongo: {
                adapter: {
                    registerModel: fp.noop
                },
                config: {
                    url: 'mongodb://mongo:27017'
                }
            }
        }
    },{
        desc: 'invalid adapter (missing #registerModel)',
        connections: {
            mongo: {
                adapter: {
                    registerConnection: fp.noop
                },
                config: {
                    url: 'mongodb://mongo:27017'
                }
            }
        }
    }];
}
