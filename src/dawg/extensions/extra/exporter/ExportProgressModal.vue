<template>
  <dg-modal :value="open" center-vertical>
    <template v-slot:body>
      <div class="p-2 flex flex-col items-center">
        <div class="text-default">Export in progress. {{ progress | round }}% complete.</div>
        <div class="m-1"></div>
        <dg-linear-progress :progress="progress">
        </dg-linear-progress>
        <div class="m-1"></div>
      </div>
    </template>
  </dg-modal>
</template>

<script lang="ts">
export default {
  name: 'ExportProgressModal',
  filters: {
    round: (value: number) => {
      return Math.round(value * 100) / 100;
    },
  },
  props: {
    open: { Boolean, required: true },
    progress: { type: Number, required: true },
  },
};
</script>
