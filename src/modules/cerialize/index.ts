// tslint:disable-next-line:ban-types
const TypeMap = new Map<any, { [k: string]: MetaData }>();

// type aliases for serialization functions
export type Serializer = (value: any) => any;
export type Deserializer = (value: any) => any;

export type Constructor<T> = new (...args: any[]) => T;
export type Type = Constructor<any> | null;

// todo instance.constructor.prototype.__proto__ === parent class, maybe use this?
// because types are stored in a JS Map keyed by constructor, serialization is not inherited by default
// keeping this seperate by default also allows sub classes to serialize differently than their parent
export function inheritSerialization<T>(parentType: Constructor<T>): any {
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

const storeInformation = (target: any, data: IMetaData) => {
  const metaDataList = TypeMap.get(target.constructor) || {};
  const metadata = new MetaData(data);
  metaDataList[data.key] = metadata;
  TypeMap.set(target.constructor, metaDataList);
};

// this combines @serialize and @deserialize as defined above
export function autoserialize(target: any, key: string): any {
  storeInformation(target, { key });
}

// serializes and deserializes a type using 1.) a custom key name, 2.) a custom type, or 3.) both custom key and type
export function autoserializeAs(type: Constructor<any>): any {
  if (!TypeMap.get(type) && type !== Date) {
    throw Error('type not found!!');
  }

  return (target: any, key: string) => {
    storeInformation(target, { key, type });
  };
}

// Supports serializing/deserializing of dictionary-like map objects, ie: { x: {}, y: {} }
export function autoserializeIndexable(type: Constructor<any>): any {
  if (!TypeMap.get(type) && type !== Date) {
    throw Error('type not found!!');
  }

  return (target: any, key: string) => {
    storeInformation(target, { key, type, indexable: true });
  };
}

interface IMetaData {
  key: string;
  type?: Type;
  indexable?: boolean;
}

// helper class to contain serialization meta data for a property, each property
// in a type tagged with a serialization annotation will contain an array of these
// objects each describing one property
class MetaData implements IMetaData {
  public key: string;    // the key name of the property this meta data describes
  public type: Type;
  public indexable: boolean;

  constructor(o: IMetaData) {
    this.indexable = o.indexable || false;
    this.type = o.type || null;
    this.key = o.key;
  }

  // clone a meta data instance, used for inheriting serialization properties
  public clone() {
    return new MetaData({
      key: this.key,
      type: this.type,
      indexable: this.indexable,
    });
  }
}

/**
 * Deserializes json into a `type`.
 *
 * @param json The JSON.
 * @param type The type.
 */
export function Deserialize(json: any, type?: Type, indexable = false): any {
  if (json === null) {
    throw Error('NULL');
  } else if (Array.isArray(json)) {
    return json.map((item) => Deserialize(item, type));
  } else if (indexable) {
    if (typeof json !== 'object' || !type) {
      throw Error('BAD');
    }

    const deserialized: { [k: string]: any } = {};
    Object.keys(json).forEach((key: string) => {
      deserialized[key] = deserializeObject(json[key], type);
    });

    return deserialized;
  } else if (type && typeof json === 'object') {
    return deserializeObject(json, type);
  } else if (typeof json === 'string' && type === Date.prototype.constructor) {
    return new Date(json);
  } else {
    return json;
  }
}


// deserialize a bit of json into an instance of `type`
function deserializeObject(json: any, type: Constructor<any>): any {
  const metadataArray = TypeMap.get(type);

  // if we dont have meta data, just decode the json and use that
  if (!metadataArray) {
    throw new Error('TypeMap does not contain type');
  }

  const instance = new type();

  // for each tagged property on the source type, try to deserialize it
  for (const metadata of Object.values(metadataArray)) {
    const key = metadata.key;
    if (!(key in json)) {
      throw Error(`${key} does not exist in JSON`);
    }

    const source = json[key];
    instance[key] = Deserialize(source, metadata.type, metadata.indexable);
  }

  return instance;
}

// take an instance of something and try to spit out json for it based on property annotaitons
function serializeTypedObject(instance: any, type?: Serializer | Constructor<any>): any {
  const json: { [k: string]: any } = {};
  const metadataArray = type ? TypeMap.get(type) : TypeMap.get(instance.constructor);
  if (!metadataArray) {
    throw Error('type not found in TypeMap');
  }

  for (const metadata of Object.values(metadataArray)) {
    if (!(metadata.key in instance)) {
      throw Error(`${metadata.key} does not exist.`);
    }

    json[metadata.key] = Serialize(instance[metadata.key]);
  }

  return json;
}

// take an instance of something and spit out some json
export function Serialize<T>(instance: T, type?: Constructor<T> | Serializer | null): any {
  if (instance === null) {
    throw Error('instance is null');
  } else if (Array.isArray(instance)) {
    return instance.map((item) => Serialize(item, type));
  } else if (instance instanceof Date) {
    return instance.toISOString();
  } else if (instance.constructor && TypeMap.has(instance.constructor)) {
    return serializeTypedObject(instance);
  } else if (type && TypeMap.has(type)) {
    return serializeTypedObject(instance, type);
  } else {
    return instance;
  }
}

// expose the type map
export { TypeMap as __TypeMap };
