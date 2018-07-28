<p align="center">
  <a href="http://goldenpassport.com" target="_blank">
    <img src="https://avatars0.githubusercontent.com/u/29756034?v=4&s=100">
  </a>
</p>

<p align="center">  
  <a href="https://travis-ci.org/GoldenPassport/vue-meteor-reactive-promise-calls">
    <img src="https://img.shields.io/travis/GoldenPassport/vue-meteor-reactive-promise-calls.svg" alt="Travis CI">
  </a>

  <a href="https://www.npmjs.com/package/vuetify">
    <img src="https://img.shields.io/npm/v/vue-meteor-reactive-promise-calls.svg" alt="Version">
  </a>

  <a href="https://www.npmjs.com/package/vuetify">
    <img src="https://img.shields.io/npm/dm/vue-meteor-reactive-promise-calls.svg" alt="Downloads">
  </a>
</p>

# vue-meteor-reactive-promise-calls

Utilities for reactive promise-based Meteor method calls. If you want to call server methods using async / await this is the package for you. 

---

<br>

## 0. Background

Meteor's client side publish / subscribe capability is great, but there are occasions (e.g. security) where you may need to process data purely on the server and have only the result sent back to the client. Hence, the need to be able to synchronously call server-side Meteor methods from the client.

This NPM package looks to address this challenge by adding a number of Meteor functions (e.g. Meteor.callPromise), which can be used universally in your app. Additionally, this package can be added as a Vue plugin and called directly within your components (e.g. this.$callPromise).

Allowing you to do this:

```js
// e.g. Notes.vue
export default {
  async created() {
    // Calling meteor method from the client
    const notes = await this.$callPromise('notes.list');
  }
};
```

<br>

## 1. Getting Started

These instructions will get you a copy of the package up and running on your local machine. 

### 1.1 Installation
To get vue-meteor-reactive-promise-calls:
```
$ meteor npm i --save vue-meteor-reactive-promise-calls
```

### 1.2 Two Approaches
This package includes two approaches: [Meteor Function](#2-meteor-function) or [Vue Plugin](#3-vue-plugin).

N.B. Both the Meteor functions and Vue plugin can be used within components, but only the Meteor functions can be used universally (e.g. outside of the Vue instance).

<br>

## 2. Meteor Function
### 2.1 API
^ Required

| API | Parameters | Description |
| ------ | ------ | ------ |
| **Meteor.callPromise** | [Method&nbsp;String^],<br>[Parameters&nbsp;String/Object] | The same as Meteor.call, but you omit the callback parameter, and it returns a Promise for the result. |
| **Meteor.reactivelyCallPromise** | [VueComponent&nbsp;Object^],<br>[DataField&nbsp;String^],<br>[Method&nbsp;String^],<br>[Refresh&nbsp;Number],<br>[Parameters&nbsp;String/Object] | The same as Meteor.callPromise, but is reactive. |
| **Meteor.stopReactivePromiseCalls** | [VueComponent&nbsp;Object^] |Stop all Meteor.reactivelyCallPromise calls. |
| **Meteor.stopReactivePromiseCall** | [VueComponent&nbsp;Object^],<br>[Method&nbsp;String^] | Stop a specific Meteor.reactivelyCallPromise call. |
| **Meteor.pauseReactivePromiseCalls** | [VueComponent&nbsp;Object^] | Pause a specific Meteor.reactivelyCallPromise call. |
| **Meteor.pauseReactivePromiseCall** | [VueComponent&nbsp;Object^],<br>[Method&nbsp;String^],<br>[DataField&nbsp;String^] | Pause a specific Meteor.reactivelyCallPromise call. |
| **Meteor.resumeReactivePromiseCalls** | [VueComponent&nbsp;Object^]| Resume all Meteor.reactivelyCallPromise calls. |
| **Meteor.resumeReactivePromiseCall** | [VueComponent&nbsp;Object^],<br>[Method&nbsp;String^],<br>[DataField&nbsp;String^]  | Resume a specific Meteor.reactivelyCallPromise call. |

### 2.2 Example Code
The example below illustrates how to reactively call a server method from within a VUE file. FYI - code is based on this demo project [Demo](https://github.com/meteor-vue/vue-meteor-demo).

Step 1: Import package during startup (e.g. client.js)

```javascript
(async function () {
  // Dynamic import style
  import('vue-meteor-reactive-promise-calls');
  // Regular import
  // import 'vue-meteor-reactive-promise-calls'
  
  import('intersection-observer');
  import('vue-googlemaps/dist/vue-googlemaps.css');

  const { Meteor } = await import('meteor/meteor');
  const CreateApp = (await import('./app')).default;


  Meteor.startup(() => {
    CreateApp({
      ssr: false,
    })
  })
})();
```

Step 2: Utilise the methods in a component (e.g. notes.vue)

```javascript
<script>
import { Meteor } from 'meteor/meteor'
import { Notes } from '../api/collections'

export default {
  data () {

    return {
      newNote: '',
      notes: [],
      limit: 5,
    }
  },

  watch: {
    // On dialog close
    listDialog(pVal) {
      if (!pVal) {
        // Example of how to resume passed calls (e.g. after a modal is closed and a user returns to the parent screen.)
        Meteor.resumeReactivePromiseCalls(this.$parent);
      }
    }
  },

  mounted() {
    // Example of a standard Meteor Method call returning a promise
    this.notes = await Meteor.callPromise('notes.list', 5);

    // Example of a reactive Meteor Method call returning a promise
    Meteor.reactivelyCallPromise(this, 'notes', 3000, 'notes.list', { limit: this.limit });


    // Example - if the current component is a modal / dialog and is loaded over another page that have active calls. It is therefore best to temporarily pause the.
    Meteor.pauseReactivePromiseCalls(this.$parent);

    // Or pause just a specific method call
    Meteor.pauseReactivePromiseCall(this.$parent, 'notes.list', 'notes');
  },

  beforeDestroy() {
    // Don't forget to stop all timeouts
    Meteor.stopReactivePromiseCalls(this);
  },

  methods: {
    async addNote () {
      if (this.newNote) {
        try {
          this.newNote = await Meteor.callPromise('notes.add', {
            text: this.newNote,
          });
        } catch (e) {
          console.error(e);
        }
      }
    },

    async removeNote (note) {
      try {
        await Meteor.callPromise('notes.remove', {
          _id: note._id,
        });

        this.notes = await Meteor.callPromise('notes.list', this.limit);
      } catch (e) {
        console.error(e);
      }
    },

    handleVisibility (visible) {
      if (visible) {
        this.limit += 5;
        // Now that you have scrolled to the bottom of the page call the method with the new limit
        // N.B. Package will auto stop the old Meteor method call
        Meteor.reactivelyCallPromise(this, 'notes', 3000, 'notes.list', { limit: this.limit });
      }
    },
  },
}
</script>
```

<br>

## 3. Vue Plugin
### 3.1 API
^ Required

| API | Parameters | Description |
| ------ | ------ | ------ |
| **$callPromise** | [Method&nbsp;String^],<br>[Parameters&nbsp;String/Object] | The same as Meteor.call, but you omit the callback parameter, and it returns a Promise for the result. |
| **$reactivelyCallPromise** | [DataField&nbsp;String^],<br>[Method&nbsp;String^],<br>[Refresh&nbsp;Number],<br>[Parameters&nbsp;String/Object] | The same as $callPromise, but is reactive. |
| **$stopReactivePromiseCalls** ||Stop all $reactivelyCallPromise calls. |
| **$stopReactivePromiseCall** | [Method&nbsp;String^] | Stop a specific $reactivelyCallPromise call. |
| **$pauseReactivePromiseCalls** || Pause a specific $reactivelyCallPromise call. |
| **$pauseReactivePromiseCall** | [Method&nbsp;String^],<br>[DataField&nbsp;String^] | Pause a specific $reactivelyCallPromise call. |
| **$resumeReactivePromiseCalls** || Resume all $reactivelyCallPromise calls. |
| **$resumeReactivePromiseCall** | [Method&nbsp;String^],<br>[DataField&nbsp;String^]  | Resume a specific $reactivelyCallPromise call. |

### 3.2 Example Code
The example below illustrates how to reactively call a server method from within a VUE file. FYI - code is based on this demo project [Demo](https://github.com/meteor-vue/vue-meteor-demo).

Step 1: Add plugin to Vue instance during startup

```javascript
import Vue from 'vue';
import VueMeteorReactivePromiseCalls from 'vue-meteor-reactive-promise-calls';

Vue.use(VueMeteorReactivePromiseCalls);
```

Step 2: Utilise the methods in a component (e.g. notes.vue)

```javascript
<script>
import { Meteor } from 'meteor/meteor'
import { Notes } from '../api/collections'

export default {
  data () {
    return {
      newNoteDialog: true,
      newNote: '',
      notes: [],
      limit: 5,
    }
  },

  watch: {
    // On dialog close
    listDialog(pVal) {
      if (!pVal) {
        // Example of how to resume passed calls (e.g. after a modal is closed and a user returns to the parent screen.)
        this.$parent.$resumeReactivePromiseCalls();
      }
    }
	},

  mounted() {
    // Example of a standard call returning a promise
    this.notes = await this.$callPromise('notes.list', 5);

    // Example of a reactive call returning a promise
    this.$reactivelyCallPromise('notes', 3000, 'notes.list', { limit: this.limit });

    // Example - if the current component is a modal / dialog and is loaded over another page that have active calls. It is therefore best to temporarely pause the.
    this.$parent.$pauseReactivePromiseCalls();
  },

  beforeDestroy() {
    // Don't forget to stop all calls
    this.$stopReactivePromiseCalls();
  },

  methods: {
    async addNote () {
      if (this.newNote) {
        try {
          this.newNote = await this.$callPromise('notes.add', {
            text: this.newNote,
          });
        } catch (e) {
          console.error(e);
        }
      }
    },

    async removeNote (note) {
      try {
        await Meteor.callPromise('notes.remove', {
          _id: note._id,
        });

        this.notes = await this.$callPromise('notes.list', this.limit);
      } catch (e) {
        console.error(e);
      }
    },

    handleVisibility (visible) {
      if (visible) {
        this.limit += 5;
        // Now that you have scrolled to the bottom of the page call the method with the new limit
        // N.B. Package will auto stop the old Meteor method call
        this.$reactivelyCallPromise('notes', 3000, 'notes.list', { limit: this.limit });
      }
    },
  },
}
</script>
```

<br>

## 4. Authors
* **@gp-awesome** - *Initial work* - [GitHub](https://github.com/gp-awesome)

See also the list of [contributors](https://github.com/GoldenPassport/vue-meteor-reactive-promise-calls/graphs/contributors) who participated in this project.

<br>

## 5. Acknowledgments

* Hat tip to anyone who's code was used
* [deanius/meteor-promise](https://github.com/deanius/meteor-promise)
