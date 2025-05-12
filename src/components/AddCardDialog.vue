<template>
  <v-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" max-width="600px">
    <v-card class="add-card-dialog">
      <v-card-text>
        <div class="add-card-dialog-header">
          <span class="add-card-dialog-title">Nueva Tarjeta</span>
          <v-btn icon class="dialog-close-btn" @click="$emit('update:modelValue', false)">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>
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
                <div class="card-preview-name-modern">
                  {{ newCard.holder ? newCard.holder.toUpperCase() : 'NOMBRE APELLIDO' }}
                </div>
                <div class="card-preview-expiry-block">
                  <span class="card-preview-expiry-modern">{{ formattedExpiry }}</span>
                </div>
              </div>
            </div>
          </div>
          <v-form @submit.prevent="addCard" class="add-card-form">
            <CustomTextField
              v-model="newCard.number"
              placeholder="Numero de la tarjeta"
              type="text"
              maxlength="19"
              @input="formatCardNumber"
            />
            <div class="add-card-row" style="width: 100%; max-width: 340px; margin: 0 auto 0.5rem auto;">
              <CustomTextField
                v-model="newCard.expiry"
                placeholder="MM/YY"
                type="text"
                maxlength="5"
                @input="formatExpiry"
              />
              <CustomTextField
                v-model="newCard.cvv"
                placeholder="CVV"
                type="number"
                maxlength="4"
                @input="newCard.cvv = newCard.cvv.toString().slice(0, 4)"
              />
            </div>
            <CustomTextField
              v-model="newCard.holder"
              placeholder="Nombre Apellido"
              type="text"
              @input="newCard.holder = newCard.holder.toUpperCase()"
            />
            <button type="submit" class="filled-btn add-card-btn" style="background: #41a7b7; color: #fff; width: 100%; max-width: 340px; margin: 0 auto; display: block; font-size: 1.1rem; font-weight: 700; border-radius: 2rem; height: 50px;">
              Agregar
            </button>
            <div v-if="submitted && addCardError" class="add-card-error">{{ addCardError }}</div>
          </v-form>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import CustomTextField from '@/components/ui/CustomTextField.vue'
import { supabase } from '@/plugins/supabase'
import { useAuthStore } from '@/store/auth'
import { v4 as uuidv4 } from 'uuid'

const props = defineProps({
  modelValue: Boolean,
})
const emit = defineEmits(['update:modelValue', 'card-added'])

const authStore = useAuthStore()
const userId = computed(() => authStore.user?.id)

const newCard = ref({
  number: '',
  expiry: '',
  cvv: '',
  holder: '',
})
const submitted = ref(false)
const transparentPixel =
  'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='

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
const addCardError = computed(() => {
  if (!newCard.value.number || !newCard.value.expiry || !newCard.value.cvv || !newCard.value.holder) {
    return 'Campos faltantes';
  }
  if (cardNumberError.value) return 'Número inválido';
  if (expiryError.value) return 'Fecha de vencimiento inválida';
  if (cvvError.value) return 'CVV inválido';
  if (holderError.value) return 'Nombre inválido';
  return '';
});
async function addCard() {
  submitted.value = true
  if (addCardError.value) {
    return
  }
  if (!userId.value) {
    alert('No user ID. Please log in again.')
    return
  }
  const last4 = newCard.value.number.replace(/\D/g, '').slice(-4)
  const brandVal = getCardBrand(newCard.value.number)
  const cardToInsert = {
    id: uuidv4(),
    user_id: userId.value,
    brand: brandVal,
    number_last4: last4,
    expiry: newCard.value.expiry,
    holder: newCard.value.holder,
  }
  console.log('About to insert card:', cardToInsert)
  const { error } = await supabase.from('cards').insert([cardToInsert])
  if (error) {
    alert('No se pudo agregar la tarjeta: ' + error.message)
  }
  emit('update:modelValue', false)
  emit('card-added')
  newCard.value = { number: '', expiry: '', cvv: '', holder: '' }
  submitted.value = false
}
</script>

<style scoped>
.add-card-dialog {
  padding: 2rem !important;
  border-radius: 1.5rem !important;
  overflow: hidden;
}
.add-card-dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.2rem;
}
.add-card-dialog-title {
  font-size: 1.35rem;
  font-weight: 700;
  color: #232526;
  letter-spacing: 0.5px;
  font-family: var(--font-sans), sans-serif;
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
  padding-left: 0.2rem;
}
.card-preview-bottom-modern {
  align-items: flex-end;
  margin-top: 1.2rem;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  width: 100%;
  position: relative;
}
.card-preview-name-modern {
  font-size: 1.05rem;
  font-family: 'Inter', 'Menlo', 'Consolas', monospace;
  font-weight: 500;
  letter-spacing: 1px;
  text-transform: uppercase;
  position: absolute;
  left: 0.2rem;
  bottom: 0;
  padding-left: 0;
  padding-bottom: 0.7rem;
  color: #fff;
  opacity: 0.92;
}
.card-preview-expiry-block {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  margin-left: auto;
  position: absolute;
  right: 1.2rem;
  bottom: 0.7rem;
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
  gap: 0.7rem;
}
.add-card-form :deep(.custom-text-field-wrapper) {
  margin-bottom: 0 !important;
  margin-top: 0 !important;
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
  gap: 0.7rem;
  width: 320px;
  margin-bottom: 0 !important;
  margin-top: 0 !important;
  padding: 0 !important;
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
.add-card-error {
  color: var(--error);
  font-size: 0.98rem;
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
  font-weight: 500;
  text-align: center;
  width: 100%;
  min-height: 1.5rem;
}
</style> 