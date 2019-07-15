<template>
  <div class="icon__wrapper center--vertial">
    <icon v-if="fa" :name="icon" v-bind="$attrs" v-on="$listeners" class="foreground--text"></icon>
    <v-icon v-else v-bind="$attrs" v-on="$listeners" class="foreground--text">
      {{ icon }}
    </v-icon>  
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator';

@Component
export default class Ico extends Vue {
  @Prop(Boolean) public fa!: boolean;
  get icon() {
    const slot = this.$slots.default;
    if (!slot || !slot[0]) {
      return '';
    }

    const text = slot[0].text || '';
    return text.trim();
  }
}
</script>
