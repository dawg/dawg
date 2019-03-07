type Optional<T> = { [k in keyof T]?: T[k] };

declare module 'lowdb' {
  class Instance<T> {
    value(): T;
    assign(o: any): this;
    write(): void;
  }
  
  class Collection<T extends any[]> {
    value(): T;
    find(o: Optional<T[0]>): Instance<T[0] | null>;
    push(o: T[0]): this;
    remove(o: Optional<T[0]>): this;
    write(): void;
  }

  export class DB<T extends { [k: string]: any[] }> {
    defaults(defaults: T): this;
    get<K extends keyof T>(key: K): Collection<T[K]>;
    write(): void;
  }
  

  function low<T extends { [k: string]: any[] }>(adapter: any): DB<T>;

  export default low
}
declare module 'lowdb/adapters/FileSync';
declare module 'lowdb/adapters/Memory';