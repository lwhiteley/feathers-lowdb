import { default as createService, Service } from 'feathers-lowdb';
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

const adapter = new FileSync('./data/messages.json');
const Model = low(adapter);

const service1 = createService();
const service2 = new Service({ Model });

service1._find({});

service2.getModel({}) instanceof low;
