const Component = {
  name: 'Base',
  template:
    `<div>
    	<p>The message from the parent: {{message}}</p>
      <button @click="$emit('update', 'hello! from the child!')">click me</button>
      <a id="test-anchor" href="#" @click.prevent>Click me, for a native event!</a>
    	<div class="default"><slot/></div>
      <div>something between the slots</div>
      <div class="test"><slot name="test" /></div>
      <div> And a scoped slot: </div>
      <div class="with-scope"><slot name="withScope" :message="message" /></div>
    </div>`,
  props: ['message'],
};

const HOC = createHOC(Component, {
  created() {
    console.log(`greetings from ${this.$options.name}`);
  },

  /*
   * The `createRenderFn` helper create a render function that:
   * - passes in all attrs, props and listeners that were defined on the component
   * - merge those with any attrs, props and listeners passed to this function
   * - normalize and pass on normal slots
   * - pass on scoped slots

  render: createRenderFn(Component, {
    props: {
    	myProp: this.$store.getters('someGetter')
    }
  })
  */
  /*
   * If you want / have to create your own render function, you can use the
   * `normalizeSlots` helper function to prepare slots to pass them:
   render(h) {
     return h(Component, {
     	// it's up to you what to pass on in the data object
      // e.g. don't pass on attrs or props from the parent,
      // and only pass on what you define in the HOC
     }, normalizeSlots(this.$slots))
   }

  */


});

function createHOC(component, options = {}) {
  const hoc = {
    // copy props from the wrapped component
    props: typeof component === 'function'
      ? component.options.props
      : component.props,
    created() {
      // we use the parent's $createElement instead of our own
      // this is necessary so that the wrapped component can properly resolve the slots.
      this.$createElement = this.$parent.$createElement;
    },
    render: createRenderFn(component),
  };

  // add this object as a mixin to the options for the hoc that the function received
  if (!options.mixins) { options.mixins = []; }
  options.mixins.push(hoc);
  // create a component name
  options.name = component.name ? component.name + 'HOC' : 'AnonymousHOC';

  return options;
}

function normalizeSlots(slots) {
  return Object.keys(slots)
    .reduce((arr, key) => arr.concat(slots[key]), []);
}

function createRenderFn(component, {
  attrs = {},
  listeners = {},
  props = {},
} = {}) {
  return function(h) {
    return h(component, {
        attrs: Object.assign({}, this.$attrs, attrs), // pass on attributes (anything not defined as a prop)
        on: Object.assign({}, this.$listeners, listeners), // pass on v-on event listeners
        props: Object.assign({}, this.$props, props), // pass on props
        scopedSlots: this.$scopedSlots, // pass on scoped slots
      }, normalizeSlots(this.$slots)); // pass on normal slots, ass an array
  };
}
