<template>
  <v-container>
    <v-layout row>
      <v-flex xs12 sm6 offset-sm3>
        <v-card>
          <v-toolbar color="#4e94f3" dark>
            <v-text-field 
            label="Input Store's name or Store's address..." 
            :v-model="txtQuery" @keyup.enter="clickedOnSearch"
            prepend-icon="store"
            @input="onInput"
            >
            </v-text-field>            
            <v-btn icon @click="clickedOnSearch">
              <v-icon>search</v-icon>
            </v-btn>
          </v-toolbar>
          <v-list two-line v-if="stores.length">
            <template v-for="(item, i) in stores">
              <v-list-tile :key="item.name" avatar>
                <v-list-tile-avatar tile>
                  <img :src="item.imageLogo"/>
                </v-list-tile-avatar>
                <v-list-tile-content>
                  <v-list-tile-title v-html="item.name"></v-list-tile-title>
                  <v-list-tile-sub-title v-html="item.address"></v-list-tile-sub-title>
                </v-list-tile-content>
              </v-list-tile>
              <v-divider :key="i"></v-divider>
            </template>
          </v-list>
        </v-card>
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script>
  import axios from "axios"
  export default {
    
    data: () => ({  
      txtQuery:'',
      imageBaseUrl:"https://image.mozocoin.io/api/public/eec12af2c0c4c7d1468c5b532714b631762416c8.png",    
      stores: []
    }),
    methods: {
      onInput(str){
        this.txtQuery = str;
      },
      clickedOnSearch: function() {
        axios.get('https://dev.gateway.mozocoin.io/searchstoredemo/api/public/store/_search/store-infos?query='+ this.txtQuery)
        .then(response => {
          console.log(process.VUE_APP_BASE_URI)
          this.stores = response.data
          console.log(this.stores)
        })
      }
    }
  }
</script>

<style>

</style>
