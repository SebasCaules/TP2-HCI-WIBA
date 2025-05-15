<template>
  <v-container fluid class="dashboard-main">
    <!-- Primera fila con balance y columna lateral -->
    <v-row class="dashboard-row" no-gutters>
      <!-- Columna principal -->
      <v-col cols="12" md="8" class="pr-md-8">
        <div class="dashboard-balance-card">
          <div class="dashboard-balance-inner">
            <div class="dashboard-balance-label">Saldo</div>
            <div class="dashboard-balance-value">
              <template v-if="loading">
                Cargando...
              </template>
              <template v-else-if="error">
                {{ error }}
              </template>
              <template v-else>
                <div class="balance-container">
                  <span v-if="isBalanceVisible">
                    $ {{ Number(balance).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}
                  </span>
                  <span v-else>
                    $ ********
                  </span>
                  <v-btn
                    icon
                    variant="text"
                    class="balance-toggle-btn"
                    @click="toggleBalanceVisibility"
                  >
                    <v-icon>{{ isBalanceVisible ? 'mdi-eye' : 'mdi-eye-off' }}</v-icon>
                  </v-btn>
                </div>
              </template>
            </div>
            <div class="dashboard-actions">
              <IconFilledButton icon="mdi-arrow-down" class="dashboard-action-btn" @click="$router.push('/dashboard/depositar')">
                Depositar
              </IconFilledButton>
              <IconFilledButton icon="mdi-arrow-right" class="dashboard-action-btn" @click="$router.push('/dashboard/transferir')">
                Transferir
              </IconFilledButton>
              <IconFilledButton icon="mdi-wallet" class="dashboard-action-btn">
                Cobrar
              </IconFilledButton>
            </div>
          </div>
        </div>
        <div class="dashboard-section mt-8">
          <div class="dashboard-section-header">
            <span class="dashboard-section-title">Movimientos Recientes</span>
            <a href="/dashboard/transacciones" class="dashboard-link">Ver todo <v-icon size="16">mdi-chevron-right</v-icon></a>
          </div>
          <v-list class="dashboard-list">
            <v-list-item v-for="(tx, i) in transactions" :key="i" class="dashboard-list-item">
              <template #prepend>
                <v-icon :color="tx.amount < 0 ? 'error' : 'success'" size="20">
                  {{ tx.amount > 0 ? 'mdi-arrow-bottom-right' : 'mdi-arrow-top-right' }}
                </v-icon>
              </template>
              <v-list-item-title class="dashboard-list-title">{{ tx.description }}</v-list-item-title>
              <v-list-item-subtitle class="dashboard-list-date">{{ formatDate(tx.created_at) }}</v-list-item-subtitle>
              <template #append>
                <span :class="['dashboard-list-amount', tx.amount < 0 ? 'negative' : 'positive']">
                  {{ tx.amount < 0 ? '- ' : '' }}${{ Math.abs(tx.amount).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}
                </span>
              </template>
            </v-list-item>
          </v-list>
        </div>
      </v-col>
      <!-- Columna lateral -->
      <v-col cols="12" md="4" class="dashboard-sidebar">
        <div class="dashboard-invest-card">
          <div class="dashboard-invest-header">
            <div class="dashboard-invest-row">
              <span class="dashboard-invest-title">Inversiones</span>
              <a href="/dashboard/inversiones" class="dashboard-link-header">Ver más <v-icon size="16">mdi-chevron-right</v-icon></a>
            </div>
            <div class="dashboard-invest-row">
              <div class="dashboard-invest-value">${{ 873.06.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</div>
              <div class="dashboard-invest-gain">${{ 3.50.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }} (0,40%)</div>
            </div>
          </div>
          <div class="dashboard-invest-body">
            <div class="dashboard-invest-chart">
              <!-- Gráfico circular simple -->
              <svg width="90" height="90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="16" fill="none" stroke="#e5e7eb" stroke-width="3" />
                <circle cx="18" cy="18" r="16" fill="none" stroke="#fbbf24" stroke-width="3" stroke-dasharray="39.5 60.5" stroke-dashoffset="25" />
                <circle cx="18" cy="18" r="16" fill="none" stroke="#22c55e" stroke-width="3" stroke-dasharray="60.5 39.5" stroke-dashoffset="64.5" />
              </svg>
              <div class="dashboard-invest-legend">
                <div><span class="legend-dot" style="background:#fbbf24"></span> 39.50% - Bonos</div>
                <div><span class="legend-dot" style="background:#22c55e"></span> 60.50% - Acciones</div>
              </div>
            </div>
          </div>
        </div>
        <div class="dashboard-section mt-8">
          <div class="dashboard-section-header" style="margin-bottom: 0.5rem;">
            <span class="dashboard-section-title">Contactos</span>
            <v-btn variant="text" color="primary" class="dashboard-seeall-btn" @click="$router.push('/dashboard/contactos')">
              Ver todos
              <v-icon size="16">mdi-chevron-right</v-icon>
            </v-btn>
          </div>
          <v-list class="dashboard-contacts-list">
            <v-list-item v-for="(c, i) in contacts.slice(0, 3)" :key="i" class="dashboard-contact-item">
              <div style="display: flex; align-items: center;">
                <div class="dashboard-contact-avatar">
                  {{ c.initials }}
                </div>
                <v-list-item-title class="dashboard-contact-name">
                  {{ c.first_name }} {{ c.last_name }}
                </v-list-item-title>
              </div>
            </v-list-item>
          </v-list>
        </div>
      </v-col>
    </v-row>

    <!-- Segunda fila con pago de servicios -->
    <v-row class="dashboard-row mt-8" no-gutters>
      <v-col cols="12">
        <div class="dashboard-section">
          <div class="dashboard-section-header">
            <span class="dashboard-section-title">Pago de Servicios</span>
            <a href="/dashboard/pagos" class="dashboard-link">Ver más<v-icon size="16">mdi-chevron-right</v-icon></a>
          </div>
          <div class="dashboard-services-carousel-wrapper">
            <v-slide-group class="dashboard-services-group" show-arrows>
              <v-slide-group-item v-for="(bill, i) in bills" :key="i">
                <div class="dashboard-service-card">
                  <div class="dashboard-service-header">
                    <div class="dashboard-service-header-left">
                      <span class="dashboard-service-title">{{ bill.title }}</span>
                      <span class="dashboard-service-provider">{{ bill.provider }}</span>
                    </div>
                    <div class="dashboard-service-header-right">
                      <a href="/dashboard/pagos" class="dashboard-link-header">Pagar</a>
                    </div>
                  </div>
                  <div class="dashboard-service-body">
                    <div class="dashboard-service-amount">${{ bill.amount.toLocaleString('es-AR') }}</div>
                    <div class="dashboard-service-date">{{ bill.due_date }}</div>
                  </div>
                </div>
              </v-slide-group-item>
            </v-slide-group>
          </div>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '@/store/auth'
import IconFilledButton from '@/components/ui/IconFilledButton.vue'
import { fetchDashboardData } from '@/services/dashboard'
import type { Contact } from '@/types/types'
import type { DashboardData } from '@/services/dashboard'

const authStore = useAuthStore()
const userId = computed(() => authStore.user?.id)
const loading = ref(true)
const error = ref<string | null>(null)
const dashboardData = ref<DashboardData | null>(null)

const contacts = ref<Contact[]>([])
const isBalanceVisible = ref(true)

async function loadContacts() {
  if (!userId.value) return;
  try {
    const { contacts: fetchedContacts } = await fetchDashboardData(userId.value);
    contacts.value = fetchedContacts;
  } catch (e) {
    console.error('Error loading contacts:', e);
    contacts.value = [];
  }
}

async function fetchData() {
  loading.value = true
  error.value = null
  if (!userId.value) {
    error.value = 'Usuario no autenticado'
    loading.value = false
    return
  }
  try {
    dashboardData.value = await fetchDashboardData(userId.value)
    await loadContacts()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Error al cargar los datos'
    console.error('Error fetching dashboard data:', e)
  } finally {
    loading.value = false
  }
}

onMounted(fetchData)

const balance = computed(() => dashboardData.value?.account.balance ?? null)
const transactions = computed(() => dashboardData.value?.transactions ?? [])
const bills = computed(() => dashboardData.value?.bills ?? [])

function formatDate(timestamp: string): string {
  if (!timestamp) return 'Fecha no disponible';
  const parsedDate = new Date(timestamp);
  return isNaN(parsedDate.getTime()) ? 'Fecha inválida' : parsedDate.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

function toggleBalanceVisibility() {
  isBalanceVisible.value = !isBalanceVisible.value
}

</script>

<style scoped>
.dashboard-main {
  background: var(--background);
  min-height: 100vh;
}
.dashboard-row {
  margin-top: 0;
}
.dashboard-balance-card {
  background: var(--card);
  border-radius: var(--radius-lg);
  box-shadow: 0 2px 16px 0 rgba(60,60,60,0.06);
  padding: 2rem;
  margin-bottom: 1.5rem;
  width: 100%;
}
.dashboard-balance-inner {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}
.dashboard-balance-label {
  color: var(--muted-text);
  font-weight: 500;
  font-size: 1.1rem;
}
.dashboard-balance-value {
  font-size: 2.2rem;
  font-weight: 700;
  margin-bottom: 1.2rem;
}
.dashboard-actions {
  display: flex;
  gap: 1rem;
  margin-top: 0.2rem;
  margin-bottom: 0;
  align-items: center;
  padding-left: 0;
}
.dashboard-action-btn {
  border-radius: 2rem;
  min-width: 180px;
  font-weight: 500;
  /* El color y hover lo da .primary-btn */
  background: none;
  color: inherit;
  border: none;
  box-shadow: none;
  padding: 0;
}
.primary-btn {
  background: var(--primary);
  color: var(--primary-foreground);
  font-weight: 500;
  border-radius: var(--radius-md);
  transition: background-color 0.3s;
  cursor: pointer;
  border: none;
  outline: none;
  padding: 0.5rem 2rem;
  font-size: 1rem;
  margin-right: 0.5rem;
}
.primary-btn:hover {
  background: var(--hover);
}
.primary-btn:focus {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}
.dashboard-section {
  margin-bottom: 1.5rem;
  width: 100%;
}
.dashboard-section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}
.dashboard-section-title {
  color: var(--muted-text);
  font-weight: 600;
  font-size: 1.2rem;
}
.dashboard-link {
  color: var(--primary);
  font-size: 0.95rem;
  text-decoration: none;
  display: flex;
  align-items: center;
}
.dashboard-link-header {
  color: white;
  font-size: 0.95rem;
  text-decoration: none;
  display: flex;
  align-items: center;
}
.dashboard-list {
  background: transparent;
}
.dashboard-list-item {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 16px;
  align-items: center;
  padding: 12px 0;
}
.dashboard-list-title {
  font-weight: 600;
}
.dashboard-list-date {
  color: var(--muted-text);
  font-size: 0.95rem;
}
.dashboard-list-amount {
  min-width: 120px;
  text-align: right;
  font-weight: 600;
  font-size: 1.1rem;
}
.dashboard-list-amount.negative {
  color: var(--error);
}
.dashboard-list-amount.positive {
  color: var(--success);
}
.dashboard-invest-card {
  background: var(--card);
  border-radius: var(--radius-lg);
  box-shadow: 0 2px 16px 0 rgba(60,60,60,0.06);
  margin-bottom: 1.5rem;
  padding: 0;
}
.dashboard-invest-header {
  background: var(--primary);
  color: var(--primary-foreground);
  border-top-left-radius: var(--radius-lg);
  border-top-right-radius: var(--radius-lg);
  padding: 1.2rem 1.5rem 1rem 1.5rem;
  font-weight: 600;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.dashboard-invest-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}
.dashboard-invest-title {
  font-size: 1.2rem;
  font-weight: 600;
}
.dashboard-invest-value {
  font-size: 1.5rem;
  font-weight: 700;
}
.dashboard-invest-gain {
  color: var(--primary-foreground);
  font-weight: 500;
  text-align: right;
}
.dashboard-invest-body {
  padding: 1.2rem 1.5rem 1.5rem 1.5rem;
}
.dashboard-invest-chart {
  display: flex;
  align-items: center;
  gap: 1.2rem;
  margin-top: 1rem;
}
.dashboard-invest-legend {
  font-size: 0.95rem;
  color: var(--muted-text);
}
.legend-dot {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-right: 6px;
}
.dashboard-contacts-list {
  background: transparent;
}
.dashboard-contact-item {
  display: flex;
  align-items: center;
  border-bottom: 1px solid var(--border);
  padding: 0.5rem 0;
}
.dashboard-contact-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: #444;
  font-size: 1.1rem;
  margin-right: 16px;
}
.dashboard-contact-name {
  margin-left: 8px;
  display: flex;
  align-items: center;
}
.dashboard-services-carousel-wrapper {
  width: 100%;
  max-width: 75vw;
  overflow-x: hidden;
  box-sizing: border-box;
}
.dashboard-services-group {
  width: 100%;
  margin: 0;
  padding: 0 8px;
}
.dashboard-service-card {
  width: 300px;
  min-width: 300px;
  max-width: 300px;
  margin-right: 16px;
  background: var(--card);
  border-radius: var(--radius-lg);
  box-shadow: 0 2px 8px 0 rgba(60,60,60,0.08);
  padding: 0;
  display: flex;
  flex-direction: column;
}
.dashboard-service-header {
  background: var(--primary);
  color: var(--primary-foreground);
  border-top-left-radius: var(--radius-lg);
  border-top-right-radius: var(--radius-lg);
  padding: 0.8rem 1.2rem 0.5rem 1.2rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  font-weight: 600;
}
.dashboard-service-header-left {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}
.dashboard-service-header-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}
.dashboard-service-title {
  font-size: 1.05rem;
  color: var(--primary-foreground);
}
.dashboard-service-provider {
  font-size: 0.95rem;
  color: var(--primary-foreground);
  margin-bottom: 0.2rem;
}
.dashboard-service-pay {
  font-size: 0.95rem;
  text-decoration: underline;
  cursor: pointer;
  color: var(--primary-foreground);
}
.dashboard-service-body {
  background: var(--card);
  color: var(--card-foreground);
  border-bottom-left-radius: var(--radius-lg);
  border-bottom-right-radius: var(--radius-lg);
  padding: 1rem 1.2rem;
}
.dashboard-service-amount {
  font-size: 1.2rem;
  font-weight: 700;
}
.dashboard-service-date {
  font-size: 0.95rem;
  color: var(--muted-text);
}
.dashboard-sidebar {
  position: sticky;
  top: 24px;
  height: fit-content;
}
.dashboard-seeall-btn {
  font-family: var(--font-sans), sans-serif;
  font-size: 1rem;
  font-weight: 500;
  text-transform: none;
  letter-spacing: normal;
  padding: 0 0.5rem;
  min-width: 0;
  color: var(--primary) !important;
}
.balance-container {
  display: flex;
  align-items: center;
  gap: 8px;
}

.balance-toggle-btn {
  color: var(--muted-text);
  opacity: 0.7;
  transition: opacity 0.2s;
}

.balance-toggle-btn:hover {
  opacity: 1;
}
</style> 