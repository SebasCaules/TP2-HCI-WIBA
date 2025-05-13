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
            <div class="forgot-password-link">
              <a href="#" @click.prevent="showResetDialog = true">¿Olvidaste tu contraseña?</a>
            </div>
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
            <span>¿No tenés una cuenta?</span>
            <router-link to="/register" class="login-link">Registrate</router-link>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Password Reset Dialog -->
    <v-dialog v-model="showResetDialog" max-width="400px">
      <v-card class="reset-dialog">
        <div class="reset-dialog-content">
          <h2 class="reset-dialog-title">Restablecer contraseña</h2>
          <p class="reset-dialog-subtitle">
            Ingresá tu email y te enviaremos instrucciones para restablecer tu contraseña.
          </p>
          <CustomTextField
            v-model="resetEmail"
            label="Email"
            type="email"
            placeholder="nombre@ejemplo.com"
            :error="!!resetError"
            :errorMessage="resetError"
            class="reset-email-input"
            autocomplete="email"
          />
          <div class="reset-dialog-actions">
            <FilledButton
              class="reset-submit-btn"
              :loading="isResetting"
              :disabled="!resetEmail || isResetting"
              @click="handleResetPassword"
            >
              Enviar instrucciones
            </FilledButton>
            <button
              class="reset-cancel-btn"
              @click="showResetDialog = false"
              :disabled="isResetting"
            >
              Cancelar
            </button>
          </div>
          <div v-if="resetSuccess" class="reset-success-message">
            {{ resetSuccess }}
          </div>
        </div>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { authService } from '@/services/auth'
import { useAuthStore } from '@/store/auth'
import CustomTextField from '@/components/ui/CustomTextField.vue'
import FilledButton from '@/components/ui/FilledButton.vue'
import BackButton from '@/components/ui/BackButton.vue'

const router = useRouter()
const authStore = useAuthStore()
const form = ref()
const email = ref('')
const password = ref('')
const loading = ref(false)
const emailError = ref('')
const passwordError = ref('')

// Password reset state
const showResetDialog = ref(false)
const resetEmail = ref('')
const resetError = ref('')
const resetSuccess = ref('')
const isResetting = ref(false)

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

const handleResetPassword = async () => {
  resetError.value = ''
  resetSuccess.value = ''
  isResetting.value = true

  try {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!resetEmail.value.trim()) {
      resetError.value = 'El email es obligatorio.'
      return
    }
    if (!emailRegex.test(resetEmail.value)) {
      resetError.value = 'Ingresá un email válido.'
      return
    }

    const response = await authService.resetPassword(resetEmail.value)
    if (response.success) {
      resetSuccess.value = response.message
      resetEmail.value = ''
      // Close dialog after 3 seconds
      setTimeout(() => {
        showResetDialog.value = false
        resetSuccess.value = ''
      }, 3000)
    } else {
      resetError.value = response.message || 'Error al solicitar el restablecimiento de contraseña'
    }
  } finally {
    isResetting.value = false
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

.forgot-password-link {
  text-align: center;
  margin-top: -0.5rem;
  margin-bottom: 1rem;
}

.forgot-password-link a {
  color: var(--primary);
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 600;
}

.forgot-password-link a:hover {
  text-decoration: underline;
}

/* Reset Dialog styles */
.reset-dialog {
  border-radius: 16px;
  padding: 2rem;
}

.reset-dialog-content {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.reset-dialog-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text);
  margin: 0;
  text-align: center;
  margin-bottom: -0.2rem;
}

.reset-dialog-subtitle {
  color: var(--muted-text);
  text-align: center;
  margin: 0;
  font-size: 0.95rem;
  margin-bottom: -0.2rem;
}

.reset-email-input {
  margin-top: 0.2rem;
}

.reset-dialog-actions {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  margin-top: -0.6rem;
}

.reset-submit-btn {
  width: 100%;
  height: 48px;
  font-size: 1rem;
  font-weight: 600;
}

.reset-cancel-btn {
  background: none;
  border: none;
  color: var(--muted-text);
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  padding: 0.5rem;
  width: 100%;
}

.reset-cancel-btn:hover {
  color: var(--text);
}

.reset-cancel-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.reset-success-message {
  color: var(--success);
  text-align: center;
  font-size: 0.95rem;
  margin-top: 0.5rem;
}
</style> 