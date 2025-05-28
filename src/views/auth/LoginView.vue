<template>
  <v-container class="login-bg" fluid>
    <v-row justify="center" align="center" class="ma-0">
      <v-col cols="12" sm="8" md="5" lg="4">
        <BackButton to="/" class="d-flex justify-center" />
        <v-card class="pa-8 login-bg-card" elevation="0">
          <div class="text-center mb-2">
            <h1 class="login-title mb-1">WIBA</h1>
            <div class="login-subtitle mb-6">Billetera Electrónica</div>
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
            <ErrorMessage :message="apiError" />
            <div class="forgot-password-link">
              <a href="#" @click.prevent="showResetDialog = true">¿Olvidaste tu contraseña?</a>
            </div>
            <FilledButton
              type="submit"
              class="login-btn mb-4"
              :disabled="loading"
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
          <div class="reset-dialog-header">
            <h2 class="reset-dialog-title">Restablecer contraseña</h2>
            <v-btn icon class="dialog-close-btn" @click="showResetDialog = false">
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </div>
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
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useSecurityStore } from '@/stores/securityStore.ts'
import type { Credentials } from '@/api/user.ts'
import CustomTextField from '@/components/ui/CustomTextField.vue'
import FilledButton from '@/components/ui/FilledButton.vue'
import BackButton from '@/components/ui/BackButton.vue'
import ErrorMessage from '@/components/ui/ErrorMessage.vue'

const router = useRouter()
const securityStore = useSecurityStore()
const form = ref<HTMLFormElement | null>(null)
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

const apiError = ref('')

const errorCodeMessages = {
    400: "Los datos ingresados son inválidos. Por favor, verifica tu email y contraseña.",
    401: "Email o contraseña incorrectos.",
    500: "Email o contraseña incorrectos."
} as const;

const validateForm = (): boolean => {
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

const handleSubmit = async (): Promise<void> => {
  if (!validateForm()) return
  loading.value = true
  apiError.value = ''
  emailError.value = ''
  passwordError.value = ''

  try {
    const credentials: Credentials = {
      email: email.value,
      password: password.value
    }
    
    await securityStore.login(credentials, true)
    
    const user = await securityStore.getCurrentUser()
    if (!user) {
      throw new Error('No se pudo obtener la información del usuario')
    }

    await router.push('/dashboard')

  } catch (error) {
    console.error('Error durante el login:', error);
    
    if (error instanceof Error) {
      // Check if it's an API error with a code
      const errorObj = error as { code?: number; message?: string };
      
      if (errorObj.code && errorObj.code in errorCodeMessages) {
        apiError.value = errorCodeMessages[errorObj.code as keyof typeof errorCodeMessages];
      } else if (error.message.includes('No se pudo obtener la información del usuario')) {
        apiError.value = 'Error al obtener la información del usuario. Por favor, intenta nuevamente.';
      } else {
        // Default error message for any other error
        apiError.value = 'Email o contraseña incorrectos.';
      }
    } else {
      // Default error message for unknown errors
      apiError.value = 'Email o contraseña incorrectos.';
    }
  } finally {
    loading.value = false
  }
}

const handleResetPassword = async (): Promise<void> => {
  resetError.value = ''
  resetSuccess.value = ''
  isResetting.value = true
  apiError.value = ''

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

    await securityStore.resetPasswordRequest(resetEmail.value)
    resetSuccess.value = 'Se han enviado las instrucciones a tu correo electrónico.'
    setTimeout(() => {
      showResetDialog.value = false
      resetEmail.value = ''
      resetSuccess.value = ''
      router.push('/reset-password')
    }, 3000)
  } catch (err: any) {
    console.error('Error requesting password reset:', err)
    const errorObj = err as { code?: number; message?: string };
    
    if (errorObj.code && errorObj.code in errorCodeMessages) {
      resetError.value = errorCodeMessages[errorObj.code as keyof typeof errorCodeMessages];
    } else {
      resetError.value = securityStore.error || 'Error al solicitar el restablecimiento de contraseña.';
    }
  } finally {
    isResetting.value = false
  }
}
</script>

<style scoped>
.login-bg {
  background: var(--background);
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
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
  border-radius: 1.5rem;
  padding: 1.5rem;
  text-align: center;
}

.reset-dialog-content {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.reset-dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.dialog-close-btn {
  color: var(--muted-text) !important;
  margin-right: -8px;
}

.reset-dialog-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text);
  margin: 0;
}

.reset-dialog-subtitle {
  color: var(--muted-text);
  text-align: center;
  margin: 0;
  font-size: 0.95rem;
  margin-bottom: 1rem;
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

.reset-success-message {
  color: var(--success);
  text-align: center;
  font-size: 0.95rem;
  margin-top: 0.5rem;
}
</style> 