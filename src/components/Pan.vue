<template>
  <knob
    :min="-1"
    :max="1"
    :mid-value="0"
    :value="value"
    @input="$emit('input', $event)"
    v-bind="$attrs"
    v-on="$listeners"
  ></knob>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator';

// v-bind and v-on does not work with v-model
// https://github.com/vuejs/vue/issues/6216
@Component
export default class Pan extends Vue {
  @Prop({ type: Number, required: true }) public value!: number;
}
</script>