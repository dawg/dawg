import { ObeoParam } from '@/lib/audio/param';
import { getContext } from '@/lib/audio/global';

export interface ObeoNode<O extends AudioNode = AudioNode, I extends AudioNode | undefined = O> {
  name: 'node';
  input: I;
  output: O;
  readonly channelCount: number; // this isn't actually readonly
  readonly numberOfInputs: number;
  readonly numberOfOutputs: number;
  // tslint:disable:unified-signatures
  connect<Out extends AudioNode, In extends AudioNode>(
    destinationNode: ObeoNode<Out, In>,
    output?: number,
    input?: number,
  ): void;
  connect(destinationParam: ObeoParam, output?: number): void;
  disconnect(): void;
  disconnect(output: number): void;
  disconnect<Out extends AudioNode, In extends AudioNode>(
    destinationNode: ObeoNode<Out, In>,
    output?: number,
    input?: number,
  ): void;
  disconnect(destinationParam: ObeoParam, output?: number): void;
  // tslint:enable:unified-signatures
  dispose(): void;
  toDestination(): void;
}

export const extractAudioNode = <T extends AudioNode>(node: T): ObeoNode<T, T> => {
  return mimicAudioNode(node, node);
};

export const mimicAudioNode = <
  O extends AudioNode,
  I extends AudioNode | undefined
>(i: I, o: O): ObeoNode<O, I> => {
  const node: ObeoNode<O, I> = {
    // Using the output node but they should be the same
    channelCount: o.channelCount,
    numberOfInputs: i ? i.numberOfInputs : 0,
    numberOfOutputs: o.numberOfOutputs,

    name: 'node',

    // Having an input AND output allows us to treat complex audio node combinations as being a
    // single node.
    // The, the connect and disconnect logic handles all of the connection logic allowing the user
    // to forget about the internals of any particular node
    input: i,
    output: o,
    connect: (target: ObeoNode | ObeoParam, output?: number, input?: number) => {
      if (target.name === 'node') {
        o.connect(target.input, output, input);
      } else {
        o.connect(target.param, output);
      }
      return node;
    },
    disconnect: (
      nodeParamOrOutput?: number | ObeoNode | ObeoParam,
      output?: number,
      input?: number,
    ) => {
      // Handling all 7 cases explicitly to satisfy ts
      if (!nodeParamOrOutput) {
        o.disconnect();
      } else if (typeof nodeParamOrOutput === 'number') {
        o.disconnect(nodeParamOrOutput);
      } else if (nodeParamOrOutput.name === 'node') {
        if (output !== undefined && input !== undefined) {
          o.disconnect(nodeParamOrOutput.input, output, input);
        } else if (output !== undefined) {
          o.disconnect(nodeParamOrOutput.input, output);
        } else {
          o.disconnect(nodeParamOrOutput.input);
        }
      } else {
        if (output !== undefined) {
          o.disconnect(nodeParamOrOutput.param, output);
        } else {
          o.disconnect(nodeParamOrOutput.param);
        }
      }
    },
    dispose: () => {
      o.disconnect();
    },
    toDestination: () => {
      const context = getContext();
      o.connect(context.destination);
    },
  };

  return node;
};
