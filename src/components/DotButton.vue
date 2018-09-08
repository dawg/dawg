<template>
  <v-btn icon @click="handleClick">
    <icon name="circle" scale="0.4" :color="color"></icon>
  </v-btn>
</template>

<script>
export default {
  name: 'DotButton',
  data() {
    return {
      active: true,
    };
  },
  methods: {
    handleClick() {
      this.active = !this.active;
      this.$emit('click');
    },
  },
  computed: {
    color() {
      if (this.active) {
        return '#00ff51';
      }

      return null;
    },
  },
};
</script>
