<template>
  <div style="display: contents">
    <div @click="click" style="display: flex" v-bind:class="nodeClass">
      <ico 
        fa 
        class="icon"
        :scale="scale" 
        :style="indent"
        v-if="!isLeaf || isWav"
      >
        {{ icon }}
      </ico>
      <div class="white--text path" v-if="!isLeaf || isWav" @click="preview" @dblclick="sendToSampleTab">{{ fileName }}</div>
    </div>
    <tree
      v-if="showChildren"
      v-for="folder in folders"
      :key="folder"
      :path="folder"
      :children="children[folder]"
      :depth="depth + 1"
    ></tree>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import Tone from 'tone';
import path from 'path';
import fs from 'fs';
import av from 'av';
import { Component, Prop } from 'vue-property-decorator';

@Component
export default class Tree extends Vue {
  @Prop({type: Object, required: true}) public children!: object;
  @Prop({type: String, required: true}) public path!: string;
  @Prop({type: Number, default: 0}) public depth!: number;
  public showChildren = false;
  public click() {
    if (!this.isLeaf) {
      this.showChildren = !this.showChildren;
    }
  }

  public async sendToSampleTab(event: MouseEvent) {
    // TODO: From here we can send this.path to sample viewer
  }

  public async preview(event: MouseEvent) {
    if (this.isWav) {
      const audioContext = new AudioContext();

      function createAudioBufferFromAVBuffer(numberOfChannels: number, sampleRate: number, buffer: any[]) {
        const audioBuffer = audioContext.createBuffer(numberOfChannels, buffer.length / numberOfChannels, sampleRate);

        for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
          // This gives us the actual ArrayBuffer that contains the data
          const nowBuffering = audioBuffer.getChannelData(channel);

          for (let i = 0; i < audioBuffer.length; i++) {
            nowBuffering[i] = buffer[(i * (numberOfChannels)) + channel];
          }
        }
        return audioBuffer;
      }

      const getAudioBuffer = (source: string): Promise<AudioBuffer> => {
        return new Promise((resolve, reject) => {
          if (typeof (source) === 'string' && fs.existsSync(source)) {
            fs.readFile(source, (err, data: any) => {
              if (!err) {
                const asset = av.Asset.fromBuffer(data);

                asset.on('error', (error: any) => {
                  reject(error);
                });

                asset.decodeToBuffer((b: any[]) => {
                  resolve(createAudioBufferFromAVBuffer(asset.format.channelsPerFrame, asset.format.sampleRate, b));
                });
              } else {
                reject(err);
              }
            });
          }
        });
      };
      const songAudioBuffer = await getAudioBuffer(this.path);
      const player = new Tone.Player(songAudioBuffer).toMaster();
      player.autostart = true;
      audioContext.close();
    }
  }
  get indent() {
    let rotate = 0;
    if (this.showChildren) {
      rotate = 45;
    }

    return {
      marginLeft: `${this.depth * 10}px`,
      transform: `rotate(${rotate}deg)`,
    };
  }
  get isLeaf() {
    return this.folders.length === 0;
  }
  get folders() {
    return Object.keys(this.children);
  }
  get nodeClass() {
    return 'node';
  }
  get fileName() {
    return path.basename(this.path);
  }
  get icon() {
    return this.isLeaf ? 'file' : 'caret-right';
  }
  get scale() {
    return this.isLeaf ? 0.8 : 1;
  }
  get isWav() {
    const extension = this.path.split('.').pop();
    if (extension) {
      return extension.toLowerCase() === 'wav';
    }
    return false;
  }
}
</script>

<style lang="sass" scoped>
.path
  margin-left: 8px
  user-select: none

.node:hover
  background: rgba(255,255,255,0.12)
  cursor: pointer

.node
  font-size: 15px
  padding: 4px 8px
</style>
