<template>
  <v-card class="investment-card">
    <v-card-title class="d-flex justify-space-between align-center">
      <div>
        <div class="text-h6">{{ investment.name }}</div>
        <div class="text-subtitle-2 text-medium-emphasis">{{ investment.symbol }}</div>
      </div>
      <v-avatar color="primary" size="40">
        <span class="text-h6">{{ investment.symbol.charAt(0) }}</span>
      </v-avatar>
    </v-card-title>

    <v-card-text>
      <div class="d-flex justify-space-between align-center mb-4">
        <div>
          <div class="text-caption text-medium-emphasis">Precio Actual</div>
          <div class="text-h5">{{ formatCurrency(investment.current_price ?? 0) }}</div>
        </div>
        <div class="text-right">
          <div class="text-caption text-medium-emphasis">Variación</div>
          <div
            :class="[
              'text-h6',
              (investment.variation_percentage ?? 0) >= 0 ? 'text-success' : 'text-error'
            ]"
          >
            {{ formatPercentage(investment.variation_percentage ?? 0) }}
          </div>
        </div>
      </div>

      <div class="chart-wrapper">
        <InvestmentChart :stock="investment" />
      </div>

      <div v-if="investment.quantity" class="mt-4">
        <v-divider class="mb-4"></v-divider>
        <div class="d-flex justify-space-between">
          <div>
            <div class="text-caption text-medium-emphasis">Cuotapartes</div>
            <div class="text-body-1">{{ formatNumber(investment.quantity ?? 0) }}</div>
          </div>
          <div class="text-right">
            <div class="text-caption text-medium-emphasis">Valor Total</div>
            <div class="text-body-1">{{ formatCurrency(investment.total_value ?? 0) }}</div>
          </div>
        </div>
      </div>
    </v-card-text>

    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn
        v-if="investment.quantity"
        color="error"
        variant="text"
        @click="$emit('sell', investment)"
      >
        Vender
      </v-btn>
      <v-btn
        color="primary"
        @click="$emit('buy', investment)"
      >
        {{ investment.quantity ? 'Comprar más' : 'Comprar' }}
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import { type Stock } from '@/services/investments'
import InvestmentChart from './InvestmentChart.vue'

const props = defineProps<{
  investment: Stock & {
    quantity?: number;
    total_value?: number;
  }
}>()

defineEmits<{
  (e: 'buy', investment: Stock): void;
  (e: 'sell', investment: Stock): void;
}>()

const formatCurrency = (value: number) => {
  return `$${value.toFixed(2)}`
}

const formatPercentage = (value: number) => {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
}

const formatNumber = (value: number) => {
  return value.toFixed(6)
}
</script>

<style scoped>
.investment-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.chart-wrapper {
  height: 300px;
  margin: 0 -16px;
}

.text-success {
  color: #4CAF50;
}

.text-error {
  color: #FF5252;
}
</style> 