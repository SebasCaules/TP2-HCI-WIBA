<template>
  <v-container class="login-bg fill-height" fluid>
    <v-row justify="center" align="center" class="fill-height">
      <v-col cols="12" sm="8" md="5" lg="4">
        <v-card class="pa-8 login-bg-card" elevation="0">
          <div class="text-center mb-2">
            <h1 class="login-title mb-1">WIBA</h1>
            <div class="login-subtitle mb-6">Virtual Wallet Application</div>
          </div>
          <v-form @submit.prevent="handleRegister" ref="form">
            <div class="mb-4">
              <v-label class="block text-sm font-medium text-label mb-1">Nombre</v-label>
              <v-text-field
                v-model="nombre"
                :error="!!nombreError"
                :error-messages="nombreError"
                placeholder="Tu nombre"
                variant="outlined"
                density="comfortable"
                hide-details="auto"
              />
            </div>
            <div class="mb-4">
              <v-label class="block text-sm font-medium text-label mb-1">Apellido</v-label>
              <v-text-field
                v-model="apellido"
                :error="!!apellidoError"
                :error-messages="apellidoError"
                placeholder="Tu apellido"
                variant="outlined"
                density="comfortable"
                hide-details="auto"
              />
            </div>
            <EmailInput v-model="email" />
            <PasswordInput v-model="password" />
            <v-btn
              type="submit"
              color="primary"
              block
              class="login-btn mb-4"
              :loading="loading"
              size="large"
            >
              Registrarse
            </v-btn>
          </v-form>
          <div class="text-center mt-2">
            <span>¿Ya tenés una cuenta?</span>
            <router-link to="/login" class="login-link">Iniciar sesión</router-link>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import EmailInput from '@/components/ui/EmailInput.vue'
import PasswordInput from '@/components/ui/PasswordInput.vue'
import { authService } from '@/services/auth'

const router = useRouter()
const form = ref()
const nombre = ref('')
const apellido = ref('')
const email = ref('')
const password = ref('')
const nombreError = ref('')
const apellidoError = ref('')
const loading = ref(false)

const validateForm = () => {
  let valid = true
  nombreError.value = ''
  apellidoError.value = ''
  if (!nombre.value.trim()) {
    nombreError.value = 'El nombre es obligatorio.'
    valid = false
  }
  if (!apellido.value.trim()) {
    apellidoError.value = 'El apellido es obligatorio.'
    valid = false
  }
  return valid
}

const handleRegister = async () => {
  if (!validateForm()) return
  loading.value = true
  try {
    const response = await authService.register({
      email: email.value,
      password: password.value,
      name: nombre.value,
      lastName: apellido.value
    })
    if (response.success) {
      router.push('/login')
    } else {
      // Puedes mostrar un alert aquí si quieres
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-bg {
  background: var(--background);
}
.login-bg-card {
  background: var(--card);
  border-radius: var(--radius-lg);
  box-shadow: 0 2px 16px 0 rgba(60, 60, 60, 0.06);
}
.login-title {
  color: var(--primary);
  font-size: 2.5rem;
  font-weight: 700;
  letter-spacing: 1px;
}
.login-subtitle {
  color: var(--muted-text);
  font-size: 1.1rem;
  font-weight: 400;
}
.login-btn {
  background: var(--primary) !important;
  color: var(--primary-foreground) !important;
  border-radius: var(--radius-lg);
  font-size: 1.1rem;
  font-weight: 600;
  text-transform: none;
}
.login-link {
  color: var(--primary);
  font-weight: 500;
  margin-left: 4px;
  text-decoration: none;
}
.login-link:hover {
  text-decoration: underline;
}
</style> 