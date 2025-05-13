<template>
  <v-container class="login-bg fill-height" fluid>
    <v-row justify="center" align="center" class="fill-height">
      <v-col cols="12" sm="8" md="5" lg="4">
        <v-card class="pa-8 login-bg-card" elevation="0">
          <div class="text-center mb-2">
            <h1 class="login-title mb-1">WIBA</h1>
            <div class="login-subtitle mb-6">Virtual Wallet Application</div>
          </div>
          <v-form @submit.prevent="handleSubmit" ref="form">
            <CustomTextField
              v-model="email"
              label="Email"
              type="email"
              placeholder="nombre@ejemplo.com"
              :error="!!emailError"
              :errorMessage="emailError"
              autocomplete="email"
            />
            <CustomTextField
              v-model="password"
              label="Contraseña"
              type="password"
              placeholder="••••••••"
              :error="!!passwordError"
              :errorMessage="passwordError"
              autocomplete="current-password"
            >
              <template #right="{ isPasswordVisible }">
                <v-icon
                  :icon="isPasswordVisible ? 'mdi-eye-off' : 'mdi-eye'"
                  style="cursor: pointer; color: var(--muted-text);"
                />
              </template>
            </CustomTextField>
            <FilledButton
              type="submit"
              class="login-btn mb-4"
              :disabled="loading"
              @click="handleSubmit"
              :fullWidth="true"
            >
              {{ loading ? 'Iniciando sesión...' : 'Iniciar sesión' }}
            </FilledButton>
          </v-form>
          <div class="text-center mt-2">
            <span>¿No tienes una cuenta?</span>
            <router-link to="/register" class="login-link">Regístrate</router-link>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { authService } from '@/services/auth'
import { useAuthStore } from '@/store/auth'
import CustomTextField from '@/components/ui/CustomTextField.vue'
import FilledButton from '@/components/ui/FilledButton.vue'

const router = useRouter()
const authStore = useAuthStore()
const form = ref()
const email = ref('')
const password = ref('')
const loading = ref(false)
const emailError = ref('')
const passwordError = ref('')

const validateForm = () => {
  let valid = true
  emailError.value = ''
  passwordError.value = ''

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!email.value.trim()) {
    emailError.value = 'El email es obligatorio.'
    valid = false
  } else if (!emailRegex.test(email.value)) {
    emailError.value = 'Ingresá un email válido.'
    valid = false
  }

  if (!password.value.trim()) {
    passwordError.value = 'La contraseña es obligatoria.'
    valid = false
  } else if (password.value.length < 6) {
    passwordError.value = 'La contraseña debe tener al menos 6 caracteres.'
    valid = false
  }

  return valid
}

const handleSubmit = async () => {
  if (!validateForm()) return
  loading.value = true
  try {
    const response = await authService.login(email.value, password.value)
    if (response.success && response.user) {
      authStore.setUser(response.user)
      router.push('/dashboard')
    } else {
      // Show error message
      if (response.message?.includes('Invalid login credentials')) {
        emailError.value = 'Email o contraseña incorrectos.'
        passwordError.value = 'Email o contraseña incorrectos.'
      } else {
        emailError.value = response.message || 'Error al iniciar sesión'
      }
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
  margin-top: 0.5rem;
  font-size: 1.1rem;
  font-weight: 700;
  height: 50px;
  width: 100%;
  align-self: stretch;
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