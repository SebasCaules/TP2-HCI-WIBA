<template>
  <v-container class="deposit-container" fluid>
    <div class="deposit-content">
      <h1 class="deposit-title">Depositar</h1>
      <div class="deposit-form-group">
        <CustomTextField
          v-model="amount"
          type="number"
          placeholder="Monto"
          class="deposit-amount-input"
          @input="formatAmount"
        />
      </div>
      <div class="deposit-form-group">
        <button type="button" class="deposit-method-box" @click="showCardDialog = true">
          <img :src="selectedCard?.logo" :alt="selectedCard?.brand" class="deposit-card-logo" v-if="selectedCard" />
          <span class="deposit-method-text" v-if="selectedCard">
            <b>{{ selectedCard.brand }}</b> *{{ selectedCard.number_last4 }}
          </span>
          <span class="deposit-method-text" v-else>
            Selecciona una tarjeta
          </span>
          <v-icon class="deposit-select-icon">mdi-chevron-right</v-icon>
        </button>
      </div>
      <FilledButton class="deposit-continue-btn" @click="handleDeposit" :disabled="!isAmountValid">
        Continuar
      </FilledButton>
    </div>

    <!-- Card Selection Dialog -->
    <v-dialog 
      v-model="showCardDialog" 
      max-width="960px" 
      :retain-focus="false"
      :scrim="true"
    >
      <v-card class="select-card-dialog">
        <div class="select-card-dialog-header">
          <span class="select-card-title">Seleccionar tarjeta</span>
          <v-btn icon class="dialog-close-btn" @click="showCardDialog = false">
            <v-icon>dialog-close</v-icon>
          </v-btn>
        </div>
        <div class="select-card-list-custom">
          <template v-if="cards.length > 0">
            <div
              v-for="card in cards"
              :key="card.id"
              class="select-card-custom"
              :class="{ selected: selectedCard && selectedCard.id === card.id }"
              @click="selectCard(card)"
            >
              <img :src="card.logo" :alt="card.brand" class="select-card-logo" />
              <div class="select-card-info">
                <div class="select-card-brand">{{ card.brand }} *{{ card.number_last4 }}</div>
                <div class="select-card-expiry">Vence {{ card.expiry }}</div>
              </div>
              <v-icon v-if="selectedCard && selectedCard.id === card.id" color="primary" class="select-card-check">mdi-check-circle</v-icon>
            </div>
          </template>
          <div v-else class="no-cards-message">
            <v-icon size="48" :color="'#41a7b7'">mdi-credit-card-outline</v-icon>
            <div class="no-cards-title">No tienes tarjetas guardadas</div>
            <div class="no-cards-subtitle">Agrega una tarjeta para realizar depósitos</div>
          </div>
        </div>
        <v-card-actions class="select-card-actions">
          <FilledButton class="add-card-btn" @click="showAddCardDialog = true">
            Agregar tarjeta
          </FilledButton>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Add Card Dialog (use component) -->
    <AddCardDialog
      :model-value="showAddCardDialog"
      @update:model-value="showAddCardDialog = $event"
      @card-added="fetchCards"
    />

    <!-- Deposit Confirmation Dialog -->
    <v-dialog 
      v-model="showConfirmDialog" 
      width="650"
      :retain-focus="false"
      :scrim="true"
    >
      <v-card class="confirm-deposit-dialog" width="100%">
        <div class="confirm-deposit-header">
          <span class="confirm-deposit-title">Confirmar depósito</span>
          <v-btn icon class="dialog-close-btn" @click="showConfirmDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>
        <div class="confirm-deposit-content">
          <div class="confirm-deposit-table">
            <div class="confirm-deposit-row">
              <span class="confirm-deposit-label">Monto:</span>
              <span class="confirm-deposit-value">${{ formatNumber(amount) }}</span>
            </div>
            <div class="confirm-deposit-row">
              <span class="confirm-deposit-label">Método de pago:</span>
              <div class="confirm-deposit-card">
                <img :src="selectedCard?.logo" :alt="selectedCard?.brand" class="confirm-deposit-card-logo" />
                <span class="confirm-deposit-card-text">
                  {{ selectedCard?.brand }} *{{ selectedCard?.number_last4 }}
                </span>
              </div>
            </div>
          </div>
          <div class="confirm-deposit-actions">
            <FilledButton class="confirm-deposit-btn" @click="confirmDeposit">
              Confirmar
            </FilledButton>
          </div>
        </div>
      </v-card>
    </v-dialog>

    <!-- Success Dialog -->
    <v-dialog v-model="showSuccessDialog" max-width="400px">
      <v-card class="success-dialog">
        <div class="success-dialog-header">
          <v-btn icon class="dialog-close-btn" @click="showSuccessDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>
        <div class="success-dialog-content">
          <v-icon color="success" size="48">mdi-check-circle</v-icon>
          <div class="success-dialog-title">¡Depósito realizado con éxito!</div>
          <div class="success-dialog-message">El depósito fue completado correctamente.</div>
        </div>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { supabase } from '@/plugins/supabase'
import { useAuthStore } from '@/store/auth'
import CustomTextField from '@/components/ui/CustomTextField.vue'
import FilledButton from '@/components/ui/FilledButton.vue'
import AddCardDialog from '@/components/AddCardDialog.vue'
import { depositToAccount } from '@/services/account'

const amount = ref('')
const showCardDialog = ref(false)
const showAddCardDialog = ref(false)
const cards = ref<any[]>([])
const selectedCard = ref<any | null>(null)
const showConfirmDialog = ref(false)
const showSuccessDialog = ref(false)

const authStore = useAuthStore()
const userId = computed(() => authStore.user?.id)

const isAmountValid = computed(() => {
  const n = parseFloat(amount.value)
  return !isNaN(n) && n > 0
})

function getCardBrand(number: string) {
  const n = number.replace(/\D/g, '')
  if (n.startsWith('4')) return 'Visa'
  if (n.startsWith('5') || n.startsWith('2')) return 'Mastercard'
  if (n.startsWith('3')) return 'Amex'
  return 'Desconocida'
}
function getBrandLogo(brand: string) {
  if (brand === 'Visa') return 'https://upload.wikimedia.org/wikipedia/commons/4/41/Visa_Logo.png'
  if (brand === 'Mastercard') return 'https://brandlogos.net/wp-content/uploads/2021/11/mastercard-logo.png'
  if (brand === 'Amex') return 'https://upload.wikimedia.org/wikipedia/commons/f/fa/American_Express_logo_%282018%29.svg'
  return 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='
}

function formatAmount() {
  // Remove any non-digit characters
  let value = amount.value.replace(/\D/g, '')
  // Limit to 10 digits
  value = value.slice(0, 10)
  amount.value = value
}

function formatNumber(value: string) {
  return value.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
}

async function fetchCards() {
  if (!userId.value) return
  const { data, error } = await supabase
    .from('cards')
    .select('*')
    .eq('user_id', userId.value)
    .order('created_at', { ascending: false })
  if (error) {
    cards.value = []
    return
  }
  cards.value = (data || []).map(card => ({
    ...card,
    logo: getBrandLogo(card.brand)
  }))
  if (!selectedCard.value && cards.value.length > 0) {
    selectedCard.value = cards.value[0]
  }
}

function selectCard(card: any) {
  selectedCard.value = card
  showCardDialog.value = false
}

function handleDeposit() {
  if (!amount.value) return
  showConfirmDialog.value = true
}

async function confirmDeposit() {
  if (!amount.value || !userId.value) return
  const result = await depositToAccount(
    userId.value, 
    Number(amount.value),
    selectedCard.value?.number_last4,
    selectedCard.value?.brand
  )
  if (result.success) {
    showConfirmDialog.value = false
    amount.value = ''
    selectedCard.value = null
    showSuccessDialog.value = true
  } else {
    alert(result.message || 'Error al depositar')
  }
}

onMounted(fetchCards)
</script>

<style scoped>
.deposit-container {
  min-height: 100vh;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  background: var(--background);
}

.deposit-content {
  margin: 0 auto;
  margin-top: 24px;
  max-width: 400px;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.deposit-title {
  font-size: 2.2rem;
  font-weight: 800;
  text-align: center;
  margin-bottom: 2.2rem;
  font-family: var(--font-sans), sans-serif;
  color: var(--text);
}

.deposit-form-group {
  margin-bottom: 0.4rem;
  width: 100%;
  max-width: 400px;
}

.deposit-form-group:last-of-type {
  margin-bottom: 0;
}

.deposit-label {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--text);
  margin-bottom: 0.5rem;
  display: block;
  font-family: var(--font-sans), sans-serif;
}

.deposit-amount-input {
  width: 100%;
  max-width: 400px;
}

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

.deposit-continue-btn {
  margin-top: 1.5rem;
  font-size: 1.1rem;
  font-weight: 700;
  height: 50px;
  width: 100%;
  max-width: 400px;
  align-self: center;
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

.dialog-close-btn {
  color: var(--muted-text) !important;
  margin-right: -8px;
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

.select-card-brand b {
  font-weight: 700;
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

.select-card-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 1.5rem 0 0 0;
}

.add-card-btn {
  min-width: 200px;
  font-size: 1.1rem;
  font-weight: 600;
  border-radius: 1.5rem;
  padding: 0.8rem 2rem;
}

.confirm-deposit-dialog {
  border-radius: 1.5rem;
  overflow: visible;
  box-shadow: 0 2px 16px 0 rgba(60,60,60,0.10);
  width: 100%;
  max-width: 650px;
  margin: 0 auto;
  padding: 2rem 3rem;
}

.confirm-deposit-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 0 1rem 0;
}

.confirm-deposit-title {
  font-size: 1.4rem;
  font-weight: 700;
  font-family: var(--font-sans), sans-serif;
}

.confirm-deposit-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  width: 100%;
}

.confirm-deposit-table {
  background: var(--card);
  border-radius: 1.5rem;
  padding: 1.5rem 2rem;
  margin-bottom: 2rem;
  width: 100%;
  box-shadow: 0 1px 6px 0 rgba(60,60,60,0.06);
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
}

.confirm-deposit-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--text);
  font-family: var(--font-sans), sans-serif;
}

.confirm-deposit-card {
  display: flex;
  align-items: center;
}

.confirm-deposit-card-logo {
  width: 32px;
  height: 32px;
  max-width: 32px;
  max-height: 32px;
  object-fit: contain;
  margin-right: 0.5rem;
  flex-shrink: 0;
  flex-grow: 0;
}

.confirm-deposit-card-text {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--text);
  font-family: var(--font-sans), sans-serif;
}

.confirm-deposit-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

.confirm-deposit-btn {
  min-width: 200px;
  font-size: 1.1rem;
  font-weight: 600;
  border-radius: 1.5rem;
  padding: 0.8rem 2rem;
}

.success-dialog {
  border-radius: 1.5rem;
  padding: 1.5rem;
  text-align: center;
}

.success-dialog-header {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 1rem;
}

.dialog-close-btn {
  color: var(--muted-text) !important;
  margin-right: -8px;
}

.success-dialog-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.2rem;
  padding: 0 1rem 1rem;
}

.success-dialog-title {
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--primary);
  margin-top: 0.5rem;
}

.success-dialog-message {
  font-size: 1.05rem;
  color: var(--text);
  margin-bottom: 1rem;
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

.no-cards-icon {
  color: var(--primary);
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