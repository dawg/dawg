<script lang="ts">
import { Component, Prop } from 'vue-property-decorator';
import Tab from '@/components/Tab.vue';

@Component
export default class Sidebar extends Tab {
  @Prop({ type: String, required: true }) public icon!: string;
  @Prop({ type: Object, required: false }) public iconProps!: { [prop: string]: any };
}
</script>
