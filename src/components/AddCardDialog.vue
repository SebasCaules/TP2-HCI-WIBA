<template>
  <v-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" max-width="600px" :retain-focus="false" :scrim="true">
    <v-card class="add-card-dialog" width="100%">
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
            <div class="custom-text-field-wrapper">
              <div class="custom-text-field-label">Tipo de tarjeta</div>
              <v-select
                v-model="newCard.type"
                :items="[
                  { title: 'Crédito', value: 'CREDIT' },
                  { title: 'Débito', value: 'DEBIT' }
                ]"
                item-title="title"
                item-value="value"
                density="comfortable"
                variant="underlined"
                class="custom-select-wrapper"
              ></v-select>
            </div>
            <CustomTextField
              v-model="newCard.number"
              placeholder="Numero de la tarjeta"
              type="text"
              maxlength="19"
              @input="formatCardNumber"
            />
            <div class="add-card-row">
              <CustomTextField
                v-model="newCard.expiry"
                placeholder="MM/YY"
                type="text"
                maxlength="5"
                @input="formatExpiry"
                class="add-card-row-field"
              />
              <CustomTextField
                v-model="newCard.cvv"
                placeholder="CVV"
                type="number"
                maxlength="4"
                @input="newCard.cvv = newCard.cvv.toString().slice(0, 4)"
                class="add-card-row-field"
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
import { useCardsStore } from '@/stores/cardsStore'
import type { CreateCardRequest } from '@/api/cards'

const props = defineProps({
  modelValue: Boolean,
})
const emit = defineEmits(['update:modelValue', 'card-added'])

const cardsStore = useCardsStore()

const newCard = ref({
  number: '',
  expiry: '',
  cvv: '',
  holder: '',
  type: 'CREDIT' as const,
})
const submitted = ref(false)
const transparentPixel =
  'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='

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

  try {
    const cardData: CreateCardRequest = {
      type: newCard.value.type,
      number: newCard.value.number.replace(/\s/g, ''),
      expirationDate: newCard.value.expiry,
      fullName: newCard.value.holder,
      cvv: newCard.value.cvv,
      metadata: {
        brand: getCardBrand(newCard.value.number)
      }
    }

    await cardsStore.addCard(cardData)
    emit('update:modelValue', false)
    emit('card-added')
    newCard.value = { number: '', expiry: '', cvv: '', holder: '', type: 'CREDIT' }
    submitted.value = false
  } catch (error: any) {
    console.error('Error adding card:', error)
    const errorMessage = error?.description || error?.message || 'No se pudo agregar la tarjeta'
    alert(errorMessage)
  }
}
</script>

<style scoped>
.add-card-dialog {
  padding: 2rem 3rem !important;
  border-radius: 2rem !important;
  overflow: visible;
  box-shadow: 0 2px 16px 0 rgba(60,60,60,0.10);
  width: 100%;
  margin: 0 auto;
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
  width: 100%;
  max-width: 340px;
  margin: 0 auto;
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
  max-width: 340px;
  gap: 0.2rem;
}
.add-card-form :deep(.custom-text-field-wrapper) {
  margin-bottom: 0 !important;
  margin-top: 0 !important;
  width: 100% !important;
}
.add-card-input {
  width: 340px;
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
  width: 100%;
  margin-bottom: 0 !important;
  margin-top: 0 !important;
  padding: 0 !important;
}
.add-card-row-field {
  flex: 1 1 0;
  min-width: 0;
  width: 100%;
}
.add-card-row-field :deep(.custom-text-field-wrapper) {
  width: 100% !important;
}
.add-card-btn {
  width: 100%;
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
.custom-text-field-wrapper {
  width: 100%;
  margin-bottom: 0.2rem;
}
.custom-text-field-label {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--muted-text);
  margin-bottom: 0.4rem;
  font-family: var(--font-sans), sans-serif;
}
.custom-select-wrapper {
  position: relative;
  width: 100%;
}
.custom-select-wrapper :deep(.v-select) {
  width: 100%;
}
.custom-select-wrapper :deep(.v-field) {
  border: 1.5px solid #bdbdbd !important;
  border-radius: 12px !important;
  background: transparent !important;
  padding: 0 1.1rem !important;
  height: 50px !important;
  transition: border-color 0.18s !important;
}
.custom-select-wrapper :deep(.v-field:hover) {
  border-color: #9a9a9a !important;
}
.custom-select-wrapper :deep(.v-field--focused) {
  border-color: #489fb5 !important;
}
.custom-select-wrapper :deep(.v-field__input) {
  display: flex !important;
  align-items: center !important;
  font-size: 1.06rem !important;
  font-family: var(--font-sans, sans-serif) !important;
  font-weight: 400 !important;
  color: #424242 !important;
  padding: 0.2rem 0 !important;
  letter-spacing: 0.01em !important;
}
.custom-select-wrapper :deep(.v-select__selection) {
  display: flex !important;
  align-items: center !important;
}
.custom-select-wrapper :deep(.v-field__outline) {
  display: none !important;
}
.custom-select-wrapper :deep(.v-label) {
  font-size: 0.97rem !important;
  color: #757575 !important;
  font-weight: 400 !important;
  font-family: var(--font-sans, sans-serif) !important;
  letter-spacing: 0.01em !important;
}
.custom-select-wrapper :deep(.v-field--error) {
  border-color: #e53935 !important;
}
.custom-select-wrapper :deep(.v-field--error .v-label) {
  color: #e53935 !important;
}
.custom-select-wrapper :deep(.v-field--error .v-field__input) {
  color: #e53935 !important;
}
.custom-select-wrapper :deep(.v-field--disabled) {
  opacity: 0.7 !important;
  cursor: not-allowed !important;
}
.custom-select-wrapper :deep(.v-select__selection-text) {
  display: flex !important;
  align-items: center !important;
  height: 100% !important;
  line-height: normal !important;
}
.custom-select-wrapper :deep(.v-select__icon) {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  height: 100% !important;
  position: absolute !important;
  top: 50% !important;
  transform: translateY(-50%) !important;
  right: 1rem !important;
}
.custom-select-wrapper :deep(.v-field__input) {
  display: flex !important;
  align-items: center !important;
  height: 100% !important;
  padding-top: 0 !important;
  padding-bottom: 0 !important;
}
.custom-select-wrapper :deep(.v-field__append-inner) {
  padding-top: 0 !important;
  align-items: center !important;
}
</style> 