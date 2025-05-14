<template>
  <v-container class="settings-container" fluid>
    <div class="settings-content">
      <h1 class="settings-title">Configuración</h1>
      
      <!-- Profile Settings -->
      <v-card class="settings-card">
        <div class="settings-card-header">
          <h2 class="settings-card-title">Perfil</h2>
          <div class="settings-card-subtitle">Actualiza tu información personal</div>
        </div>
        <v-form @submit.prevent="updateProfile" class="settings-form">
          <div class="settings-form-group">
            <CustomTextField
              v-model="profile.firstName"
              label="Nombre"
              placeholder="Tu nombre"
              :error-messages="profileErrors.firstName"
            />
          </div>
          <div class="settings-form-group">
            <CustomTextField
              v-model="profile.lastName"
              label="Apellido"
              placeholder="Tu apellido"
              :error-messages="profileErrors.lastName"
            />
          </div>
          <div class="settings-form-group">
            <CustomTextField
              v-model="profile.username"
              label="Usuario"
              placeholder="Tu nombre de usuario"
              :error-messages="profileErrors.username"
            />
          </div>
          <FilledButton
            type="submit"
            class="settings-submit-btn"
            :loading="isUpdatingProfile"
            :disabled="!isProfileFormValid"
          >
            Guardar cambios
          </FilledButton>
          <div v-if="profileErrors.username || profileErrors.firstName || profileErrors.lastName" class="settings-error-message">
            {{ profileErrors.username || profileErrors.firstName || profileErrors.lastName }}
          </div>
        </v-form>
      </v-card>

      <!-- Password Settings -->
      <v-card class="settings-card">
        <div class="settings-card-header">
          <h2 class="settings-card-title">Contraseña</h2>
          <div class="settings-card-subtitle">Cambia tu contraseña</div>
        </div>
        <v-form @submit.prevent="updatePassword" class="settings-form">
          <div class="settings-form-group">
            <CustomTextField
              v-model="password.current"
              label="Contraseña actual"
              type="password"
              placeholder="Ingresa tu contraseña actual"
              :error-messages="passwordErrors.current"
            />
          </div>
          <div class="settings-form-group">
            <CustomTextField
              v-model="password.new"
              label="Nueva contraseña"
              type="password"
              placeholder="Ingresa tu nueva contraseña"
              :error-messages="passwordErrors.new"
            />
          </div>
          <div class="settings-form-group">
            <CustomTextField
              v-model="password.confirm"
              label="Confirmar contraseña"
              type="password"
              placeholder="Confirma tu nueva contraseña"
              :error-messages="passwordErrors.confirm"
            />
          </div>
          <FilledButton
            type="submit"
            class="settings-submit-btn"
            :loading="isUpdatingPassword"
            :disabled="!isPasswordFormValid"
          >
            Cambiar contraseña
          </FilledButton>
          <div v-if="passwordErrors.current || passwordErrors.new || passwordErrors.confirm" class="settings-error-message">
            {{ passwordErrors.current || passwordErrors.new || passwordErrors.confirm }}
          </div>
        </v-form>
      </v-card>
    </div>

    <!-- Success Dialog -->
    <v-dialog v-model="showSuccessDialog" max-width="400px">
      <v-card class="success-dialog">
        <div class="success-dialog-header">
          <v-btn icon class="dialog-close-btn" @click="showSuccessDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>
        <div class="success-dialog-content">
          <v-icon color="success" size="48">mdi-check-circle</v-icon>
          <div class="success-dialog-title">{{ successMessage }}</div>
        </div>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/store/auth'
import { supabase } from '@/plugins/supabase'
import CustomTextField from '@/components/ui/CustomTextField.vue'
import FilledButton from '@/components/ui/FilledButton.vue'

const authStore = useAuthStore()

// Profile form state
const profile = ref({
  firstName: '',
  lastName: '',
  username: ''
})

const profileErrors = ref({
  firstName: '',
  lastName: '',
  username: ''
})

// Password form state
const password = ref({
  current: '',
  new: '',
  confirm: ''
})

const passwordErrors = ref({
  current: '',
  new: '',
  confirm: ''
})

// UI state
const isUpdatingProfile = ref(false)
const isUpdatingPassword = ref(false)
const showSuccessDialog = ref(false)
const successMessage = ref('')

// Form validation
const isProfileFormValid = computed(() => {
  const hasChanges = 
    profile.value.firstName.trim() !== authStore.user?.name?.split(' ')[0] ||
    profile.value.lastName.trim() !== authStore.user?.name?.split(' ')[1] ||
    profile.value.username.trim() !== authStore.user?.username

  return hasChanges &&
         profile.value.firstName.trim() &&
         profile.value.lastName.trim() &&
         profile.value.username.trim()
})

const isPasswordFormValid = computed(() => {
  const hasNewPassword = password.value.new.trim() && 
                        password.value.new === password.value.confirm &&
                        password.value.new !== password.value.current

  return hasNewPassword &&
         password.value.current.trim() &&
         password.value.new.trim() &&
         password.value.confirm.trim()
})

// Fetch user data
async function fetchUserData() {
  if (!authStore.user?.id) return
  
  const { data, error } = await supabase
    .from('users')
    .select('first_name, last_name, username')
    .eq('id', authStore.user.id)
    .single()
  
  if (!error && data) {
    profile.value = {
      firstName: data.first_name || '',
      lastName: data.last_name || '',
      username: data.username || ''
    }
  }
}

// Update profile
async function updateProfile() {
  if (!authStore.user?.id) return
  
  // Reset all states at the start
  isUpdatingProfile.value = true
  profileErrors.value = { firstName: '', lastName: '', username: '' }
  
  try {
    // Validate username format
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/
    if (!usernameRegex.test(profile.value.username)) {
      profileErrors.value.username = 'El nombre de usuario debe tener entre 3 y 20 caracteres y solo puede contener letras, números y guiones bajos'
      isUpdatingProfile.value = false
      return
    }

    // Check if username is taken (only if it's different from current)
    if (profile.value.username !== authStore.user.username) {
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('username', profile.value.username)
        .neq('id', authStore.user.id)
        .single()
      
      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        throw checkError
      }
      
      if (existingUser) {
        profileErrors.value.username = 'Este nombre de usuario ya está en uso. Por favor, elige otro.'
        isUpdatingProfile.value = false
        return
      }
    }

    // Validate other fields
    if (!profile.value.firstName.trim()) {
      profileErrors.value.firstName = 'El nombre es requerido'
      isUpdatingProfile.value = false
      return
    }

    if (!profile.value.lastName.trim()) {
      profileErrors.value.lastName = 'El apellido es requerido'
      isUpdatingProfile.value = false
      return
    }

    // Update user data
    const { error: updateError } = await supabase
      .from('users')
      .update({
        first_name: profile.value.firstName.trim(),
        last_name: profile.value.lastName.trim(),
        username: profile.value.username.trim()
      })
      .eq('id', authStore.user.id)
    
    if (updateError) {
      throw updateError
    }

    // Update auth store
    authStore.setUser({
      ...authStore.user,
      name: `${profile.value.firstName} ${profile.value.lastName}`,
      username: profile.value.username
    })

    successMessage.value = 'Perfil actualizado correctamente'
    showSuccessDialog.value = true
  } catch (error) {
    console.error('Error updating profile:', error)
    profileErrors.value.username = 'Error al actualizar el perfil. Por favor, intenta nuevamente.'
    isUpdatingProfile.value = false
  }
}

// Update password
async function updatePassword() {
  if (!authStore.user?.email) return
  
  // Reset all states at the start
  isUpdatingPassword.value = true
  passwordErrors.value = { current: '', new: '', confirm: '' }
  
  try {
    // Validate new password first
    if (password.value.new.length < 6) {
      passwordErrors.value.new = 'La contraseña debe tener al menos 6 caracteres'
      isUpdatingPassword.value = false
      return
    }

    if (password.value.new !== password.value.confirm) {
      passwordErrors.value.confirm = 'Las contraseñas no coinciden'
      isUpdatingPassword.value = false
      return
    }

    // Verify current password
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: authStore.user.email,
      password: password.value.current
    })

    // Check for wrong password specifically
    if (signInError) {
      if (signInError.status === 400) {
        passwordErrors.value.current = 'Contraseña actual incorrecta'
      } else {
        passwordErrors.value.current = 'Error al verificar la contraseña'
      }
      isUpdatingPassword.value = false
      return
    }

    // Update password
    const { error: updateError } = await supabase.auth.updateUser({
      password: password.value.new
    })

    if (updateError) {
      passwordErrors.value.new = 'Error al actualizar la contraseña'
      isUpdatingPassword.value = false
      return
    }

    // Success - clear form and show success message
    password.value = { current: '', new: '', confirm: '' }
    successMessage.value = 'Contraseña actualizada correctamente'
    showSuccessDialog.value = true

  } catch (error) {
    console.error('Error updating password:', error)
    passwordErrors.value.new = 'Error al actualizar la contraseña'
  } finally {
    // Always ensure the loading state is cleared
    isUpdatingPassword.value = false
  }
}

onMounted(fetchUserData)
</script>

<style scoped>
.settings-container {
  min-height: 100vh;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  background: var(--background);
  padding: 2rem 1rem;
}

.settings-content {
  max-width: 600px;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.settings-title {
  font-size: 2.2rem;
  font-weight: 800;
  text-align: center;
  margin-bottom: 1rem;
  font-family: var(--font-sans), sans-serif;
  color: var(--text);
}

.settings-card {
  border-radius: 16px;
  overflow: hidden;
  background: var(--card);
  box-shadow: 0 2px 16px 0 rgba(60,60,60,0.10);
}

.settings-card-header {
  padding: 1.5rem 2rem;
  border-bottom: 1px solid var(--border);
}

.settings-card-title {
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--text);
  margin-bottom: 0.5rem;
  font-family: var(--font-sans), sans-serif;
}

.settings-card-subtitle {
  font-size: 0.95rem;
  color: var(--muted-text);
  font-family: var(--font-sans), sans-serif;
}

.settings-form {
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
}

.settings-form-group {
  width: 100%;
}

.settings-submit-btn {
  margin-top: 0.5rem;
  font-size: 1.1rem;
  font-weight: 700;
  height: 50px;
  width: 100%;
}

.success-dialog {
  border-radius: 1.5rem;
  padding: 1.5rem;
  text-align: center;
}

.success-dialog-header {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 1rem;
}

.dialog-close-btn {
  color: var(--muted-text) !important;
  margin-right: -8px;
}

.success-dialog-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.2rem;
  padding: 0 1rem 1rem;
}

.success-dialog-title {
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--primary);
  margin-top: 0.5rem;
  font-family: var(--font-sans), sans-serif;
}

.settings-error-message {
  color: #E53935;
  font-size: 1.02rem;
  margin-top: 0.7rem;
  margin-bottom: 0.5rem;
  text-align: center;
  font-family: var(--font-sans, sans-serif);
}
</style> 