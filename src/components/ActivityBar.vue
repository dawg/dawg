<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import SideBar from '@/components/SideBar.vue';
import BaseTabs from '@/components/BaseTabs.vue';
import VuePerfectScrollbar from 'vue-perfect-scrollbar';

@Component({ components: { SideBar, BaseTabs, VuePerfectScrollbar } })
export default class ActivityBar extends Vue {
  @Prop({ type: Number, default: 60 }) public activityBarWidth!: number;
  @Prop({ type: Number, default: 300 }) public sidePanelWidth!: number;
  @Prop({ type: Number, required: true }) public titleHeight!: number;
  @Prop({ type: Number, default: 0 }) public paddingBottom!: number;
}
</script>

<style scoped lang="sass">
.aside
  height: 100%
  width: 100%
  z-index: 3
  border-right: 1px solid

.title
  font-size: 15px !important
  border-bottom: 1px solid rgba(0, 0, 0, 0.3)
  padding: 0 20px

.scrollbar >>> .ps__scrollbar-y-rail
  background-color: transparent
</style>