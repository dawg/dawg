class Global {
  public PPQ = 192;
  public context: AudioContext | OfflineAudioContext = new AudioContext();
}

export default new Global();
