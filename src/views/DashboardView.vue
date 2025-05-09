<template>
  <v-container fluid class="dashboard-main">
    <v-row class="dashboard-row" no-gutters>
      <!-- Columna principal -->
      <v-col cols="12" md="8" class="pr-md-8">
        <div class="dashboard-balance-card">
          <div class="dashboard-balance-label">Saldo</div>
          <div class="dashboard-balance-value">$ 2.598,57</div>
          <div class="dashboard-actions">
            <button class="primary-btn dashboard-action-btn"><v-icon left>mdi-arrow-down</v-icon>Depositar</button>
            <button class="primary-btn dashboard-action-btn"><v-icon left>mdi-arrow-right</v-icon>Transferir</button>
            <button class="primary-btn dashboard-action-btn"><v-icon left>mdi-wallet</v-icon>Cobrar</button>
          </div>
        </div>
        <div class="dashboard-section mt-8">
          <div class="dashboard-section-header">
            <span class="dashboard-section-title">Movimientos Recientes</span>
            <a href="#" class="dashboard-link">Ver todo <v-icon size="16">mdi-chevron-right</v-icon></a>
          </div>
          <v-list class="dashboard-list">
            <v-list-item v-for="(tx, i) in transactions" :key="i" class="dashboard-list-item">
              <template #prepend>
                <v-icon :color="tx.type === 'deposit' ? 'primary' : 'grey'" size="20">
                  {{ tx.type === 'deposit' ? 'mdi-arrow-down-right' : 'mdi-arrow-up-right' }}
                </v-icon>
              </template>
              <v-list-item-title class="dashboard-list-title">{{ tx.description }}</v-list-item-title>
              <v-list-item-subtitle class="dashboard-list-date">{{ tx.date }}</v-list-item-subtitle>
              <template #append>
                <span :class="['dashboard-list-amount', tx.amount < 0 ? 'negative' : 'positive']">
                  {{ tx.amount < 0 ? '- ' : '+ ' }}${{ Math.abs(tx.amount).toFixed(2) }}
                </span>
              </template>
            </v-list-item>
          </v-list>
        </div>
        <div class="dashboard-section mt-8">
          <div class="dashboard-section-title">Pago de Servicios</div>
          <v-slide-group class="dashboard-services-group" show-arrows>
            <v-slide-group-item v-for="(bill, i) in bills" :key="i">
              <div class="dashboard-service-card">
                <div class="dashboard-service-header">
                  <div>
                    <span class="dashboard-service-title">{{ bill.title }}</span>
                    <span class="dashboard-service-provider">{{ bill.provider }}</span>
                  </div>
                  <span class="dashboard-service-pay">Pagar</span>
                </div>
                <div class="dashboard-service-body">
                  <div class="dashboard-service-amount">${{ bill.amount.toLocaleString('es-AR') }}</div>
                  <div class="dashboard-service-date">{{ bill.due_date }}</div>
                </div>
              </div>
            </v-slide-group-item>
          </v-slide-group>
        </div>
      </v-col>
      <!-- Columna lateral -->
      <v-col cols="12" md="4">
        <div class="dashboard-invest-card">
          <div class="dashboard-invest-header">
            <span>Inversiones</span>
            <a href="#" class="dashboard-link">Ver más <v-icon size="16">mdi-chevron-right</v-icon></a>
            <div class="dashboard-invest-value">$ 873,06</div>
            <div class="dashboard-invest-gain">+ $3,50 (0,40%)</div>
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
          <div class="dashboard-section-title">Contactos</div>
          <v-list class="dashboard-contacts-list">
            <v-list-item v-for="(c, i) in contacts" :key="i" class="dashboard-contact-item">
              <template #prepend>
                <div class="dashboard-contact-avatar">{{ c.initials }}</div>
              </template>
              <v-list-item-title>{{ c.name }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '@/store/auth'

const authStore = useAuthStore()
const userName = computed(() => authStore.user?.name || 'Usuario')

const transactions = [
  { description: 'Starbucks', date: '4/3/2025', amount: -7.94, type: 'deposit' },
  { description: 'Starbucks', date: '4/3/2025', amount: -7.94, type: 'deposit' },
  { description: 'Harvey Specter', date: '3/27/2025', amount: -12.78, type: 'transfer' },
  { description: 'Harvey Specter', date: '3/27/2025', amount: -12.78, type: 'transfer' },
  { description: 'Uber', date: '3/24/2025', amount: -5.90, type: 'deposit' },
]
const bills = [
  { title: 'ITBA - Inst Tecn Bs As', provider: 'ITBA', amount: 1534000, due_date: '4/10/2025' },
  { title: 'ARCA - Monot Fisc', provider: 'ARCA (Ex AFIP)', amount: 53467, due_date: '4/24/2025' },
  { title: 'Factura Edenor', provider: 'Edenor', amount: 23700, due_date: '6/8/2025' },
]
const contacts = [
  { name: 'Harvey Specter', initials: 'HS' },
  { name: 'Rachel Zane', initials: 'RZ' },
  { name: 'Katrina Bennett', initials: 'KB' },
]
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
  margin-bottom: 0.5rem;
}
.dashboard-action-btn {
  border-radius: 2rem;
  min-width: 140px;
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
.dashboard-list {
  background: transparent;
}
.dashboard-list-item {
  display: flex;
  align-items: center;
  border-bottom: 1px solid var(--border);
  padding: 0.5rem 0;
}
.dashboard-list-title {
  font-weight: 600;
  margin-right: 1rem;
}
.dashboard-list-date {
  color: var(--muted-text);
  font-size: 0.95rem;
  margin-right: 1rem;
}
.dashboard-list-amount {
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
  gap: 0.2rem;
}
.dashboard-invest-header a,
.dashboard-invest-header span,
.dashboard-invest-header .dashboard-invest-value,
.dashboard-invest-header .dashboard-invest-gain {
  color: var(--primary-foreground) !important;
}
.dashboard-invest-value {
  font-size: 1.5rem;
  font-weight: 700;
}
.dashboard-invest-gain {
  color: var(--success);
  font-weight: 500;
  margin-bottom: 0.5rem;
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
  background: var(--icon-muted);
  color: var(--card-foreground);
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 1rem;
  margin-right: 10px;
}
.dashboard-services-group {
  margin-top: 0.5rem;
}
.dashboard-service-card {
  background: var(--card);
  border-radius: var(--radius-lg);
  box-shadow: 0 2px 8px 0 rgba(60,60,60,0.08);
  margin-right: 1rem;
  padding: 0;
  min-width: 220px;
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
</style> 