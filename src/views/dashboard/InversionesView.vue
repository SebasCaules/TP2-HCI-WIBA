<template>
  <v-container>
    <template v-if="authStore.isAuthenticated">
      <!-- Nueva seccion -->
      <div class="dashboard-invest-card">
        <div class="dashboard-invest-header">
          <div class="dashboard-invest-title">Inversiones</div>
          <div class="dashboard-invest-summary">
            <span class="dashboard-invest-value">
              ${{ totalBalance.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}
            </span>
            <span class="dashboard-invest-gain">
              - {{ percentageChange >= 0 ? '+' : '' }}{{ (totalBalance * percentageChange / 100).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}
              ({{ percentageChange.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}%)
            </span>
          </div>
          <div class="dashboard-invest-balance-row">
            <span class="dashboard-invest-balance-label">Saldo disponible:</span>
            <span class="dashboard-invest-balance-value">
              ${{ availableBalance.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}
            </span>
          </div>
        </div>
        <div class="dashboard-invest-body">
          <div class="dashboard-invest-chart" style="position:relative;">
            <!-- Gráfico circular SVG dinámico -->
            <svg width="160" height="160" viewBox="0 0 36 36" style="z-index:1">
              <circle cx="18" cy="18" r="16" fill="none" stroke="#e5e7eb" stroke-width="3" />
              <template v-for="(slice, idx) in chartSlices" :key="slice.type">
                <circle
                  cx="18" cy="18" r="16" fill="none"
                  :stroke="slice.color"
                  stroke-width="3"
                  :stroke-dasharray="slice.percent + ' ' + (100 - slice.percent)"
                  :stroke-dashoffset="slice.offset"
                  @mousemove="showTooltip($event, slice)"
                  @mouseleave="hideTooltip"
                  style="cursor:pointer"
                />
              </template>
            </svg>
            <div v-if="tooltip.show" class="dashboard-invest-tooltip" :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }">
              <strong>{{ tooltip.label }}</strong><br>
              {{ tooltip.percent.toFixed(2) }}%<br>
              ${{ tooltip.value.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}
            </div>
            <div class="dashboard-invest-legend">
              <div v-for="slice in chartSlices" :key="slice.type">
                <span class="legend-dot" :style="{ background: slice.color }"></span>
                {{ slice.percent.toFixed(2) }}% - {{ slice.label }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Invest Button -->
      <v-row class="mt-4">
        <v-col cols="12">
          <v-btn
            color="primary"
            class="white--text rounded"
            @click="openInvestDialog"
          >
            <v-icon left>mdi-plus</v-icon>
            Invertir
          </v-btn>
        </v-col>
      </v-row>

      <!-- Investment Table -->
      <v-row>
        <v-col cols="12">
          <v-data-table
            v-if="investments.length > 0"
            :items="investments"
            :headers="investmentHeaders"
            class="elevation-1"
            item-value="id"
            hide-default-footer
            @click:row="openWithdrawDialog"
          >
            <template #item.name="{ item }">
              <td class="text-center">{{ item.name }}</td>
            </template>
            <template #item.quantity="{ item }">
              <td class="text-center">{{ item.quantity.toFixed(2) }}</td>
            </template>
            <template #item.price="{ item }">
              <td class="text-center">${{ item.price.toFixed(6) }}</td>
            </template>
            <template #item.variation="{ item }">
              <td :class="[getVariationClass(item.variation), 'text-center']">
                {{ (item.variation >= 0 ? '+' : '') + item.variation.toFixed(2) }}%
              </td>
            </template>
            <template #item.total_value="{ item }">
              <td class="text-center">${{ item.total_value.toFixed(2) }}</td>
            </template>
          </v-data-table>
          <div v-else class="text-gray-500">Aún no tenés inversiones.</div>
        </v-col>
      </v-row>

      <!-- Investment Dialog -->
      <v-dialog v-model="investDialog" max-width="500">
        <v-card>
          <v-card-title>Realizar Inversión</v-card-title>
          <v-card-text>
            <v-form v-model="isFormValid">
              <v-select
                v-model="selectedFund"
                :items="fundOptions"
                label="Seleccionar Fondo"
                item-title="name"
                item-value="id"
                required
              ></v-select>

              <v-text-field
                v-model.number="investmentAmount"
                label="Monto a invertir"
                prefix="$"
                type="number"
                :rules="[v => v > 0 || 'El monto debe ser mayor a 0', v => v <= availableBalance || 'Saldo insuficiente']"
                required
                @input="syncSharesFromAmount"
              ></v-text-field>

              <v-text-field
                v-model.number="investmentShares"
                label="Cantidad de cuotapartes"
                type="number"
                :rules="[v => v > 0 || 'La cantidad debe ser mayor a 0']"
                required
                @input="syncAmountFromShares"
              ></v-text-field>
              <div>
                <span class="mt-2">
                  Saldo disponible: ${{ availableBalance.toFixed(2) }}
                </span>
              </div>
            </v-form>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn
              color="grey"
              variant="text"
              @click="closeInvestDialog"
            >
              Cancelar
            </v-btn>
            <v-btn
              color="primary"
              class="rounded"
              :loading="isLoading"
              :disabled="!isFormValid || isLoading"
              @click="handleInvestment"
            >
              Confirmar
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Withdraw Dialog -->
      <v-dialog v-model="withdrawDialog" max-width="500">
        <v-card>
          <v-card-title>Retirar Inversión</v-card-title>
          <v-card-text>
            <v-form v-model="isWithdrawFormValid">
              <div class="mb-2">
                <strong>Fondo:</strong> {{ selectedInvestment?.stock?.name }}
              </div>
              <div class="mb-2">
                <strong>Cuotapartes disponibles:</strong> {{ (selectedInvestment?.quantity ?? 0).toFixed(6) }}
              </div>
              <v-text-field
                v-model.number="withdrawAmount"
                label="Monto a retirar"
                prefix="$"
                type="number"
                :rules="[
                  v => v > 0 || 'El monto debe ser mayor a 0',
                  v => v <= (selectedInvestment?.total_value ?? 0) || 'No puede retirar más de lo que posee'
                ]"
                required
                @input="syncWithdrawSharesFromAmount"
              ></v-text-field>

              <v-text-field
                v-model.number="withdrawShares"
                label="Cantidad a retirar (cuotapartes)"
                type="number"
                :rules="[
                  v => v > 0 || 'La cantidad debe ser mayor a 0',
                  v => v <= (selectedInvestment?.quantity ?? 0) || 'No puede retirar más de lo que posee'
                ]"
                required
                @input="syncWithdrawAmountFromShares"
              ></v-text-field>
            </v-form>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="grey" variant="text" @click="closeWithdrawDialog">Cancelar</v-btn>
            <v-btn
              color="primary"
              class="rounded"
              :loading="isLoading"
              :disabled="!isWithdrawFormValid || isLoading"
              @click="handleWithdraw"
            >
              Confirmar
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Snackbar for notifications -->
      <v-snackbar
        v-model="snackbar.show"
        :color="snackbar.color"
        timeout="3000"
      >
        {{ snackbar.text }}
      </v-snackbar>
    </template>
    <template v-else>
      <v-alert
        type="warning"
        prominent
        border="start"
      >
        Por favor inicie sesión para ver sus inversiones
      </v-alert>
    </template>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useAuthStore } from '@/store/auth'
import { 
  type Stock,   
  type PortfolioItem, 
  getStocks,
  getPortfolio,
  updatePortfolio,
  performInvestmentTransaction
} from '@/services/investments'
import { getAccountBalance as fetchAccountBalance, updateAccountBalance } from '@/services/account'

const authStore = useAuthStore()

const investDialog = ref(false)
const withdrawDialog = ref(false)
const isFormValid = ref(false)
const isWithdrawFormValid = ref(false)
const isLoading = ref(false)
const selectedFund = ref<Stock | null>(null)
const investmentAmount = ref(0)
const investmentShares = ref(0)
const stocks = ref<Stock[]>([])
const portfolio = ref<PortfolioItem[]>([])

const selectedInvestment = ref<null | (PortfolioItem & { stock?: Stock })>(null)

const withdrawAmount = ref(0)
const withdrawShares = ref(0)

const snackbar = ref({
  show: false,
  text: '',
  color: 'success'
})

// Available balance from service
const availableBalance = ref(0)

// Transform portfolio data for display (flattened for headers)
const investments = computed(() => {
  return portfolio.value.map(item => {
    const stock = stocks.value.find(s => s.id === item.stock_id)
    const totalValue = (item.total_value != null)
      ? item.total_value
      : (item.quantity * (stock?.current_price ?? 0))
    const variation = stock && item.average_price
      ? ((stock.current_price - item.average_price) / item.average_price) * 100
      : 0

    return {
      id: item.id,
      name: stock?.name || '',
      quantity: item.quantity,
      price: stock?.current_price || 0,
      variation: variation,
      total_value: totalValue,
      stock
    }
  })
})

// Computed properties
const totalBalance = computed(() => {
  return investments.value.reduce((sum, inv) => sum + inv.total_value, 0)
})

const percentageChange = computed(() => {
  const totalVariation = investments.value.reduce((sum, inv) => {
    return sum + (inv.variation * inv.total_value)
  }, 0)
  return totalBalance.value > 0 ? (totalVariation / totalBalance.value) : 0
})

const percentageChangeClass = computed(() => ({
  'green--text': percentageChange.value >= 0,
  'red--text': percentageChange.value < 0,
  'ml-2': true
}))


const fundOptions = computed(() => {
  return stocks.value.map(stock => ({
    id: stock.id,
    name: stock.name
  }))
})

// Methods
const getVariationClass = (variation: number) => ({
  'green--text': variation >= 0,
  'red--text': variation < 0
})

const openInvestDialog = () => {
  selectedFund.value = null
  investmentAmount.value = 0
  investmentShares.value = 0
  investDialog.value = true
}

const closeInvestDialog = () => {
  investDialog.value = false
  selectedFund.value = null
  investmentAmount.value = 0
  investmentShares.value = 0
}

const openWithdrawDialog = (investment: PortfolioItem & { stock?: Stock }) => {
  selectedInvestment.value = investment
  withdrawAmount.value = 0
  withdrawShares.value = 0
  withdrawDialog.value = true
}

const closeWithdrawDialog = () => {
  withdrawDialog.value = false
  selectedInvestment.value = null
  withdrawAmount.value = 0
  withdrawShares.value = 0
}

const syncSharesFromAmount = () => {
  if (!selectedFund.value) {
    investmentShares.value = 0
    return
  }
  const price = stocks.value.find(s => s.id === Number(selectedFund.value))?.current_price || 0
  if (price > 0) {
    investmentShares.value = +(investmentAmount.value / price).toFixed(6)
  } else {
    investmentShares.value = 0
  }
}

const syncAmountFromShares = () => {
  if (!selectedFund.value) {
    investmentAmount.value = 0
    return
  }
  const price = stocks.value.find(s => s.id === Number(selectedFund.value))?.current_price || 0
  if (price > 0) {
    investmentAmount.value = +(investmentShares.value * price).toFixed(2)
  } else {
    investmentAmount.value = 0
  }
}

watch(selectedFund, () => {
  investmentAmount.value = 0
  investmentShares.value = 0
})

const handleInvestment = async () => {
  if (!selectedFund.value || !authStore.user?.id) {
    console.log('Investment cancelled: Missing fund or user ID')
    return
  }

  if (investmentAmount.value > availableBalance.value) {
    snackbar.value = {
      show: true,
      text: 'Saldo insuficiente para realizar la inversión',
      color: 'error'
    }
    return
  }

  const selectedStock = stocks.value.find(stock => stock.id === Number(selectedFund.value))
  
  if (!selectedStock) {
    console.error('Selected stock not found:', selectedFund.value)
    throw new Error('Fondo no encontrado')
  }

  isLoading.value = true
  try {
    const amount = parseFloat(investmentAmount.value.toString())
    const price = parseFloat(selectedStock.current_price.toString())
    
    if (isNaN(amount) || isNaN(price) || price <= 0) {
      throw new Error(`Monto o precio inválido - Monto: ${amount}, Precio: ${price}`)
    }

    const shares = amount / price

    // Create transaction
    try {
      const userId = authStore.user.id
      const stockId = selectedStock.id
      const quantity = parseFloat(shares.toFixed(6))
      const priceVal = parseFloat(selectedStock.current_price.toString())

      await performInvestmentTransaction(
        userId,
        stockId,
        'buy',
        quantity,
        priceVal
      )
    } catch (error) {
      console.error('Transaction error:', error)
      throw new Error('Error al crear la transacción')
    }

    // Update portfolio
    const existingPosition = portfolio.value.find(p => p.stock_id === selectedStock.id)
    const newQuantity = (existingPosition?.quantity || 0) + shares

    await updatePortfolio(authStore.user.id, selectedStock.id, newQuantity)

    // Update balance: decrease user balance
    await updateAccountBalance(authStore.user.id, -amount)
    availableBalance.value -= amount

    // Refresh portfolio data
    await fetchPortfolio()

    snackbar.value = {
      show: true,
      text: 'Inversión realizada con éxito',
      color: 'success'
    }

    closeInvestDialog()

  } catch (error: any) {
    snackbar.value = {
      show: true,
      text: error.message || 'Error al realizar la inversión',
      color: 'error'
    }
  } finally {
    isLoading.value = false
  }
}

const handleWithdraw = async () => {
  if (!selectedInvestment.value || !authStore.user?.id) {
    return
  }
  if (withdrawAmount.value <= 0 || withdrawAmount.value > selectedInvestment.value.total_value) {
    snackbar.value = {
      show: true,
      text: 'Cantidad inválida para retirar',
      color: 'error'
    }
    return
  }

  const price = selectedInvestment.value.stock?.current_price
  if (typeof price !== 'number') {
    snackbar.value = {
      show: true,
      text: 'No se pudo obtener el precio actual del fondo',
      color: 'error'
    }
    return
  }

  isLoading.value = true
  try {
    const userId = authStore.user.id
    const stockId = selectedInvestment.value.stock_id
    const quantity = parseFloat(withdrawAmount.value.toFixed(6))

    // Perform withdrawal transaction
    await performInvestmentTransaction(
      userId,
      stockId,
      'sell',
      quantity,
      price
    )

    // Update portfolio
    const existingPosition = portfolio.value.find(p => p.stock_id === stockId)
    const newQuantity = (existingPosition?.quantity || 0) - quantity

    await updatePortfolio(authStore.user.id, stockId, newQuantity >= 0 ? newQuantity : 0)

    // Update balance: increase user balance
    const amountReturned = quantity * price
    await updateAccountBalance(authStore.user.id, amountReturned)
    availableBalance.value += amountReturned

    // Refresh portfolio data
    await fetchPortfolio()

    snackbar.value = {
      show: true,
      text: 'Retiro realizado con éxito',
      color: 'success'
    }

    closeWithdrawDialog()
  } catch (error: any) {
    snackbar.value = {
      show: true,
      text: error.message || 'Error al realizar el retiro',
      color: 'error'
    }
  } finally {
    isLoading.value = false
  }
}

const fetchPortfolio = async () => {
  try {
    if (!authStore.user?.id) return

    const portfolioData = await getPortfolio(authStore.user.id)
    portfolio.value = portfolioData
  } catch (error: any) {
    snackbar.value = {
      show: true,
      text: 'Error al cargar el portafolio: ' + error.message,
      color: 'error'
    }
  }
}

// Initialize data
onMounted(async () => {
  if (!authStore.isAuthenticated || !authStore.user?.id) {
    snackbar.value = {
      show: true,
      text: 'Por favor inicie sesión para ver sus inversiones',
      color: 'error'
    }
    return
  }

  try {
    const stocksData = await getStocks()
    stocks.value = stocksData
    await fetchPortfolio()
    availableBalance.value = await fetchAccountBalance(authStore.user.id)
  } catch (error: any) {
    snackbar.value = {
      show: true,
      text: 'Error al cargar los datos: ' + error.message,
      color: 'error'
    }
  }
})

// Colores fijos para los 5 tipos, referenciando por symbol
const typeColors: Record<string, string> = {
  'FND-A': '#22c55e',
  'FND-B': '#fbbf24',
  'FND-C': '#3b82f6',
  'FND-D': '#ef4444',
  'FND-E': '#a855f7',
}

// Nombres legibles para la leyenda, referenciando por symbol
const typeLabels: Record<string, string> = {
  'FND-A': 'Clase A',
  'FND-B': 'Clase B',
  'FND-C': 'Conservador',
  'FND-D': 'Balanceado',
  'FND-E': 'Clase C',
}

// Calcular distribución por tipo
const chartSlices = computed(() => {
  const total = totalBalance.value
  // Agrupar por tipo (symbol)
  const grouped: Record<string, number> = {}
  investments.value.forEach(inv => {
    const type = inv.stock?.symbol ?? 'FND-A'
    grouped[type] = (grouped[type] || 0) + (inv.total_value ?? 0)
  })
  // Calcular porcentajes y offsets para SVG
  let offset = 25 // para que arranque arriba
  return Object.entries(typeColors).map(([type, color]) => {
    const value = grouped[type] || 0
    const percent = total > 0 ? (value / total) * 100 : 0
    const slice = {
      type,
      color,
      label: typeLabels[type],
      value,
      percent,
      offset
    }
    offset -= (percent / 100) * 100 // ajustar el offset para el siguiente arco
    return slice
  })
})

// Tooltip para el gráfico
const tooltip = ref({ show: false, x: 0, y: 0, label: '', percent: 0, value: 0 })
function showTooltip(e: MouseEvent, slice: any) {
  tooltip.value = {
    show: true,
    x: e.offsetX + 10,
    y: e.offsetY - 10,
    label: slice.label,
    percent: slice.percent,
    value: slice.value
  }
}
function hideTooltip() {
  tooltip.value.show = false
}

const syncWithdrawSharesFromAmount = () => {
  if (!selectedInvestment.value?.stock_id) {
    withdrawShares.value = 0
    return
  }
  const price = stocks.value.find(s => s.id === selectedInvestment.value?.stock_id)?.current_price || 0
  if (price > 0) {
    withdrawShares.value = +(withdrawAmount.value / price).toFixed(6)
  } else {
    withdrawShares.value = 0
  }
}

const syncWithdrawAmountFromShares = () => {
  if (!selectedInvestment.value?.stock_id) {
    withdrawAmount.value = 0
    return
  }
  const price = stocks.value.find(s => s.id === selectedInvestment.value?.stock_id)?.current_price || 0
  if (price > 0) {
    withdrawAmount.value = +(withdrawShares.value * price).toFixed(2)
  } else {
    withdrawAmount.value = 0
  }
}
// Tabla de inversiones: columnas visibles (nuevo formato)
const investmentHeaders = [
  { key: 'name', value: 'name' },
  { key: 'quantity', value: 'quantity' },
  { key: 'price', value: 'price' },
  { key: 'variation', value: 'variation' },
  { key: 'total_value', value: 'total_value' }
]
</script>

<style scoped>
.investment-summary {
  background-color: #5BA4B4 !important;
}

.green--text {
  color: #4CAF50 !important;
}

.red--text {
  color: #FF5252 !important;
}

.rounded {
  border-radius: 24px !important;
}

.dashboard-invest-card {
  background: var(--card);
  border-radius: var(--radius-lg);
  box-shadow: 0 2px 16px 0 rgba(60,60,60,0.06);
  margin-bottom: 1.5rem;
  padding: 0;
  width: fit-content;
  max-width: 700px;
  margin-left: auto;
  margin-right: auto;
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
.dashboard-invest-tooltip {
  position: absolute;
  background: #fff;
  color: #222;
  border-radius: 8px;
  box-shadow: 0 2px 8px 0 rgba(60,60,60,0.12);
  padding: 8px 14px;
  font-size: 0.95rem;
  pointer-events: none;
  z-index: 10;
  min-width: 120px;
  text-align: center;
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
.dashboard-invest-balance {
  font-weight: 500;
  color: var(--primary-foreground);
}
.white--text {
  color: white !important;
}

.white--text .v-icon {
  color: white !important;
}
</style>