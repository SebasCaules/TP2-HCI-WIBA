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
              v-model="birthDate"
              label="Fecha de nacimiento"
              placeholder="dd/mm/aaaa"
              :error="!!birthDateError"
              :errorMessage="birthDateError"
              autocomplete="bdate"
              @input="formatBirthDate"
              @blur="validateBirthDateOnBlur"
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
import { UserApi } from '@/api/user.ts'

const router = useRouter()
const form = ref<HTMLFormElement | null>(null)
const nombre = ref('')
const apellido = ref('')
const email = ref('')
const password = ref('')
const nombreError = ref('')
const apellidoError = ref('')
const emailError = ref('')
const passwordError = ref('')
const birthDate = ref('')
const birthDateError = ref('')
const loading = ref(false)

const menuOpen = ref(false)

const validateForm = (): boolean => {
  let valid = true
  nombreError.value = ''
  apellidoError.value = ''
  emailError.value = ''
  passwordError.value = ''
  birthDateError.value = ''

  if (!nombre.value.trim()) {
    nombreError.value = 'El nombre es obligatorio.'
    valid = false
  }
  if (!apellido.value.trim()) {
    apellidoError.value = 'El apellido es obligatorio.'
    valid = false
  }

  if (!birthDate.value) {
    birthDateError.value = 'La fecha de nacimiento es obligatoria.'
    valid = false
  } else if (birthDateError.value) {
    valid = false
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

const handleRegister = async (): Promise<void> => {
  if (!validateForm()) return
  loading.value = true
  try {
    const isoBirthDate = formatBirthDateToISO(birthDate.value)
    if (!isoBirthDate) {
      birthDateError.value = 'Formato de fecha inválido. Usá dd/mm/aaaa.'
      loading.value = false
      return
    }

    const registrationData = {
      name: nombre.value,
      firstName: nombre.value,
      lastName: apellido.value,
      birthDate: isoBirthDate,
      email: email.value,
      password: password.value,
      metadata: {}
    }
    
    await UserApi.createUser(registrationData)
    router.push(`/confirmacion?email=${encodeURIComponent(email.value)}`)
  } catch (error: any) {
    if (error.code === 400) {
      // Manejar errores de validación específicos
      if (error.description?.toLowerCase().includes('email')) {
        emailError.value = 'Este email ya está registrado o no es válido.'
      } else if (error.description?.toLowerCase().includes('username')) {
        // No username field anymore, so no error set here
      } else if (error.description?.toLowerCase().includes('password')) {
        passwordError.value = 'La contraseña no cumple con los requisitos mínimos.'
      } else {
        emailError.value = error.description || 'Error al registrar el usuario.'
      }
    } else {
      emailError.value = 'Error al registrar el usuario. Por favor, intenta nuevamente.'
    }
  } finally {
    loading.value = false
  }
}

function formatBirthDateToISO(dateStr: string): string | null {
  const parts = dateStr.split('/')
  if (parts.length !== 3) return null

  const [day, month, year] = parts.map(p => p.padStart(2, '0'))
  if (!/^\d{2}$/.test(day) || !/^\d{2}$/.test(month) || !/^\d{4}$/.test(year)) return null

  return `${year}-${month}-${day}`
}

function formatBirthDate(e: Event) {
  const input = (e.target as HTMLInputElement)
  let value = input.value.replace(/\D/g, '')
  if (value.length >= 3 && value.length <= 4)
    value = value.replace(/^(\d{2})(\d{1,2})/, '$1/$2')
  else if (value.length > 4)
    value = value.replace(/^(\d{2})(\d{2})(\d{1,4})/, '$1/$2/$3')
  input.value = value
  birthDate.value = value

  if (value.length === 10) {
    validateBirthDateOnBlur()
  }
}

function validateBirthDateOnBlur() {
  birthDateError.value = ''
  if (!birthDate.value) return

  const parts = birthDate.value.split('/')
  if (parts.length !== 3) {
    birthDateError.value = 'Formato de fecha inválido. Usá dd/mm/aaaa.'
    return
  }

  const [day, month, year] = parts.map(Number)

  if (month < 1 || month > 12) {
    birthDateError.value = 'El mes es inválido.'
    return
  }

  // Chequeo días válidos por mes
  const daysInMonth = new Date(year, month, 0).getDate()
  if (day < 1 || day > daysInMonth) {
    birthDateError.value = 'La fecha es inválida.'
    return
  }

  const birth = new Date(year, month - 1, day)
  const today = new Date()
  const age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  const dayCheck = today.getDate() - birth.getDate()
  const is18 = age > 18 || (age === 18 && (m > 0 || (m === 0 && dayCheck >= 0)))

  if (!is18) {
    birthDateError.value = 'Debés tener al menos 18 años para registrarte.'
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
  box-shadow: var(--shadow-card);
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