'use strict';

const fp = require('lodash/fp');
const hook = require('../../lib');
const test = require('tape-catch');

test('should not fail if there are no connections', function(t) {
    const mycro = { log: fp.noop };
    hook.call(mycro, function(err) {
        t.equal(typeof err, 'undefined');
        t.end();
    });
});
