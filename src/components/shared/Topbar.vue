<template>
  <v-app-bar class="topbar" flat>
    <v-app-bar-title class="topbar-title">WIBA</v-app-bar-title>
    <v-spacer />
    <v-menu
      v-model="showMenu"
      :close-on-content-click="false"
      location="bottom end"
      transition="scale-transition"
    >
      <template v-slot:activator="{ props }">
        <div class="topbar-user-container" v-bind="props">
          <span class="user-name">{{ userName }}</span>
          <v-btn
            icon
            class="user-chevron-btn"
          >
            <v-icon class="user-chevron" :class="{ 'menu-open': showMenu }">mdi-chevron-down</v-icon>
          </v-btn>
        </div>
      </template>
      <v-card class="user-menu" min-width="320">
        <div class="user-menu-header">
          <div class="user-menu-info">
            <div class="user-menu-label">Usuario</div>
            <div class="user-menu-value-container">
              <span class="user-menu-value">{{ username }}</span>
              <v-icon
                size="small"
                class="copy-icon"
                :color="copySuccess.username ? 'success' : 'var(--primary)'"
                @click="copyToClipboard(username)"
              >
                {{ copySuccess.username ? 'mdi-check' : 'mdi-content-copy' }}
              </v-icon>
            </div>
          </div>
          <div class="user-menu-info">
            <div class="user-menu-label">Cuenta</div>
            <div class="user-menu-value-container">
              <span class="user-menu-value">{{ accountNumber }}</span>
              <v-icon
                size="small"
                class="copy-icon"
                :color="copySuccess.account ? 'success' : 'var(--primary)'"
                @click="copyToClipboard(accountNumber)"
              >
                {{ copySuccess.account ? 'mdi-check' : 'mdi-content-copy' }}
              </v-icon>
            </div>
          </div>
        </div>
        <v-divider />
        <div class="user-menu-actions">
          <router-link to="/dashboard/configuracion" class="user-menu-action">
            <v-icon size="small" color="var(--primary)">mdi-cog</v-icon>
            <span>Configuración</span>
          </router-link>
          <button class="user-menu-action" @click="handleLogout">
            <v-icon size="small" color="var(--primary)">mdi-logout</v-icon>
            <span>Cerrar sesión</span>
          </button>
        </div>
      </v-card>
    </v-menu>
  </v-app-bar>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useAuthStore } from '@/store/auth'
import { useRouter, useRoute } from 'vue-router'
import { supabase } from '@/plugins/supabase'

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()
const showMenu = ref(false)
const accountNumber = ref('')
const username = ref('')
const copySuccess = ref({
  username: false,
  account: false
})

const userName = computed(() => authStore.user?.name || 'Usuario')

async function fetchUserData() {
  if (!authStore.user?.id) return
  const { data, error } = await supabase
    .from('users')
    .select('username, accounts(account_number)')
    .eq('id', authStore.user.id)
    .single()
  
  if (!error && data) {
    username.value = data.username
    if (data.accounts && Array.isArray(data.accounts) && data.accounts.length > 0) {
      accountNumber.value = data.accounts[0].account_number
    }
  }
}

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    const key = text === username.value ? 'username' : 'account'
    copySuccess.value[key] = true
    setTimeout(() => {
      copySuccess.value[key] = false
    }, 2000)
  } catch (err) {
    console.error('Failed to copy text:', err)
  }
}

function handleLogout() {
  authStore.clearUser()
  router.push('/login')
}

// Close menu when route changes
watch(() => route.path, () => {
  showMenu.value = false
})

onMounted(fetchUserData)
</script>

<style scoped>
.topbar {
  background: var(--card);
  color: var(--primary);
  border-bottom: 1px solid var(--border);
}
.topbar-title {
  font-weight: 700;
  font-size: 1.3rem;
  color: var(--primary);
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
}
.topbar-user-container {
  display: flex;
  align-items: center;
  margin-right: 2rem;
  gap: 0.5rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 8px;
  transition: background-color 0.2s ease;
}
.topbar-user-container:hover {
  background: var(--background);
}
.user-name {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--primary);
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: inline-block;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
}
.user-chevron-btn {
  color: var(--primary);
  background: transparent !important;
  box-shadow: none !important;
  min-width: 32px !important;
  width: 32px !important;
  height: 32px !important;
  padding: 0 !important;
}
.user-chevron {
  color: var(--primary);
  opacity: 0.8;
  transition: all 0.2s ease;
}
.user-chevron-btn:hover .user-chevron {
  opacity: 1;
}
.user-chevron.menu-open {
  transform: rotate(180deg);
}
.user-menu {
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  background: var(--card);
}
.user-menu-header {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.user-menu-info {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
.user-menu-label {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--muted-text);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
}
.user-menu-value-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--background);
  padding: 0.6rem 0.8rem;
  border-radius: 8px;
  border: 1px solid var(--border);
}
.user-menu-value {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text);
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  flex: 1;
}
.copy-icon {
  opacity: 0.7;
  cursor: pointer;
  transition: all 0.2s ease;
}
.copy-icon:hover {
  opacity: 1;
}
.user-menu-actions {
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.user-menu-action {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  text-decoration: none;
  border: none;
  background: none;
  width: 100%;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.2s ease;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
}
.user-menu-action span {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--primary);
}
.user-menu-action:hover {
  background: var(--background);
}
</style> 