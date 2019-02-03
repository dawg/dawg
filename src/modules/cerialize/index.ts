// tslint:disable-next-line:ban-types
const TypeMap = new Map<any, { [k: string]: MetaData }>();

// type aliases for serialization functions
export type Serializer = (value: any) => any;
export type Deserializer = (value: any) => any;

type Func = () => void;
export type Constructor<T> = new (...args: any[]) => T;
export type Type = Func | Constructor<any> | null;

export interface ISerializable {
  Serialize?: (value: any) => any;
  Deserialize?: (json: any, instance?: any) => any;
}

function serializeString(value: any): string | string[] {
  return value && value.toString() || null;
}

function serializeNumber(value: any): number | number[] {
  return parseInt(value, 10);
}

function getSerializeFnForType(type: any): Serializer {
  if (type === String) {
    return serializeString;
  } else if (type === Number) {
    return serializeNumber;
  } else if (type === Boolean) {
    return type;
  } else {
    return type;
  }
}

// todo instance.constructor.prototype.__proto__ === parent class, maybe use this?
// because types are stored in a JS Map keyed by constructor, serialization is not inherited by default
// keeping this seperate by default also allows sub classes to serialize differently than their parent
export function inheritSerialization<T>(parentType: Constructor<T>): any {
  return (childType: Func) => {
    const parentMetaData = TypeMap.get(parentType) || {};
    const childMetaData = TypeMap.get(childType) || {};
    for (const item of Object.values(parentMetaData)) {
      const keyName = item.keyName;
      if (!(keyName in childMetaData)) {
        childMetaData[keyName] = MetaData.clone(item);
      }
    }
    TypeMap.set(childType, childMetaData);
  };
}

// this combines @serialize and @deserialize as defined above
export function autoserialize(target: any, keyName: string): any {
  if (!target || !keyName) { return; }
  const metaDataList = TypeMap.get(target.constructor) || {};
  const metadata = new MetaData({ keyName });

  // TODO Check if exists?
  metaDataList[keyName] = metadata;

  TypeMap.set(target.constructor, metaDataList);
}

// serializes and deserializes a type using 1.) a custom key name, 2.) a custom type, or 3.) both custom key and type
export function autoserializeAs(type: Func | Constructor<any>): any {
  return (target: any, keyName: string) => {
    if (!target || !keyName) { return; }
    const metaDataList = TypeMap.get(target.constructor) || {};
    const metadata = new MetaData({ keyName });

    // TODO Check if exists?
    metaDataList[keyName] = metadata;

    metadata.deserializedType = type;
    metadata.serializedType = getSerializeFnForType(type);

    if (!TypeMap.get(type) && type !== Date) {
      throw Error('type not found!!');
    }
    TypeMap.set(target.constructor, metaDataList);
  };
}

// Supports serializing/deserializing of dictionary-like map objects, ie: { x: {}, y: {} }
export function autoserializeIndexable(type: Func | Constructor<any>): any {
  if (!type) { return; }
  return (target: any, keyName: string) => {
    if (!target || !keyName) { return; }
    const metaDataList = TypeMap.get(target.constructor) || {};
    const metadata = new MetaData({ keyName, type });

    // TODO Check if exists?
    metaDataList[keyName] = metadata;

    metadata.deserializedType = type;
    metadata.serializedType = getSerializeFnForType(type);
    metadata.indexable = true;
    if (!TypeMap.get(type) && type !== Date) {
      throw Error('UNKOWN TYPE');
    }
    TypeMap.set(target.constructor, metaDataList);
  };
}

// helper class to contain serialization meta data for a property, each property
// in a type tagged with a serialization annotation will contain an array of these
// objects each describing one property
class MetaData {

  // checks for a key name in a meta data array
  public static hasKeyName(metadataArray: MetaData[], key: string): boolean {
    return metadataArray.some((item) => item.keyName === key);
  }

  // clone a meta data instance, used for inheriting serialization properties
  public static clone(data: MetaData): MetaData {
    const metadata = new MetaData({ keyName: data.keyName });
    metadata.serializedType = data.serializedType;
    metadata.deserializedType = data.deserializedType;
    metadata.indexable = data.indexable;
    return metadata;
  }

  public keyName: string;    // the key name of the property this meta data describes

  // TODO(jacob) COnsilidate and remove !!!
  public serializedKey!: string; // the target keyname for serializing
  public deserializedKey!: string;  // the target keyname for deserializing

  // the type or function to use when serializing this property
  public serializedType: Serializer | Constructor<any> | null;

  // the type or function to use when deserializing this property
  public deserializedType: Serializer | Constructor<any> | null;
  public indexable: boolean;

  constructor(o: { keyName: string, type?: Type, indexable?: boolean }) {
    this.indexable = o.indexable || false;

    this.serializedType = o.type || null;
    this.deserializedType = this.serializedType;

    this.keyName = o.keyName;
    this.serializedKey = o.keyName;
    this.deserializedKey = o.keyName;
  }
}

/**
 * Deserializes json into a `type`.
 *
 * @param json The JSON.
 * @param type The type.
 */
export function Deserialize(json: any, type?: Serializer | Constructor<any> | null): any {
  if (json === null) {
    throw Error('NULL');
  } else if (Array.isArray(json)) {
    return json.map((item) => Deserialize(item, type));
  } else if (type && typeof json === 'object') {
    return deserializeObject(json, type);
  } else if (typeof json === 'string' && type === Date.prototype.constructor) {
    return new Date(json);
  } else {
    return json;
  }
}


// deserialize a bit of json into an instance of `type`
function deserializeObject(json: any, type: Serializer | Constructor<any> | null): any {
  const metadataArray = TypeMap.get(type);

  // if we dont have meta data, just decode the json and use that
  if (!metadataArray) {
    throw new Error('NOOO');
  }

  // TODO What the heck?
  const instance = new (type as any)();

  // for each tagged property on the source type, try to deserialize it
  for (const metadata of Object.values(metadataArray)) {
    const serializedKey = metadata.deserializedKey;
    const source = json[serializedKey];

    const keyName = metadata.keyName;

    if (source === undefined) {
      throw Error(`${serializedKey} is undefined`);
    }


    if (metadata.indexable) {
      if (typeof source !== 'object') {
        throw Error('BAD');
      }

      const deserialized: { [k: string]: any } = {};
      Object.keys(source).forEach((key: string) => {
        deserialized[key] = deserializeObject(source[key], type);
      });

      instance[keyName] = deserialized;
      return;
    }

    instance[keyName] = Deserialize(source, metadata.deserializedType);
  }

  return instance;
}

// take an instance of something and try to spit out json for it based on property annotaitons
function serializeTypedObject(instance: any, type?: Serializer | Constructor<any>): any {

  const json: { [k: string]: any } = {};
  const metadataArray = type ? TypeMap.get(type) : TypeMap.get(instance.constructor);


  if (!metadataArray) {
    throw Error('slkdfjk');
  }

  for (const metadata of Object.values(metadataArray)) {
    if (!metadata.serializedKey) { continue; }

    const serializedKey = metadata.serializedKey;
    const source = instance[metadata.keyName];

    if (source === undefined) {
      throw Error(`${metadata.keyName} does not exist.`);
    }

    if (Array.isArray(source)) {
      json[serializedKey] = source.map((item) => Serialize(item, metadata.serializedType));
    } else {
      json[serializedKey] = Serialize(source);
    }
  }

  return json;
}

// take an instance of something and spit out some json
export function Serialize<T>(instance: T, type?: Constructor<T> | Serializer | null): any {
  if (Array.isArray(instance)) {
    return instance.map((item) => Serialize(item, type));
  }

  if (instance instanceof Date) {
    return instance.toISOString();
  }

  if (instance.constructor && TypeMap.has(instance.constructor)) {
    return serializeTypedObject(instance);
  }

  if (type && TypeMap.has(type)) {
    return serializeTypedObject(instance, type);
  }

  // if (typeof type === 'function') {
  //   return type(instance);
  // }

  return instance;
}

// expose the type map
export { TypeMap as __TypeMap };
