import { BadRequest, MethodNotAllowed, NotFound } from '@feathersjs/errors';
import { _ } from '@feathersjs/commons';
import { sorter, select, AdapterBase, } from '@feathersjs/adapter-commons';
import sift from 'sift';
import { Low } from 'lowdb';
import { TextFile, JSONFile } from 'lowdb/node';
import YAML from 'yaml';
import { tmpdir } from 'node:os';
export class YAMLFile {
    adapter;
    constructor(filename) {
        this.adapter = new TextFile(filename);
    }
    async read() {
        const data = await this.adapter.read();
        if (data === null) {
            return null;
        }
        else {
            return YAML.parse(data);
        }
    }
    write(obj) {
        return this.adapter.write(YAML.stringify(obj));
    }
}
const _select = (data, params, ...args) => {
    const base = select(params, ...args);
    return base(JSON.parse(JSON.stringify(data)));
};
const genTempName = () => `${tmpdir()}/low-${new Date().toISOString()}-${(Math.random() * 9 ** 9) | 0}`;
export function yaml(options = {}) {
    const filename = options.filename ||
        genTempName() + '.yaml';
    return new YAMLFile(filename);
}
export function json(options = {}) {
    const filename = options.filename ||
        genTempName() + '.json';
    return new JSONFile(filename);
}
export class LowDBAdapter extends AdapterBase {
    store;
    _uId;
    filename; // Probably unnecesary
    db;
    partition;
    data;
    waitForDisk;
    constructor(options = {}) {
        super({
            id: 'id',
            matcher: sift.default,
            sorter,
            // store: {},
            startId: 0,
            ...options,
        });
        this._uId = this.options.startId;
        this.store = this.options.Model || yaml(options);
        this.db = new Low(this.store);
        this.partition = options.partition;
        this.waitForDisk = !!(options.waitForDisk || this.partition);
    }
    async load() {
        if (this.db.data === null) {
            await this.db.read();
            this.db.data ||= {};
        }
        if (this.partition && this.db.data[this.partition] === undefined) {
            this.db.data[this.partition] = {};
        }
        this.data = this.partition ? this.db.data[this.partition] : this.db.data;
    }
    async getEntries(_params) {
        const params = _params || {};
        return this._find({
            ...params,
            paginate: false,
        });
    }
    getQuery(params) {
        const { $skip, $sort, $limit, $select, ...query } = params.query || {};
        return {
            query,
            filters: { $skip, $sort, $limit, $select },
        };
    }
    async _find(params = {}) {
        await this.load();
        const { paginate } = this.getOptions(params);
        const { query, filters } = this.getQuery(params);
        let values = _.values(this.data);
        const total = values.length;
        const hasSkip = filters.$skip !== undefined;
        const hasSort = filters.$sort !== undefined;
        const hasLimit = filters.$limit !== undefined;
        const hasQuery = _.keys(query).length > 0;
        if (hasSort) {
            values.sort(this.options.sorter(filters.$sort));
        }
        if (hasQuery || hasLimit || hasSkip) {
            let skipped = 0;
            const matcher = this.options.matcher(query);
            const matched = [];
            for (let index = 0, length = values.length; index < length; index++) {
                const value = values[index];
                if (hasQuery && !matcher(value, index, values)) {
                    continue;
                }
                if (hasSkip && filters.$skip > skipped) {
                    skipped++;
                    continue;
                }
                matched.push(_select(value, params, this.id));
                if (hasLimit && filters.$limit === matched.length) {
                    break;
                }
            }
            values = matched;
        }
        else {
            values = values.map((value) => _select(value, params, this.id));
        }
        const result = {
            total: hasQuery ? values.length : total,
            limit: filters.$limit,
            skip: filters.$skip || 0,
            data: filters.$limit === 0 ? [] : values,
        };
        if (!paginate) {
            return result.data;
        }
        return result;
    }
    async _get(id, params = {}) {
        await this.load();
        const { query } = this.getQuery(params);
        if (id in this.data) {
            const value = this.data[id];
            if (this.options.matcher(query)(value)) {
                return _select(value, params, this.id);
            }
        }
        throw new NotFound(`No record found for id '${id}'`);
    }
    async _create(data, params = {}) {
        await this.load();
        const createEntry = async (data, params = {}) => {
            const id = data[this.id] || this._uId++;
            const current = _.extend({}, data, { [this.id]: id });
            this.data[id] = current;
            return _select(current, params, this.id);
        };
        let result = null;
        if (Array.isArray(data)) {
            result = Promise.all(data.map((e) => createEntry(e, params)));
        }
        else {
            result = createEntry(data, params);
        }
        await result;
        if (this.waitForDisk) { // Be safe if fornicating
            await this.db.write();
        }
        else {
            this.db.write();
        }
        return result;
    }
    async _update(id, data, params = {}) {
        await this.load();
        if (id === null || Array.isArray(data)) {
            throw new BadRequest("You can not replace multiple instances. Did you mean 'patch'?");
        }
        const oldEntry = await this._get(id);
        // We don't want our id to change type if it can be coerced
        const oldId = oldEntry[this.id];
        // eslint-disable-next-line eqeqeq
        id = oldId == id ? oldId : id;
        const result = _.extend({}, data, { [this.id]: id });
        this.data[id] = result;
        if (this.waitForDisk) {
            await this.db.write();
        }
        else {
            this.db.write();
        }
        return this._get(id, params);
    }
    async _patch(id, data, params = {}) {
        await this.load();
        if (id === null && !this.allowsMulti('patch', params)) {
            throw new MethodNotAllowed('Can not patch multiple entries');
        }
        const { query } = this.getQuery(params);
        const patchEntry = async (entry) => {
            const currentId = entry[this.id];
            this.data[currentId] = _.extend(this.data[currentId], _.omit(data, this.id));
            return _select(this.data[currentId], params, this.id);
        };
        let result = null;
        if (id === null) {
            const entries = await this.getEntries({
                ...params,
                query,
            });
            result = Promise.all(entries.map(patchEntry));
        }
        else {
            result = patchEntry(await this._get(id, params)); // Will throw an error if not found
        }
        await result;
        if (this.waitForDisk) {
            await this.db.write();
        }
        else {
            this.db.write();
        }
        return result;
    }
    async _remove(id, params = {}) {
        await this.load();
        if (id === null && !this.allowsMulti('remove', params)) {
            throw new MethodNotAllowed('Can not remove multiple entries');
        }
        const { query } = this.getQuery(params);
        if (id === null) {
            const entries = await this.getEntries({
                ...params,
                query,
            });
            return Promise.all(entries.map((current) => this._remove(current[this.id], params)));
        }
        const entry = await this._get(id, params);
        delete this.data[id];
        if (this.waitForDisk) {
            await this.db.write();
        }
        else {
            this.db.write();
        }
        return entry;
    }
}
export class LowDBService extends LowDBAdapter {
    async find(params) {
        return this._find({
            ...params,
            query: await this.sanitizeQuery(params),
        });
    }
    async get(id, params) {
        return this._get(id, {
            ...params,
            query: await this.sanitizeQuery(params),
        });
    }
    async create(data, params) {
        if (Array.isArray(data) && !this.allowsMulti('create', params)) {
            throw new MethodNotAllowed('Can not create multiple entries');
        }
        return this._create(data, params);
    }
    async update(id, data, params) {
        return this._update(id, data, {
            ...params,
            query: await this.sanitizeQuery(params),
        });
    }
    async patch(id, data, params) {
        const { $limit, ...query } = await this.sanitizeQuery(params);
        return this._patch(id, data, {
            ...params,
            query,
        });
    }
    async remove(id, params) {
        const { $limit, ...query } = await this.sanitizeQuery(params);
        return this._remove(id, {
            ...params,
            query,
        });
    }
}
//# sourceMappingURL=index.js.map