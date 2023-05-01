// TypeScript Version: 3.7
import { Params, Paginated, Id, NullableId } from '@feathersjs/feathers';
import {
  AdapterService,
  ServiceOptions,
  InternalServiceMethods,
} from '@feathersjs/adapter-commons';

import { lowdb as LowDb } from 'lowdb';

export interface LowdbServiceOptions extends ServiceOptions {
  Model: LowDb;
}

export class Service<T = any> extends AdapterService<T>
  implements InternalServiceMethods<T> {
  options: LowdbServiceOptions;

  constructor(config?: Partial<LowdbServiceOptions>);
  getModel(params: Params): LowDb;

  _find(params?: Params): Promise<T | T[] | Paginated<T>>;
  _get(id: Id, params?: Params): Promise<T>;
  _create(
    data: Partial<T> | Array<Partial<T>>,
    params?: Params,
  ): Promise<T | T[]>;
  _update(id: NullableId, data: T, params?: Params): Promise<T>;
  _patch(id: NullableId, data: Partial<T>, params?: Params): Promise<T>;
  _remove(id: NullableId, params?: Params): Promise<T>;
}

declare const lowdb: (config?: Partial<LowdbServiceOptions>) => Service;
export default lowdb;
