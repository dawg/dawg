<template>
  <div 
    :contenteditable="contenteditable"
    @blur="blur"
    @dblclick="dblclick" 
    @input="input"
  ></div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator';

@Component
export default class NAME extends Vue {
  @Prop({ type: String, required: true }) public value!: string;
  public contenteditable = false;

  public mounted() {
    this.$el.innerText = this.value;
  }

  public dblclick() {
    this.contenteditable = true;
    this.$nextTick(() => {
      this.$el.focus();
      // Select all of the text in the div!
      document.execCommand('selectall', undefined, false);
    });
  }

  public blur() {
    this.contenteditable = false;
  }

  public input(e: any) {
    this.$emit('input', e.currentTarget.innerText);
  }
}
</script>

<style lang="sass" scoped>
</style>