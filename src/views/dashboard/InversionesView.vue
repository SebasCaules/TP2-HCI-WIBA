<template>
  <v-container>
    <template v-if="authStore.isAuthenticated">
      <!-- Main Investment Card -->
      <v-row>
        <v-col cols="12">
          <v-card class="investment-summary" color="#5BA4B4">
            <v-card-text class="white--text">
              <div class="text-subtitle-1">Inversiones</div>
              <div class="d-flex align-center">
                <span class="text-h4">${{ totalBalance.toFixed(2) }}</span>
                <span class="ml-2" :class="percentageChangeClass">
                  {{ percentageChange >= 0 ? '+' : '' }}{{ percentageChange.toFixed(2) }}%
                </span>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Portfolio Distribution Chart -->
      <v-row class="mt-4">
        <v-col cols="12" md="6">
          <v-card>
            <v-card-text>
              <div class="d-flex justify-center">
                <v-progress-circular
                  :rotate="-90"
                  :size="200"
                  :width="15"
                  :model-value="100"
                  color="transparent"
                >
                  <v-progress-circular
                    :rotate="-90"
                    :size="200"
                    :width="15"
                    :model-value="classAPercentage"
                    color="#4CAF50"
                  ></v-progress-circular>
                </v-progress-circular>
              </div>
              <div class="d-flex justify-center mt-4">
                <div class="mr-4">
                  <v-icon color="#4CAF50" class="mr-1">mdi-circle</v-icon>
                  {{ classAPercentage.toFixed(2) }}% - Clase A
                </div>
                <div>
                  <v-icon color="#FFA726" class="mr-1">mdi-circle</v-icon>
                  {{ classBPercentage.toFixed(2) }}% - Clase B
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Invest Button -->
      <v-row class="mt-4">
        <v-col cols="12">
          <v-btn
            color="#5BA4B4"
            class="white--text"
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
          <v-table v-if="investments.length > 0">
            <thead>
              <tr>
                <th>Fondo</th>
                <th>Cuotapartes</th>
                <th>Precio</th>
                <th>Variación</th>
                <th>Saldo Valorizado</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="investment in investments" :key="investment.id">
                <td>{{ investment.name }}</td>
                <td>{{ investment.shares.toFixed(2) }}</td>
                <td>${{ investment.price.toFixed(6) }}</td>
                <td :class="getVariationClass(investment.variation)">
                  {{ investment.variation >= 0 ? '+' : '' }}{{ investment.variation.toFixed(2) }}%
                </td>
                <td>${{ investment.totalValue.toFixed(2) }}</td>
              </tr>
            </tbody>
          </v-table>
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
                :rules="[v => v > 0 || 'El monto debe ser mayor a 0']"
                required
              ></v-text-field>
            </v-form>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn
              color="grey"
              variant="text"
              @click="investDialog = false"
            >
              Cancelar
            </v-btn>
            <v-btn
              color="primary"
              :loading="isLoading"
              :disabled="!isFormValid || isLoading"
              @click="handleInvestment"
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
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/store/auth'
import { 
  type Stock, 
  type Portfolio, 
  type InvestmentTransaction,
  getStocks,
  getPortfolio,
  createInvestmentTransaction,
  updatePortfolio,
  performInvestmentTransaction,
  fetchUserInvestments
} from '@/services/investments'

const authStore = useAuthStore()
const investDialog = ref(false)
const isFormValid = ref(false)
const isLoading = ref(false)
const selectedFund = ref<Stock | null>(null)
const investmentAmount = ref(0)
const stocks = ref<Stock[]>([])
const portfolio = ref<Portfolio[]>([])

const snackbar = ref({
  show: false,
  text: '',
  color: 'success'
})

// Transform portfolio data for display
const investments = computed(() => {
  return portfolio.value.map(item => ({
    id: item.stock_id,
    name: item.stock?.name || '',
    shares: item.quantity,
    price: item.stock?.current_price || 0,
    variation: ((item.stock?.current_price || 0) - item.average_price) / item.average_price * 100,
    totalValue: item.quantity * (item.stock?.current_price || 0),
    class: (item.stock?.name || '').includes('Clase A') ? 'A' : 'B'
  }))
})

// Computed properties
const totalBalance = computed(() => {
  return investments.value.reduce((sum, inv) => sum + inv.totalValue, 0)
})

const percentageChange = computed(() => {
  const totalVariation = investments.value.reduce((sum, inv) => {
    return sum + (inv.variation * inv.totalValue)
  }, 0)
  return totalBalance.value > 0 ? (totalVariation / totalBalance.value) : 0
})

const percentageChangeClass = computed(() => ({
  'green--text': percentageChange.value >= 0,
  'red--text': percentageChange.value < 0,
  'ml-2': true
}))

const classAPercentage = computed(() => {
  const classATotal = investments.value
    .filter(inv => inv.class === 'A')
    .reduce((sum, inv) => sum + inv.totalValue, 0)
  return totalBalance.value > 0 ? (classATotal / totalBalance.value) * 100 : 0
})

const classBPercentage = computed(() => {
  return 100 - classAPercentage.value
})

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
  investDialog.value = true
}

const handleInvestment = async () => {
  if (!selectedFund.value || !authStore.user?.id) return

  isLoading.value = true
  try {
    const shares = investmentAmount.value / selectedFund.value.current_price

    // Create transaction
    try {
    const userId = authStore.user.id
    const stockId = selectedFund.value.id
    const quantity = shares
    const price = selectedFund.value.current_price

    await performInvestmentTransaction(
      userId,
      stockId,
      'buy',
      quantity,
      price
    )
    } catch (error) {
      console.error('Error al realizar la transacción:', error)
      throw new Error('Error al crear la transacción')
    }

    // Update portfolio
    const existingPosition = portfolio.value.find(p => p.stock_id === selectedFund.value?.id)
    const newQuantity = (existingPosition?.quantity || 0) + shares

    await updatePortfolio(authStore.user.id, selectedFund.value.id, newQuantity)

    // Refresh portfolio data
    await fetchPortfolio()

    snackbar.value = {
      show: true,
      text: 'Inversión realizada con éxito',
      color: 'success'
    }

    investDialog.value = false
    selectedFund.value = null
    investmentAmount.value = 0

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

const fetchPortfolio = async () => {
  try {
    if (!authStore.user?.id) return

    const portfolioData = await getPortfolio(authStore.user.id)
    const stocksData = await getStocks()

    // Attach stock data to portfolio
    portfolio.value = portfolioData.map(item => ({
      ...item,
      stock: stocksData.find(s => s.id === item.stock_id)
    }))

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
  if (!authStore.isAuthenticated) {
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
  } catch (error: any) {
    snackbar.value = {
      show: true,
      text: 'Error al cargar los datos: ' + error.message,
      color: 'error'
    }
  }
})
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
</style>