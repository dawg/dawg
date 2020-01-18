<template>
  <base-tabs 
    class="tabs-panels" 
    ref="panels"
    :selected-tab.sync="openedPanel"
    :first="framework.ui.panels[0] ? framework.ui.panels[0].name : undefined"
  >
    <tab 
      v-for="item in framework.ui.panels"
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
import * as framework from '@/framework';
import { createComponent } from '@vue/composition-api';

export default createComponent({
  name: 'Panels',
  components: {
    BaseTabs,
    Tab,
  },
  setup() {
    return {
      framework,
      openedPanel: framework.ui.openedPanel,
    };
  },
});
</script>
