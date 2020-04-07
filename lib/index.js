const crypto = require('crypto');
const errors = require('@feathersjs/errors');
const { _ } = require('@feathersjs/commons');
const {
  sorter,
  select,
  AdapterService,
} = require('@feathersjs/adapter-commons');
const sift = require('sift').default;

const _select = (data, ...args) => {
  const base = select(...args);

  return base(JSON.parse(JSON.stringify(data)));
};

// Create the service.
class Service extends AdapterService {
  constructor(options) {
    if (!options || !options.Model) {
      throw new Error('LowDB datastore `Model` needs to be provided');
    }

    const opts = { ...options, matcher: sift, sorter };
    super({ id: '_id', ...opts });
    this.getModel().defaults({ data: [] }).write();
  }

  getModel() {
    return this.options.Model;
  }

  async _find(params = {}) {
    // Start with finding all, and limit when necessary.
    const { filters, query, paginate } = this.filterQuery(params);
    const db = this.getModel(params);
    const dataArr = db.get('data');
    const count = dataArr.size().value();
    const q = dataArr.filter(this.options.matcher(query)).thru((array) => {
      let arr = db._.castArray(array);

      // $select uses a specific find syntax, so it has to come first.
      if (filters.$select) {
        arr = arr.map((x) => db._.pick(x, filters.$select));
      }

      if (filters.$sort) {
        arr.sort(this.options.sorter(filters.$sort));
      }

      if (filters.$skip) {
        arr = arr.slice(filters.$skip);
      }

      if (filters.$limit !== undefined) {
        arr = arr.slice(0, filters.$limit);
      }

      return arr;
    });

    const result = {
      total: count,
      limit: filters.$limit,
      skip: filters.$skip || 0,
      data: q.value().map((value) => _select(value, params)),
    };

    if (!(paginate && paginate.default)) {
      return result.data;
    }

    return result;
  }

  async _get(id, params = {}) {
    const { query } = this.filterQuery(params);
    const db = this.getModel(params);

    return Promise.resolve(
      db
        .get('data')
        .find({ [this.id]: id })
        .value(),
    ).then((doc) => {
      if (doc && this.options.matcher(query)(doc)) {
        return _select(doc, params, this.id);
      }
      throw new errors.NotFound(`No record found for id '${id}'`);
    });
  }

  async _findOrGet(id, params = {}) {
    if (id === null) {
      return this._find(
        _.extend({}, params, {
          paginate: false,
        }),
      );
    }

    return this._get(id, params);
  }

  _create(raw, params = {}) {
    const addId = (item) => {
      if (item[this.id] === undefined) {
        return {
          ...item,
          [this.id]: crypto.randomBytes(8).toString('hex'),
        };
      }

      return item;
    };
    const db = this.getModel(params);
    const data = Array.isArray(raw) ? raw.map(addId) : addId(raw);
    const dataArr = db.get('data');
    db._.castArray(data).forEach((x) => dataArr.push(x).write());

    return Promise.resolve(data).then(select(params, this.id));
  }

  async _patch(id, data, params = {}) {
    const patchEntry = (entry) => {
      const currentId = entry[this.id];
      const dataArr = this.getModel(params).get('data');

      const currentVal = dataArr.find({ [this.id]: currentId }).value();

      const patched = _.extend(currentVal, _.omit(data, this.id));

      dataArr
        .find({ [this.id]: currentId })
        .assign(patched)
        .write();

      return _select(patched, params, this.id);
    };

    if (id === null) {
      const entries = await this._findOrGet(id, params);
      return entries.map(patchEntry);
    }

    return patchEntry(await this._get(id, params)); // Will throw an error if not found
  }

  async _update(id, data, params = {}) {
    const oldEntry = await this._get(id);
    // We don't want our id to change type if it can be coerced
    const oldId = oldEntry[this.id];

    const currentId = oldId === id ? oldId : id;
    const dataArr = this.getModel(params).get('data');
    const index = dataArr.findIndex({ [this.id]: currentId });

    dataArr
      .set(`[${index}]`, _.extend({}, data, { [this.id]: currentId }))
      .write();

    return this._get(currentId, params);
  }

  async _remove(id, params = {}) {
    if (id === null) {
      const entries = await this._findOrGet(id, params);

      return Promise.all(
        entries.map((current) => this._remove(current[this.id], params)),
      );
    }

    const entry = await this._get(id, params);

    this.getModel(params).get('data').remove(entry).write();

    return entry;
  }
}

module.exports = function init(options) {
  return new Service(options);
};

module.exports.Service = Service;
