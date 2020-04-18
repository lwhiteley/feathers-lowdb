const path = require('path');
const low = require('lowdb');
const FileAsync = require('lowdb/adapters/FileAsync');
const mkdirp = require('mkdirp');

const { SequentialService, runTests } = require('./_common');

const dir = 'db-data/file-async';
mkdirp.sync(dir);

const createService = async (name, options) => {
  const filename = path.join(dir, name);

  const adapter = new FileAsync(`${filename}.json`);
  const db = await low(adapter);

  return new SequentialService({
    Model: db,
    events: ['testing'],
    ...options,
  });
};

runTests({ createService, testTitle: 'LowDB FileAsync Service ' });
