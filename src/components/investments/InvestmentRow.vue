<template>
  <v-list-item
    :title="investment.name"
    :subtitle="investment.symbol"
    class="investment-row"
    @click="openSellDialog"
  >
    <template v-slot:prepend>
      <v-avatar color="primary" size="40">
        <span class="text-h6">{{ investment.symbol.charAt(0) }}</span>
      </v-avatar>
    </template>

    <template v-slot:append>
      <div class="d-flex flex-column align-end">
        <div class="text-body-1 font-weight-medium">
          {{ formatCurrency(investment.current_price) }}
        </div>
        <div
          :class="[
            'text-caption',
            investment.variation_percentage >= 0 ? 'text-success' : 'text-error'
          ]"
        >
          {{ formatPercentage(investment.variation_percentage) }}
        </div>
      </div>
    </template>

    <template v-slot:default>
      <div class="d-flex flex-column">
        <div class="text-body-2">
          Cuotapartes: {{ formatNumber(investment.quantity) }}
        </div>
        <div class="text-body-2">
          Valor total: {{ formatCurrency(investment.total_value) }}
        </div>
      </div>
    </template>
  </v-list-item>

  <InvestmentDialog
    v-model="showSellDialog"
    :is-sell="true"
    :selected-stock="investment"
    :max-shares="investment.quantity"
    @transaction="handleSell"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { type Stock } from '@/services/investments'
import InvestmentDialog from './InvestmentDialog.vue'

const props = defineProps<{
  investment: Stock & {
    quantity: number;
    total_value: number;
  }
}>()

const emit = defineEmits<{
  (e: 'sell', data: { amount: number; shares: number; stockId: number }): void;
}>()

const showSellDialog = ref(false)

const formatCurrency = (value: number) => {
  return `$${value.toFixed(2)}`
}

const formatPercentage = (value: number) => {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
}

const formatNumber = (value: number) => {
  return value.toFixed(6)
}

const openSellDialog = () => {
  showSellDialog.value = true
}

const handleSell = (data: { amount: number; shares: number; stockId: number }) => {
  emit('sell', data)
}
</script>

<style scoped>
.investment-row {
  cursor: pointer;
  transition: background-color 0.2s;
}

.investment-row:hover {
  background-color: rgba(var(--v-theme-primary), 0.05);
}

.text-success {
  color: #4CAF50;
}

.text-error {
  color: #FF5252;
}
</style> 