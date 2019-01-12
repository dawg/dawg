<template>
  <knob
    :min="-1"
    :max="1"
    :mid-value="0"
    v-bind="$attrs"
    v-on="$listeners"
  ></knob>
</template>

<script lang="ts">
import { Vue, Component } from 'vue-property-decorator';

@Component
export default class Pan extends Vue {}
</script>