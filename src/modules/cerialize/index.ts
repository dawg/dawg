// this library can be used in Node or a browser, make sure our global object points to the right place
declare var global: any;
let win: any = null;
try {
  win = window;
} catch (e) {
  win = global;
}
// some other modules might want access to the serialization meta data, expose it here
const TypeMap = win.__CerializeTypeMap = new (win as any).Map();

// type aliases for serialization functions
export type Serializer = (value: any) => any;
export type Deserializer = (value: any) => any;

export type INewable<T> = new (...args: any[]) => T;

export interface IEnum {
  [enumeration: string]: any;
}

export interface ISerializable {
  Serialize?: (value: any) => any;
  Deserialize?: (json: any, instance?: any) => any;
}

// convert strings like my_camel_string to myCamelString
export function CamelCase(str: string): string {
  const STRING_CAMELIZE_REGEXP = (/(\-|_|\.|\s)+(.)?/g);
  return str.replace(STRING_CAMELIZE_REGEXP, (match, separator, chr) => {
    return chr ? chr.toUpperCase() : '';
  }).replace(/^([A-Z])/, (match, separator, chr) => {
    return match.toLowerCase();
  });
}

// convert strings like MyCamelString to my_camel_string
export function SnakeCase(str: string): string {
  const STRING_DECAMELIZE_REGEXP = (/([a-z\d])([A-Z])/g);
  return str.replace(STRING_DECAMELIZE_REGEXP, '$1_$2').toLowerCase();
}

// convert strings like myCamelCase to my_camel_case
export function UnderscoreCase(str: string): string {
  const STRING_UNDERSCORE_REGEXP_1 = (/([a-z\d])([A-Z]+)/g);
  const STRING_UNDERSCORE_REGEXP_2 = (/\-|\s+/g);
  return str.replace(STRING_UNDERSCORE_REGEXP_1, '$1_$2').replace(STRING_UNDERSCORE_REGEXP_2, '_').toLowerCase();
}

// convert strings like my_camelCase to my-camel-case
export function DashCase(str: string): string {
  const STRING_DASHERIZE_REGEXP = (/([a-z\d])([A-Z])/g);
  str = str.replace(/_/g, '-');
  return str.replace(STRING_DASHERIZE_REGEXP, '$1-$2').toLowerCase();
}

function deserializeString(value: any): string | string[] {
  if (Array.isArray(value)) {
    return value.map((element: any) => {
      return element && element.toString() || null;
    });
  } else {
    return value && value.toString() || null;
  }
}

function deserializeNumber(value: any): number | number[] {
  if (Array.isArray(value)) {
    return value.map((element: any) => {
      return parseFloat(element);
    });
  } else {
    return parseFloat(value);
  }
}

function deserializeBoolean(value: any): boolean | boolean[] {
  if (Array.isArray(value)) {
    return value.map((element: any) => {
      return Boolean(element);
    });
  } else {
    return Boolean(value);
  }
}

function serializeString(value: any): string | string[] {
  if (Array.isArray(value)) {
    return value.map((element: any) => {
      return element && element.toString() || null;
    });
  } else {
    return value && value.toString() || null;
  }
}

function serializeNumber(value: any): number | number[] {
  if (Array.isArray(value)) {
    return value.map((element: any) => {
      return parseInt(element);
    });
  } else {
    return parseInt(value);
  }
}

function serializeBoolean(value: any): boolean | boolean[] {
  if (Array.isArray(value)) {
    return value.map((element: any) => {
      return Boolean(element);
    });
  } else {
    return Boolean(value);
  }
}

function getDeserializeFnForType(type: any): Deserializer {
  if (type === String) {
    return deserializeString;
  } else if (type === Number) {
    return deserializeNumber;
  } else if (type === Boolean) {
    return deserializeBoolean;
  } else {
    return type;
  }
}

function getSerializeFnForType(type: any): Serializer {
  if (type === String) {
    return serializeString;
  } else if (type === Number) {
    return serializeNumber;
  } else if (type === Boolean) {
    return serializeBoolean;
  } else {
    return type;
  }
}

// gets meta data for a key name, creating a new meta data instance
// if the input array doesn't already define one for the given keyName
function getMetaData(array: MetaData[], keyName: string): MetaData {
  for (let i = 0; i < array.length; i++) {
    if (array[i].keyName === keyName) {
      return array[i];
    }
  }
  array.push(new MetaData(keyName));
  return array[array.length - 1];
}

// helper for grabbing the type and keyname from a multi-type input variable
function getTypeAndKeyName(keyNameOrType: string | Function | ISerializable, keyName?: string) {
  let type: Function | null = null;
  let key: string | null = null;
  if (typeof keyNameOrType === 'string') {
    key = keyNameOrType as string;

  } else if (keyNameOrType && typeof keyNameOrType === 'function' || typeof keyNameOrType === 'object') {
    type = keyNameOrType as Function;
    key = keyName || null;
  }
  return {
    key,
    type,
  };
}

// todo instance.constructor.prototype.__proto__ === parent class, maybe use this?
// because types are stored in a JS Map keyed by constructor, serialization is not inherited by default
// keeping this seperate by default also allows sub classes to serialize differently than their parent
export function inheritSerialization(parentType: Function): any {
  return (childType: Function) => {
    const parentMetaData: MetaData[] = TypeMap.get(parentType) || [];
    const childMetaData: MetaData[] = TypeMap.get(childType) || [];
    for (let i = 0; i < parentMetaData.length; i++) {
      const keyName = parentMetaData[i].keyName;
      if (!MetaData.hasKeyName(childMetaData, keyName)) {
        childMetaData.push(MetaData.clone(parentMetaData[i]));
      }
    }
    TypeMap.set(childType, childMetaData);
  };
}

// an untyped serialization property annotation, gets existing meta data for the target or creates
// a new one and assigns the serialization key for that type in the meta data
export function serialize(target: any, keyName: string): any {
  if (!target || !keyName) { return; }
  const metaDataList: MetaData[] = TypeMap.get(target.constructor) || [];
  const metadata = getMetaData(metaDataList, keyName);
  metadata.serializedKey = keyName;
  TypeMap.set(target.constructor, metaDataList);
}

// an untyped deserialization property annotation, gets existing meta data for the target or creates
// a new one and assigns the deserialization key for that type in the meta data
export function deserialize(target: any, keyName: string): any {
  if (!target || !keyName) { return; }
  const metaDataList: MetaData[] = TypeMap.get(target.constructor) || [];
  const metadata = getMetaData(metaDataList, keyName);
  metadata.deserializedKey = keyName;
  TypeMap.set(target.constructor, metaDataList);
}

// this combines @serialize and @deserialize as defined above
export function autoserialize(target: any, keyName: string): any {
  if (!target || !keyName) { return; }
  const metaDataList: MetaData[] = TypeMap.get(target.constructor) || [];
  const metadata = getMetaData(metaDataList, keyName);
  metadata.serializedKey = keyName;
  metadata.deserializedKey = keyName;
  TypeMap.set(target.constructor, metaDataList);
}

// We dont actually need the type to serialize but I like the consistency with deserializeAs which definitely does
// serializes a type using 1.) a custom key name, 2.) a custom type, or 3.) both custom key and type
export function serializeAs(keyNameOrType: string | Serializer | INewable<any> | ISerializable | IEnum, keyName?: string): any {
  if (!keyNameOrType) { return; }
  const { key, type } = getTypeAndKeyName(keyNameOrType, keyName);
  return (target: any, actualKeyName: string) => {
    if (!target || !actualKeyName) { return; }
    const metaDataList: MetaData[] = TypeMap.get(target.constructor) || [];
    const metadata = getMetaData(metaDataList, actualKeyName);
    metadata.serializedKey = (key) ? key : actualKeyName;
    metadata.serializedType = type;
    // this allows the type to be a stand alone function instead of a class
    if (type !== Date && type !== RegExp && !TypeMap.get(type) && typeof type === 'function') {
      metadata.serializedType = {
        Serialize: getSerializeFnForType(type),
      } as ISerializable;
    }
    TypeMap.set(target.constructor, metaDataList);
  };
}

// Supports serializing of dictionary-like map objects, ie: { x: {}, y: {} }
export function serializeIndexable(type: Serializer | INewable<any> | ISerializable, keyName?: string): any {
  if (!type) { return; }
  return (target: any, actualKeyName: string) => {
    if (!target || !actualKeyName) { return; }
    const metaDataList: MetaData[] = TypeMap.get(target.constructor) || [];
    const metadata = getMetaData(metaDataList, actualKeyName);
    metadata.serializedKey = (keyName) ? keyName : actualKeyName;
    metadata.serializedType = type;
    metadata.indexable = true;
    // this allows the type to be a stand alone function instead of a class
    if (type !== Date && type !== RegExp && !TypeMap.get(type) && typeof type === 'function') {
      metadata.serializedType = {
        Serialize: getSerializeFnForType(type),
      } as ISerializable;
    }
    TypeMap.set(target.constructor, metaDataList);
  };
}

// deserializes a type using 1.) a custom key name, 2.) a custom type, or 3.) both custom key and type
export function deserializeAs(keyNameOrType: string | Function | INewable<any> | ISerializable | IEnum, keyName?: string): any {
  if (!keyNameOrType) { return; }
  const { key, type } = getTypeAndKeyName(keyNameOrType, keyName);
  return (target: any, actualKeyName: string) => {
    if (!target || !actualKeyName) { return; }
    const metaDataList: MetaData[] = TypeMap.get(target.constructor) || [];
    const metadata = getMetaData(metaDataList, actualKeyName);
    metadata.deserializedKey = (key) ? key : actualKeyName;
    metadata.deserializedType = type;
    // this allows the type to be a stand alone function instead of a class
    // todo maybe add an explicit date and regexp deserialization function here
    if (!TypeMap.get(type) && type !== Date && type !== RegExp && typeof type === 'function') {
      metadata.deserializedType = {
        Deserialize: getDeserializeFnForType(type),
      } as ISerializable;
    }
    TypeMap.set(target.constructor, metaDataList);
  };
}

// Supports deserializing of dictionary-like map objects, ie: { x: {}, y: {} }
export function deserializeIndexable(type: Function | INewable<any> | ISerializable, keyName?: string): any {
  if (!type) { return; }
  const key = keyName;
  return (target: any, actualKeyName: string) => {
    if (!target || !actualKeyName) { return; }
    const metaDataList: MetaData[] = TypeMap.get(target.constructor) || [];
    const metadata = getMetaData(metaDataList, actualKeyName);
    metadata.deserializedKey = (key) ? key : actualKeyName;
    metadata.deserializedType = type;
    metadata.indexable = true;
    if (!TypeMap.get(type) && type !== Date && type !== RegExp && typeof type === 'function') {
      metadata.deserializedType = {
        Deserialize: getDeserializeFnForType(type),
      } as ISerializable;
    }
    TypeMap.set(target.constructor, metaDataList);
  };
}

// serializes and deserializes a type using 1.) a custom key name, 2.) a custom type, or 3.) both custom key and type
export function autoserializeAs(keyNameOrType: string | Function | INewable<any> | ISerializable | IEnum, keyName?: string): any {
  if (!keyNameOrType) { return; }
  const { key, type } = getTypeAndKeyName(keyNameOrType, keyName);
  return (target: any, actualKeyName: string) => {
    if (!target || !actualKeyName) { return; }
    const metaDataList: MetaData[] = TypeMap.get(target.constructor) || [];
    const metadata = getMetaData(metaDataList, actualKeyName);
    const serialKey = (key) ? key : actualKeyName;
    metadata.deserializedKey = serialKey;
    metadata.deserializedType = type;
    metadata.serializedKey = serialKey;
    metadata.serializedType = getSerializeFnForType(type);
    if (!TypeMap.get(type) && type !== Date && type !== RegExp && typeof type === 'function') {
      metadata.deserializedType = {
        Deserialize: getDeserializeFnForType(type),
      } as ISerializable;
    }
    TypeMap.set(target.constructor, metaDataList);
  };
}

// Supports serializing/deserializing of dictionary-like map objects, ie: { x: {}, y: {} }
export function autoserializeIndexable(type: Function | INewable<any> | ISerializable, keyName?: string): any {
  if (!type) { return; }
  const key = keyName;
  return (target: any, actualKeyName: string) => {
    if (!target || !actualKeyName) { return; }
    const metaDataList: MetaData[] = TypeMap.get(target.constructor) || [];
    const metadata = getMetaData(metaDataList, actualKeyName);
    const serialKey = (key) ? key : actualKeyName;
    metadata.deserializedKey = serialKey;
    metadata.deserializedType = type;
    metadata.serializedKey = serialKey;
    metadata.serializedType = getSerializeFnForType(type);
    metadata.indexable = true;
    if (!TypeMap.get(type) && type !== Date && type !== RegExp && typeof type === 'function') {
      metadata.deserializedType = {
        Deserialize: getDeserializeFnForType(type),
      } as ISerializable;
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
    for (let i = 0; i < metadataArray.length; i++) {
      if (metadataArray[i].keyName === key) { return true; }
    }
    return false;
  }

  // clone a meta data instance, used for inheriting serialization properties
  public static clone(data: MetaData): MetaData {
    const metadata = new MetaData(data.keyName);
    metadata.deserializedKey = data.deserializedKey;
    metadata.serializedKey = data.serializedKey;
    metadata.serializedType = data.serializedType;
    metadata.deserializedType = data.deserializedType;
    metadata.indexable = data.indexable;
    return metadata;
  }

  public keyName: string;    // the key name of the property this meta data describes
  public serializedKey: string | null; // the target keyname for serializing
  public deserializedKey: string | null;    // the target keyname for deserializing

  // the type or function to use when serializing this property
  public serializedType: Function | INewable<any> | ISerializable | null;

  // the type or function to use when deserializing this property
  public deserializedType: Function | INewable<any> | ISerializable | null;
  public indexable: boolean;

  constructor(keyName: string) {
    this.keyName = keyName;
    this.serializedKey = null;
    this.deserializedKey = null;
    this.deserializedType = null;
    this.serializedType = null;
    this.indexable = false;
  }
}

// merges two primitive objects recursively, overwriting or defining properties on
// `instance` as they defined in `json`. Works on objects, arrays and primitives
function mergePrimitiveObjects(instance: any, json: any): any {
  if (!json) { return instance; } // if we dont have a json value, just use what the instance defines already
  if (!instance) { return json; } // if we dont have an instance value, just use the json

  // for each key in the input json we need to do a merge into the instance object
  Object.keys(json).forEach((key: string) => {
    let transformedKey: string = key;
    if (typeof deserializeKeyTransform === 'function') {
      transformedKey = deserializeKeyTransform(key);
    }
    const jsonValue: any = json[key];
    let instanceValue: any = instance[key];
    if (Array.isArray(jsonValue)) {
      // in the array case we reuse the items that exist already where possible
      // so reset the instance array length (or make it an array if it isnt)
      // then call mergePrimitiveObjects recursively
      instanceValue = Array.isArray(instanceValue) ? instanceValue : [];
      instanceValue.length = jsonValue.length;
      for (let i = 0; i < instanceValue.length; i++) {
        instanceValue[i] = mergePrimitiveObjects(instanceValue[i], jsonValue[i]);
      }
    } else if (jsonValue && typeof jsonValue === 'object') {
      if (!instanceValue || typeof instanceValue !== 'object') {
        instanceValue = {};
      }
      instanceValue = mergePrimitiveObjects(instanceValue, jsonValue);
    } else {
      // primitive case, just use straight assignment
      instanceValue = jsonValue;
    }
    instance[transformedKey] = instanceValue;
  });
  return instance;
}

// takes an array defined in json and deserializes it into an array that ist stuffed with instances of `type`.
// any instances already defined in `arrayInstance` will be re-used where possible to maintain referential integrity.
function deserializeArrayInto(source: any[], type: Function | INewable<any> | ISerializable, arrayInstance: any): any[] {
  if (!Array.isArray(arrayInstance)) {
    arrayInstance = new Array<any>(source.length);
  }
  // extend or truncate the target array to match the source array
  arrayInstance.length = source.length;

  for (let i = 0; i < source.length; i++) {
    arrayInstance[i] = DeserializeInto(source[i], type, arrayInstance[i] || new (type as any)());
  }

  return arrayInstance;
}

// takes an object defined in json and deserializes it into a `type` instance or populates / overwrites
// properties on `instance` if it is provided.
function deserializeObjectInto(json: any, type: Function | INewable<any> | ISerializable | null, instance: any): any {
  const metadataArray: MetaData[] = TypeMap.get(type);
  // if we dont have an instance we need to create a new `type`
  if (instance === null || instance === void 0) {
    if (type) {
      instance = new (type as any)();
    }
  }

  // if we dont have any meta data and we dont have a type to inflate, just merge the objects
  if (instance && !type && !metadataArray) {
    return mergePrimitiveObjects(instance, json);
  }

  // if we dont have meta data just bail out and keep what we have
  if (!metadataArray) {
    invokeDeserializeHook(instance, json, type);
    return instance;
  }

  // for each property in meta data, try to hydrate that property with its corresponding json value
  for (let i = 0; i < metadataArray.length; i++) {
    const metadata = metadataArray[i];
    // these are not the droids we're looking for (to deserialize), moving along
    if (!metadata.deserializedKey) { continue; }

    let serializedKey = metadata.deserializedKey;

    if (metadata.deserializedKey === metadata.keyName) {
      if (typeof deserializeKeyTransform === 'function') {
        serializedKey = deserializeKeyTransform(metadata.keyName);
      }
    }

    const source = json[serializedKey];

    if (source === void 0) { continue; }

    const keyName = metadata.keyName;

    // if there is a custom deserialize function, use that
    if (metadata.deserializedType && typeof (metadata.deserializedType as any).Deserialize === 'function') {
      instance[keyName] = (metadata.deserializedType as any).Deserialize(source);
    } else if (Array.isArray(source)) {
      if (metadata.deserializedType) {
        instance[keyName] = deserializeArrayInto(source, metadata.deserializedType, instance[keyName]);
      } else {
        instance[keyName] = deserializeArray(source, null);
      }
    } else if ((typeof source === 'string' || source instanceof Date) && metadata.deserializedType === Date.prototype.constructor) {
      const deserializedDate = new Date(source);
      if (instance[keyName] instanceof Date) {
        instance[keyName].setTime(deserializedDate.getTime());
      } else {
        instance[keyName] = deserializedDate;
      }
    } else if (typeof source === 'string' && type === RegExp) {
      instance[keyName] = new RegExp(source);
    } else if (source && typeof source === 'object') {
      if (metadata.indexable) {
        instance[keyName] = deserializeIndexableObjectInto(source, metadata.deserializedType, instance[keyName]);
      } else {
        instance[keyName] = deserializeObjectInto(source, metadata.deserializedType, instance[keyName]);
      }
    } else {
      instance[keyName] = source;
    }
  }

  // invoke our after deserialized callback if provided
  invokeDeserializeHook(instance, json, type);

  return instance;
}

// deserializes a bit of json into a `type`
export function Deserialize(json: any, type?: Function | INewable<any> | ISerializable | null): any {

  if (Array.isArray(json)) {
    return deserializeArray(json, type);
  } else if (json && typeof json === 'object') {
    return deserializeObject(json, type);
  } else if ((typeof json === 'string' || json instanceof Date) && type === Date.prototype.constructor) {
    return new Date(json);
  } else if (typeof json === 'string' && type === RegExp) {
    return new RegExp(json as string);
  } else {
    return json;
  }

}

// takes some json, a type, and a target object and deserializes the json into that object
export function DeserializeInto(source: any, type: Function | INewable<any> | ISerializable, target: any): any {
  if (Array.isArray(source)) {
    return deserializeArrayInto(source, type, target || []);
  } else if (source && typeof source === 'object') {
    return deserializeObjectInto(source, type, target || new (type as any)());
  } else {
    return target || (type && new (type as any)()) || null;
  }
}

// deserializes an array of json into an array of `type`
function deserializeArray(source: any[], type?: Function | INewable<any> | ISerializable | null): any[] {
  const retn: any[] = new Array(source.length);
  for (let i = 0; i < source.length; i++) {
    retn[i] = Deserialize(source[i], type);
  }
  return retn;
}

function invokeDeserializeHook(instance: any, json: any, type: any): void {
  if (type && typeof (type).OnDeserialized === 'function') {
    type.OnDeserialized(instance, json);
  }
}

function invokeSerializeHook(instance: any, json: any): void {
  if (typeof (instance.constructor).OnSerialized === 'function') {
    (instance.constructor).OnSerialized(instance, json);
  }
}

// deserialize a bit of json into an instance of `type`
function deserializeObject(json: any, type?: Function | INewable<any> | ISerializable | null): any {
  const metadataArray: MetaData[] = TypeMap.get(type);

  // if we dont have meta data, just decode the json and use that
  if (!metadataArray) {
    let inst: any = null;
    if (!type) {
      inst = JSON.parse(JSON.stringify(json));
    } else {
      inst = new (type as any)(); // todo this probably wrong
      invokeDeserializeHook(inst, json, type);
    }
    return inst;
  }

  const instance = new (type as any)();

  // for each tagged property on the source type, try to deserialize it
  for (let i = 0; i < metadataArray.length; i++) {
    const metadata = metadataArray[i];

    if (!metadata.deserializedKey) { continue; }

    let serializedKey = metadata.deserializedKey;

    if (metadata.deserializedKey === metadata.keyName) {
      if (typeof deserializeKeyTransform === 'function') {
        serializedKey = deserializeKeyTransform(metadata.keyName);
      }
    }

    const source = json[serializedKey];

    const keyName = metadata.keyName;

    if (source === void 0) { continue; }

    if (source === null) {
      instance[keyName] = source;
    } else if (metadata.deserializedType && typeof (metadata.deserializedType as any).Deserialize === 'function') {
      instance[keyName] = (metadata.deserializedType as any).Deserialize(source);
    } else if (Array.isArray(source)) {
      instance[keyName] = deserializeArray(source, metadata.deserializedType || null);
    } else if ((typeof source === 'string' || source instanceof Date) && metadata.deserializedType === Date.prototype.constructor) {
      instance[keyName] = new Date(source);
    } else if (typeof source === 'string' && metadata.deserializedType === RegExp) {
      instance[keyName] = new RegExp(json);
    } else if (source && typeof source === 'object') {
      if (metadata.indexable) {
        instance[keyName] = deserializeIndexableObject(source, metadata.deserializedType);
      } else {
        instance[keyName] = deserializeObject(source, metadata.deserializedType);
      }
    } else {
      instance[keyName] = source;
    }
  }

  invokeDeserializeHook(instance, json, type);

  return instance;
}

function deserializeIndexableObject(source: any, type: Function | ISerializable | null): any {
  const retn: any = {};
  // todo apply key transformation here?
  Object.keys(source).forEach((key: string) => {
    retn[key] = deserializeObject(source[key], type);
  });
  return retn;
}

function deserializeIndexableObjectInto(source: any, type: Function | ISerializable | null, instance: any): any {
  // todo apply key transformation here?
  Object.keys(source).forEach((key: string) => {
    instance[key] = deserializeObjectInto(source[key], type, instance[key]);
  });
  return instance;
}

// take an array and spit out json
function serializeArray(source: any[], type?: Function | ISerializable | null): any[] {
  const serializedArray: any[] = new Array(source.length);
  for (let j = 0; j < source.length; j++) {
    serializedArray[j] = Serialize(source[j], type);
  }
  return serializedArray;
}

// take an instance of something and try to spit out json for it based on property annotaitons
function serializeTypedObject(instance: any, type?: Function | ISerializable): any {

  const json: any = {};

  let metadataArray: MetaData[];
  if (type) {
    metadataArray = TypeMap.get(type);
  } else {
    metadataArray = TypeMap.get(instance.constructor);
  }

  for (let i = 0; i < metadataArray.length; i++) {
    const metadata = metadataArray[i];

    if (!metadata.serializedKey) { continue; }

    let serializedKey = metadata.serializedKey;

    if (metadata.serializedKey === metadata.keyName) {
      if (typeof serializeKeyTransform === 'function') {
        serializedKey = serializeKeyTransform(metadata.keyName);
      }
    }

    const source = instance[metadata.keyName];

    if (source === void 0) { continue; }

    if (Array.isArray(source)) {
      json[serializedKey] = serializeArray(source, metadata.serializedType || null);
    } else if (metadata.serializedType && typeof (metadata.serializedType as any).Serialize === 'function') {
      // todo -- serializeIndexableObject probably isn't needed because of how serialize works
      json[serializedKey] = (metadata.serializedType as any).Serialize(source);

    } else {
      const value = Serialize(source);
      if (value !== void 0) {
        json[serializedKey] = value;
      }
    }
  }

  invokeSerializeHook(instance, json);

  return json;
}

// take an instance of something and spit out some json
export function Serialize(instance: any, type?: Function | ISerializable | null): any {
  if (instance === null || instance === void 0) { return null; }

  if (Array.isArray(instance)) {
    return serializeArray(instance, type);
  }

  if (type && TypeMap.has(type)) {
    return serializeTypedObject(instance, type);
  }

  if (instance.constructor && TypeMap.has(instance.constructor)) {
    return serializeTypedObject(instance);
  }

  if (instance instanceof Date) {
    return instance.toISOString();
  }

  if (instance instanceof RegExp) {
    return instance.toString();
  }

  if (instance && typeof instance === 'object' || typeof instance === 'function') {
    const keys = Object.keys(instance);
    const json: any = {};
    for (let i = 0; i < keys.length; i++) {
      // todo this probably needs a key transform
      json[keys[i]] = Serialize(instance[keys[i]]);
    }
    invokeSerializeHook(instance, json);
    return json;
  }

  return instance;
}

export function GenericDeserialize<T>(json: any, type: INewable<T>): T {
  return Deserialize(json, type) as T;
}

export function GenericDeserializeInto<T>(json: any, type: INewable<T>, instance: T): T {
  return DeserializeInto(json, type, instance) as T;
}

type Nullable<T> = T | null;

// these are used for transforming keys from one format to another
let serializeKeyTransform: Nullable<(key: string) => string> = null;
let deserializeKeyTransform: Nullable<(key: string) => string> = null;

// setter for deserializing key transform
export function DeserializeKeysFrom(transform: (key: string) => string) {
  deserializeKeyTransform = transform;
}

// setter for serializing key transform
export function SerializeKeysTo(transform: (key: string) => string) {
  serializeKeyTransform = transform;
}

// this is kinda dumb but typescript doesnt treat enums as a type, but sometimes you still
// want them to be serialized / deserialized, this does the trick but must be called after
// the enum is defined.
export function SerializableEnumeration(e: IEnum): void {
  e.Serialize = (x: any) => {
    return e[x];
  };

  e.Deserialize = (x: any) => {
    return e[x];
  };
}

// expose the type map
export { TypeMap as __TypeMap };
