<template>
  <v-app>
    <v-app-bar>
      <v-app-bar-title>Wiba</v-app-bar-title>
    </v-app-bar>

    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'PublicLayout'
})
</script> 