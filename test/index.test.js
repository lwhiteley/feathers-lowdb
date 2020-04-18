const path = require('path');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const mkdirp = require('mkdirp');

const { SequentialService, runTests } = require('./_common');

const dir = 'db-data/file-sync';
mkdirp.sync(dir);

const createService = (name, options) => {
  const filename = path.join(dir, name);

  const adapter = new FileSync(`${filename}.json`);
  const db = low(adapter);

  return Promise.resolve(
    new SequentialService({
      Model: db,
      events: ['testing'],
      ...options,
    }),
  );
};

runTests({ createService, testTitle: 'LowDB FileSync Service ' });
