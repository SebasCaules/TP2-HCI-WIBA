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
              <span class="user-menu-value">{{ accountCvu }}</span>
              <v-icon
                size="small"
                class="copy-icon"
                :color="copySuccess.account ? 'success' : 'var(--primary)'"
                @click="copyToClipboard(accountCvu)"
              >
                {{ copySuccess.account ? 'mdi-check' : 'mdi-content-copy' }}
              </v-icon>
            </div>
          </div>
          <div class="user-menu-info">
            <div class="user-menu-label">Alias</div>
            <div class="user-menu-value-container">
              <template v-if="editingAlias">
                <v-text-field
                  v-model="editedAlias"
                  density="compact"
                  variant="plain"
                  hide-details
                  style="flex: 1"
                  :error-messages="aliasError"
                  @keyup.enter="saveAlias"
                />
                <v-icon 
                  class="copy-icon" 
                  @click="saveAlias"
                  :color="aliasError ? 'error' : 'success'"
                >
                  mdi-check
                </v-icon>
                <v-icon
                  size="small"
                  class="copy-icon"
                  @click="() => { editingAlias = false; aliasError = '' }"
                >
                  mdi-close
                </v-icon>
              </template>
              <template v-else>
                <span class="user-menu-value">{{ accountAlias }}</span>
                <v-icon
                  size="small"
                  class="copy-icon"
                  :color="copySuccess.alias ? 'success' : 'var(--primary)'"
                  @click="copyToClipboard(accountAlias)"
                >
                  {{ copySuccess.alias ? 'mdi-check' : 'mdi-content-copy' }}
                </v-icon>
                <v-icon
                  size="small"
                  class="copy-icon"
                  @click="() => { editedAlias = accountAlias; editingAlias = true }"
                >
                  mdi-pencil
                </v-icon>
              </template>
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
import { useSecurityStore } from '@/stores/securityStore'
import { useAccountStore } from '@/stores/accountStore'
import { UserApi } from '@/api/user'
import { useRouter, useRoute } from 'vue-router'

const securityStore = useSecurityStore()
const accountStore = useAccountStore()
const router = useRouter()
const route = useRoute()
const showMenu = ref(false)
const copySuccess = ref({
  username: false,
  account: false,
  alias: false
})

const editingAlias = ref(false)
const editedAlias = ref('')
const aliasError = ref('')

const userName = computed(() => securityStore.user?.firstName || 'Usuario')
const username = computed(() => securityStore.user?.username || 'Username' )
const accountCvu = computed(() => accountStore.account?.cvu || '')
const accountAlias = computed(() => accountStore.account?.alias || '')

async function saveAlias() {
  if (!editedAlias.value || editedAlias.value.trim() === '') {
    aliasError.value = 'El alias no puede estar vacío'
    return
  }

  try {
    await accountStore.updateAlias(editedAlias.value)
    editingAlias.value = false
    aliasError.value = ''
  } catch (err) {
    aliasError.value = err instanceof Error ? err.message : 'Error al actualizar el alias'
  }
}

async function fetchUserData() {
  try {
    const user = await UserApi.get()
    securityStore.setUser(user)
  } catch (err) {
    console.error('Error al obtener datos del usuario:', err)
  }
}

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    const key = text === username.value ? 'username' : text === accountCvu.value ? 'account' : 'alias'
    copySuccess.value[key] = true
    setTimeout(() => {
      copySuccess.value[key] = false
    }, 2000)
  } catch (err) {
    console.error('Failed to copy text:', err)
  }
}

function handleLogout() {
  securityStore.logout()
  router.push('/login')
}

// Close menu when route changes
watch(() => route.path, () => {
  showMenu.value = false
})

onMounted(() => {
  fetchUserData()
  accountStore.fetchAccount()
})
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
  font-family: var(--font-sans);
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
  font-family: var(--font-sans);
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
  font-family: var(--font-sans);
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