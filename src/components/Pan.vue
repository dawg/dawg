<template>
  <knob
    :min="-1"
    :max="1"
    :mid-value="0"
    :value="value"
    @input="$emit('input', $event)"
    v-bind="$attrs"
    v-on="$listeners"
    :format="format"
    name="Pan"
  ></knob>
</template>

<script lang="ts">
import { createComponent } from '@/utils';

export default createComponent({
  name: 'Pan',
  props: {
    value: { type: Number, required: true },
  },
  setup(props) {
    function format(value: number) {
      let text = (Math.round(Math.abs(props.value) * 100)) + '%';

      if (props.value < 0) {
        text += ' left';
      } else if (props.value > 0) {
        text += ' right';
      }

      return text;
    }

    return {
      format,
    };
  },
});
</script>