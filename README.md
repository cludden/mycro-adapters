# mycro-adapters
a [mycro](https://github.com/cludden/mycro) hook for loading adapters.



## Installing
```bash
npm install --save mycro-adapters
```



## Getting Started
*This hook assumes that the [mycro-containers](https://github.com/cludden/mycro-containers) hook has run prior to this hook.*

Define one or more connections:
```javascript
//in /connections/mongo.js

const adapter = require('mycro-mongoose');

module.exports = {
    adapter,
    config: {
        url: 'mongodb://<username>:<password>@localhost:27017/my-database'
    }
};
```

Define one or more models:
```javascript
// in /models/user.js

module.exports = function(mycro) {

    return function createUserModel(connection, Schema) {
        const schema = new Schema({
            first: String,
            last: String,
            email: String
        },{
            collection: 'users'
        });

        schema.statics.greet = function(greeting) {
            const result = `${greeting} ${this.first}!`;
            mycro.log('silly', result);
            return result
        }

        return connection.model('user', schema);
    }
}
```



## Adapter API
Adapter should follow the schema below.
```javascript
{
    /**
     * Optional post processing hook that receives the
     * connection and a map of models registered by
     * this adapter,
     * @param  {*} connection - the connection instance returned by #registerConnection
     * @param  {Object} models - a map of models registered to the connection
     * @param  {Function} done
     */
    processModels(connection, models, done) {
        // do some post processing here. return a new map of
        // processed models
        done(null, processed);
    },


    /**
     * Create a new connection using the connection config defined in
     * the connection file. The callback should return a connection
     * instance.
     * @param  {Object} config - connection config
     * @param  {Function} done
     */
    registerConnection(config, done) {
        // create a new connection using config
        done(null, connection);
    },


    /**
     * Register a model using the connection instance and the
     * model definition.
     * @param  {*} connection - the connection instance returned by #registerConnection
     * @param  {*} modelDef - the model definition
     * @param  {Function} done
     */
    registerModel(connection, modelDef, done) {
        // create a new model and return it
        done(null, model);
    }
}
```



## Testing
run tests  
```javascript
npm test
```

run coverage
```javascript
npm run coverage
```



## Contributing
1. [Fork it](https://github.com/cludden/mycro-adapters/fork)
2. Create your feature branch (`git checkout -b my-new-feature`)
3. Commit your changes (`git commit -am 'Add some feature'`)
4. Push to the branch (`git push origin my-new-feature`)
5. Create new Pull Request



## License
Copyright (c) 2016 Chris Ludden.
Licensed under the [MIT license](LICENSE.md).
