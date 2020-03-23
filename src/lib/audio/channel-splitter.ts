import { getContext } from '@/lib/audio/global';
import { ObeoNode, extractAudioNode } from '@/lib/audio/node';

type ObeoChannelSplitter = ObeoNode<ChannelSplitterNode>;

export const createChannelSplitter = (numberOfOutputs?: number): ObeoChannelSplitter => {
  const context = getContext();
  return extractAudioNode(context.createChannelSplitter(numberOfOutputs));
};
