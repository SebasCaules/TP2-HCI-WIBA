<template>
  <v-container>
    <h1 class="tarjetas-title">Tarjetas</h1>
    <button class="primary-btn tarjetas-add-btn" @click="showDialog = true">
      <v-icon left>mdi-plus</v-icon>Agregar
    </button>
    <v-divider class="mb-4" />
    <v-data-table
      :headers="headers"
      :items="cards"
      class="tarjetas-table"
      hide-default-footer
      item-value="id"
      :loading="loading"
    >
      <template #no-data>
        <div v-if="noCards" class="no-cards-message">No tienes tarjetas guardadas.</div>
      </template>
      <template #item.logo="{ item }">
        <img :src="item.logo" :alt="item.brand" class="tarjeta-logo" />
      </template>
      <template #item.name="{ item }">
        <span class="tarjeta-name">{{ item.brand }} *{{ item.number_last4 }}</span>
      </template>
      <template #item.expiry="{ item }">
        <span class="tarjeta-expiry">{{ item.expiry }}</span>
      </template>
      <template #item.actions="{ item }">
        <v-btn variant="text" color="error" class="tarjeta-delete-btn" @click="deleteCard(item.id)">
          Eliminar
        </v-btn>
      </template>
    </v-data-table>

    <!-- Add Card Dialog -->
    <v-dialog v-model="showDialog" max-width="520px">
      <v-card class="add-card-dialog">
        <v-card-text>
          <v-btn icon class="dialog-close-btn" @click="showDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
          <div class="add-card-form-container">
            <div class="card-preview card-preview-modern">
              <div class="card-preview-bg-modern">
                <div class="card-preview-row card-preview-header">
                  <span class="card-preview-title"></span>
                  <img :src="brandLogo || transparentPixel" alt="brand" class="card-preview-logo-modern" />
                </div>
                <div class="card-preview-row card-preview-number-row">
                  <span class="card-preview-number-modern">{{ maskedCardNumber }}</span>
                </div>
                <div class="card-preview-row card-preview-bottom-modern">
                  <div class="card-preview-expiry-block">
                    <span class="card-preview-expiry-modern">{{ formattedExpiry }}</span>
                  </div>
                </div>
              </div>
            </div>
            <v-form @submit.prevent="addCard" class="add-card-form">
              <v-text-field
                v-model="newCard.number"
                label="Numero de la tarjeta"
                outlined
                dense
                class="add-card-input"
                maxlength="19"
                :error-messages="submitted && cardNumberError ? [cardNumberError] : []"
                :hide-details="!(submitted && cardNumberError) ? true : 'auto'"
                @input="formatCardNumber"
              />
              <div class="add-card-row">
                <v-text-field
                  v-model="newCard.expiry"
                  label=""
                  outlined
                  dense
                  class="add-card-input"
                  maxlength="5"
                  :error-messages="submitted && expiryError ? [expiryError] : []"
                  :hide-details="!(submitted && expiryError) ? true : 'auto'"
                  placeholder="MM/YY"
                  @input="formatExpiry"
                />
                <v-text-field
                  v-model="newCard.cvv"
                  label="CVV"
                  outlined
                  dense
                  class="add-card-input"
                  :maxlength="getCardBrand(newCard.number) === 'Amex' ? 4 : 3"
                  :error-messages="submitted && cvvError ? [cvvError] : []"
                  :hide-details="!(submitted && cvvError) ? true : 'auto'"
                  :placeholder="getCardBrand(newCard.number) === 'Amex' ? '1234' : '123'"
                />
              </div>
              <v-text-field
                v-model="newCard.holder"
                label="Nombre del titular"
                outlined
                dense
                class="add-card-input"
                :error-messages="submitted && holderError ? [holderError] : []"
                :hide-details="!(submitted && holderError) ? true : 'auto'"
                placeholder="Nombre Apellido"
              />
              <button class="primary-btn add-card-btn" type="submit">Agregar</button>
            </v-form>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { supabase } from '@/plugins/supabase'
import { useAuthStore } from '@/store/auth'
import { v4 as uuidv4 } from 'uuid'

const showDialog = ref(false)
const submitted = ref(false)
const loading = ref(false)
const cards = ref<any[]>([])
const noCards = ref(false)

const authStore = useAuthStore()
const userId = computed(() => authStore.user?.id)

const headers = [
  { title: '', value: 'logo', width: 60 },
  { title: 'Nombre', value: 'name', align: 'start' },
  { title: 'Vencimiento', value: 'expiry', align: 'end', width: 120 },
  { title: '', value: 'actions', align: 'end', width: 120 },
]

const newCard = ref({
  number: '',
  expiry: '',
  cvv: '',
  holder: '',
})

function getCardBrand(number) {
  const n = number.replace(/\D/g, '')
  if (n.startsWith('4')) return 'Visa'
  if (n.startsWith('5')) return 'Mastercard'
  if (n.startsWith('3')) return 'Amex'
  return 'Desconocida'
}

function getBrandLogo(brand) {
  if (brand === 'Visa') return 'https://upload.wikimedia.org/wikipedia/commons/4/41/Visa_Logo.png'
  if (brand === 'Mastercard') return 'https://brandlogos.net/wp-content/uploads/2021/11/mastercard-logo.png'
  if (brand === 'Amex') return 'https://upload.wikimedia.org/wikipedia/commons/f/fa/American_Express_logo_%282018%29.svg'
  return transparentPixel
}

const brand = computed(() => getCardBrand(newCard.value.number))
const brandLogo = computed(() => getBrandLogo(brand.value))

const maskedCardNumber = computed(() => {
  let raw = newCard.value.number.replace(/\D/g, '')
  const brand = getCardBrand(raw)
  
  if (brand === 'Amex') {
    let masked = (raw + 'XXXXXXXXXXXXXXX').slice(0, 15)
    let arr = masked.split('').map((c, i) => (i < raw.length ? raw[i] : 'X'))
    let formatted = arr.join('')
    if (formatted.length > 4) formatted = formatted.slice(0, 4) + ' ' + formatted.slice(4)
    if (formatted.length > 11) formatted = formatted.slice(0, 11) + ' ' + formatted.slice(11)
    return formatted
  } else {
    let masked = (raw + 'XXXXXXXXXXXXXXXX').slice(0, 16)
    let arr = masked.split('').map((c, i) => (i < raw.length ? raw[i] : 'X'))
    return arr.join('').replace(/(.{4})/g, '$1 ').trim()
  }
})

const formattedExpiry = computed(() => {
  let val = newCard.value.expiry.replace(/[^\d]/g, '')
  if (val.length === 0) return 'MM/YY'
  if (val.length <= 2) return val
  return val.slice(0, 2) + '/' + val.slice(2, 4)
})

const transparentPixel =
  'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='

function formatCardNumber() {
  let val = newCard.value.number.replace(/\D/g, '')
  const brand = getCardBrand(val)
  
  if (brand === 'Amex') {
    val = val.slice(0, 15)
    if (val.length > 4) {
      val = val.slice(0, 4) + ' ' + val.slice(4)
    }
    if (val.length > 11) {
      val = val.slice(0, 11) + ' ' + val.slice(11)
    }
  } else {
    val = val.slice(0, 16)
    val = val.replace(/(.{4})/g, '$1 ').trim()
  }
  
  newCard.value.number = val
}

function formatExpiry() {
  let val = newCard.value.expiry.replace(/[^\d]/g, '')
  if (val.length > 4) val = val.slice(0, 4)
  if (val.length > 2) {
    newCard.value.expiry = val.slice(0, 2) + '/' + val.slice(2, 4)
  } else {
    newCard.value.expiry = val
  }
}

const cardNumberError = computed(() => {
  if (!newCard.value.number) return 'Campo requerido'
  const brand = getCardBrand(newCard.value.number)
  
  if (brand === 'Amex') {
    if (!/^\d{4} \d{6} \d{5}$/.test(newCard.value.number)) return 'Formato: 0000 000000 00000'
  } else {
    if (!/^\d{4} \d{4} \d{4} \d{4}$/.test(newCard.value.number)) return 'Formato: 0000 0000 0000 0000'
  }
  return ''
})
const expiryError = computed(() => {
  if (!newCard.value.expiry) return 'Campo requerido'
  if (!/^\d{2}\/\d{2}$/.test(newCard.value.expiry)) return 'Formato: MM/AA'
  const [mm, yy] = newCard.value.expiry.split('/')
  if (mm && (parseInt(mm) < 1 || parseInt(mm) > 12)) return 'Mes inválido'
  return ''
})
const cvvError = computed(() => {
  if (!newCard.value.cvv) return 'Campo requerido'
  const brand = getCardBrand(newCard.value.number)
  
  if (brand === 'Amex') {
    if (!/^\d{4}$/.test(newCard.value.cvv)) return '4 dígitos'
  } else {
    if (!/^\d{3}$/.test(newCard.value.cvv)) return '3 dígitos'
  }
  return ''
})
const holderError = computed(() => {
  if (!newCard.value.holder) return 'Campo requerido'
  if (newCard.value.holder.length <= 2) return 'Nombre muy corto'
  return ''
})

async function fetchCards() {
  if (!userId.value) return
  loading.value = true
  const { data, error } = await supabase
    .from('cards')
    .select('*')
    .eq('user_id', userId.value)
    .order('created_at', { ascending: false })
  loading.value = false
  if (error) {
    cards.value = []
    noCards.value = true
    return
  }
  cards.value = (data || []).map(card => ({
    ...card,
    brand: card.brand,
    name: `${card.brand} *${card.number_last4}`,
    expiry: card.expiry,
    logo: getBrandLogo(card.brand)
  }))
  noCards.value = cards.value.length === 0
}

onMounted(fetchCards)

async function addCard() {
  submitted.value = true
  if (
    cardNumberError.value ||
    expiryError.value ||
    cvvError.value ||
    holderError.value
  ) return
  if (!userId.value) return
  const last4 = newCard.value.number.replace(/\D/g, '').slice(-4)
  const brandVal = getCardBrand(newCard.value.number)
  const { error } = await supabase.from('cards').insert([
    {
      id: uuidv4(),
      user_id: userId.value,
      brand: brandVal,
      number_last4: last4,
      expiry: newCard.value.expiry,
      holder: newCard.value.holder,
    }
  ])
  if (!error) {
    showDialog.value = false
    newCard.value = { number: '', expiry: '', cvv: '', holder: '' }
    submitted.value = false
    await fetchCards()
  }
}

async function deleteCard(id: string) {
  await supabase.from('cards').delete().eq('id', id)
  await fetchCards()
}
</script>

<style scoped>
.tarjetas-title {
  font-size: 2.2rem;
  font-weight: 800;
  margin-bottom: 1.5rem;
  margin-top: 0.5rem;
  font-family: var(--font-sans), sans-serif;
}
.tarjetas-add-btn {
  margin-bottom: 2.2rem;
  font-size: 1.1rem;
  font-weight: 600;
  padding: 0.5rem 2rem;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}
.tarjetas-table {
  width: 100%;
  background: transparent;
}
.tarjetas-table :deep(.v-data-table__tr) {
  height: 72px;
}
.tarjetas-table :deep(.v-data-table__td) {
  padding-top: 16px !important;
  padding-bottom: 16px !important;
}
.add-card-dialog {
  padding: 0;
}
.add-card-form-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.card-preview-modern {
  display: flex;
  justify-content: center;
  margin-bottom: 1.5rem;
  width: 100%;
}
.card-preview-bg-modern {
  width: 340px;
  height: 215px;
  border-radius: 18px;
  background: linear-gradient(120deg, #232526 60%, #414345 100%);
  box-shadow: 0 2px 16px 0 rgba(60,60,60,0.18);
  color: #fff;
  font-family: 'Menlo', 'Consolas', monospace;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 1.2rem;
  position: relative;
}
.card-preview-row {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
}
.card-preview-header {
  font-size: 1.1rem;
  font-family: 'Inter', 'Menlo', 'Consolas', monospace;
  font-weight: 600;
  margin-bottom: 0.7rem;
}
.card-preview-title {
  letter-spacing: 1px;
}
.card-preview-logo-modern {
  width: 48px;
  height: 32px;
  object-fit: contain;
}
.card-preview-number-row {
  justify-content: flex-start;
  margin-bottom: 1.2rem;
}
.card-preview-number-modern {
  font-size: 1.05rem;
  letter-spacing: 2.2px;
  font-family: 'Menlo', 'Consolas', monospace;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.card-preview-bottom-modern {
  align-items: flex-end;
  margin-top: 1.2rem;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  width: 100%;
}
.card-preview-name-modern {
  font-size: 1.05rem;
  font-family: 'Inter', 'Menlo', 'Consolas', monospace;
  font-weight: 500;
  letter-spacing: 1px;
  text-transform: uppercase;
}
.card-preview-expiry-block {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  margin-left: auto;
}
.card-preview-expiry-modern {
  font-size: 1.05rem;
  font-family: 'Menlo', 'Consolas', monospace;
  font-weight: 500;
  letter-spacing: 1px;
}
.add-card-form {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}
.add-card-input {
  width: 320px;
  margin-bottom: 1.1rem;
  text-align: center;
  font-family: var(--font-sans) !important;
  min-height: 56px;
}
.add-card-input input {
  font-family: var(--font-sans) !important;
}
.add-card-row {
  display: flex;
  gap: 1.2rem;
  width: 320px;
  margin-bottom: 1.1rem;
}
.add-card-btn {
  width: 320px;
  margin-top: 0.5rem;
  font-size: 1.1rem;
  font-weight: 600;
  padding: 0.7rem 2.5rem;
  color: #fff !important;
}
.tarjeta-logo {
  width: 38px;
  height: 38px;
  object-fit: contain;
}
.tarjeta-name {
  font-weight: 700;
  font-size: 1.1rem;
  padding-left: 0.5rem;
}
.tarjeta-expiry {
  color: #888;
  font-weight: 600;
  font-size: 1.1rem;
}
.tarjeta-delete-btn,
.tarjeta-delete-btn .v-btn__content {
  font-family: var(--font-sans), sans-serif !important;
  color: #e53935 !important;
  font-weight: bold !important;
  font-size: inherit !important;
  letter-spacing: normal !important;
  text-transform: none;
}
.dialog-close-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 2;
}
</style> 