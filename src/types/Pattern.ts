import { Message, Type, Field } from 'protobufjs/light'; // respectively "./node_modules/protobufjs/light.js"

@Type.d('Pattern')
export default class Pattern extends Message<Pattern> {
  @Field.d(1, 'number')
  public id!: number;

  @Field.d(2, 'number')
  public length!: number;

  @Field.d(3, 'number')
  public time!: number;
}
