<template>
  <div class="icon__wrapper center--vertial">
    <icon v-if="fa" :name="icon" v-bind="$attrs" v-on="$listeners" class="foreground--text"></icon>
    <v-icon v-else v-bind="$attrs" v-on="$listeners" class="foreground--text">
      {{ icon }}
    </v-icon>  
  </div>
</template>

<script lang="ts">
import { computed, createComponent } from '@vue/composition-api';

export default createComponent({
  name: 'DgIcon',
  props: {
    fa: Boolean as () => boolean | undefined,
  },
  setup: (props, context) => ({
    icon: computed(() => {
      const slot = context.slots.default();
      if (!slot || !slot[0]) {
        return '';
      }

      const text = slot[0].text || '';
      return text.trim();
    }),
  }),
});
</script>
