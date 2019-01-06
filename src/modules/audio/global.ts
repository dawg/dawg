import Tone from 'tone';

class Global {
  public PPQ = 192;
  public context: Tone.Context | Tone.OfflineContext = new Tone.Context();
}

export default new Global();
