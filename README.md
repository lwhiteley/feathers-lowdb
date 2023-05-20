# feathers-lowdb

[![NPM version][npm-image]][npm-url]
[![Downloads][downloads-image]][downloads-url]
[![Test Runner](https://github.com/lwhiteley/feathers-lowdb/actions/workflows/Node18.yml/badge.svg)](https://github.com/lwhiteley/feathers-lowdb/actions/workflows/Node18.yml)

[feathers-lowdb][repo-url] is a FeathersJS database adapter for [Lowdb][lowdb-repo], a small JSON and YAML database for Node, and the browser. LowDB can store data in-memory or on the filesystem which makes it useful as a persistent storage without a separate database server.

```bash
$ npm i feathers-lowdb
```

## Try it Online 


- [Quick Start with Browser client](https://stackblitz.com/fork/lowdb-qs-browser)
- [Quick Start API Server](https://stackblitz.com/fork/lowdb-qs-api)
- [Quick Start First App](https://stackblitz.com/fork/lowdb-qs-first-app)

Advanced

- [Contributors Replit](https://replit.com/@fossprime/feathers-lowdb)

## LowDB benefits over NeDB, SQLite and others 

- No External Dependencies 🫧: LowDB is a self-contained JavaScript library, whereas NeDB and SQLite require external dependencies. This makes LowDB more convenient to use, as you don't need to manage additional installations or dependencies.

- Flexibility🤸‍♀️: LowDB operates directly on JSON files, allowing you to easily manipulate and access the data using standard JavaScript objects and arrays. This flexibility can be advantageous for certain use cases, such as simple data storage or prototyping.

- Portability ✈️: Since LowDB is based on JSON files, it can be easily shared and moved between different platforms or systems. This makes it suitable for scenarios where data needs to be transferred or accessed across multiple environments.

- The output is aesthetically pleasing by default, making it easier for humans to read without additional tools.

- It is widely used, ensuring good maintenance and a large community.

- It is lightweight by default, without unnecessary attempts to mimic MongoDB or focus on indexing or performance micro-optimizations.

- It utilizes ES Modules, making it as lightweight as possible by default, which is great for frontends.

- Document updates are actually saved instead of being copied as new versions at the bottom of the file, making debugging of userland code easier.

- It is suitable for testing, as the output is more predictable and less cryptic. You can load snapshots, make changes, and expect the output file to be perfectly matched.

- Indexes can be saved outside of the database or as a separate collection, rather than being appended as a strange line in your collection.



## API

### `yaml([options])`

Returns a new database instance initialized with the given options.

```js
import { LowDBService } from 'feathers-lowdb'

export const createModel = (app: Application) => {
  return new LowDBService({
    filename: 'users.yaml', // or users.json
    id: '_id', // todo: https://github.com/feathersjs/feathers/issues/2839
    startId: 1,
    paginate: {
      default: 2,
      max: 4
    }
  })
}
```

**Options:**

- `filename` (_optional, default `/tmp/low-123-321.yaml`) - The full path to the file
- `id` (_optional_, default: `'id'`) - The name of the id field property.
- `startId` (_optional_, default: `0`) - An id number to start with that will be incremented for every new record (unless it is already set).
- `store` (_optional_) - An object with id to item assignments to pre-initialize the data store
- `events` (_optional_) - A list of [custom service events](https://docs.feathersjs.com/api/events.html#custom-events) sent by this service
- `paginate` (_optional_) - A [pagination object](https://docs.feathersjs.com/api/databases/common.html#pagination) containing a `default` and `max` page size
- `whitelist` (_DEPRECATED_) - renamed to `allow`
- `allow` (_optional_) - A list of additional query parameters to allow
- `multi` (_optional_) - Allow `create` with arrays and `update` and `remove` with `id` `null` to change multiple items. Can be `true` for all methods or an array of allowed methods (e.g. `[ 'remove', 'create' ]`)

## Example

Here is an example of a Feathers server with a `messages` LowDB service that supports pagination and persists to `messages.yaml`:

```
$ npm i @feathersjs/feathers @feathersjs/koa @feathersjs/socketio feathers-lowdb@alpha
```

In `app.js`:

```js
import { feathers } from '@feathersjs/feathers'
import {
  koa,
  rest,
  bodyParser,
  errorHandler,
  serveStatic,
} from '@feathersjs/koa'
import socketio from '@feathersjs/socketio'
import { LowDBService } from 'feathers-lowdb'

// Creates an ExpressJS compatible Feathers application
const app = koa(feathers())

// Use the current folder for static file hosting
app.use(serveStatic('.'))
// Register the error handle
app.use(errorHandler())
// Parse JSON request bodies
app.use(bodyParser())

// Register REST service handler
app.configure(rest())
// Configure Socket.io real-time APIs
app.configure(socketio())
// Register our messages service
app.use(
  '/messages',
  new LowDBService({
    filename: 'messages.yaml', // or messages.json
    id: '_id', // todo: https://github.com/feathersjs/feathers/issues/2839
    startId: 1,
    paginate: {
      default: 2,
      max: 4
    }
  })
);

// Create a dummy Message
app
  .service('messages')
  .create({
    text: 'Message created on server',
  })
  .then((message) => console.log('Created message', message))


app.listen(3030, () => {
  console.log(`Feathers server listening`)
})
```

Run the example with `node app` and go to [localhost:3030/messages](http://localhost:3030/messages).

Try this example online: https://stackblitz.com/fork/lowdb-qs-first-app

## License

Copyright (c) 2023

Licensed under the [MIT license](LICENSE).

[npm-image]: https://img.shields.io/npm/v/feathers-lowdb.svg?style=flat-square
[npm-url]: https://npmjs.org/package/feathers-lowdb
[downloads-image]: http://img.shields.io/npm/dm/feathers-lowdb.svg?style=flat-square
[downloads-url]: https://npmjs.org/package/feathers-lowdb
[build-image]: https://github.com/lwhiteley/feathers-lowdb/workflows/test-lib/badge.svg
[repo-url]: https://github.com/lwhiteley/feathers-lowdb
[lowdb-repo]: https://github.com/typicode/lowdb
