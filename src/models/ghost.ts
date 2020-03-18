
export abstract class Ghost {
  public abstract component: string;
  constructor(public time: number, public row: number) {}
}

export class ChunkGhost extends Ghost {
  public component = 'chunk-ghost';
  public buffer: AudioBuffer | null = null;
}


