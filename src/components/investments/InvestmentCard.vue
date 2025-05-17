<template>
  <div class="dashboard-invest-card">
      <div class="dashboard-invest-header">
          <div class="dashboard-invest-title">{{ title }}</div>
          <div class="dashboard-invest-summary">
              <span class="dashboard-invest-value">
                  {{ formatMoney(totalBalance) }}
              </span>
              <span class="dashboard-invest-gain">
                  {{ percentageChange >= 0 ? '+' : '' }}{{ formatMoney(totalGain) }}
                  ({{ percentageChange >= 0 ? '+' : '' }}{{ formatPercent(percentageChange) }})
              </span>
          </div>
          <div v-if="showBalance" class="dashboard-invest-balance-row">
              <span class="dashboard-invest-balance-label">Saldo disponible:</span>
              <span class="dashboard-invest-balance-value">
                  {{ formatMoney(balance ?? 0) }}
              </span>
          </div>
      </div>
      <div class="dashboard-invest-body">
          <div class="dashboard-invest-chart" style="position: relative">
              <svg
                  :width="size"
                  :height="size"
                  :viewBox="`0 0 36 36`"
                  style="z-index: 1"
              >
                  <circle
                      cx="18"
                      cy="18"
                      r="16"
                      fill="none"
                      stroke="#e5e7eb"
                      stroke-width="3"
                  />
                  <template v-for="(slice, idx) in chartSlices" :key="slice.type">
                      <circle
                          cx="18"
                          cy="18"
                          r="16"
                          fill="none"
                          :stroke="String(slice.color)"
                          stroke-width="3"
                          :stroke-dasharray="
                              slice.percent + ' ' + (100 - slice.percent)
                          "
                          :stroke-dashoffset="slice.offset"
                          @mousemove="showTooltip($event, slice)"
                          @mouseleave="hideTooltip"
                          style="cursor: pointer"
                      />
                  </template>
              </svg>
              <div
                  v-if="tooltip.show"
                  class="dashboard-invest-tooltip"
                  :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }"
              >
                  <strong>{{ tooltip.label }}</strong
                  ><br />
                  {{ formatPercent(tooltip.percent) }}<br />
                  {{ formatMoney(tooltip.value) }}
              </div>
              <div class="dashboard-invest-legend">
                  <div v-for="slice in chartSlices" :key="slice.type">
                      <span
                          class="legend-dot"
                          :style="{ background: String(slice.color) }"
                      ></span>
                      {{ formatPercent(slice.percent) }} - {{ slice.label }}
                  </div>
              </div>
          </div>
      </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { getPortfolio } from '@/services/investments'
import { investmentTypeColors, investmentTypeLabels } from '@/types/types'

const props = defineProps<{
  userId: string
  showBalance?: boolean
  balance?: number
  size?: number
  title?: string
}>()

const title = props.title || 'Inversiones'
const size = props.size || 160

const portfolio = ref<any[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

onMounted(async () => {
  try {
      loading.value = true
      portfolio.value = await getPortfolio(props.userId)
  } catch (e: any) {
      error.value = e.message || 'Error al cargar inversiones'
  } finally {
      loading.value = false
  }
})

const investments = computed(() => portfolio.value)

const totalBalance = computed(() => {
  return investments.value.reduce((sum, inv) => sum + inv.total_value, 0)
})

const totalInitialBalance = computed(() => {
  return investments.value.reduce((sum, inv) => {
      const initial = inv.total_value / (1 + inv.variation_percentage / 100)
      return sum + initial
  }, 0)
})

const totalGain = computed(() => {
  return totalBalance.value - totalInitialBalance.value
})

const percentageChange = computed(() => {
  return totalInitialBalance.value > 0
      ? (totalGain.value / totalInitialBalance.value) * 100
      : 0
})

const chartSlices = computed(() => {
  const total = totalBalance.value
  const grouped: Record<string, number> = {}
  investments.value.forEach(inv => {
      const type = inv.stock?.symbol ?? 'FND-A'
      grouped[type] = (grouped[type] || 0) + (inv.total_value ?? 0)
  })
  let offset = 25
  return Object.entries(investmentTypeColors)
      .map(([type, color]) => {
          const value = grouped[type] || 0
          const percent = total > 0 ? (value / total) * 100 : 0
          const slice = {
              type,
              color: String(color),
              label: String(investmentTypeLabels[type as keyof typeof investmentTypeLabels] || type),
              value,
              percent,
              offset
          }
          offset -= (percent / 100) * 100
          return slice
      })
      .filter(slice => slice.percent > 0)
})

const tooltip = ref({ show: false, x: 0, y: 0, label: '', percent: 0, value: 0 })
function showTooltip(e: MouseEvent, slice: any) {
  tooltip.value = {
      show: true,
      x: e.offsetX - 125,
      y: e.offsetY - 85,
      label: slice.label,
      percent: slice.percent,
      value: slice.value
  }
}
function hideTooltip() {
  tooltip.value.show = false
}

function formatMoney(value: number) {
  return value.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function formatPercent(value: number) {
  return value.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%'
}
</script>

<style scoped>
.dashboard-invest-card {
  background: var(--card);
  border-radius: var(--radius-lg);
  box-shadow: 0 2px 16px 0 rgba(60, 60, 60, 0.06);
  margin-bottom: 1.5rem;
  padding: 0;
  width: 100%;
  max-width: 700px;
  margin-left: auto;
  margin-right: auto;
  container-type: inline-size;
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
.dashboard-invest-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--primary-foreground);
}
.dashboard-invest-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--primary-foreground);
}
.dashboard-invest-gain {
  color: var(--primary-foreground);
  font-weight: 500;
  text-align: right;
}
.dashboard-invest-balance-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  color: var(--muted-text);
  margin-top: 0.2rem;
  margin-bottom: 0.2rem;
}
.dashboard-invest-balance-label {
  font-size: 1rem;
  color: var(--primary-foreground);
  font-weight: 400;
}
.dashboard-invest-balance-value {
  font-size: 1rem;
  color: var(--primary-foreground);
  font-weight: 600;
  margin-left: 0.5rem;
}
.dashboard-invest-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
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

@container (max-width: 350px) {
  .dashboard-invest-chart {
    flex-direction: column;
    align-items: flex-center;
  }
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
.dashboard-invest-tooltip {
  position: absolute;
  background: #fff;
  color: #222;
  border-radius: 8px;
  box-shadow: 0 2px 8px 0 rgba(60, 60, 60, 0.12);
  padding: 8px 14px;
  font-size: 0.95rem;
  pointer-events: none;
  z-index: 10;
  min-width: 120px;
  text-align: center;
}
</style>