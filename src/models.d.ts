import * as $protobuf from "protobufjs";
/** Properties of a Note. */
export interface INote {

    /** Note id */
    id: number;

    /** Note time */
    time: number;

    /** Note duration */
    duration: number;
}

/** Represents a Note. */
export class Note implements INote {

    /**
     * Constructs a new Note.
     * @param [properties] Properties to set
     */
    constructor(properties?: INote);

    /** Note id. */
    public id: number;

    /** Note time. */
    public time: number;

    /** Note duration. */
    public duration: number;

    /**
     * Creates a new Note instance using the specified properties.
     * @param [properties] Properties to set
     * @returns Note instance
     */
    public static create(properties?: INote): Note;

    /**
     * Encodes the specified Note message. Does not implicitly {@link Note.verify|verify} messages.
     * @param message Note message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: INote, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Encodes the specified Note message, length delimited. Does not implicitly {@link Note.verify|verify} messages.
     * @param message Note message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(message: INote, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a Note message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns Note
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): Note;

    /**
     * Decodes a Note message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns Note
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): Note;

    /**
     * Verifies a Note message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): (string|null);

    /**
     * Creates a Note message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns Note
     */
    public static fromObject(object: { [k: string]: any }): Note;

    /**
     * Creates a plain object from a Note message. Also converts values to other types if specified.
     * @param message Note
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(message: Note, options?: $protobuf.IConversionOptions): { [k: string]: any };

    /**
     * Converts this Note to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };
}

/** Properties of a Score. */
export interface IScore {

    /** Score name */
    name: string;

    /** Score instrumentId */
    instrumentId: string;

    /** Score notes */
    notes?: (INote[]|null);
}

/** Represents a Score. */
export class Score implements IScore {

    /**
     * Constructs a new Score.
     * @param [properties] Properties to set
     */
    constructor(properties?: IScore);

    /** Score name. */
    public name: string;

    /** Score instrumentId. */
    public instrumentId: string;

    /** Score notes. */
    public notes: INote[];

    /**
     * Creates a new Score instance using the specified properties.
     * @param [properties] Properties to set
     * @returns Score instance
     */
    public static create(properties?: IScore): Score;

    /**
     * Encodes the specified Score message. Does not implicitly {@link Score.verify|verify} messages.
     * @param message Score message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: IScore, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Encodes the specified Score message, length delimited. Does not implicitly {@link Score.verify|verify} messages.
     * @param message Score message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(message: IScore, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a Score message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns Score
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): Score;

    /**
     * Decodes a Score message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns Score
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): Score;

    /**
     * Verifies a Score message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): (string|null);

    /**
     * Creates a Score message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns Score
     */
    public static fromObject(object: { [k: string]: any }): Score;

    /**
     * Creates a plain object from a Score message. Also converts values to other types if specified.
     * @param message Score
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(message: Score, options?: $protobuf.IConversionOptions): { [k: string]: any };

    /**
     * Converts this Score to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };
}

/** Properties of a Pattern. */
export interface IPattern {

    /** Pattern name */
    name: string;

    /** Pattern scores */
    scores?: (IScore[]|null);
}

/** Represents a Pattern. */
export class Pattern implements IPattern {

    /**
     * Constructs a new Pattern.
     * @param [properties] Properties to set
     */
    constructor(properties?: IPattern);

    /** Pattern name. */
    public name: string;

    /** Pattern scores. */
    public scores: IScore[];

    /**
     * Creates a new Pattern instance using the specified properties.
     * @param [properties] Properties to set
     * @returns Pattern instance
     */
    public static create(properties?: IPattern): Pattern;

    /**
     * Encodes the specified Pattern message. Does not implicitly {@link Pattern.verify|verify} messages.
     * @param message Pattern message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: IPattern, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Encodes the specified Pattern message, length delimited. Does not implicitly {@link Pattern.verify|verify} messages.
     * @param message Pattern message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(message: IPattern, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a Pattern message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns Pattern
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): Pattern;

    /**
     * Decodes a Pattern message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns Pattern
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): Pattern;

    /**
     * Verifies a Pattern message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): (string|null);

    /**
     * Creates a Pattern message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns Pattern
     */
    public static fromObject(object: { [k: string]: any }): Pattern;

    /**
     * Creates a plain object from a Pattern message. Also converts values to other types if specified.
     * @param message Pattern
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(message: Pattern, options?: $protobuf.IConversionOptions): { [k: string]: any };

    /**
     * Converts this Pattern to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };
}

/** Properties of a Project. */
export interface IProject {

    /** Project bpm */
    bpm: number;

    /** Project patterns */
    patterns?: (IPattern[]|null);
}

/** Represents a Project. */
export class Project implements IProject {

    /**
     * Constructs a new Project.
     * @param [properties] Properties to set
     */
    constructor(properties?: IProject);

    /** Project bpm. */
    public bpm: number;

    /** Project patterns. */
    public patterns: IPattern[];

    /**
     * Creates a new Project instance using the specified properties.
     * @param [properties] Properties to set
     * @returns Project instance
     */
    public static create(properties?: IProject): Project;

    /**
     * Encodes the specified Project message. Does not implicitly {@link Project.verify|verify} messages.
     * @param message Project message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: IProject, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Encodes the specified Project message, length delimited. Does not implicitly {@link Project.verify|verify} messages.
     * @param message Project message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(message: IProject, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a Project message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns Project
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): Project;

    /**
     * Decodes a Project message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns Project
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): Project;

    /**
     * Verifies a Project message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): (string|null);

    /**
     * Creates a Project message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns Project
     */
    public static fromObject(object: { [k: string]: any }): Project;

    /**
     * Creates a plain object from a Project message. Also converts values to other types if specified.
     * @param message Project
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(message: Project, options?: $protobuf.IConversionOptions): { [k: string]: any };

    /**
     * Converts this Project to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };
}
