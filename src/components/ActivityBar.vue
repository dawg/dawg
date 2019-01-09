<template>
  <v-navigation-drawer
    permanent
    mini-variant
    class="secondary-lighten-2"
  >
    <v-list dense style="height: 100%; display: flex; flex-direction: column">
      <v-list-tile
        v-for="item in items"
        :key="item.name"
        @click="$emit('click', item, $event)"
      >
        <tooltip-icon medium color="white" :tooltip="item.name" right>{{ item.icon }}</tooltip-icon>
      </v-list-tile>
      <div style="flex-grow: 1"></div>
      <v-list-tile>
        <v-icon medium color="white">settings</v-icon>
      </v-list-tile>
    </v-list>
  </v-navigation-drawer>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator';

interface Item {
  name: string;
  icon: string;
}

@Component
export default class ActivityBar extends Vue {
  @Prop({ type: Array, required: true }) public items!: Item[];
}
</script>

<style lang="sass" scoped>

</style>