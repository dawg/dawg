import { ObeoParam } from '@/lib/audio/param';

export interface ObeoNode<T extends AudioNode = AudioNode> extends AudioNode {
  name: 'node';
  node: T;
  connect(destinationNode: ObeoNode, output?: number, input?: number): ObeoNode<T>;
  connect(destinationParam: ObeoParam, output?: number): void;
  // tslint:disable:unified-signatures
  disconnect(): void;
  disconnect(output: number): void;
  disconnect(destinationNode: ObeoNode): void;
  disconnect(destinationNode: ObeoNode, output: number): void;
  disconnect(destinationNode: ObeoNode, output: number, input: number): void;
  disconnect(destinationParam: ObeoParam): void;
  disconnect(destinationParam: ObeoParam, output: number): void;
  // tslint:enable:unified-signatures
}

export const extractAudioNode = <T extends AudioNode>(node: T): ObeoNode<T> => {
  // TODO properties ??
  const audea: ObeoNode<T> = {
    // EventTarget
    addEventListener: node.addEventListener.bind(node),
    dispatchEvent: node.dispatchEvent.bind(node),
    removeEventListener: node.removeEventListener.bind(node),

    // AudioNode
    channelCount: node.channelCount,
    channelCountMode: node.channelCountMode,
    channelInterpretation: node.channelInterpretation,
    context: node.context,
    numberOfInputs: node.numberOfInputs,
    numberOfOutputs: node.numberOfOutputs,

    // Custom
    name: 'node',
    node,
    connect: (target: ObeoNode | ObeoParam, output?: number, input?: number) => {
      if (target.name === 'node') {
        node.connect(target.node, output, input);
      } else {
        node.connect(target.param, output);
      }
      return audea;
    },
    disconnect: (nodeParamOrOutput?: number | ObeoNode | ObeoParam, output?: number, input?: number) => {
      // Handling all 7 cases explicitly to satisfy ts
      if (!nodeParamOrOutput) {
        node.disconnect();
      } else if (typeof nodeParamOrOutput === 'number') {
        node.disconnect(nodeParamOrOutput);
      } else if (nodeParamOrOutput.name === 'node') {
        if (output !== undefined && input !== undefined) {
          node.disconnect(nodeParamOrOutput.node, output, input);
        } else if (output !== undefined) {
          node.disconnect(nodeParamOrOutput.node, output);
        } else {
          node.disconnect(nodeParamOrOutput.node);
        }
      } else {
        if (output !== undefined) {
          node.disconnect(nodeParamOrOutput.param, output);
        } else {
          node.disconnect(nodeParamOrOutput.param);
        }
      }
    },
  };

  return audea;
};
