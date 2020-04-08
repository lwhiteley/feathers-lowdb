# feathers-lowdb

[![NPM version][npm-image]][npm-url]
[![Downloads][downloads-image]][downloads-url]
[![Build Status][build-image]][repo-url]

[feathers-lowdb](repo-url) is a database service adapter for [Lowdb][lowdb-repo], a small JSON database for Node, Electron and the browser powered by Lodash. LowDB can store data in-memory or on the filesystem which makes it useful as a persistent storage without a separate database server.

```bash
$ npm i --save lowdb feathers-lowdb
```

> **Important:** `feathers-lowdb` implements the [Feathers Common database adapter API](https://docs.feathersjs.com/api/databases/common.html) and [querying syntax](https://docs.feathersjs.com/api/databases/querying.html).

## API

### `service(options)`

Returns a new service instance initialized with the given options. `Model` has to be an LowDB database instance.

```js
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const service = require('feathers-lowdb');

const adapter = new FileSync('./data/messages.json');
// Create a LowDB instance
const Model = low(adapter);

app.use('/messages', service({ Model }));
app.use('/messages', service({ Model, id, events, paginate }));
```

**Options:**

- `Model` (**required**) - The LowDB database instance. See the [LowDB API][lowdb-repo] for more information.
- `id` (_optional_, default: `'_id'`) - The name of the id field property.
- `events` (_optional_) - A list of [custom service events](https://docs.feathersjs.com/api/events.html#custom-events) sent by this service
- `paginate` (_optional_) - A [pagination object](https://docs.feathersjs.com/api/databases/common.html#pagination) containing a `default` and `max` page size
- `multi` (_optional_) - Allow `create` with arrays and `update` and `remove` with `id` null to change multiple items. Can be `true` for all methods or an array of multi methods (e.g. `[ 'remove', 'create' ]`)

## Example

Here is an example of a Feathers server with a `messages` LowDB service that supports pagination and persists to `db-data/messages`:

```
$ npm i --save @feathersjs/feathers @feathersjs/errors @feathersjs/express @feathersjs/socketio feathers-lowdb lowdb
```

In `app.js`:

```js
const feathers = require('@feathersjs/feathers');
const express = require('@feathersjs/express');
const socketio = require('@feathersjs/socketio');

const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const service = require('feathers-lowdb');

const adapter = new FileSync('./data/messages.json');
// Create a LowDB instance
const db = low(adapter);

// Create an Express compatible Feathers application instance.
const app = express(feathers());
// Turn on JSON parser for REST services
app.use(express.json());
// Turn on URL-encoded parser for REST services
app.use(express.urlencoded({ extended: true }));
// Enable REST services
app.configure(express.rest());
// Enable Socket.io services
app.configure(socketio());
// Connect to the db, create and register a Feathers service.
app.use(
  '/messages',
  service({
    Model: db,
    paginate: {
      default: 2,
      max: 4,
    },
  }),
);
// Set up default error handler
app.use(express.errorHandler());

// Create a dummy Message
app
  .service('messages')
  .create({
    text: 'Message created on server',
  })
  .then((message) => console.log('Created message', message));

// Start the server.
const port = 3030;

app.listen(port, () => {
  console.log(`Feathers server listening on port ${port}`);
});
```

Run the example with `node app` and go to [localhost:3030/messages](http://localhost:3030/messages).

## License

Copyright (c) 2019

Licensed under the [MIT license](LICENSE).

[npm-image]: https://img.shields.io/npm/v/feathers-lowdb.svg?style=flat-square
[npm-url]: https://npmjs.org/package/feathers-lowdb
[downloads-image]: http://img.shields.io/npm/dm/feathers-lowdb.svg?style=flat-square
[downloads-url]: https://npmjs.org/package/feathers-lowdb
[build-image]: https://github.com/lwhiteley/feathers-lowdb/workflows/test-lib/badge.svg
[repo-url]: https://github.com/lwhiteley/feathers-lowdb
[lowdb-repo]: https://github.com/typicode/lowdb
