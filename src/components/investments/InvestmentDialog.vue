<template>
  <v-dialog v-model="dialog" max-width="500">
    <v-card>
      <v-card-title>
        {{ isSell ? 'Vender Inversión' : 'Realizar Inversión' }}
      </v-card-title>

      <v-card-text>
        <v-form v-model="isFormValid" @submit.prevent>
          <div v-if="!isSell" class="mb-4">
            <v-select
              v-model="selectedFund"
              :items="fundOptions"
              label="Seleccionar Fondo"
              item-title="name"
              item-value="id"
              required
            ></v-select>
          </div>

          <div class="mb-4">
            <div class="text-caption mb-2">Saldo disponible</div>
            <v-text-field
              :model-value="formatCurrency(availableBalance)"
              readonly
              variant="outlined"
              density="comfortable"
              hide-details
            ></v-text-field>
          </div>

          <div class="mb-4">
            <div class="text-caption mb-2">Monto en dinero</div>
            <v-text-field
              v-model.number="amount"
              type="number"
              prefix="$"
              :rules="amountRules"
              variant="outlined"
              density="comfortable"
              @update:model-value="updateShares"
            ></v-text-field>
          </div>

          <div class="mb-4">
            <div class="text-caption mb-2">Cantidad de cuotapartes</div>
            <v-text-field
              v-model.number="shares"
              type="number"
              :rules="sharesRules"
              variant="outlined"
              density="comfortable"
              @update:model-value="updateAmount"
            ></v-text-field>
          </div>

          <div v-if="errorMessage" class="text-error mb-4">
            {{ errorMessage }}
          </div>
        </v-form>
      </v-card-text>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          color="grey"
          variant="text"
          @click="closeDialog"
        >
          Cancelar
        </v-btn>
        <v-btn
          color="primary"
          :loading="isLoading"
          :disabled="!isFormValid || isLoading"
          @click="handleTransaction"
        >
          {{ isSell ? 'Vender' : 'Comprar' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { type Stock } from '@/services/investments'
import { getAccountBalance } from '@/services/account'

const props = defineProps<{
  modelValue: boolean;
  isSell?: boolean;
  selectedStock?: Stock;
  fundOptions?: { id: number; name: string }[];
  maxShares?: number;
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'transaction', data: { amount: number; shares: number; stockId: number }): void;
}>()

const dialog = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const isFormValid = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')
const availableBalance = ref(0)
const amount = ref(0)
const shares = ref(0)
const selectedFund = ref<number | null>(null)

const currentPrice = computed(() => {
  if (props.isSell && props.selectedStock) {
    return props.selectedStock.current_price
  }
  if (!props.isSell && selectedFund.value) {
    const stock = props.fundOptions?.find(f => f.id === selectedFund.value)
    return stock?.current_price || 0
  }
  return 0
})

const amountRules = [
  (v: number) => v > 0 || 'El monto debe ser mayor a 0',
  (v: number) => v <= availableBalance.value || `El monto no puede superar $${availableBalance.value}`
]

const sharesRules = [
  (v: number) => v > 0 || 'La cantidad debe ser mayor a 0',
  (v: number) => !props.isSell || v <= (props.maxShares || 0) || 'No tienes suficientes cuotapartes'
]

const updateShares = () => {
  if (currentPrice.value > 0) {
    shares.value = Number((amount.value / currentPrice.value).toFixed(6))
  }
}

const updateAmount = () => {
  if (currentPrice.value > 0) {
    amount.value = Number((shares.value * currentPrice.value).toFixed(2))
  }
}

const formatCurrency = (value: number) => {
  return `$${value.toFixed(2)}`
}

const loadBalance = async () => {
  try {
    const balance = await getAccountBalance(props.selectedStock?.user_id || '')
    availableBalance.value = balance
  } catch (error) {
    console.error('Error loading balance:', error)
  }
}

const handleTransaction = async () => {
  if (!isFormValid.value) return

  isLoading.value = true
  errorMessage.value = ''

  try {
    const stockId = props.isSell ? props.selectedStock?.id : selectedFund.value
    if (!stockId) throw new Error('Fondo no seleccionado')

    emit('transaction', {
      amount: amount.value,
      shares: shares.value,
      stockId
    })

    closeDialog()
  } catch (error: any) {
    errorMessage.value = error.message || 'Error al procesar la transacción'
  } finally {
    isLoading.value = false
  }
}

const closeDialog = () => {
  dialog.value = false
  amount.value = 0
  shares.value = 0
  errorMessage.value = ''
  selectedFund.value = null
}

watch(() => dialog.value, (newValue) => {
  if (newValue) {
    loadBalance()
  }
})

watch(() => currentPrice.value, () => {
  if (amount.value > 0) {
    updateShares()
  } else if (shares.value > 0) {
    updateAmount()
  }
})
</script>

<style scoped>
.text-error {
  color: #FF5252;
}
</style> 