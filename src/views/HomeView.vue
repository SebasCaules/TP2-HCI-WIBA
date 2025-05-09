<template>
  <v-container class="fill-height">
    <v-row justify="center" align="center">
      <v-col cols="12" sm="8" md="6" lg="4">
        <v-card class="elevation-12">
          <v-card-title class="text-center text-h5 pt-6">
            Bienvenido a Wiba
          </v-card-title>
          <v-card-text class="text-center">
            <p class="text-body-1 mb-4">
              Tu plataforma de gestión financiera
            </p>
            <v-btn
              color="primary"
              to="/login"
              block
              class="mb-2"
            >
              Iniciar Sesión
            </v-btn>
            <v-btn
              variant="outlined"
              to="/register"
              block
            >
              Registrarse
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
// No additional setup needed
</script>

<style scoped>
.v-card {
  border-radius: var(--radius-lg);
}
</style> 