import { AdapterBase, AdapterServiceOptions, PaginationOptions, AdapterParams } from '@feathersjs/adapter-commons';
import { NullableId, Id, Params, Paginated } from '@feathersjs/feathers';
import { Low } from 'lowdb';
import type { Adapter } from 'lowdb';
import { TextFile, JSONFile } from 'lowdb/node';
export interface LowDBServiceStore<T> {
    [key: string]: T;
}
export interface LowDBServiceOptions<T = any> extends AdapterServiceOptions {
    filename?: string;
    store?: LowDBServiceStore<T>;
    startId?: number;
    matcher?: (query: any) => any;
    sorter?: (sort: any) => any;
    Model?: Adapter<Record<string, any>>;
    partition?: string;
    waitForDisk?: Boolean;
}
export declare class YAMLFile {
    adapter: TextFile;
    constructor(filename: string);
    read(): Promise<any>;
    write(obj: Record<string, any>): Promise<void>;
}
export declare function yaml<T = any>(options?: Partial<LowDBServiceOptions<T>>): YAMLFile;
export declare function json<T = any>(options?: Partial<LowDBServiceOptions<T>>): JSONFile<unknown>;
export declare class LowDBAdapter<Result = any, Data = Partial<Result>, ServiceParams extends Params = Params, PatchData = Partial<Data>> extends AdapterBase<Result, Data, PatchData, ServiceParams, LowDBServiceOptions<Result>> {
    store: Adapter<Record<string, any>>;
    _uId: number;
    filename: string;
    db: Low<Record<string, any>>;
    partition: string;
    data: Record<string, any>;
    waitForDisk: boolean;
    constructor(options?: LowDBServiceOptions<Result>);
    load(): Promise<void>;
    getEntries(_params?: ServiceParams): Promise<Result[]>;
    getQuery(params: ServiceParams): {
        query: {
            [key: string]: any;
        };
        filters: {
            $skip: any;
            $sort: any;
            $limit: any;
            $select: any;
        };
    };
    _find(_params?: ServiceParams & {
        paginate?: PaginationOptions;
    }): Promise<Paginated<Result>>;
    _find(_params?: ServiceParams & {
        paginate: false;
    }): Promise<Result[]>;
    _find(_params?: ServiceParams): Promise<Paginated<Result> | Result[]>;
    _get(id: Id, params?: ServiceParams): Promise<Result>;
    _create(data: Partial<Data>, params?: ServiceParams): Promise<Result>;
    _create(data: Partial<Data>[], params?: ServiceParams): Promise<Result[]>;
    _create(data: Partial<Data> | Partial<Data>[], _params?: ServiceParams): Promise<Result | Result[]>;
    _update(id: Id, data: Data, params?: ServiceParams): Promise<Result>;
    _patch(id: null, data: PatchData, params?: ServiceParams): Promise<Result[]>;
    _patch(id: Id, data: PatchData, params?: ServiceParams): Promise<Result>;
    _patch(id: NullableId, data: PatchData, _params?: ServiceParams): Promise<Result | Result[]>;
    _remove(id: null, params?: ServiceParams): Promise<Result[]>;
    _remove(id: Id, params?: ServiceParams): Promise<Result>;
    _remove(id: NullableId, _params?: ServiceParams): Promise<Result | Result[]>;
}
export declare class LowDBService<Result = any, Data = Partial<Result>, ServiceParams extends AdapterParams = AdapterParams, PatchData = Partial<Data>> extends LowDBAdapter<Result, Data, ServiceParams, PatchData> {
    find(params?: ServiceParams & {
        paginate?: PaginationOptions;
    }): Promise<Paginated<Result>>;
    find(params?: ServiceParams & {
        paginate: false;
    }): Promise<Result[]>;
    find(params?: ServiceParams): Promise<Paginated<Result> | Result[]>;
    get(id: Id, params?: ServiceParams): Promise<Result>;
    create(data: Data, params?: ServiceParams): Promise<Result>;
    create(data: Data[], params?: ServiceParams): Promise<Result[]>;
    update(id: Id, data: Data, params?: ServiceParams): Promise<Result>;
    patch(id: Id, data: PatchData, params?: ServiceParams): Promise<Result>;
    patch(id: null, data: PatchData, params?: ServiceParams): Promise<Result[]>;
    remove(id: Id, params?: ServiceParams): Promise<Result>;
    remove(id: null, params?: ServiceParams): Promise<Result[]>;
}
