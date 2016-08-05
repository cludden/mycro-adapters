'use strict';

const joi = require('joi');

/**
 * Adapter schema
 * @param
 */
const schema = joi.object({
    adapter: joi.object({
        processModels: joi.func(),
        registerConnection: joi.func().required(),
        registerModel: joi.func().required()
    }).unknown(true).required(),
    config: joi.alternatives().try(
        joi.func(),
        joi.object()
    ),
    default: joi.boolean(),
    models: joi.array()
}).unknown(true).required();

module.exports = function(connection, name) {
    /**
     * Validate adapter signature using the schema above.
     * @param  {Function} done
     */
    return function validateConnection(done) {
        joi.validate(connection, schema, function(err) {
            if (err) {
                return done(err);
            }
            done(null, name, connection);
        });
    };
};
