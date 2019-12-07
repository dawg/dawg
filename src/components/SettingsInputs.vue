<template>
  <div class="settings-inputs">
    <div class="section" v-for="(section, i) in processed" :key="i">
      <h1>{{ section.title }}</h1>
      <div v-for="input in inputs" :key="input.label + i">
        <v-text-field
          v-if="input.type === 'StringType'"
          class="text-field"
          :label="input.title"
          v-model="input.value.value"
          :disabled="input.disabled ? input.disabled.value : false"
        ></v-text-field>
        <v-switch
          v-if="input.type === 'BooleanType'"
          v-model="input.value.value"
          color="primary"
          :disabled="input.disabled ? input.disabled.value : false"
        ></v-switch>
        <v-select
          v-if="input.type === 'select'"
          class="select"
          dense
          dark
          :label="input.label"
          :items="input.options"
          v-model="input.value.value"
        ></v-select>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { createComponent, computed, Ref } from '@vue/composition-api';
import { Marked } from 'marked-ts';
import { ReactiveDefinition, ExtensionProps, StoredProps } from '../dawg/extensions';
import { keys, literal } from '../utils';

interface Input {
  type: 'string' | 'boolean' | 'number' | 'array' | 'select';
  value: Ref<string | boolean | number | any[] | undefined>;
  label: string;
  description: string;
}

interface Section<P extends StoredProps> {
  title: string;
  definition: P;
  inputs: ReactiveDefinition<P>;
}

const lookup = {
  StringType: literal('string'),
  BooleanType: literal('boolean'),
  NumberType: literal('number'),
  ArrayType: literal('array'),
};

export default createComponent({
  props: {
    sections: { type: Array as () => Array<Section<StoredProps>>, required: true },
  },
  setup(props) {
    return {
      processed: computed(() => {
        return props.sections.map((section) => {
          return {
            title: section.title,
            inputs: keys(section.definition).map((key): Input | undefined => {
              const definition = section.definition[key];
              if (!definition.expose) {
                return;
              }

              let type: Input['type'] = lookup[section.definition[key].type._tag];
              if (definition.options) {
                if (type === 'string') {
                  type = 'select';
                } else {
                  // TODO invalid options
                  return;
                }
              }

              return {
                type,
                value: section.inputs[key],
                label: definition.label,
                description: Marked.parse(definition.description),
              };
            }).filter((input) => input),
          };
        }).sort((a, b) => {
          return a.title.localeCompare(b.title);
        });
      }),
    };
  },
});
</script>

<style lang="sass" scoped>

</style>