<template>
  <base-tabs 
    class="tabs-panels secondary" 
    ref="panels"
    :selected-tab.sync="openedPanel"
    :first="base.ui.panels[0] ? base.ui.panels[0].name : undefined"
  >
    <tab 
      v-for="item in base.ui.panels"
      :key="item.name"
      :name="item.name"
      :selected-tab="openedPanel"
    >
      <component
        :is="item.component"
      ></component>
    </tab>

  </base-tabs>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator';
import BaseTabs from '@/components/BaseTabs.vue';
import Tab from '@/components/Tab.vue';
import * as base from '@/base';
import { createComponent } from '@/utils';

export default createComponent({
  name: 'Panels',
  components: {
    BaseTabs,
    Tab,
  },
  setup() {
    return {
      base,
      openedPanel: base.ui.openedPanel,
    };
  },
});
</script>
