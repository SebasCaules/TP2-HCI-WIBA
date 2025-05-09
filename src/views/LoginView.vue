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
              Iniciar sesión
            </v-btn>
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
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { authService } from '@/services/auth'
import { useAuthStore } from '@/store/auth'
import EmailInput from '@/components/ui/EmailInput.vue'
import PasswordInput from '@/components/ui/PasswordInput.vue'

const router = useRouter()
const authStore = useAuthStore()
const form = ref()
const email = ref('')
const password = ref('')
const loading = ref(false)

const handleSubmit = async () => {
  // No validación extra, los componentes ya validan
  loading.value = true
  try {
    const response = await authService.login(email.value, password.value)
    if (response.success && response.user) {
      authStore.setUser(response.user)
      router.push('/dashboard')
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