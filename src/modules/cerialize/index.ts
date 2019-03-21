// tslint:disable-next-line:ban-types
const TypeMap = new Map<any, { [k: string]: MetaData }>();

// type aliases for serialization functions
export type Serializer = (value: any) => any;
export type Deserializer = (value: any) => any;

export type Constructor<T> = new (...args: any[]) => T;
export type Type = Constructor<any>;
interface AnyObject { [k: string]: any; }

// todo instance.constructor.prototype.__proto__ === parent class, maybe use this?
// because types are stored in a JS Map keyed by constructor, serialization is not inherited by default
// keeping this seperate by default also allows sub classes to serialize differently than their parent
// tslint:disable-next-line:ban-types
export function inherit<T>(parentType: Function & { prototype: T }): any {
  return (childType: any) => {
    const parentMetaData = TypeMap.get(parentType) || {};
    const childMetaData = TypeMap.get(childType) || {};
    for (const item of Object.values(parentMetaData)) {
      const key = item.key;
      if (!(key in childMetaData)) {
        childMetaData[key] = item.clone();
      }
    }
    TypeMap.set(childType, childMetaData);
  };
}

const storeInformation = (target: Constructor<any>, data: IMetaData) => {
  const metaDataList = TypeMap.get(target.constructor) || {};
  const metadata = new MetaData(data);
  metaDataList[data.key] = metadata;
  TypeMap.set(target.constructor, metaDataList);
};

export interface Target {
  name: string;
  new (...args: any[]): any;
}

export interface Options {
  type?: Constructor<any>;
  nullable?: boolean;
  optional?: boolean;
  types?: Array<Constructor<any>>;
}

export function attr(attribute: string): any {
  return (target: any, key: string) => {
    storeInformation(target, { key, attribute });
  };
}

export function auto(target: any, key: string): void;
export function auto(options: Options): (target: any, key: string) => void;

// this combines @serialize and @deserialize as defined above
export function auto(targetOrOptions: Constructor<any> | Options, maybeKey?: string): any {
  if (maybeKey) {
    // Key will always be defined. See above function declarations.
    storeInformation(targetOrOptions as any, { key: maybeKey! });
  } else {
    const options = targetOrOptions as Options;
    return (target: Constructor<any>, key: string) => {
      let types = options.type ? [options.type] : undefined;
      if (options.types) {
        if (!types) {
          types = options.types;
        } else {
          types = [...types, ...options.types];
        }
      }

      storeInformation(target, {
        key,
        types,
        nullable: options.nullable,
        optional: options.optional,
      });
    };
  }
}

// serializes and deserializes a type using 1.) a custom key name, 2.) a custom type, or 3.) both custom key and type
export function autoserializeAs(type: Constructor<any>): any {
  return (target: any, key: string) => {
    if (!TypeMap.get(type)) {
      throw Error(`type not found!! ${type}`);
    }

    storeInformation(target, { key, types: [type] });
  };
}

// Supports serializing/deserializing of dictionary-like map objects, ie: { x: {}, y: {} }
export function autoserializeIndexable(type: Constructor<any>): any {
  if (!TypeMap.get(type)) {
    throw Error(`not found ${type.name}`);
  }

  return (target: any, key: string) => {
    storeInformation(target, { key, types: [type], indexable: true });
  };
}

export function union(type: Constructor<any>, ...types: Array<Constructor<any>>): any {
  if (!TypeMap.get(type)) {
    throw Error(`not found ${type.name}`);
  }

  return (target: any, key: string) => {
    const metaDataList = TypeMap.get(target.constructor) || {};
    const metadata = new MetaData({ key, types: [type, ...types] });
    metaDataList[key] = metadata;
    TypeMap.set(target.constructor, metaDataList);
  };
}

interface IMetaData {
  key: string;
  types?: Type[];
  indexable?: boolean;
  nullable?: boolean;
  optional?: boolean;
  attribute?: string;
}

// helper class to contain serialization meta data for a property, each property
// in a type tagged with a serialization annotation will contain an array of these
// objects each describing one property
class MetaData {
  /**
   * The key name of the property this meta data describes
   */
  public key: string;
  public types: Type[];
  public indexable: boolean;
  public nullable: boolean;
  public optional: boolean;
  public attribute?: string;

  constructor(o: IMetaData) {
    this.indexable = o.indexable || false;
    this.types = o.types || [];
    this.key = o.key;
    this.optional = o.optional || false;
    this.nullable = o.nullable || false;
    this.attribute = o.attribute;
  }

  // clone a meta data instance, used for inheriting serialization properties
  public clone() {
    return new MetaData({
      key: this.key,
      types: this.types,
      indexable: this.indexable,
      nullable: this.nullable,
    });
  }
}

export const is = (o: any, type: Constructor<any>) => {
  if (!o) {
    return false;
  }

  const metadataArray = TypeMap.get(type);
  if (!metadataArray) {
    throw Error(`TypeMap does not contain type ${type}`);
  }

  for (const metadata of Object.values(metadataArray)) {
    // TODO Check Types!
    if (!o.hasOwnProperty(metadata.key)) {
      return false;
    }
  }

  return true;
};

// deserialize a bit of json into an instance of `type`
function deserializeObject(json: any, types: Array<Constructor<any>>): any {
  let theType: Type | undefined;
  if (types.length === 1) {
    theType = types[0];
  } else if (types.length > 1) { // union check
    for (const maybe of types) {
      if (is(json, maybe)) {
        theType = maybe;
        break;
      }
    }
  }

  if (!theType) {
    throw Error(`Unable to determine suitable type out of ${types.length} types.`);
  }

  const metadataArray = TypeMap.get(theType);

  // if we dont have meta data, just decode the json and use that
  if (!metadataArray) {
    throw new Error(`TypeMap does not contain type ${theType}`);
  }

  const instance = new theType();

  // for each tagged property on the source type, try to deserialize it
  for (const metadata of Object.values(metadataArray)) {
    const key = metadata.key;
    const source = json[key];
    if (source === undefined) {
      if (metadata.optional) {
        continue;
      } else {
        throw Error(`${key} does not exist`);
      }
    }

    if (metadata.attribute) {
      instance[key][metadata.attribute] = source;
      continue;
    }

    try {
      instance[key] = Deserialize(source, metadata);
    } catch (e) {
      throw Error(`${key} -> ${e.message}`);
    }
  }

  return instance;
}

const apply = (o: AnyObject, func: (value: any) => any) => {
  if (typeof o !== 'object') {
    throw Error('BAD');
  }
  const deserialized: { [k: string]: any } = {};
  Object.keys(o).forEach((key: string) => {
    deserialized[key] = func(o[key]);
  });

  return deserialized;
};

// take an instance of something and try to spit out json for it based on property annotaitons
function serializedObject(instance: any, type?: Serializer | Constructor<any>): any {
  const json: { [k: string]: any } = {};
  const metadataArray = type ? TypeMap.get(type) : TypeMap.get(instance.constructor);
  if (!metadataArray) {
    throw Error('type not found in TypeMap');
  }

  for (const metadata of Object.values(metadataArray)) {
    if (!(metadata.key in instance)) {
      throw Error(`${metadata.key} does not exist.`);
    }

    json[metadata.key] = Serialize(instance[metadata.key], undefined, metadata);
  }

  return json;
}

/**
 * Deserializes json into a `type`.
 *
 * @param json The JSON.
 * @param type The type.
 */
export function Deserialize(json: any, meta: MetaData): any {
  const { indexable, nullable, types } = meta;

  if (json === null) {
    if (nullable) {
      return json;
    } else {
      throw Error('is null');
    }
  } else if (Array.isArray(json)) {
    return json.map((item) => Deserialize(item, meta));
  } else if (indexable) {
    return apply(json, (value) => deserializeObject(value, types));
  } else if (typeof json === 'object') {
    return deserializeObject(json, types);
  } else {
    return json;
  }
}

// TODO Remove any type here
/**
 * Take an instance of something and spit out some json.
 *
 * @param instance
 * @param type
 * @param indexable
 */
export function Serialize(instance: any, type?: Constructor<any> | Serializer | null, meta?: MetaData): any {
  const { indexable = false, nullable = false, attribute = null } = meta || {};

  if (instance === null) {
    if (nullable) {
      return instance;
    } else {
      throw Error('instance is null');
    }
  } else if (Array.isArray(instance)) {
    return instance.map((item) => Serialize(item, type));
  } else if (indexable) {
    return apply(instance, serializedObject);
  } else if (instance.constructor && TypeMap.has(instance.constructor)) {
    return serializedObject(instance);
  } else if (type && TypeMap.has(type)) {
    return serializedObject(instance, type);
  } else if (attribute !== null) {
    return instance[attribute];
  } else {
    return instance;
  }
}

export const deserialize = <T>(o: any, c: Constructor<T>): T => {
  const meta = new MetaData({ types: [c], key: '' });
  return Deserialize(o, meta);
};

export const serialize = <T>(o: T, c: Constructor<T>): any => {
  return Serialize(o, c);
};

// expose the type map
export { TypeMap as __TypeMap };
