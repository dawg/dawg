<template>
  <dg-modal :value="open">
    <div>Export in progress. {{ progress }}% complete.</div>
    <dg-linear-progress :progress="progress">
    </dg-linear-progress>
  </dg-modal>
</template>

<script lang="ts">
export default {
  name: 'ExportProgressModal',
  props: {
    open: { Boolean, required: true },
    progress: { type: Number, required: true },
  },
};
</script>
