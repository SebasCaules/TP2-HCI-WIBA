<template>
  <v-container class="login-bg fill-height" fluid>
    <v-row justify="center" align="center" class="fill-height">
      <v-col cols="12" sm="8" md="5" lg="4">
        <BackButton to="/" class="d-flex justify-center" />
        <v-card class="pa-8 login-bg-card" elevation="0">
          <div class="text-center mb-2">
            <h1 class="login-title mb-1">WIBA</h1>
            <div class="login-subtitle mb-6">Virtual Wallet Application</div>
          </div>
          <v-form @submit.prevent="handleRegister" ref="form">
            <CustomTextField
              v-model="nombre"
              label="Nombre"
              placeholder="Tu nombre"
              :error="!!nombreError"
              :errorMessage="nombreError"
              autocomplete="given-name"
            />
            <CustomTextField
              v-model="apellido"
              label="Apellido"
              placeholder="Tu apellido"
              :error="!!apellidoError"
              :errorMessage="apellidoError"
              autocomplete="family-name"
            />
            <CustomTextField
              v-model="username"
              label="Nombre de usuario"
              placeholder="Tu nombre de usuario"
              :error="!!usernameError"
              :errorMessage="usernameError"
              autocomplete="username"
            />
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
              autocomplete="new-password"
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
              @click="handleRegister"
              :fullWidth="true"
            >
              {{ loading ? 'Registrando...' : 'Registrarse' }}
            </FilledButton>
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
import CustomTextField from '@/components/ui/CustomTextField.vue'
import FilledButton from '@/components/ui/FilledButton.vue'
import BackButton from '@/components/ui/BackButton.vue'
import { authService } from '@/services/auth'

const router = useRouter()
const form = ref()
const nombre = ref('')
const apellido = ref('')
const username = ref('')
const email = ref('')
const password = ref('')
const nombreError = ref('')
const apellidoError = ref('')
const usernameError = ref('')
const emailError = ref('')
const passwordError = ref('')
const loading = ref(false)

const validateForm = () => {
  let valid = true
  nombreError.value = ''
  apellidoError.value = ''
  usernameError.value = ''
  emailError.value = ''
  passwordError.value = ''

  if (!nombre.value.trim()) {
    nombreError.value = 'El nombre es obligatorio.'
    valid = false
  }
  if (!apellido.value.trim()) {
    apellidoError.value = 'El apellido es obligatorio.'
    valid = false
  }

  if (!username.value.trim()) {
    usernameError.value = 'El nombre de usuario es obligatorio.'
    valid = false
  } else {
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/
    if (!usernameRegex.test(username.value)) {
      usernameError.value = 'El nombre de usuario debe tener entre 3 y 20 caracteres y solo puede contener letras, números y guiones bajos.'
      valid = false
    }
  }

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
  } else {
    const errors = []
    if (password.value.length < 6) errors.push('Al menos 6 caracteres')
    if (!/[A-Z]/.test(password.value)) errors.push('Una letra mayúscula')
    if (!/\d/.test(password.value)) errors.push('Un número')
    if (errors.length > 0) {
      passwordError.value = errors.join(', ')
      valid = false
    }
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
      lastName: apellido.value,
      username: username.value
    })
    if (response.success) {
      router.push('/login')
    } else {
      if (response.message?.includes('already registered')) {
        emailError.value = 'Este email ya está registrado.'
      } else if (response.message?.includes('username')) {
        usernameError.value = 'Este nombre de usuario ya está en uso.'
      } else {
        emailError.value = response.message || 'Error al registrar'
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