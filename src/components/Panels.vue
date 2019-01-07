<template>
  <base-tabs class="tabs-panels secondary" ref="panels">
    <panel name="Instruments">
      <synths 
        :instruments="instruments"
        :selected-score.sync="selectedScore"
        :selected-pattern="selectedPattern"
        :synth.sync="selectedSynth"
        :scores="selectedScore"
      ></synths>
    </panel>
    <panel name="Mixer">
      <mixer></mixer>
    </panel>
    <panel name="Piano Roll">
      <piano-roll 
        v-model="notes"
        :part="part"
        :synth="selectedSynth"
        :play="play"
        @added="added"
        @removed="removed"
      ></piano-roll>
    </panel>
    <panel name="Sample">
      <div></div>
    </panel>
  </base-tabs>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator';
import Panel from '@/components/Panel.vue';
import Synths from '@/components/Synths.vue';
import BaseTabs from '@/components/BaseTabs.vue';
import PianoRoll from '@/components/PianoRoll.vue';
import Tab from '@/components/Tab.vue';
import Mixer from '@/components/Mixer.vue';
import { Instrument, Score, Note, Pattern } from '@/schemas';
import { Nullable, toTickTime, allKeys, Keys } from '@/utils';
import { project } from '@/store';
import Part from '@/modules/audio/part';

type ACTIONS = 'add';

interface Group {
  action: ACTIONS;
  icon: string;
  tooltip: string;
}

@Component({
  components: {
    Panel,
    Synths,
    PianoRoll,
    Mixer,
    BaseTabs,
  },
})
export default class Panels extends Vue {
  @Prop({ type: String, required: true }) public openedPanel!: string;
  @Prop(Nullable(Object)) public selectedPattern!: Pattern | null;

  public $refs!: {
    panels: BaseTabs,
  };

  public play = false;
  public part = new Part<Note>();
  public selectedSynth: Instrument | null = null;
  public panels: Tab[] = [];
  public selectedScore: Score | null = null;
  public count = 0;
  public groups: Group[] = [
    {
      action: 'add',
      icon: 'add',
      tooltip: 'Add Instrument',
    },
  ];

  public mounted() {
    this.panels = this.$refs.panels.tabs;
    this.part.loop = true;

    window.addEventListener('keypress', this.keydown);
  }

  public destroyed() {
    window.removeEventListener('keypress', this.keydown);
  }

  public selectPanel(name: string, e: MouseEvent) {
    this.$update('openedPanel', name);
    this.$refs.panels.selectTab(name, e);
  }

  public action(action: ACTIONS) {
    if (action === 'add') {
      project.addInstrument();
    }
  }

  public keydown(e: KeyboardEvent) {
    if (e.keyCode === Keys.SPACE) {
      e.preventDefault();
      this.playPause();
    }
  }

  public playPattern() {
    this.part.start();
    this.play = true;
  }

  public pausePattern() {
    this.part.pause();
    this.play = false;
  }

  public playPause() {
    if (this.part.state === 'started') {
      this.pausePattern();
    } else {
      this.playPattern();
    }
  }

  public added(note: Note) {
    const time = toTickTime(note.time);
    this.$log.debug(`Adding note at ${note.time} -> ${time}`);
    this.part.add(this.callback, time, note);
  }

  public removed(note: Note, i: number) {
    // const time = toTickTime(note.time);
    this.part.remove(note);
  }

  public callback(time: number, note: Note) {
    if (!this.selectedScore) { return; }
    const duration = toTickTime(note.duration);
    const value = allKeys[note.id].value;
    const instrument = this.instrumentLookup[this.selectedScore.instrument];
    instrument.triggerAttackRelease(value, duration, time);
  }

  get notes() {
    if (!this.selectedScore) { return []; }
    return this.selectedScore.notes;
  }

  get instruments() {
    return project.instruments;
  }

  get instrumentLookup() {
    const instruments: {[k: string]: Instrument} = {};
    project.instruments.forEach((instrument) => {
      instruments[instrument.name] = instrument;
    });
    return instruments;
  }
}
</script>

<style lang="sass" scoped>

</style>