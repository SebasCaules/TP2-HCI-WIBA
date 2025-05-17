<template>
  <v-container fluid class="transactions-main">
    <v-row class="transactions-row" no-gutters>
      <v-col cols="12" class="px-md-8">
        <template v-if="authStore.isAuthenticated">
          <h1 class="transactions-title">Inversiones</h1>
          
          <!-- Stats Row -->
          <v-row class="mb-6">
            <v-col cols="12" md="8">
              <div class="stats-card">
                <div class="stats-row">
                  <div class="stats-item">
                    <div class="stats-label">Invertido</div>
                    <div class="stats-value">{{ formatMoney(totalBalance) }}</div>
                  </div>
                  <div class="stats-item">
                    <div class="stats-label">Ganancia</div>
                    <div :class="['stats-value', totalGain >= 0 ? 'text-success' : 'text-error']">
                      {{ (totalGain >= 0 ? '+' : '') + formatMoney(totalGain) }}
                      <span class="stats-percentage">({{ (percentageChange >= 0 ? '+' : '') + formatPercent(percentageChange) }})</span>
                    </div>
                  </div>
                </div>
                <div class="stats-balance-row">
                  <div class="stats-item">
                    <div class="stats-label">Poder de compra</div>
                    <div class="stats-value">{{ formatMoney(availableBalance) }}</div>
                  </div>
                </div>
              </div>
            </v-col>
            <v-col cols="12" md="4">
              <div class="chart-card">
                <div class="chart-title">Distribución de Inversiones</div>
                <div class="chart-container">
                  <svg
                    :width="160"
                    :height="160"
                    :viewBox="`0 0 36 36`"
                    style="z-index: 1; margin-bottom: 1.5rem;"
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
                        :stroke="slice.color"
                        stroke-width="3"
                        :stroke-dasharray="slice.percent + ' ' + (100 - slice.percent)"
                        :stroke-dashoffset="slice.offset"
                        @mousemove="showTooltip($event, slice)"
                        @mouseleave="hideTooltip"
                        style="cursor: pointer"
                      />
                    </template>
                  </svg>
                  <div
                    v-if="tooltip.show"
                    class="chart-tooltip"
                    :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }"
                  >
                    <strong>{{ tooltip.label }}</strong><br />
                    {{ formatPercent(tooltip.percent) }}<br />
                    {{ formatMoney(tooltip.value) }}
                  </div>
                  <div class="chart-legend">
                    <div v-for="slice in chartSlices" :key="slice.type">
                      <span
                        class="legend-dot"
                        :style="{ background: slice.color }"
                      ></span>
                      {{ formatPercent(slice.percent) }} - {{ slice.label }}
                    </div>
                  </div>
                </div>
              </div>
            </v-col>
          </v-row>

          <!-- Invest Button -->
          <IconFilledButton icon="mdi-plus" class="invest-add-btn" @click="openInvestDialog">
            Invertir
          </IconFilledButton>

          <!-- Investment Table -->
          <div class="card">
            <v-data-table
              v-if="investments.length > 0"
              :items="investments"
              :headers="investmentHeaders"
              :items-per-page="5"
              class="investments-table"
              item-value="id"
              hover
              @click:row="openWithdrawDialog"
            >
              <template #item.name="{ item }">
                <div class="text-center font-weight-medium">{{ item.name }}</div>
              </template>

              <template #item.quantity="{ item }">
                <div class="text-center">{{ formatShares(item.quantity) }}</div>
              </template>

              <template #item.price="{ item }">
                <div class="text-center">{{ formatMoney(item.price) }}</div>
              </template>

              <template #item.variation="{ item }">
                <div :class="['text-center', getVariationClass(item.variation)]">
                  {{ (item.variation >= 0 ? '+' : '') + formatPercent(item.variation) }}
                </div>
              </template>

              <template #item.total_value="{ item }">
                <div class="text-center font-weight-medium">{{ formatMoney(item.total_value) }}</div>
              </template>
              <template #bottom>
                <div class="text-center pt-2">
                  <v-pagination
                    v-model="currentPage"
                    :length="Math.ceil(investments.length / itemsPerPage)"
                    rounded
                  ></v-pagination>
                </div>
              </template>

              <template #no-data>
                <div class="pa-4 text-center">
                  <v-icon size="large" color="grey" class="mb-2">mdi-chart-line</v-icon>
                  <div class="text-h6 text-grey">Aún no tenés inversiones</div>
                  <div class="text-body-2 text-grey mt-2">
                    Comenzá a invertir haciendo clic en el botón "Invertir"
                  </div>
                </div>
              </template>
            </v-data-table>
          </div>

          <!-- Investment Dialog -->
          <v-dialog v-model="investDialog" max-width="500">
            <v-card>
              <div class="dialog-header">
                <span class="dialog-title" style="font-family: var(--font-sans);">Realizar Inversión</span>
                <v-btn icon class="dialog-close-btn" @click="closeInvestDialog">
                  <v-icon>mdi-close</v-icon>
                </v-btn>
              </div>
              <v-card-text>
                <v-form v-model="isFormValid">
                  <button type="button" class="deposit-method-box" @click="showFundDialog = true">
                    <img :src="selectedFund?.logo" :alt="selectedFund?.name" class="deposit-card-logo" v-if="selectedFund" />
                    <span class="deposit-method-text" v-if="selectedFund">
                      <b>{{ selectedFund.name }}</b>
                    </span>
                    <span class="deposit-method-text" v-else style="font-weight: 400;">
                      Seleccionar fondo
                    </span>
                    <v-icon class="deposit-select-icon">mdi-chevron-right</v-icon>
                  </button>

                  <CustomTextField
                    v-model="investmentAmount"
                    label="Monto a invertir"
                    type="number"
                    placeholder="0.00"
                    :error="investmentAmount > availableBalance"
                    :errorMessage="investmentAmount > availableBalance ? 'Saldo insuficiente' : ''"
                    @input="syncSharesFromAmount"
                  >
                    <template #left>
                      <span style="color: var(--muted-text);">$</span>
                    </template>
                  </CustomTextField>

                  <CustomTextField
                    v-model="investmentShares"
                    label="Cantidad de cuotapartes"
                    type="number"
                    placeholder="0.00"
                    :error="investmentShares <= 0"
                    :errorMessage="investmentShares <= 0 ? 'La cantidad debe ser mayor a 0' : ''"
                    @input="syncAmountFromShares"
                  />

                  <div class="mt-2" style="font-family: var(--font-sans);">
                    <span>Saldo disponible: {{ formatMoney(availableBalance) }}</span>
                  </div>
                </v-form>
              </v-card-text>
              <v-card-actions class="dialog-actions">
                <FilledButton
                  :loading="isLoading"
                  :disabled="!isFormValid || isLoading"
                  @click="handleInvestment"
                  class="action-button"
                >
                  Confirmar
                </FilledButton>
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
                    <strong>Cuotapartes disponibles:</strong> {{ formatShares(selectedInvestment?.quantity ?? 0) }}
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

          <!-- Fund Selection Dialog -->
          <v-dialog 
            v-model="showFundDialog" 
            max-width="960px" 
            :retain-focus="false"
            :scrim="true"
          >
            <v-card class="select-card-dialog">
              <div class="select-card-dialog-header">
                <span class="select-card-title">Seleccionar fondo</span>
                <v-btn icon class="dialog-close-btn" @click="showFundDialog = false">
                  <v-icon>mdi-close</v-icon>
                </v-btn>
              </div>
              <div class="select-card-list-custom">
                <template v-if="fundOptions.length > 0">
                  <div
                    v-for="fund in fundOptions"
                    :key="fund.id"
                    class="select-card-custom"
                    :class="{ selected: selectedFund && selectedFund.id === fund.id }"
                    @click="selectFund(fund)"
                  >
                    <img :src="fund.logo" :alt="fund.name" class="select-card-logo" />
                    <div class="select-card-info">
                      <div class="select-card-brand">{{ fund.name }}</div>
                      <div class="select-card-expiry">Precio actual: {{ formatMoney(fund.current_price) }}</div>
                    </div>
                    <v-icon v-if="selectedFund && selectedFund.id === fund.id" color="primary" class="select-card-check">mdi-check-circle</v-icon>
                  </div>
                </template>
                <div v-else class="no-cards-message">
                  <v-icon size="48" :color="'#41a7b7'">mdi-chart-line</v-icon>
                  <div class="no-cards-title">No hay fondos disponibles</div>
                  <div class="no-cards-subtitle">Por favor intenta más tarde</div>
                </div>
              </div>
            </v-card>
          </v-dialog>
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
      </v-col>
    </v-row>
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
import InvestmentCard from '@/components/InvestmentCard.vue'
import IconFilledButton from '@/components/ui/IconFilledButton.vue'
import CustomTextField from '@/components/ui/CustomTextField.vue'
import FilledButton from '@/components/ui/FilledButton.vue'

const authStore = useAuthStore()

// Utility functions for formatting
function formatMoney(value: number) {
  return value.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatShares(value: number) {
  return value.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatPercent(value: number) {
  return value.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%';
}

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
  return portfolio.value
    .filter(item => item.quantity > 0)
    .map(item => {
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

const totalInitialBalance = computed(() => {
  return investments.value.reduce((sum, inv) => {
    const initial = inv.total_value / (1 + inv.variation / 100)
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

const showFundDialog = ref(false)

// Add fund logos mapping
const fundLogos: Record<string, string> = {
  'FND-A': 'https://cdn-icons-png.flaticon.com/512/217/217853.png',
  'FND-B': 'https://cdn-icons-png.flaticon.com/512/217/217853.png',
  'FND-C': 'https://cdn-icons-png.flaticon.com/512/217/217853.png',
  'FND-D': 'https://cdn-icons-png.flaticon.com/512/217/217853.png',
  'FND-E': 'https://cdn-icons-png.flaticon.com/512/217/217853.png',
}

// Update fundOptions computed to include logo
const fundOptions = computed(() => {
  return stocks.value.map(stock => ({
    id: stock.id,
    name: stock.name,
    current_price: stock.current_price,
    logo: fundLogos[stock.symbol] || 'https://cdn-icons-png.flaticon.com/512/217/217853.png'
  }))
})

function selectFund(fund: any) {
  selectedFund.value = fund
  showFundDialog.value = false
  investmentAmount.value = 0
  investmentShares.value = 0
}

// Methods
const getVariationClass = (variation: number) => {
  if (variation < 0) return 'text-error'
  return 'text-success'
}

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

const openWithdrawDialog = (item: any) => {
  const tr = item.currentTarget as HTMLTableRowElement;
  const firstCell = tr.querySelector('td:first-child div');
  const name = firstCell?.textContent?.trim();
  if (!name) {
    console.warn('No se pudo obtener el nombre de la inversión');
    return;
  }

  const investment = investments.value.find(inv => inv.name === name);
  if (!investment) {
    console.warn('No se encontró ninguna inversión con ese nombre');
    return;
  }

  withdrawDialog.value = true;
  selectedInvestment.value = {
    id: investment.id,
    user_id: authStore.user?.id || '',
    stock_id: investment.stock?.id || 0,
    quantity: investment.quantity,
    average_price: investment.price,
    total_value: investment.total_value,
    stock: investment.stock,
    variation_percentage: investment.variation
  };
  withdrawAmount.value = investment.total_value;
  withdrawShares.value = investment.quantity;
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
    const quantity = parseFloat(withdrawShares.value.toFixed(6))

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
  'FND-A': 'var(--chart-1)',
  'FND-B': 'var(--chart-2)',
  'FND-C': 'var(--chart-3)',
  'FND-D': 'var(--chart-4)',
  'FND-E': 'var(--chart-5)',
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
  // Agrupar por tipo (symbol) solo para inversiones con cantidad > 0
  const grouped: Record<string, number> = {}
  investments.value
    .filter(inv => inv.quantity > 0)
    .forEach(inv => {
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
  }).filter(slice => slice.value > 0)
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
  if (!selectedInvestment.value?.stock?.current_price) {
    withdrawShares.value = 0
    return
  }
  const price = selectedInvestment.value.stock.current_price
  if (price > 0) {
    withdrawShares.value = +(withdrawAmount.value / price).toFixed(6)
  } else {
    withdrawShares.value = 0
  }
}

const syncWithdrawAmountFromShares = () => {
  if (!selectedInvestment.value?.stock?.current_price) {
    withdrawAmount.value = 0
    return
  }
  const price = selectedInvestment.value.stock.current_price
  if (price > 0) {
    withdrawAmount.value = +(withdrawShares.value * price).toFixed(2)
  } else {
    withdrawAmount.value = 0
  }
}

// Tabla de inversiones: columnas visibles (nuevo formato)
const investmentHeaders = [
  { 
    title: 'Fondo',
    key: 'name',
    align: 'center' as const,
    sortable: true
  },
  { 
    title: 'Cuotapartes',
    key: 'quantity',
    align: 'center' as const,
    sortable: true
  },
  { 
    title: 'Precio',
    key: 'price',
    align: 'center' as const,
    sortable: true
  },
  { 
    title: 'Variación',
    key: 'variation',
    align: 'center' as const,
    sortable: true
  },
  { 
    title: 'Valor Total',
    key: 'total_value',
    align: 'center' as const,
    sortable: true
  }
]

// Agregar estas variables al script setup
const currentPage = ref(1)
const itemsPerPage = ref(5)
</script>

<style scoped>
.transactions-main {
  background: var(--background);
  min-height: 100vh;
  padding: 0;
}

.transactions-row {
  margin: 0;
}

.transactions-title {
  font-size: 2.2rem;
  font-weight: 800;
  margin-bottom: 1.5rem;
  margin-top: 0.5rem;
  margin-left: 0;
  font-family: var(--font-sans), sans-serif;
}

.stats-card {
  background: var(--card);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  box-shadow: 0 2px 16px 0 rgba(60,60,60,0.06);
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
  height: 100%;
}

.stats-row {
  display: flex;
  justify-content: space-between;
  gap: 2rem;
}

.stats-balance-row {
  padding-top: 0.8rem;
  border-top: 1px solid var(--border);
}

.stats-balance-row .stats-item {
  width: 100%;
}

.stats-balance-row .stats-value {
  font-size: 1.5rem;
  font-weight: 700;
}

.stats-item {
  flex: 1;
}

.stats-label {
  font-size: 1rem;
  color: var(--muted-text);
  margin-bottom: 0.5rem;
}

.stats-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text);
}

.stats-percentage {
  font-size: 1rem;
  font-weight: 500;
  margin-left: 0.5rem;
}

.chart-card {
  background: var(--card);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  box-shadow: 0 2px 16px 0 rgba(60,60,60,0.06);
  height: 100%;
  display: flex;
  flex-direction: column;
}

.chart-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 1rem;
}

.chart-container {
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 1.2rem;
  margin-top: 1rem;
}

.chart-svg {
  width: 100%;
  height: 200px;
}

.chart-tooltip {
  position: absolute;
  background: white;
  border-radius: 8px;
  padding: 0.8rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  pointer-events: none;
  z-index: 10;
  min-width: 120px;
}

.tooltip-label {
  font-weight: 600;
  color: var(--text);
  margin-bottom: 0.3rem;
}

.tooltip-value {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text);
}

.tooltip-percent {
  font-size: 0.9rem;
  color: var(--muted-text);
  margin-top: 0.2rem;
}

.chart-legend {
  font-size: 0.95rem;
  color: var(--muted-text);
}

.chart-legend > div {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.legend-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  min-width: 8px;
  min-height: 8px;
  border-radius: 50%;
  margin-right: 8px;
  flex-shrink: 0;
}

.invest-add-btn {
  margin-bottom: 2.2rem;
  font-size: 1.1rem;
  font-weight: 600;
  padding: 0.5rem 2.5rem;
  min-width: 200px;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.investments-table {
  background: transparent;
}

.investments-table :deep(th) {
  font-weight: 600;
  font-size: 1rem;
  color: var(--text);
  white-space: nowrap;
  background-color: var(--card);
  border-bottom: none;
  font-family: var(--font-sans), sans-serif;
}

.text-success {
  color: var(--success) !important;
}

.text-error {
  color: var(--error) !important;
}

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
  width: 100%;
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
.dashboard-invest-legend {
  font-size: 0.95rem;
  color: var(--muted-text);
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
.white--text {
  color: white !important;
}
.white--text .v-icon {
  color: white !important;
}

/* --- TABLA DE INVERSIONES --- */
.v-data-table {
  background: white;
  border-radius: var(--radius-lg);
  box-shadow: 0 2px 16px 0 rgba(60,60,60,0.06);
}
.v-data-table thead th {
  background-color: #374151 !important;
  color: white !important;
  font-weight: 700;
  font-size: 1.05rem;
  border-top: none;
  border-bottom: 1.5px solid var(--border);
  text-align: center;
}
.v-data-table tbody tr {
  transition: background 0.18s;
}
.v-data-table tbody tr:hover {
  background: #f7fafc !important;
}
.v-data-table tbody td {
  font-size: 1.05rem;
  color: var(--foreground);
  border-bottom: 1px solid var(--border);
  text-align: center;
  vertical-align: middle;
  padding-top: 0.7rem;
  padding-bottom: 0.7rem;
}
.v-data-table tbody td.font-weight-medium {
  font-weight: 700;
  color: var(--primary);
}
.v-data-table .text-success {
  color: var(--success) !important;
  font-weight: 600;
}
.v-data-table .text-error {
  color: var(--error) !important;
  font-weight: 600;
}
.v-data-table .text-center {
  text-align: center !important;
}
.v-data-table .v-pagination {
  margin-top: 0.5rem;
}
/* Links y acciones */
.dashboard-link, .dashboard-link-header {
  color: var(--primary);
  font-size: 0.95rem;
  text-decoration: none;
  display: flex;
  align-items: center;
}
.dashboard-link-header {
  color: white;
}
.mt-4 {
  margin-top: 1.5rem !important;
}
.text-grey {
  color: var(--muted-text) !important;
}
/* Intercalado filas impares */
.v-data-table tbody tr:nth-child(even) {
  background-color: #f3f4f6 !important;
}

/* Dialog styles */
.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem 1.5rem 0.5rem 1.5rem;
}

.dialog-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text);
}

.dialog-close-btn {
  margin-right: -0.5rem;
}

.dialog-actions {
  padding: 1rem 1.5rem 1.5rem 1.5rem;
  display: flex;
  justify-content: center;
}

.action-button {
  min-width: 200px;
}

/* Add these styles from DepositarView */
.deposit-method-box {
  display: flex;
  align-items: center;
  border: 1.5px solid #BDBDBD;
  border-radius: 12px;
  background: transparent;
  height: 48px;
  padding: 0 1.1rem;
  width: 100%;
  box-sizing: border-box;
  transition: border-color 0.18s;
  font-size: 1.06rem;
  font-family: var(--font-sans, sans-serif);
  cursor: pointer;
  outline: none;
  gap: 0.8rem;
  margin-bottom: 1rem;
}

.deposit-method-box:hover,
.deposit-method-box:focus {
  border-color: #489FB5;
}

.deposit-card-logo {
  width: 32px;
  height: 32px;
  object-fit: contain;
  display: flex;
  align-items: center;
}

.deposit-method-text {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--text);
  flex: 1;
  font-family: var(--font-sans), sans-serif;
  display: flex;
  align-items: center;
  height: 100%;
}

.deposit-select-icon {
  color: var(--muted-text);
  margin-left: auto;
  display: flex;
  align-items: center;
  height: 100%;
}

.select-card-dialog {
  border-radius: 1.5rem;
  overflow: visible;
  box-shadow: 0 2px 16px 0 rgba(60,60,60,0.10);
  max-width: 960px;
  margin: 0 auto;
  padding: 2rem 3rem;
}

.select-card-dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 0 1rem 0;
}

.select-card-title {
  font-size: 1.4rem;
  font-weight: 700;
  font-family: var(--font-sans), sans-serif;
}

.select-card-list-custom {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 1rem;
  max-height: 400px;
  overflow-y: auto;
  margin: 1.5rem 0;
  width: 100%;
  padding-right: 0.5rem;
}

.select-card-custom {
  width: 100%;
  display: flex;
  align-items: center;
  background: #f8fafc;
  border-radius: 14px;
  border: 2px solid #e0e0e0;
  padding: 1rem 1.5rem;
  cursor: pointer;
  transition: border-color 0.18s, background 0.18s;
  position: relative;
}

.select-card-custom.selected {
  border-color: var(--primary, #41a7b7);
  background: #e3f6f3;
}

.select-card-custom:hover {
  border-color: var(--primary, #41a7b7);
  background: #f0f4f8;
}

.select-card-logo {
  width: 48px;
  height: 48px;
  object-fit: contain;
  margin-right: 1.5rem;
}

.select-card-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.select-card-brand {
  font-weight: 700;
  font-size: 1.2rem;
  color: #232526;
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.select-card-expiry {
  font-size: 1rem;
  color: #888;
  margin-top: 0.2rem;
}

.select-card-check {
  font-size: 1.8rem;
  margin-left: 1.5rem;
}

.no-cards-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 2rem;
  text-align: center;
  background: #f8fafc;
  border-radius: 14px;
  border: 2px dashed #e0e0e0;
  width: 100%;
  gap: 1rem;
}

.no-cards-title {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--text);
  font-family: var(--font-sans), sans-serif;
}

.no-cards-subtitle {
  font-size: 1.05rem;
  color: var(--muted-text);
  font-family: var(--font-sans), sans-serif;
}
</style>
