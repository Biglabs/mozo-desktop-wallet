<template>
  <v-app  id="inspire">
    <v-content>
      <search/>
    </v-content>
  </v-app>
</template>

<script>
import Search from './components/Search'

export default {
  name: 'App',
  components: {
    Search
  },
  data () {
    return {
      //
    }
  }
}
</script>
