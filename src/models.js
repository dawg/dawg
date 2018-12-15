/*eslint-disable block-scoped-var, id-length, no-control-regex, no-magic-numbers, no-prototype-builtins, no-redeclare, no-shadow, no-var, sort-vars*/
"use strict";

var $protobuf = require("protobufjs/minimal");

// Common aliases
var $Reader = $protobuf.Reader, $Writer = $protobuf.Writer, $util = $protobuf.util;

// Exported root namespace
var $root = $protobuf.roots["default"] || ($protobuf.roots["default"] = {});

$root.Note = (function() {

    /**
     * Properties of a Note.
     * @exports INote
     * @interface INote
     * @property {number} id Note id
     * @property {number} time Note time
     * @property {number} duration Note duration
     */

    /**
     * Constructs a new Note.
     * @exports Note
     * @classdesc Represents a Note.
     * @implements INote
     * @constructor
     * @param {INote=} [properties] Properties to set
     */
    function Note(properties) {
        if (properties)
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * Note id.
     * @member {number} id
     * @memberof Note
     * @instance
     */
    Note.prototype.id = 0;

    /**
     * Note time.
     * @member {number} time
     * @memberof Note
     * @instance
     */
    Note.prototype.time = 0;

    /**
     * Note duration.
     * @member {number} duration
     * @memberof Note
     * @instance
     */
    Note.prototype.duration = 0;

    /**
     * Creates a new Note instance using the specified properties.
     * @function create
     * @memberof Note
     * @static
     * @param {INote=} [properties] Properties to set
     * @returns {Note} Note instance
     */
    Note.create = function create(properties) {
        return new Note(properties);
    };

    /**
     * Encodes the specified Note message. Does not implicitly {@link Note.verify|verify} messages.
     * @function encode
     * @memberof Note
     * @static
     * @param {INote} message Note message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    Note.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        writer.uint32(/* id 1, wireType 0 =*/8).int32(message.id);
        writer.uint32(/* id 2, wireType 0 =*/16).int32(message.time);
        writer.uint32(/* id 3, wireType 0 =*/24).int32(message.duration);
        return writer;
    };

    /**
     * Encodes the specified Note message, length delimited. Does not implicitly {@link Note.verify|verify} messages.
     * @function encodeDelimited
     * @memberof Note
     * @static
     * @param {INote} message Note message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    Note.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a Note message from the specified reader or buffer.
     * @function decode
     * @memberof Note
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {Note} Note
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    Note.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        var end = length === undefined ? reader.len : reader.pos + length, message = new $root.Note();
        while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
            case 1:
                message.id = reader.int32();
                break;
            case 2:
                message.time = reader.int32();
                break;
            case 3:
                message.duration = reader.int32();
                break;
            default:
                reader.skipType(tag & 7);
                break;
            }
        }
        if (!message.hasOwnProperty("id"))
            throw $util.ProtocolError("missing required 'id'", { instance: message });
        if (!message.hasOwnProperty("time"))
            throw $util.ProtocolError("missing required 'time'", { instance: message });
        if (!message.hasOwnProperty("duration"))
            throw $util.ProtocolError("missing required 'duration'", { instance: message });
        return message;
    };

    /**
     * Decodes a Note message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof Note
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {Note} Note
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    Note.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a Note message.
     * @function verify
     * @memberof Note
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    Note.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (!$util.isInteger(message.id))
            return "id: integer expected";
        if (!$util.isInteger(message.time))
            return "time: integer expected";
        if (!$util.isInteger(message.duration))
            return "duration: integer expected";
        return null;
    };

    /**
     * Creates a Note message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof Note
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {Note} Note
     */
    Note.fromObject = function fromObject(object) {
        if (object instanceof $root.Note)
            return object;
        var message = new $root.Note();
        if (object.id != null)
            message.id = object.id | 0;
        if (object.time != null)
            message.time = object.time | 0;
        if (object.duration != null)
            message.duration = object.duration | 0;
        return message;
    };

    /**
     * Creates a plain object from a Note message. Also converts values to other types if specified.
     * @function toObject
     * @memberof Note
     * @static
     * @param {Note} message Note
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    Note.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        var object = {};
        if (options.defaults) {
            object.id = 0;
            object.time = 0;
            object.duration = 0;
        }
        if (message.id != null && message.hasOwnProperty("id"))
            object.id = message.id;
        if (message.time != null && message.hasOwnProperty("time"))
            object.time = message.time;
        if (message.duration != null && message.hasOwnProperty("duration"))
            object.duration = message.duration;
        return object;
    };

    /**
     * Converts this Note to JSON.
     * @function toJSON
     * @memberof Note
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    Note.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    return Note;
})();

$root.Pattern = (function() {

    /**
     * Properties of a Pattern.
     * @exports IPattern
     * @interface IPattern
     * @property {string} name Pattern name
     * @property {Array.<INote>|null} [notes] Pattern notes
     */

    /**
     * Constructs a new Pattern.
     * @exports Pattern
     * @classdesc Represents a Pattern.
     * @implements IPattern
     * @constructor
     * @param {IPattern=} [properties] Properties to set
     */
    function Pattern(properties) {
        this.notes = [];
        if (properties)
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * Pattern name.
     * @member {string} name
     * @memberof Pattern
     * @instance
     */
    Pattern.prototype.name = "";

    /**
     * Pattern notes.
     * @member {Array.<INote>} notes
     * @memberof Pattern
     * @instance
     */
    Pattern.prototype.notes = $util.emptyArray;

    /**
     * Creates a new Pattern instance using the specified properties.
     * @function create
     * @memberof Pattern
     * @static
     * @param {IPattern=} [properties] Properties to set
     * @returns {Pattern} Pattern instance
     */
    Pattern.create = function create(properties) {
        return new Pattern(properties);
    };

    /**
     * Encodes the specified Pattern message. Does not implicitly {@link Pattern.verify|verify} messages.
     * @function encode
     * @memberof Pattern
     * @static
     * @param {IPattern} message Pattern message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    Pattern.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        writer.uint32(/* id 1, wireType 2 =*/10).string(message.name);
        if (message.notes != null && message.notes.length)
            for (var i = 0; i < message.notes.length; ++i)
                $root.Note.encode(message.notes[i], writer.uint32(/* id 2, wireType 2 =*/18).fork()).ldelim();
        return writer;
    };

    /**
     * Encodes the specified Pattern message, length delimited. Does not implicitly {@link Pattern.verify|verify} messages.
     * @function encodeDelimited
     * @memberof Pattern
     * @static
     * @param {IPattern} message Pattern message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    Pattern.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a Pattern message from the specified reader or buffer.
     * @function decode
     * @memberof Pattern
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {Pattern} Pattern
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    Pattern.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        var end = length === undefined ? reader.len : reader.pos + length, message = new $root.Pattern();
        while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
            case 1:
                message.name = reader.string();
                break;
            case 2:
                if (!(message.notes && message.notes.length))
                    message.notes = [];
                message.notes.push($root.Note.decode(reader, reader.uint32()));
                break;
            default:
                reader.skipType(tag & 7);
                break;
            }
        }
        if (!message.hasOwnProperty("name"))
            throw $util.ProtocolError("missing required 'name'", { instance: message });
        return message;
    };

    /**
     * Decodes a Pattern message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof Pattern
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {Pattern} Pattern
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    Pattern.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a Pattern message.
     * @function verify
     * @memberof Pattern
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    Pattern.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (!$util.isString(message.name))
            return "name: string expected";
        if (message.notes != null && message.hasOwnProperty("notes")) {
            if (!Array.isArray(message.notes))
                return "notes: array expected";
            for (var i = 0; i < message.notes.length; ++i) {
                var error = $root.Note.verify(message.notes[i]);
                if (error)
                    return "notes." + error;
            }
        }
        return null;
    };

    /**
     * Creates a Pattern message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof Pattern
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {Pattern} Pattern
     */
    Pattern.fromObject = function fromObject(object) {
        if (object instanceof $root.Pattern)
            return object;
        var message = new $root.Pattern();
        if (object.name != null)
            message.name = String(object.name);
        if (object.notes) {
            if (!Array.isArray(object.notes))
                throw TypeError(".Pattern.notes: array expected");
            message.notes = [];
            for (var i = 0; i < object.notes.length; ++i) {
                if (typeof object.notes[i] !== "object")
                    throw TypeError(".Pattern.notes: object expected");
                message.notes[i] = $root.Note.fromObject(object.notes[i]);
            }
        }
        return message;
    };

    /**
     * Creates a plain object from a Pattern message. Also converts values to other types if specified.
     * @function toObject
     * @memberof Pattern
     * @static
     * @param {Pattern} message Pattern
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    Pattern.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        var object = {};
        if (options.arrays || options.defaults)
            object.notes = [];
        if (options.defaults)
            object.name = "";
        if (message.name != null && message.hasOwnProperty("name"))
            object.name = message.name;
        if (message.notes && message.notes.length) {
            object.notes = [];
            for (var j = 0; j < message.notes.length; ++j)
                object.notes[j] = $root.Note.toObject(message.notes[j], options);
        }
        return object;
    };

    /**
     * Converts this Pattern to JSON.
     * @function toJSON
     * @memberof Pattern
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    Pattern.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    return Pattern;
})();

$root.Project = (function() {

    /**
     * Properties of a Project.
     * @exports IProject
     * @interface IProject
     * @property {number} bpm Project bpm
     */

    /**
     * Constructs a new Project.
     * @exports Project
     * @classdesc Represents a Project.
     * @implements IProject
     * @constructor
     * @param {IProject=} [properties] Properties to set
     */
    function Project(properties) {
        if (properties)
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * Project bpm.
     * @member {number} bpm
     * @memberof Project
     * @instance
     */
    Project.prototype.bpm = 0;

    /**
     * Creates a new Project instance using the specified properties.
     * @function create
     * @memberof Project
     * @static
     * @param {IProject=} [properties] Properties to set
     * @returns {Project} Project instance
     */
    Project.create = function create(properties) {
        return new Project(properties);
    };

    /**
     * Encodes the specified Project message. Does not implicitly {@link Project.verify|verify} messages.
     * @function encode
     * @memberof Project
     * @static
     * @param {IProject} message Project message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    Project.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        writer.uint32(/* id 1, wireType 0 =*/8).int32(message.bpm);
        return writer;
    };

    /**
     * Encodes the specified Project message, length delimited. Does not implicitly {@link Project.verify|verify} messages.
     * @function encodeDelimited
     * @memberof Project
     * @static
     * @param {IProject} message Project message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    Project.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a Project message from the specified reader or buffer.
     * @function decode
     * @memberof Project
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {Project} Project
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    Project.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        var end = length === undefined ? reader.len : reader.pos + length, message = new $root.Project();
        while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
            case 1:
                message.bpm = reader.int32();
                break;
            default:
                reader.skipType(tag & 7);
                break;
            }
        }
        if (!message.hasOwnProperty("bpm"))
            throw $util.ProtocolError("missing required 'bpm'", { instance: message });
        return message;
    };

    /**
     * Decodes a Project message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof Project
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {Project} Project
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    Project.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a Project message.
     * @function verify
     * @memberof Project
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    Project.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (!$util.isInteger(message.bpm))
            return "bpm: integer expected";
        return null;
    };

    /**
     * Creates a Project message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof Project
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {Project} Project
     */
    Project.fromObject = function fromObject(object) {
        if (object instanceof $root.Project)
            return object;
        var message = new $root.Project();
        if (object.bpm != null)
            message.bpm = object.bpm | 0;
        return message;
    };

    /**
     * Creates a plain object from a Project message. Also converts values to other types if specified.
     * @function toObject
     * @memberof Project
     * @static
     * @param {Project} message Project
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    Project.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        var object = {};
        if (options.defaults)
            object.bpm = 0;
        if (message.bpm != null && message.hasOwnProperty("bpm"))
            object.bpm = message.bpm;
        return object;
    };

    /**
     * Converts this Project to JSON.
     * @function toJSON
     * @memberof Project
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    Project.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    return Project;
})();

module.exports = $root;
