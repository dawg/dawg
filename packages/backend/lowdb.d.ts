class Instance<T> {
  value(): T;
  assign(o: any): this;
  write(): void;
}

class Collection<T extends any[]> {
  value(): T;
  find(o: any): Instance<T[0] | null>;
  insert(o: T[0])
}

declare module 'lowdb' {
  class DB<T extends { [k: string]: any[] }> {
    defaults(defaults: T): this;
    get<K extends keyof T>(key: K): Collection<T[K]>;
    write(): void;
  }
  

  function low<T>(adapter: any): DB<T>;

  export = low
}
declare module 'lowdb/adapters/FileSync';