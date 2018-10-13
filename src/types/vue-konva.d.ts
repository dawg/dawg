declare module 'vue-konva' {
    import Vue, { VueConstructor } from 'vue';
    
    export class Stage {
        getX(): number;
    }

    export class VRect extends Vue {
        getStage(): Stage
    }

    export function install(vue: VueConstructor<Vue>, options?: any): void;
}